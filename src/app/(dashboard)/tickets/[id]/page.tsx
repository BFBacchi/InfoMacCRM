import { notFound, redirect } from "next/navigation";
import { TicketDetailPanel } from "@/components/tickets/ticket-detail-panel";
import { getCurrentProfile, hasRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

/**
 * Detalle de ticket con historial y acciones según rol.
 */
export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createServerSupabaseClient();
  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).single();
  if (!ticket) notFound();

  const { data: history } = await supabase
    .from("ticket_history")
    .select("id, action, previous_value, new_value, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: false });

  const { data: techRows } = await supabase.from("technicians").select("id, profile_id");
  const profileIds = [...new Set((techRows ?? []).map((t) => t.profile_id))];
  let names: { id: string; full_name: string }[] = [];
  if (profileIds.length) {
    const { data } = await supabase.from("profiles").select("id, full_name").in("id", profileIds);
    names = data ?? [];
  }
  const nameBy = new Map(names.map((p) => [p.id, p.full_name]));
  const technicians =
    techRows?.map((t) => ({
      id: t.id,
      label: nameBy.get(t.profile_id) ?? t.id.slice(0, 8),
    })) ?? [];

  const { data: bases } = await supabase.from("bases").select("id, name, city, province, type").order("name");
  const infomacBases =
    (bases ?? [])
      .filter((b) => b.type === "infomac")
      .map((b) => ({
        id: b.id,
        label: `${b.name} — ${b.city}, ${b.province}`,
      })) ?? [];

  const canManage = hasRole(profile, ["admin", "coordinator"]);

  return (
    <TicketDetailPanel
      ticket={ticket}
      history={history ?? []}
      technicians={technicians}
      infomacBases={infomacBases}
      canManage={canManage}
    />
  );
}
