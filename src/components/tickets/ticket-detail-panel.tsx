"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTicketAction } from "@/app/(dashboard)/tickets/actions";
import { TicketMapEmbed } from "@/components/maps/ticket-map-embed";
import { TicketSlaBar } from "@/components/tickets/ticket-sla-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { HStack, VStack } from "@/components/ui/stack";
import type { Ticket, TicketStatus } from "@/types/database";

const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "sin_asignar", label: "Sin asignar" },
  { value: "asignado", label: "Asignado" },
  { value: "en_curso", label: "En curso" },
  { value: "cerrado_operativo", label: "Cerrado operativo" },
  { value: "cerrado_definitivo", label: "Cerrado definitivo" },
];

type HistoryRow = {
  id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
};

type Props = {
  ticket: Ticket;
  history: HistoryRow[];
  technicians: { id: string; label: string }[];
  canManage: boolean;
};

/**
 * Detalle editable de ticket: SLA, estado, asignación, mapa y bitácora.
 */
export function TicketDetailPanel({ ticket: initial, history, technicians, canManage }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [pending, start] = useTransition();

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(`${ticket.city}, ${ticket.province}, Argentina`);
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }, [ticket.city, ticket.province]);

  const onStatus = (v: string) => {
    start(async () => {
      const res = await updateTicketAction({ id: ticket.id, status: v as TicketStatus });
      if ("error" in res && res.error) toast.error(res.error);
      else {
        setTicket((t) => ({ ...t, status: v as TicketStatus }));
        toast.success("Estado actualizado");
        router.refresh();
      }
    });
  };

  const onTech = (v: string) => {
    start(async () => {
      const res = await updateTicketAction({
        id: ticket.id,
        technician_id: v || null,
        status: v ? "asignado" : ticket.status,
      });
      if ("error" in res && res.error) toast.error(res.error);
      else {
        setTicket((t) => ({ ...t, technician_id: v || null, status: v ? "asignado" : t.status }));
        toast.success("Asignación actualizada");
        router.refresh();
      }
    });
  };

  return (
    <VStack className="gap-8">
      <HStack className="items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{ticket.ticket_number}</h1>
        <Button href={mapsUrl} variant="tertiary" size="sm" className="inline-flex items-center gap-1.5">
          <span>Cómo llegar (Google Maps)</span>
          <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </HStack>

      <Card padding="l" radius="l" className="w-full">
        <VStack className="gap-4">
          <p className="text-sm text-zinc-800 dark:text-zinc-200">
            {ticket.city}, {ticket.province} · Prioridad {ticket.priority}
          </p>
          <TicketSlaBar receivedAt={ticket.received_at} slaHours={ticket.sla_hours} />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            km cliente: {ticket.km_cliente ?? "—"} · km INFOMAC: {ticket.km_infomac ?? "—"}
          </p>
          {canManage ? (
            <HStack className="gap-4">
              <FormSelect
                id="status"
                label="Estado"
                options={STATUSES.map((s) => ({ value: s.value, label: s.label }))}
                value={ticket.status}
                onSelect={(v) => onStatus(v)}
              />
              <FormSelect
                id="technician"
                label="Técnico"
                options={[{ value: "", label: "Sin asignar" }, ...technicians.map((t) => ({ value: t.id, label: t.label }))]}
                value={ticket.technician_id ?? ""}
                onSelect={(v) => onTech(v)}
              />
            </HStack>
          ) : null}
        </VStack>
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ubicación</h2>
        <div className="mt-4 w-full">
          <TicketMapEmbed city={ticket.city} province={ticket.province} />
        </div>
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Descripción</h2>
        <p className="mt-3 text-sm text-zinc-800 dark:text-zinc-200">{ticket.description}</p>
        {ticket.notes ? (
          <>
            <hr className="my-4 border-zinc-200 dark:border-zinc-800" />
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notas</p>
            <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">{ticket.notes}</p>
          </>
        ) : null}
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Historial</h2>
        <VStack className="mt-4 gap-2">
          {history.length === 0 ? (
            <p className="text-sm text-zinc-500">Sin movimientos registrados.</p>
          ) : (
            history.map((h) => (
              <p key={h.id} className="text-sm text-zinc-800 dark:text-zinc-200">
                {new Date(h.created_at).toLocaleString("es-AR")} — {h.action}
                {h.previous_value || h.new_value ? ` (${h.previous_value ?? ""} → ${h.new_value ?? ""})` : ""}
              </p>
            ))
          )}
        </VStack>
      </Card>

      <Button variant="secondary" onClick={() => router.push(`/warranty?ticket=${ticket.id}`)} disabled={pending}>
        Ver garantías vinculadas
      </Button>
    </VStack>
  );
}
