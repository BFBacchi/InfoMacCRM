"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  full_name: z.string().min(1),
  role: z.enum(["coordinator", "technician"]),
  base_id: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.string().uuid().nullable()),
  specialty: z.string().optional().nullable(),
});

const updateSchema = z.object({
  profile_id: z.string().uuid(),
  full_name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["coordinator", "technician"]),
  base_id: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : val), z.string().uuid().nullable()),
  phone: z.string().nullable().optional(),
  specialty: z.string().nullable().optional(),
  availability: z.enum(["true", "false"]).optional(),
});

async function requireSuper() {
  const me = await getCurrentProfile();
  if (!me?.is_superuser) {
    return { error: "Solo el superusuario puede gestionar el equipo.", admin: null as Awaited<ReturnType<typeof getCurrentProfile>> };
  }
  return { error: null as string | null, admin: me };
}

/**
 * Crea usuario Auth + perfil coordinador o técnico (y fila technicians si aplica).
 */
export async function createTeamMemberAction(formData: FormData) {
  const parsed = createSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    role: formData.get("role"),
    base_id: formData.get("base_id") || null,
    specialty: formData.get("specialty") || null,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const gate = await requireSuper();
  if (gate.error) return { error: gate.error };

  const admin = createServiceRoleClient();
  const { email, password, full_name, role, base_id, specialty } = parsed.data;
  const availability = formData.get("availability") !== "false";

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (cErr) return { error: cErr.message };
  const id = created.user!.id;

  const { error: pErr } = await admin
    .from("profiles")
    .update({
      full_name,
      email,
      role: role as UserRole,
      base_id: base_id ?? null,
      phone: null,
    })
    .eq("id", id);
  if (pErr) {
    await admin.auth.admin.deleteUser(id);
    return { error: pErr.message };
  }

  if (role === "technician") {
    const { error: tErr } = await admin.from("technicians").insert({
      profile_id: id,
      base_id: base_id ?? null,
      specialty: specialty?.trim() || null,
      availability: availability ?? true,
    });
    if (tErr) {
      await admin.auth.admin.deleteUser(id);
      return { error: tErr.message };
    }
  }

  revalidatePath("/settings/team");
  revalidatePath("/technicians");
  return { ok: true };
}

/**
 * Actualiza perfil y, si aplica, fila technicians (crea o elimina al cambiar rol).
 */
export async function updateTeamMemberAction(formData: FormData) {
  const parsed = updateSchema.safeParse({
    profile_id: formData.get("profile_id"),
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    base_id: formData.get("base_id") || null,
    phone: formData.get("phone") || null,
    specialty: formData.get("specialty") || null,
    availability: formData.get("availability") === "false" ? "false" : "true",
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const gate = await requireSuper();
  if (gate.error) return { error: gate.error };

  const { profile_id, full_name, email, role, base_id, phone, specialty, availability } = parsed.data;
  const availabilityBool = availability === "true";
  if (profile_id === gate.admin!.id) {
    return { error: "No podés editarte desde esta tabla; usá perfil / onboarding." };
  }

  const admin = createServiceRoleClient();

  const { data: target } = await admin.from("profiles").select("id, is_superuser, role").eq("id", profile_id).single();
  if (!target) return { error: "Usuario no encontrado." };
  if (target.is_superuser) return { error: "No se puede editar el superusuario desde aquí." };

  const { error: authErr } = await admin.auth.admin.updateUserById(profile_id, { email });
  if (authErr) return { error: authErr.message };

  const { error: pErr } = await admin
    .from("profiles")
    .update({
      full_name,
      email,
      role: role as UserRole,
      base_id: base_id ?? null,
      phone: phone?.trim() || null,
    })
    .eq("id", profile_id);
  if (pErr) return { error: pErr.message };

  const { data: techRow } = await admin.from("technicians").select("id").eq("profile_id", profile_id).maybeSingle();

  if (role === "technician") {
    if (techRow?.id) {
      const { error: uErr } = await admin
        .from("technicians")
        .update({
          base_id: base_id ?? null,
          specialty: specialty?.trim() || null,
          availability: availabilityBool ?? true,
        })
        .eq("id", techRow.id);
      if (uErr) return { error: uErr.message };
    } else {
      const { error: iErr } = await admin.from("technicians").insert({
        profile_id,
        base_id: base_id ?? null,
        specialty: specialty?.trim() || null,
        availability: availabilityBool,
      });
      if (iErr) return { error: iErr.message };
    }
  } else if (role === "coordinator" && techRow?.id) {
    const { error: dErr } = await admin.from("technicians").delete().eq("id", techRow.id);
    if (dErr) return { error: dErr.message };
  }

  revalidatePath("/settings/team");
  revalidatePath("/technicians");
  return { ok: true };
}

/**
 * Elimina usuario de Auth (cascada en profiles y technicians).
 */
export async function deleteTeamMemberAction(profileId: string) {
  const gate = await requireSuper();
  if (gate.error) return { error: gate.error };
  if (profileId === gate.admin!.id) return { error: "No podés eliminarte a vos mismo." };

  const admin = createServiceRoleClient();
  const { data: target } = await admin.from("profiles").select("is_superuser").eq("id", profileId).single();
  if (!target) return { error: "Usuario no encontrado." };
  if (target.is_superuser) return { error: "No se puede eliminar al superusuario." };

  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) return { error: error.message };
  revalidatePath("/settings/team");
  revalidatePath("/technicians");
  revalidatePath("/dashboard");
  return { ok: true };
}
