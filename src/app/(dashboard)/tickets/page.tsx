import { redirect } from "next/navigation";
import { TicketsExplorer } from "@/components/tickets/tickets-explorer";
import { getCurrentProfile, hasRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Lista de tickets con tabla y vista Kanban.
 */
export default async function TicketsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const supabase = await createServerSupabaseClient();
  const { data: tickets } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");
  const { data: techRows } = await supabase.from("technicians").select("id, profile_id");
  const profileIds = [...new Set((techRows ?? []).map((t) => t.profile_id))];
  let techProfiles: { id: string; full_name: string }[] = [];
  if (profileIds.length) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
    techProfiles = data ?? [];
  }

  const nameByProfile = new Map((techProfiles ?? []).map((p) => [p.id, p.full_name]));

  const technicians =
    techRows?.map((t) => ({
      id: t.id,
      label: nameByProfile.get(t.profile_id) ?? t.id.slice(0, 8),
    })) ?? [];

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const techById = new Map(technicians.map((x) => [x.id, x.label]));
  const initialTickets = (tickets ?? []).map((t) => ({
    ...t,
    client_name: clientMap.get(t.client_id) ?? null,
    technician_label: t.technician_id ? techById.get(t.technician_id) ?? "—" : "—",
  }));

  const canManage = hasRole(profile, ["admin", "coordinator"]);

  return (
    <TicketsExplorer
      initialTickets={initialTickets}
      clients={clients ?? []}
      technicians={technicians}
      canManage={canManage}
    />
  );
}
