"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { bulkUpdateTicketsAction, updateTicketAction } from "@/app/(dashboard)/tickets/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { HStack, VStack } from "@/components/ui/stack";
import { Table } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import type { Ticket, TicketPartsReceived, TicketStatus } from "@/types/database";

const STATUSES: TicketStatus[] = [
  "sin_asignar",
  "asignado",
  "en_curso",
  "cerrado_operativo",
  "cerrado_definitivo",
];

const STATUS_LABEL: Record<TicketStatus, string> = {
  sin_asignar: "Sin asignar",
  asignado: "Asignado",
  en_curso: "En curso",
  cerrado_operativo: "Cerrado operativo",
  cerrado_definitivo: "Cerrado definitivo",
};

const PARTS_LABEL: Record<TicketPartsReceived, string> = {
  pendiente: "Pendiente",
  recibida: "Recibida",
  no_aplica: "No aplica",
};

type TicketRow = Ticket & { client_name?: string | null; technician_label?: string };

type TechOpt = { id: string; label: string };

type Props = {
  initialTickets: TicketRow[];
  clients: { id: string; name: string }[];
  technicians: TechOpt[];
  canManage: boolean;
};

const colHelper = createColumnHelper<TicketRow>();

/**
 * Tabla + Kanban de tickets con filtros básicos y acciones masivas.
 */
export function TicketsExplorer({ initialTickets, clients, technicians, canManage }: Props) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [tickets, setTickets] = useState(initialTickets);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTech, setBulkTech] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (clientFilter !== "all" && t.client_id !== clientFilter) return false;
      return true;
    });
  }, [tickets, statusFilter, clientFilter]);

  const columns = useMemo(
    () => [
      ...(canManage
        ? [
            colHelper.display({
              id: "sel",
              header: () => "Sel.",
              cell: ({ row }) => (
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300"
                  checked={selected.has(row.original.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(row.original.id);
                    else next.delete(row.original.id);
                    setSelected(next);
                  }}
                />
              ),
            }),
          ]
        : []),
      colHelper.accessor("ticket_number", { header: "Número", cell: (i) => i.getValue() }),
      colHelper.accessor("client_name", {
        header: "Cliente",
        cell: (i) => i.getValue() ?? "—",
      }),
      colHelper.accessor("equipment_model", {
        header: "Modelo",
        cell: (i) => {
          const v = i.getValue() as string;
          return v ? (v.length > 28 ? `${v.slice(0, 28)}…` : v) : "—";
        },
      }),
      colHelper.accessor("city", { header: "Ciudad", cell: (i) => i.getValue() }),
      colHelper.accessor("province", { header: "Prov.", cell: (i) => i.getValue() }),
      colHelper.accessor("technician_label", {
        header: "Técnico",
        cell: (i) => i.getValue() ?? "—",
      }),
      colHelper.accessor("parts_received_status", {
        header: "Partes",
        cell: (i) => <Badge>{PARTS_LABEL[i.getValue() as TicketPartsReceived] ?? i.getValue()}</Badge>,
      }),
      colHelper.accessor("status", {
        header: "Estado",
        cell: (i) => <Badge>{STATUS_LABEL[i.getValue() as TicketStatus]}</Badge>,
      }),
      colHelper.accessor("priority", { header: "Prioridad", cell: (i) => i.getValue() }),
      colHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Link
            href={`/tickets/${row.original.id}`}
            className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
          >
            Ver
          </Link>
        ),
      }),
    ],
    [canManage, selected],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const headers =
    table.getHeaderGroups()[0]?.headers.map((h) => ({
      key: h.id,
      content: flexRender(h.column.columnDef.header, h.getContext()),
    })) ?? [];

  const rows = table.getRowModel().rows.map((r) =>
    r.getVisibleCells().map((c) => flexRender(c.column.columnDef.cell, c.getContext())),
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id;
    const activeId = String(event.active.id);
    if (!overId || typeof overId !== "string") return;
    if (!STATUSES.includes(overId as TicketStatus)) return;
    const newStatus = overId as TicketStatus;
    if (!canManage) return;
    startTransition(async () => {
      await updateTicketAction({ id: activeId, status: newStatus });
      setTickets((prev) => prev.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t)));
    });
  };

  const onBulkAssign = () => {
    if (!bulkTech || selected.size === 0) return;
    startTransition(async () => {
      await bulkUpdateTicketsAction([...selected], { technician_id: bulkTech, status: "asignado" });
      setTickets((prev) =>
        prev.map((t) =>
          selected.has(t.id) ? { ...t, technician_id: bulkTech, status: "asignado" as TicketStatus } : t,
        ),
      );
      setSelected(new Set());
    });
  };

  return (
    <VStack className="gap-8">
      <HStack className="items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Tickets</h1>
        {canManage ? (
          <Button href="/tickets/new" variant="primary">
            Nuevo ticket
          </Button>
        ) : null}
      </HStack>

      <HStack className="items-end gap-4">
        <SegmentedControl
          className="shrink-0"
          selected={view}
          onToggle={(v) => setView(v as "table" | "kanban")}
          buttons={[
            { value: "table", label: "Tabla" },
            { value: "kanban", label: "Kanban" },
          ]}
        />
        <FormSelect
          id="f-status"
          label="Estado"
          options={[
            { value: "all", label: "Todos" },
            ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
          ]}
          value={statusFilter}
          onSelect={(v) => setStatusFilter(String(v))}
        />
        <FormSelect
          id="f-client"
          label="Cliente"
          options={[
            { value: "all", label: "Todos" },
            ...clients.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={clientFilter}
          onSelect={(v) => setClientFilter(String(v))}
        />
      </HStack>

      {canManage && view === "table" ? (
        <Card padding="m" radius="m" className="w-full">
          <HStack className="items-end gap-4">
            <FormSelect
              id="bulk-tech"
              label="Asignar técnico"
              options={technicians.map((t) => ({ value: t.id, label: t.label }))}
              value={bulkTech}
              onSelect={(v) => setBulkTech(String(v))}
            />
            <Button variant="secondary" disabled={!bulkTech || selected.size === 0 || isPending} onClick={onBulkAssign}>
              Aplicar a {selected.size} seleccionados
            </Button>
            <Button href="/api/export/tickets?format=csv" variant="tertiary">
              Exportar CSV
            </Button>
          </HStack>
        </Card>
      ) : null}

      {view === "table" ? (
        <Table data={{ headers, rows }} className="w-full min-w-[1100px]" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <HStack className="items-start gap-4">
            {STATUSES.map((status) => (
              <KanbanColumn key={status} status={status} tickets={filtered.filter((t) => t.status === status)} />
            ))}
          </HStack>
        </DndContext>
      )}
    </VStack>
  );
}

function KanbanColumn({ status, tickets }: { status: TicketStatus; tickets: TicketRow[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[240px] flex-1 basis-[220px] rounded-xl transition-shadow",
        isOver && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-950",
      )}
    >
      <Card padding="m" radius="m" className="min-h-[200px] w-full">
        <VStack className="gap-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{STATUS_LABEL[status]}</h3>
          <VStack className="gap-2">
            {tickets.map((t) => (
              <DraggableTicket key={t.id} ticket={t} />
            ))}
          </VStack>
        </VStack>
      </Card>
    </div>
  );
}

function DraggableTicket({ ticket }: { ticket: TicketRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.7 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Card padding="sm" radius="m" className="cursor-grab active:cursor-grabbing">
        <VStack className="gap-1">
          <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{ticket.ticket_number}</p>
          <p className="text-sm text-zinc-800 dark:text-zinc-200">{ticket.city}</p>
          {ticket.equipment_model ? (
            <p className="text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">{ticket.equipment_model}</p>
          ) : null}
          <Link href={`/tickets/${ticket.id}`} className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400">
            Abrir
          </Link>
        </VStack>
      </Card>
    </div>
  );
}
