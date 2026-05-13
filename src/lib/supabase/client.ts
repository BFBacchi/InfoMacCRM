import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Crea el cliente Supabase para el navegador (sesión en cookies vía `@supabase/ssr`).
 * @returns Cliente tipado para operaciones en componentes cliente.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
