"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTeamMemberAction,
  deleteTeamMemberAction,
  updateTeamMemberAction,
} from "@/app/(dashboard)/settings/team-actions";
import type { TeamRow } from "@/app/(dashboard)/settings/team/page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table } from "@/components/ui/table";

type BaseOpt = { id: string; name: string };

const inputClass =
  "w-full max-w-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

type Props = {
  initialRows: TeamRow[];
  bases: BaseOpt[];
};

export function TeamManagement({ initialRows, bases }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const baseOptions = useMemo(
    () => [{ value: "", label: "Sin base" }, ...bases.map((b) => ({ value: b.id, label: b.name }))],
    [bases],
  );

  const onCreate = (fd: FormData) => {
    start(async () => {
      const res = await createTeamMemberAction(fd);
      if ("error" in res && res.error) {
        toast.error(typeof res.error === "string" ? res.error : "Revisá los datos del formulario.");
        return;
      }
      toast.success("Usuario creado");
      window.location.reload();
    });
  };

  const onUpdate = (fd: FormData) => {
    start(async () => {
      const res = await updateTeamMemberAction(fd);
      if ("error" in res && res.error) {
        toast.error(typeof res.error === "string" ? res.error : "No se pudo guardar.");
        return;
      }
      toast.success("Cambios guardados");
      setEditingId(null);
      window.location.reload();
    });
  };

  const onDelete = (id: string) => {
    if (!confirm("¿Eliminar este usuario? Se borrarán sus tickets asignados como técnico (referencia) y datos vinculados.")) return;
    start(async () => {
      const res = await deleteTeamMemberAction(id);
      if ("error" in res && res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Usuario eliminado");
      setRows((r) => r.filter((x) => x.id !== id));
    });
  };

  const headers = [
    { key: "u", content: "Usuario" },
    { key: "r", content: "Rol" },
    { key: "b", content: "Base" },
    { key: "t", content: "Técnico" },
    { key: "a", content: "Acciones" },
  ];

  const tableRows = rows.map((row) => {
    const baseLabel = bases.find((b) => b.id === row.base_id)?.name ?? "—";
    const techCell =
      row.role === "technician"
        ? `${row.specialty ?? "—"} · ${row.availability === false ? "No disp." : "Disp."}`
        : "—";

    return [
      <div key={`${row.id}-u`} className="text-sm">
        <div className="font-medium text-zinc-900 dark:text-zinc-50">{row.full_name}</div>
        <div className="text-zinc-500">{row.email}</div>
      </div>,
      <span key={`${row.id}-r`} className="text-sm capitalize">
        {row.role === "coordinator" ? "Coordinador" : "Técnico"}
      </span>,
      <span key={`${row.id}-b`} className="text-sm">
        {baseLabel}
      </span>,
      <span key={`${row.id}-t`} className="text-sm">
        {techCell}
      </span>,
      <div key={`${row.id}-a`} className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(editingId === row.id ? null : row.id)}>
          {editingId === row.id ? "Cerrar" : "Editar"}
        </Button>
        <Button type="button" size="sm" variant="danger" onClick={() => onDelete(row.id)} disabled={pending}>
          Eliminar
        </Button>
      </div>,
    ];
  });

  return (
    <div className="flex flex-col gap-8">
      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Nuevo coordinador o técnico</h2>
        <form
          className="mt-4 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(new FormData(e.currentTarget));
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="t-email">
                Correo
              </label>
              <input id="t-email" name="email" type="email" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="t-pass">
                Contraseña inicial (mín. 8)
              </label>
              <input id="t-pass" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="t-name">
                Nombre completo
              </label>
              <input id="t-name" name="full_name" required className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="t-role">
                Rol
              </label>
              <select id="t-role" name="role" required className={inputClass}>
                <option value="coordinator">Coordinador</option>
                <option value="technician">Técnico</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="t-base">
                Base
              </label>
              <select id="t-base" name="base_id" className={inputClass} defaultValue="">
                {baseOptions.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="t-spec">
                Especialidad (técnico)
              </label>
              <input id="t-spec" name="specialty" className={inputClass} placeholder="Opcional" />
            </div>
            <div>
              <label className={labelClass} htmlFor="t-avail">
                Disponible (técnico)
              </label>
              <select id="t-avail" name="availability" className={inputClass} defaultValue="true">
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <Button type="submit" variant="primary" disabled={pending}>
            Crear usuario
          </Button>
        </form>
      </Card>

      <Card padding="l" radius="l" className="w-full">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Listado</h2>
        <div className="mt-4">
          <Table data={{ headers, rows: tableRows }} className="w-full" />
        </div>
      </Card>

      {editingId ? (
        <EditMemberPanel
          key={editingId}
          row={rows.find((r) => r.id === editingId)!}
          bases={baseOptions}
          pending={pending}
          onCancel={() => setEditingId(null)}
          onSave={(fd) => onUpdate(fd)}
        />
      ) : null}
    </div>
  );
}

function EditMemberPanel({
  row,
  bases,
  pending,
  onCancel,
  onSave,
}: {
  row: TeamRow;
  bases: { value: string; label: string }[];
  pending: boolean;
  onCancel: () => void;
  onSave: (fd: FormData) => void;
}) {
  return (
    <Card padding="l" radius="l" className="w-full border-blue-200 dark:border-blue-900">
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar: {row.full_name}</h3>
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(new FormData(e.currentTarget));
        }}
      >
        <input type="hidden" name="profile_id" value={row.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nombre</label>
            <input name="full_name" required defaultValue={row.full_name} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input name="email" type="email" required defaultValue={row.email} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <input name="phone" defaultValue={row.phone ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <select name="role" className={inputClass} defaultValue={row.role}>
              <option value="coordinator">Coordinador</option>
              <option value="technician">Técnico</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Base</label>
            <select name="base_id" className={inputClass} defaultValue={row.base_id ?? ""}>
              {bases.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Especialidad</label>
            <input name="specialty" defaultValue={row.specialty ?? ""} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Disponible</label>
            <select name="availability" className={inputClass} defaultValue={row.availability === false ? "false" : "true"}>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" disabled={pending}>
            Guardar
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
