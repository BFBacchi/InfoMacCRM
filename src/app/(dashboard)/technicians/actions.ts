"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Activa o desactiva la disponibilidad de un técnico.
 * @param technicianId ID en `technicians`.
 * @param availability Nuevo valor.
 */
export async function setTechnicianAvailabilityAction(technicianId: string, availability: boolean) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("technicians").update({ availability }).eq("id", technicianId);
  if (error) return { error: error.message };
  revalidatePath("/technicians");
  return { ok: true };
}

/**
 * Formulario server action para alternar disponibilidad.
 */
export async function toggleTechnicianForm(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const availability = formData.get("availability") === "true";
  if (!id) return;
  await setTechnicianAvailabilityAction(id, availability);
}
