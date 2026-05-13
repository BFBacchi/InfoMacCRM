"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Profile } from "@/types/database";

type Props = {
  profile: Profile;
  children: React.ReactNode;
};

/**
 * Redirige a onboarding si faltan datos obligatorios del perfil (excepto en /onboarding).
 * @param props.profile Perfil del usuario autenticado.
 * @param props.children Contenido de la ruta.
 */
export function ProfileGate({ profile, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const incomplete =
      !profile.full_name?.trim() ||
      !profile.phone?.trim() ||
      !profile.base_id;
    if (incomplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [pathname, profile.base_id, profile.full_name, profile.phone, router]);

  return <>{children}</>;
}
