import { redirect } from "next/navigation";
import { GuestHome } from "@/components/marketing/guest-home";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Raíz: panel si hay sesión; landing con credenciales demo si no.
 */
export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <GuestHome />;
}
