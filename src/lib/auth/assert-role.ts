import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

/**
 * Redirige a `/dashboard` si el rol del usuario no está permitido.
 * @param profile Perfil actual o null.
 * @param allowed Roles permitidos para la ruta.
 */
export function assertRole(profile: Profile | null, allowed: Array<Profile["role"]>): asserts profile is Profile {
  if (!profile || !allowed.includes(profile.role)) {
    redirect("/dashboard");
  }
}
