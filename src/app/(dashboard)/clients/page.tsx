import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { assertRole } from "@/lib/auth/assert-role";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Directorio de clientes con SLA configurado.
 */
export default async function ClientsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertRole(profile, ["admin", "coordinator"]);

  const supabase = await createServerSupabaseClient();
  const { data: clients } = await supabase.from("clients").select("*").order("name");
  const { data: tickets } = await supabase.from("tickets").select("id, client_id");
  const countBy = new Map<string, number>();
  for (const t of tickets ?? []) {
    countBy.set(t.client_id, (countBy.get(t.client_id) ?? 0) + 1);
  }

  const headers = [
    { key: "n", content: "Cliente" },
    { key: "t", content: "Tipo" },
    { key: "s", content: "SLA (h)" },
    { key: "c", content: "Tickets" },
  ];
  const rows =
    clients?.map((c) => [
      <span key={`${c.id}-n`} className="text-sm">
        {c.name}
      </span>,
      <span key={`${c.id}-t`} className="text-sm">
        {c.type}
      </span>,
      <span key={`${c.id}-s`} className="text-sm">
        {String(c.sla_hours)}
      </span>,
      <span key={`${c.id}-c`} className="text-sm">
        {String(countBy.get(c.id) ?? 0)}
      </span>,
    ]) ?? [];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Clientes</h1>
      <Card padding="m" radius="m" className="w-full">
        <Table data={{ headers, rows }} className="w-full" />
      </Card>
    </div>
  );
}
