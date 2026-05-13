"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateWarrantyCaseAction } from "@/app/(dashboard)/warranty/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { VStack } from "@/components/ui/stack";
import type { PartStatus, ReturnStatus, WarrantyCase } from "@/types/database";

type Row = WarrantyCase & { ticket_number?: string | null };

const PART_OPTS: { value: PartStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "recibida", label: "Recibida" },
  { value: "incorrecta", label: "Incorrecta" },
  { value: "devuelta", label: "Devuelta" },
];

const RET_OPTS: { value: ReturnStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completada", label: "Completada" },
];

/**
 * Tarjeta de edición de un caso de garantía (URLs de fotos/remitos).
 */
export function WarrantyCaseCard({ row: initial }: { row: Row }) {
  const router = useRouter();
  const [row, setRow] = useState(initial);
  const [partPhoto, setPartPhoto] = useState(row.part_photo_url ?? "");
  const [retPhoto, setRetPhoto] = useState(row.return_photo_url ?? "");
  const [retRemito, setRetRemito] = useState(row.return_remito_url ?? "");
  const [pending, start] = useTransition();

  const run = (patch: Record<string, unknown>) => {
    start(async () => {
      const res = await updateWarrantyCaseAction({ id: row.id, ...patch });
      if ("error" in res && res.error) toast.error(res.error);
      else {
        toast.success("Guardado");
        setRow((r) => ({ ...r, ...(patch as Partial<WarrantyCase>) }));
        router.refresh();
      }
    });
  };

  return (
    <Card padding="l" radius="l" className="w-full">
      <VStack className="gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Caso {row.id.slice(0, 8)} — Ticket {row.ticket_number ?? row.ticket_id}
        </h2>
        <p className="text-sm text-zinc-800 dark:text-zinc-200">{row.part_description}</p>
        <FormSelect
          id={`part-${row.id}`}
          label="Estado repuesto"
          options={PART_OPTS}
          value={row.part_status}
          onSelect={(v) => setRow((r) => ({ ...r, part_status: v as PartStatus }))}
        />
        <Input id={`part-photo-${row.id}`} label="URL foto repuesto" value={partPhoto} onChange={(e) => setPartPhoto(e.target.value)} />
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run({
              part_status: row.part_status,
              part_photo_url: partPhoto || null,
            })
          }
        >
          Guardar repuesto
        </Button>
        <FormSelect
          id={`ret-${row.id}`}
          label="Devolución"
          options={RET_OPTS}
          value={row.return_status}
          onSelect={(v) => setRow((r) => ({ ...r, return_status: v as ReturnStatus }))}
        />
        <Input id={`ret-photo-${row.id}`} label="URL foto devolución" value={retPhoto} onChange={(e) => setRetPhoto(e.target.value)} />
        <Input id={`ret-rem-${row.id}`} label="URL remito" value={retRemito} onChange={(e) => setRetRemito(e.target.value)} />
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run({
              return_status: row.return_status,
              return_photo_url: retPhoto || null,
              return_remito_url: retRemito || null,
            })
          }
        >
          Guardar devolución
        </Button>
      </VStack>
    </Card>
  );
}
