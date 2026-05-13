import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { assertRole } from "@/lib/auth/assert-role";
import { getCurrentProfile } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Agrupa casos de garantía con devolución pendiente por técnico (Hoja 2 / logística).
 */
export default async function WarrantyBatchesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertRole(profile, ["admin", "coordinator"]);

  const supabase = await createServerSupabaseClient();
  const { data: cases } = await supabase
    .from("warranty_cases")
    .select("id, technician_id, ticket_id, part_description, return_status")
    .in("return_status", ["pendiente", "en_proceso"])
    .order("created_at", { ascending: false });

  const list = cases ?? [];
  const ticketIds = [...new Set(list.map((c) => c.ticket_id))];
  let locs: { id: string; city: string; province: string }[] = [];
  if (ticketIds.length) {
    const { data } = await supabase.from("tickets").select("id, city, province").in("id", ticketIds);
    locs = data ?? [];
  }
  const locBy = new Map(locs.map((t) => [t.id, t]));

  const byTech = new Map<string | null, typeof list>();
  for (const c of list) {
    const k = c.technician_id;
    const arr = byTech.get(k) ?? [];
    arr.push(c);
    byTech.set(k, arr);
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Lotes de devolución</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Casos agrupados por técnico (devolución pendiente o en proceso).
      </p>
      {list.length === 0 ? <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay devoluciones pendientes.</p> : null}
      {[...byTech.entries()].map(([techId, rows]) => (
        <Card key={techId ?? "sin-tecnico"} padding="l" radius="l" className="w-full">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Técnico {techId?.slice(0, 8) ?? "sin asignar"}
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {rows.map((r) => {
              const tk = locBy.get(r.ticket_id);
              return (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{r.part_description}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {tk ? `${tk.city}, ${tk.province}` : "—"} · {r.return_status}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      ))}
    </div>
  );
}
