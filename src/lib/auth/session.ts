import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Obtiene el perfil del usuario autenticado o null.
 * @returns Perfil desde la tabla `profiles`.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

/**
 * Comprueba si el rol del usuario está en la lista permitida.
 * @param profile Perfil actual (puede ser null).
 * @param roles Roles permitidos.
 */
export function hasRole(
  profile: Profile | null,
  roles: Array<Profile["role"]>,
): boolean {
  if (!profile) return false;
  return roles.includes(profile.role);
}
