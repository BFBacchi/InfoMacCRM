import { redirect } from "next/navigation";
import { TicketCreateForm } from "@/components/tickets/ticket-create-form";
import { getCurrentProfile, hasRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Alta de ticket (coordinadores y administradores).
 */
export default async function NewTicketPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!hasRole(profile, ["admin", "coordinator"])) redirect("/tickets");

  const supabase = await createServerSupabaseClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");
  if (!clients?.length) {
    return <p>No hay clientes configurados. Cargá clientes en Configuración.</p>;
  }

  return <TicketCreateForm clients={clients} />;
}
