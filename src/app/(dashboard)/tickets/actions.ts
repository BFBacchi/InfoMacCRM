"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { computeNearestBases } from "@/lib/google-maps/nearest-bases";
import { ticketCreateSchema, ticketUpdateSchema } from "@/types/schemas/tickets";

/**
 * Crea un ticket y calcula km / bases cercanas si hay coordenadas en `bases`.
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
  const nearest = await computeNearestBases(parsed.data.city, parsed.data.province, bases ?? []);

  const { data: profile } = await supabase.from("profiles").select("id").eq("id", user.id).single();

  const row = {
    client_id: parsed.data.client_id,
    coordinator_id: profile?.id ?? user.id,
    city: parsed.data.city,
    province: parsed.data.province,
    task_type: parsed.data.task_type,
    description: parsed.data.description,
    priority: parsed.data.priority,
    sla_hours: parsed.data.sla_hours,
    notes: parsed.data.notes ?? null,
    received_at: new Date().toISOString(),
    status: "sin_asignar" as const,
    km_cliente: nearest.kmCliente,
    km_infomac: nearest.kmInfomac,
    base_cliente_id: nearest.baseClienteId,
    base_infomac_id: nearest.baseInfomacId,
  };

  const { data, error } = await supabase.from("tickets").insert(row).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  return { id: data?.id };
}

/**
 * Actualiza campos de un ticket (estado, técnico, notas, fechas).
 * @param input Payload parcial validado.
 */
export async function updateTicketAction(input: unknown) {
  const parsed = ticketUpdateSchema.safeParse(input);
  if (!parsed.success) return { error: "Datos inválidos" };
  const supabase = await createServerSupabaseClient();
  const { id, ...rest } = parsed.data;
  const { error } = await supabase.from("tickets").update(rest).eq("id", id);
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
