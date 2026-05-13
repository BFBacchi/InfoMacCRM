"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createTicketAction } from "@/app/(dashboard)/tickets/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/stack";
import { ticketCreateSchema, type TicketCreateValues } from "@/types/schemas/tickets";

type ClientOpt = { id: string; name: string };
type BaseOpt = { id: string; label: string };

type Props = {
  clients: ClientOpt[];
  infomacBases: BaseOpt[];
};

const TASK_OPTS = [
  { value: "masterizacion", label: "Masterización" },
  { value: "reemplazo", label: "Reemplazo" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "relevamiento", label: "Relevamiento" },
  { value: "otro", label: "Otro" },
];

const PRI_OPTS = [
  { value: "standard", label: "Standard" },
  { value: "incidencia", label: "Incidencia" },
  { value: "critico", label: "Crítico" },
];

const PARTS_OPTS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "recibida", label: "Recibida" },
  { value: "no_aplica", label: "No aplica" },
];

const CITY_SUGGEST = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"];

/**
 * Formulario de alta de ticket: escenario, equipo, ubicación, base INFOMAC, distancias y SLA.
 */
export function TicketCreateForm({ clients, infomacBases }: Props) {
  const router = useRouter();
  const defaultBase = infomacBases[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TicketCreateValues>({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      client_id: clients[0]?.id ?? "",
      city: "",
      province: "",
      base_infomac_id: defaultBase,
      task_type: "diagnostico",
      description: "",
      equipment_model: "",
      end_user_location: "",
      priority: "standard",
      sla_hours: 48,
      notes: "",
      parts_received_status: "pendiente",
    },
  });

  const clientId = watch("client_id");
  const taskType = watch("task_type");
  const priority = watch("priority");
  const baseInfomacId = watch("base_infomac_id");
  const partsStatus = watch("parts_received_status");

  const onSubmit = handleSubmit(async (values) => {
    const res = await createTicketAction(values);
    if ("error" in res && res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Ticket creado");
    if ("id" in res && res.id) router.replace(`/tickets/${res.id}`);
    else router.replace("/tickets");
  });

  return (
    <Card padding="xl" radius="l" className="mx-auto w-full max-w-4xl">
      <VStack className="gap-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nuevo ticket</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Completá la ficha operativa. La distancia a la base INFOMAC se calcula respecto a ciudad y provincia (origen
            para Distance Matrix).
          </p>
        </div>
        <form onSubmit={onSubmit}>
          <VStack className="gap-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                id="client_id"
                label="Cliente"
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                value={clientId}
                onSelect={(v) => setValue("client_id", String(v), { shouldValidate: true })}
                error={!!errors.client_id}
                errorMessage={errors.client_id?.message}
              />
              <FormSelect
                id="base_infomac_id"
                label="Base INFOMAC"
                options={infomacBases.map((b) => ({ value: b.id, label: b.label }))}
                value={baseInfomacId}
                onSelect={(v) => setValue("base_infomac_id", String(v), { shouldValidate: true })}
                error={!!errors.base_infomac_id}
                errorMessage={errors.base_infomac_id?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="city" label="Ciudad (origen distancia)" list="cities-list" {...register("city")} error={!!errors.city} errorMessage={errors.city?.message} />
              <datalist id="cities-list">
                {CITY_SUGGEST.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <Input
                id="province"
                label="Provincia (origen distancia)"
                {...register("province")}
                error={!!errors.province}
                errorMessage={errors.province?.message}
              />
            </div>

            <Textarea
              id="end_user_location"
              label="Ubicación del usuario final (domicilio / referencia)"
              {...register("end_user_location")}
            />
            <p className="-mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Opcional pero recomendado para la visita. Ciudad y provincia arriba definen el cálculo de km frente a las bases.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormSelect
                id="task_type"
                label="Tipo de tarea"
                options={TASK_OPTS}
                value={taskType}
                onSelect={(v) => setValue("task_type", v as TicketCreateValues["task_type"], { shouldValidate: true })}
              />
              <FormSelect
                id="priority"
                label="Prioridad"
                options={PRI_OPTS}
                value={priority}
                onSelect={(v) => setValue("priority", v as TicketCreateValues["priority"], { shouldValidate: true })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="sla_hours"
                label="SLA (horas)"
                type="number"
                {...register("sla_hours", { valueAsNumber: true })}
                error={!!errors.sla_hours}
                errorMessage={errors.sla_hours?.message}
              />
              <FormSelect
                id="parts_received_status"
                label="Estado de partes recibidas"
                options={PARTS_OPTS}
                value={partsStatus}
                onSelect={(v) => setValue("parts_received_status", v as TicketCreateValues["parts_received_status"], { shouldValidate: true })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="equipment_model"
                label="Modelo del equipo"
                {...register("equipment_model")}
                error={!!errors.equipment_model}
                errorMessage={errors.equipment_model?.message}
              />
            </div>

            <Textarea
              id="description"
              label="Descripción o escenario"
              {...register("description")}
              error={!!errors.description}
              errorMessage={errors.description?.message}
            />

            <Textarea id="notes" label="Observaciones" {...register("notes")} />

            <Button type="submit" variant="primary" loading={isSubmitting} fillWidth>
              Crear ticket y calcular distancias
            </Button>
          </VStack>
        </form>
      </VStack>
    </Card>
  );
}
