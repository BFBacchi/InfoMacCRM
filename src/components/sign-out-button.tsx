"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * Cierra sesión en Supabase y redirige al login.
 */
export function SignOutButton() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  return (
    <Button
      variant="tertiary"
      size="sm"
      fillWidth
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Cerrar sesión
    </Button>
  );
}
