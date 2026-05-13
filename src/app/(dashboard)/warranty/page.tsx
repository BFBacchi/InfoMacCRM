import { WarrantyCaseCard } from "@/components/warranty/warranty-case-card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ ticket?: string }> };

/**
 * Listado de casos de garantía con filtro opcional por ticket.
 */
export default async function WarrantyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createServerSupabaseClient();
  let q = supabase.from("warranty_cases").select("*").order("created_at", { ascending: false });
  if (sp.ticket) q = q.eq("ticket_id", sp.ticket);
  const { data: rows } = await q;
  const list = rows ?? [];
  const ticketIds = [...new Set(list.map((r) => r.ticket_id))];
  let numbers: { id: string; ticket_number: string }[] = [];
  if (ticketIds.length) {
    const { data } = await supabase.from("tickets").select("id, ticket_number").in("id", ticketIds);
    numbers = data ?? [];
  }
  const numBy = new Map(numbers.map((t) => [t.id, t.ticket_number]));

  const mapped = list.map((r) => ({
    ...r,
    ticket_number: numBy.get(r.ticket_id) ?? null,
  }));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Garantías</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Checklist: para “recibida” y “completada” se validan fotos y remito según reglas del servidor.
      </p>
      <div className="flex flex-col gap-4">
        {mapped.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No hay casos.</p>
        ) : (
          mapped.map((r) => <WarrantyCaseCard key={r.id} row={r} />)
        )}
      </div>
    </div>
  );
}
