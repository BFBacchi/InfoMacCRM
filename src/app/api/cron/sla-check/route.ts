import { addHours, isAfter, parseISO } from "date-fns";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * Cron: inserta notificaciones cuando un ticket abierto supera el 80 % del SLA.
 * Protegido por `Authorization: Bearer ${CRON_SECRET}`.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  const { data: settings } = await supabase.from("notification_settings").select("*").eq("key", "sla_warning_80").maybeSingle();
  if (settings && !settings.enabled) {
    return NextResponse.json({ skipped: true });
  }

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, ticket_number, received_at, sla_hours, technician_id")
    .in("status", ["sin_asignar", "asignado", "en_curso"]);

  let created = 0;
  for (const t of tickets ?? []) {
    if (!t.received_at) continue;
    const start = parseISO(t.received_at);
    const warnAt = addHours(start, Math.floor((t.sla_hours ?? 48) * 0.8));
    if (!isAfter(new Date(), warnAt)) continue;
    const limit = addHours(start, t.sla_hours ?? 48);
    if (isAfter(new Date(), limit)) continue;

    const targets: string[] = [];
    if (t.technician_id) {
      const { data: tech } = await supabase.from("technicians").select("profile_id").eq("id", t.technician_id).maybeSingle();
      if (tech?.profile_id) targets.push(tech.profile_id);
    }
    const { data: coordinators } = await supabase.from("profiles").select("id").eq("role", "coordinator");
    for (const c of coordinators ?? []) targets.push(c.id);
    const unique = [...new Set(targets)];
    for (const uid of unique) {
      const { error } = await supabase.from("notifications").insert({
        user_id: uid,
        ticket_id: t.id,
        type: "sla_warning",
        message: `SLA al 80% en ticket ${t.ticket_number}`,
        read: false,
      });
      if (!error) created += 1;
    }
  }

  return NextResponse.json({ created });
}
