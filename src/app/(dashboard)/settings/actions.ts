"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Inserta una base logística.
 */
export async function createBaseAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const type = String(formData.get("type") ?? "infomac") as "cliente" | "infomac";
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  if (!name || !city || !province) return;
  const supabase = await createServerSupabaseClient();
  await supabase.from("bases").insert({ name, city, province, type, lat: lat || null, lng: lng || null });
  revalidatePath("/settings");
}

/**
 * Inserta un cliente OEM.
 */
export async function createClientAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "other") as "dell" | "lenovo" | "other";
  const sla = Number(formData.get("sla_hours") ?? 48);
  if (!name) return;
  const supabase = await createServerSupabaseClient();
  await supabase.from("clients").insert({
    name,
    type,
    sla_hours: sla,
    contact_email: null,
    contact_phone: null,
  });
  revalidatePath("/settings");
  revalidatePath("/clients");
}

/**
 * Activa o desactiva un disparador de notificación.
 */
export async function toggleNotificationSettingAction(formData: FormData) {
  const key = String(formData.get("key") ?? "");
  const enabled = formData.get("enabled") === "true";
  if (!key) return;
  const supabase = await createServerSupabaseClient();
  await supabase.from("notification_settings").update({ enabled }).eq("key", key);
  revalidatePath("/settings");
}
