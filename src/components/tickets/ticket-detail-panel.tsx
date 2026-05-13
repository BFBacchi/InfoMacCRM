"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateTicketAction } from "@/app/(dashboard)/tickets/actions";
import { TicketMapEmbed } from "@/components/maps/ticket-map-embed";
import { TicketSlaBar } from "@/components/tickets/ticket-sla-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HStack, VStack } from "@/components/ui/stack";
import { ticketEditFormSchema, type TicketEditFormValues } from "@/types/schemas/tickets";
import type { Ticket, TicketPartsReceived, TicketStatus } from "@/types/database";

const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "sin_asignar", label: "Sin asignar" },
  { value: "asignado", label: "Asignado" },
  { value: "en_curso", label: "En curso" },
  { value: "cerrado_operativo", label: "Cerrado operativo" },
  { value: "cerrado_definitivo", label: "Cerrado definitivo" },
];

const PARTS_OPTS: { value: TicketPartsReceived; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "recibida", label: "Recibida" },
  { value: "no_aplica", label: "No aplica" },
];

const PARTS_LABEL: Record<TicketPartsReceived, string> = {
  pendiente: "Pendiente",
  recibida: "Recibida",
  no_aplica: "No aplica",
};

type HistoryRow = {
  id: string;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
};

type BaseOpt = { id: string; label: string };

type Props = {
  ticket: Ticket;
  history: HistoryRow[];
  technicians: { id: string; label: string }[];
  infomacBases: BaseOpt[];
  canManage: boolean;
};

function buildFormValues(t: Ticket, fallbackBaseId: string): TicketEditFormValues {
  return {
    id: t.id,
    description: t.description,
    equipment_model: t.equipment_model ?? "",
    end_user_location: t.end_user_location ?? "",
    action_taken: t.action_taken ?? "",
    notes: t.notes ?? "",
    base_infomac_id: t.base_infomac_id ?? fallbackBaseId,
    parts_received_status: t.parts_received_status ?? "pendiente",
    city: t.city,
    province: t.province,
  };
}

/**
 * Detalle editable de ticket: SLA, estado, asignación, ficha operativa, mapa e historial.
 */
export function TicketDetailPanel({ ticket: initial, history, technicians, infomacBases, canManage }: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initial);
  const [pending, start] = useTransition();
  const fallbackBase = infomacBases[0]?.id ?? "";

  const ficha = useForm<TicketEditFormValues>({
    resolver: zodResolver(ticketEditFormSchema),
    defaultValues: buildFormValues(initial, fallbackBase),
  });

  const { register, handleSubmit, reset, setValue, watch, formState } = ficha;
  const partsStatus = watch("parts_received_status");
  const baseInfomacId = watch("base_infomac_id");

  useEffect(() => {
    setTicket(initial);
    reset(buildFormValues(initial, fallbackBase));
  }, [initial.id, initial.updated_at, initial, reset, fallbackBase]);

  const mapsQuery = useMemo(() => {
    const loc = ticket.end_user_location?.trim();
    if (loc) return loc;
    return `${ticket.city}, ${ticket.province}, Argentina`;
  }, [ticket.city, ticket.province, ticket.end_user_location]);

  const mapsUrl = useMemo(() => {
    const q = encodeURIComponent(mapsQuery);
    return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  }, [mapsQuery]);

  const infomacLabel = useMemo(() => {
    if (!ticket.base_infomac_id) return "—";
    return infomacBases.find((b) => b.id === ticket.base_infomac_id)?.label ?? ticket.base_infomac_id.slice(0, 8);
  }, [ticket.base_infomac_id, infomacBases]);

  const techLabel = useMemo(() => {
    if (!ticket.technician_id) return "Sin asignar";
    return technicians.find((x) => x.id === ticket.technician_id)?.label ?? ticket.technician_id.slice(0, 8);
  }, [ticket.technician_id, technicians]);

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

  const onSaveFicha = handleSubmit(async (values) => {
    start(async () => {
      const res = await updateTicketAction({
        id: values.id,
        description: values.description,
        equipment_model: values.equipment_model,
        end_user_location: values.end_user_location,
        action_taken: values.action_taken,
        notes: values.notes?.trim() ? values.notes : null,
        base_infomac_id: values.base_infomac_id,
        parts_received_status: values.parts_received_status,
        city: values.city,
        province: values.province,
      });
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      setTicket((t) => ({
        ...t,
        description: values.description,
        equipment_model: values.equipment_model,
        end_user_location: values.end_user_location,
        action_taken: values.action_taken,
        notes: values.notes?.trim() ? values.notes : null,
        base_infomac_id: values.base_infomac_id,
        parts_received_status: values.parts_received_status,
        city: values.city,
        province: values.province,
      }));
      toast.success("Ficha actualizada");
      router.refresh();
    });
  });

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
          <div className="grid gap-2 text-sm text-zinc-800 sm:grid-cols-2 dark:text-zinc-200">
            <p>
              <span className="text-zinc-500 dark:text-zinc-400">Ciudad / provincia (origen km): </span>
              {ticket.city}, {ticket.province}
            </p>
            <p>
              <span className="text-zinc-500 dark:text-zinc-400">Prioridad: </span>
              {ticket.priority}
            </p>
            <p>
              <span className="text-zinc-500 dark:text-zinc-400">Técnico asignado: </span>
              {techLabel}
            </p>
            <p>
              <span className="text-zinc-500 dark:text-zinc-400">Partes recibidas: </span>
              {PARTS_LABEL[ticket.parts_received_status ?? "pendiente"] ?? ticket.parts_received_status}
            </p>
          </div>
          <TicketSlaBar receivedAt={ticket.received_at} slaHours={ticket.sla_hours} />
          <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Distancia a base cliente (referencia): <strong className="text-zinc-900 dark:text-zinc-100">{ticket.km_cliente ?? "—"}</strong> km
            </p>
            <p>
              Distancia ciudad/provincia → base INFOMAC <span className="text-zinc-500">({infomacLabel})</span>:{" "}
              <strong className="text-zinc-900 dark:text-zinc-100">{ticket.km_infomac ?? "—"}</strong> km
            </p>
          </div>
          {canManage ? (
            <HStack className="flex-wrap gap-4">
              <FormSelect
                id="status"
                label="Estado del ticket"
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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ficha operativa</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Descripción, equipo, ubicación del usuario final, base INFOMAC, observaciones, acción tomada y estado de partes.
        </p>

        {canManage ? (
          <form className="mt-6 space-y-4" onSubmit={onSaveFicha}>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormSelect
                id="ficha_base_infomac"
                label="Base INFOMAC"
                options={infomacBases.map((b) => ({ value: b.id, label: b.label }))}
                value={baseInfomacId}
                onSelect={(v) => setValue("base_infomac_id", String(v), { shouldValidate: true })}
                error={!!formState.errors.base_infomac_id}
                errorMessage={formState.errors.base_infomac_id?.message}
              />
              <FormSelect
                id="ficha_parts"
                label="Estado de partes recibidas"
                options={PARTS_OPTS.map((o) => ({ value: o.value, label: o.label }))}
                value={partsStatus}
                onSelect={(v) => setValue("parts_received_status", v as TicketPartsReceived, { shouldValidate: true })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="ficha_city" label="Ciudad (origen km)" {...register("city")} error={!!formState.errors.city} errorMessage={formState.errors.city?.message} />
              <Input
                id="ficha_province"
                label="Provincia (origen km)"
                {...register("province")}
                error={!!formState.errors.province}
                errorMessage={formState.errors.province?.message}
              />
            </div>
            <Input
              id="ficha_equipment_model"
              label="Modelo del equipo"
              {...register("equipment_model")}
              error={!!formState.errors.equipment_model}
              errorMessage={formState.errors.equipment_model?.message}
            />
            <Textarea
              id="ficha_end_user_location"
              label="Ubicación del usuario final"
              {...register("end_user_location")}
            />
            <Textarea
              id="ficha_description"
              label="Descripción o escenario"
              {...register("description")}
              error={!!formState.errors.description}
              errorMessage={formState.errors.description?.message}
            />
            <Textarea id="ficha_notes" label="Observaciones" {...register("notes")} />
            <Textarea
              id="ficha_action_taken"
              label="Acción tomada"
              {...register("action_taken")}
              error={!!formState.errors.action_taken}
              errorMessage={formState.errors.action_taken?.message}
            />
            <Button type="submit" variant="primary" loading={pending} disabled={pending}>
              Guardar ficha
            </Button>
          </form>
        ) : (
          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Descripción o escenario</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{ticket.description}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Modelo del equipo</dt>
              <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{ticket.equipment_model || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Base INFOMAC</dt>
              <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{infomacLabel}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ubicación usuario final</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{ticket.end_user_location || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Observaciones</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{ticket.notes || "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Acción tomada</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{ticket.action_taken || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Partes recibidas</dt>
              <dd className="mt-1 text-zinc-800 dark:text-zinc-200">{PARTS_LABEL[ticket.parts_received_status ?? "pendiente"]}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Ubicación (mapa)</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Centrado en ciudad y provincia del ticket.</p>
        <div className="mt-4 w-full">
          <TicketMapEmbed city={ticket.city} province={ticket.province} />
        </div>
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
