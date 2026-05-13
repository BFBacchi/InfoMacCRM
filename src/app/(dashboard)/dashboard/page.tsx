import { addHours, isAfter, parseISO, startOfDay, subDays } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardCharts, type BarDatum, type ChartDatum } from "@/components/dashboard/dashboard-charts";
import { Card } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Ticket, TicketStatus } from "@/types/database";

const STATUS_LABEL: Record<TicketStatus, string> = {
  sin_asignar: "Sin asignar",
  asignado: "Asignado",
  en_curso: "En curso",
  cerrado_operativo: "Cerrado operativo",
  cerrado_definitivo: "Cerrado definitivo",
};

/**
 * Panel principal con métricas, gráficos y widgets por rol.
 */
export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const supabase = await createServerSupabaseClient();

  const todayStart = startOfDay(new Date());
  const weekAgo = subDays(todayStart, 7);

  const { data: tickets } = await supabase.from("tickets").select("*");

  const list = (tickets ?? []) as Ticket[];
  const openStatuses: TicketStatus[] = ["sin_asignar", "asignado", "en_curso"];
  const open = list.filter((t) => openStatuses.includes(t.status));
  const closedToday = list.filter(
    (t) => t.closed_at && isAfter(parseISO(t.closed_at), todayStart),
  );

  const slaRisk = open.filter((t) => {
    if (!t.received_at) return false;
    const limit = addHours(parseISO(t.received_at), t.sla_hours);
    const warn = addHours(parseISO(t.received_at), Math.floor(t.sla_hours * 0.8));
    return isAfter(new Date(), warn) && !isAfter(new Date(), limit);
  });

  const closedStatuses: TicketStatus[] = ["cerrado_operativo", "cerrado_definitivo"];
  const closedWeek = list.filter(
    (t) =>
      t.closed_at &&
      isAfter(parseISO(t.closed_at), weekAgo) &&
      closedStatuses.includes(t.status),
  );
  const prevWeekStart = subDays(weekAgo, 7);
  const closedPrevWeek = list.filter((t) => {
    if (!t.closed_at) return false;
    const d = parseISO(t.closed_at);
    return isAfter(d, prevWeekStart) && !isAfter(d, weekAgo) && closedStatuses.includes(t.status);
  });
  const slaOk = closedWeek.filter((t) => {
    if (!t.received_at || !t.closed_at) return true;
    return !isAfter(parseISO(t.closed_at), addHours(parseISO(t.received_at), t.sla_hours));
  });
  const slaRate = closedWeek.length ? Math.round((slaOk.length / closedWeek.length) * 100) : 100;
  const prevSlaOk = closedPrevWeek.filter((t) => {
    if (!t.received_at || !t.closed_at) return true;
    return !isAfter(parseISO(t.closed_at), addHours(parseISO(t.received_at), t.sla_hours));
  });
  const prevRate = closedPrevWeek.length
    ? Math.round((prevSlaOk.length / closedPrevWeek.length) * 100)
    : slaRate;
  const trend = slaRate - prevRate;

  const byStatus: Partial<Record<TicketStatus, number>> = {};
  for (const t of list) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  }
  const statusSeries: ChartDatum[] = (Object.keys(byStatus) as TicketStatus[]).map((k) => ({
    name: STATUS_LABEL[k],
    value: byStatus[k] ?? 0,
  }));

  const byProv: Record<string, number> = {};
  for (const t of open) {
    byProv[t.province] = (byProv[t.province] ?? 0) + 1;
  }
  const provinceSeries: BarDatum[] = Object.entries(byProv).map(([label, count]) => ({
    label,
    count,
  }));

  const { data: techs } = await supabase.from("technicians").select("id, profile_id");
  const workload: { label: string; count: number }[] = [];
  if (techs?.length) {
    for (const tech of techs) {
      const c = list.filter((t) => t.technician_id === tech.id && openStatuses.includes(t.status)).length;
      workload.push({ label: tech.id.slice(0, 8), count: c });
    }
  }

  const { count: warrantyPending } = await supabase
    .from("warranty_cases")
    .select("id", { count: "exact", head: true })
    .in("return_status", ["pendiente", "en_proceso"]);

  const avgResolution =
    closedWeek.length > 0
      ? Math.round(
          closedWeek.reduce((acc, t) => {
            if (!t.received_at || !t.closed_at) return acc;
            const h =
              (parseISO(t.closed_at).getTime() - parseISO(t.received_at).getTime()) / (1000 * 3600);
            return acc + h;
          }, 0) / closedWeek.length,
        )
      : 0;

  const { data: techRow } = await supabase
    .from("technicians")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const myTickets =
    profile.role === "technician" && techRow
      ? list.filter((t) => t.technician_id === techRow.id).slice(0, 5)
      : [];

  const expiring = open.filter((t) => {
    if (!t.received_at) return false;
    const limit = addHours(parseISO(t.received_at), t.sla_hours);
    const soon = addHours(new Date(), 24);
    return isAfter(limit, new Date()) && !isAfter(limit, soon);
  });

  const { data: recentHistory } = await supabase
    .from("ticket_history")
    .select("id, action, created_at, ticket_id, new_value")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Panel operativo</h1>

      <div className="flex flex-wrap gap-4">
        <MetricCard title="Tickets abiertos" value={String(open.length)} />
        <MetricCard title="Cerrados hoy" value={String(closedToday.length)} />
        <MetricCard title="En riesgo SLA (80 %)" value={String(slaRisk.length)} />
        <MetricCard
          title="SLA cumplido (7 días)"
          value={`${slaRate}%`}
          subtitle={trend >= 0 ? `+${trend} vs semana previa` : `${trend} vs semana previa`}
        />
        <MetricCard title="Devoluciones pendientes" value={String(warrantyPending ?? 0)} />
        <MetricCard title="Tiempo medio resolución (h)" value={String(avgResolution)} />
      </div>

      <DashboardCharts statusSeries={statusSeries} provinceSeries={provinceSeries} />

      <div className="flex flex-wrap gap-6">
        {profile.role === "technician" ? (
          <Card padding="l" radius="l" className="min-w-[280px] flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Mis tickets</h2>
            <div className="mt-4 flex flex-col gap-2">
              {myTickets.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No tenés tickets asignados.</p>
              ) : (
                myTickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}`}
                    className="text-sm text-zinc-800 transition-colors hover:text-blue-700 dark:text-zinc-200 dark:hover:text-blue-400"
                  >
                    {t.ticket_number} — {t.city} ({STATUS_LABEL[t.status]})
                  </Link>
                ))
              )}
            </div>
          </Card>
        ) : null}

        {(profile.role === "coordinator" || profile.role === "admin") && expiring.length > 0 ? (
          <Card padding="l" radius="l" className="min-w-[280px] flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Vencen en 24h</h2>
            <div className="mt-4 flex flex-col gap-2">
              {expiring.map((t) => (
                <p key={t.id} className="text-sm text-zinc-800 dark:text-zinc-200">
                  {t.ticket_number} — {t.province} / {t.city}
                </p>
              ))}
            </div>
          </Card>
        ) : null}

        <Card padding="l" radius="l" className="min-w-[280px] flex-1">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Carga por técnico (abiertos)</h2>
          <div className="mt-4 flex flex-col gap-1">
            {workload.map((w) => (
              <p key={w.label} className="text-sm text-zinc-800 dark:text-zinc-200">
                {w.label}: {w.count}
              </p>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Actividad reciente</h2>
        <div className="mt-4 flex flex-col gap-2">
          {(recentHistory ?? []).map((h) => (
            <p key={h.id} className="text-sm text-zinc-800 dark:text-zinc-200">
              {new Date(h.created_at).toLocaleString("es-AR")} — {h.action}
              {h.new_value ? `: ${h.new_value}` : ""}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle?: string }) {
  return (
    <Card padding="m" radius="m" className="min-w-[160px] flex-1 basis-[160px]">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</p>
        <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{value}</p>
        {subtitle ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
      </div>
    </Card>
  );
}
