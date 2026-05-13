import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";

/**
 * Solo el superusuario (`profiles.is_superuser`) puede acceder a rutas de gestión de equipo.
 */
export function assertSuperuser(profile: Profile | null): asserts profile is Profile {
  if (!profile || !profile.is_superuser) {
    redirect("/dashboard");
  }
}
