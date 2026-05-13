"use server";

import { revalidatePath } from "next/cache";
import { computeKmTicketToBase, computeNearestBases } from "@/lib/google-maps/nearest-bases";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { ticketCreateSchema, ticketUpdateSchema } from "@/types/schemas/tickets";

/**
 * Crea un ticket y calcula km / bases: cliente por cercanía, INFOMAC según base elegida.
 * @param input Campos validados con Zod.
 */
export async function createTicketAction(input: unknown) {
  const parsed = ticketCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Datos inválidos", details: parsed.error.flatten() };
  }
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: bases } = await supabase.from("bases").select("*");
  const list = bases ?? [];
  const nearest = await computeNearestBases(parsed.data.city, parsed.data.province, list);

  const kmInfomac =
    (await computeKmTicketToBase(parsed.data.city, parsed.data.province, parsed.data.base_infomac_id, list)) ??
    nearest.kmInfomac;

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();

  const row = {
    client_id: parsed.data.client_id,
    coordinator_id: profile?.id ?? user.id,
    city: parsed.data.city,
    province: parsed.data.province,
    task_type: parsed.data.task_type,
    description: parsed.data.description,
    equipment_model: parsed.data.equipment_model ?? "",
    end_user_location: parsed.data.end_user_location ?? "",
    action_taken: "",
    parts_received_status: parsed.data.parts_received_status,
    priority: parsed.data.priority,
    sla_hours: parsed.data.sla_hours,
    notes: parsed.data.notes?.trim() ? parsed.data.notes : null,
    received_at: new Date().toISOString(),
    status: "sin_asignar" as const,
    km_cliente: nearest.kmCliente,
    km_infomac: kmInfomac,
    base_cliente_id: nearest.baseClienteId,
    base_infomac_id: parsed.data.base_infomac_id,
  };

  const { data, error } = await supabase.from("tickets").insert(row).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { id: data?.id };
}

function distanceKeysChanged(rest: Record<string, unknown>) {
  return (
    ("city" in rest && rest.city !== undefined) ||
    ("province" in rest && rest.province !== undefined) ||
    ("base_infomac_id" in rest && rest.base_infomac_id !== undefined)
  );
}

/**
 * Actualiza campos de un ticket (estado, técnico, notas, fechas, datos operativos).
 * Recalcula km si cambian ciudad, provincia o base INFOMAC.
 * @param input Payload parcial validado.
 */
export async function updateTicketAction(input: unknown) {
  const parsed = ticketUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await createServerSupabaseClient();
  const { id, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { ...rest };

  if (distanceKeysChanged(rest as Record<string, unknown>)) {
    const { data: current } = await supabase.from("tickets").select("city, province, base_infomac_id").eq("id", id).single();
    if (current) {
      const city = (rest.city as string | undefined) ?? current.city;
      const province = (rest.province as string | undefined) ?? current.province;
      const baseInfomacId =
        "base_infomac_id" in rest ? (rest.base_infomac_id as string | null) : current.base_infomac_id;

      const { data: bases } = await supabase.from("bases").select("*");
      const list = bases ?? [];
      const nearest = await computeNearestBases(city, province, list);
      patch.km_cliente = nearest.kmCliente;
      patch.base_cliente_id = nearest.baseClienteId;

      if (baseInfomacId) {
        const km = await computeKmTicketToBase(city, province, baseInfomacId, list);
        patch.km_infomac = km ?? nearest.kmInfomac;
        patch.base_infomac_id = baseInfomacId;
      } else {
        patch.km_infomac = nearest.kmInfomac;
        patch.base_infomac_id = nearest.baseInfomacId;
      }
    }
  }

  const updatePayload = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Database["public"]["Tables"]["tickets"]["Update"];

  if (Object.keys(updatePayload).length === 0) {
    return { ok: true };
  }

  const { error } = await supabase.from("tickets").update(updatePayload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${id}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Actualización masiva de técnico o estado.
 * @param ids IDs de tickets.
 * @param patch Campos a aplicar.
 */
export async function bulkUpdateTicketsAction(
  ids: string[],
  patch: Database["public"]["Tables"]["tickets"]["Update"],
) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("tickets").update(patch).in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { ok: true };
}
