"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { warrantyUpdateSchema } from "@/types/schemas/warranty";

/**
 * Actualiza un caso de garantía con validación Zod.
 * @param input Campos a persistir.
 */
export async function updateWarrantyCaseAction(input: unknown) {
  const parsed = warrantyUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Validación fallida", details: parsed.error.flatten() };
  }
  const supabase = await createServerSupabaseClient();
  const { id, ...rest } = parsed.data;
  const { error } = await supabase.from("warranty_cases").update(rest).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/warranty");
  return { ok: true };
}

/**
 * Crea un caso de garantía vinculado a un ticket Dell/Lenovo.
 */
export async function createWarrantyCaseAction(payload: {
  ticket_id: string;
  client_id: string;
  part_description: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: ticket } = await supabase
    .from("tickets")
    .select("technician_id, client_id")
    .eq("id", payload.ticket_id)
    .single();
  if (!ticket) return { error: "Ticket no encontrado" };

  const { error } = await supabase.from("warranty_cases").insert({
    ticket_id: payload.ticket_id,
    client_id: payload.client_id,
    technician_id: ticket.technician_id,
    part_description: payload.part_description,
  });
  if (error) return { error: error.message };
  revalidatePath("/warranty");
  revalidatePath(`/tickets/${payload.ticket_id}`);
  return { ok: true };
}
