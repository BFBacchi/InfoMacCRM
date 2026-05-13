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

type Props = {
  clients: ClientOpt[];
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

const CITY_SUGGEST = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata"];

/**
 * Formulario de alta de ticket con sugerencias básicas de ciudad/provincia.
 */
export function TicketCreateForm({ clients }: Props) {
  const router = useRouter();

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
      task_type: "diagnostico",
      description: "",
      priority: "standard",
      sla_hours: 48,
      notes: "",
    },
  });

  const clientId = watch("client_id");
  const taskType = watch("task_type");
  const priority = watch("priority");

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
    <Card padding="xl" radius="l" className="mx-auto w-full max-w-xl">
      <VStack className="gap-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Nuevo ticket</h1>
        <form onSubmit={onSubmit}>
          <VStack className="gap-4">
            <FormSelect
              id="client_id"
              label="Cliente"
              options={clients.map((c) => ({ value: c.id, label: c.name }))}
              value={clientId}
              onSelect={(v) => setValue("client_id", String(v), { shouldValidate: true })}
              error={!!errors.client_id}
              errorMessage={errors.client_id?.message}
            />
            <Input id="city" label="Ciudad" list="cities-list" {...register("city")} error={!!errors.city} errorMessage={errors.city?.message} />
            <datalist id="cities-list">
              {CITY_SUGGEST.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <Input
              id="province"
              label="Provincia"
              {...register("province")}
              error={!!errors.province}
              errorMessage={errors.province?.message}
            />
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
            <Input
              id="sla_hours"
              label="SLA (horas)"
              type="number"
              {...register("sla_hours", { valueAsNumber: true })}
              error={!!errors.sla_hours}
              errorMessage={errors.sla_hours?.message}
            />
            <Textarea id="description" label="Descripción" {...register("description")} />
            <Textarea id="notes" label="Notas internas" {...register("notes")} />
            <Button type="submit" variant="primary" loading={isSubmitting} fillWidth>
              Crear y calcular rutas
            </Button>
          </VStack>
        </form>
      </VStack>
    </Card>
  );
}
