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

  const { data: bases } = await supabase.from("bases").select("id, name, city, province, type").order("name");
  const infomacBases =
    (bases ?? [])
      .filter((b) => b.type === "infomac")
      .map((b) => ({
        id: b.id,
        label: `${b.name} — ${b.city}, ${b.province}`,
      })) ?? [];

  if (!infomacBases.length) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No hay bases INFOMAC con tipo &quot;infomac&quot; cargadas. Agregá al menos una base en Configuración (con lat/lng para
        distancias).
      </p>
    );
  }

  return <TicketCreateForm clients={clients} infomacBases={infomacBases} />;
}
