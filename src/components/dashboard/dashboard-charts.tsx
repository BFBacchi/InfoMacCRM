"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ChartDatum = { name: string; value: number };
export type BarDatum = { label: string; count: number };

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#64748b"];

type Props = {
  statusSeries: ChartDatum[];
  provinceSeries: BarDatum[];
};

/**
 * Gráficos del panel con Recharts y estilos Tailwind en el contenedor.
 */
export function DashboardCharts({ statusSeries, provinceSeries }: Props) {
  const barData = provinceSeries.map((p) => ({ label: p.label, count: p.count }));

  return (
    <div className="flex flex-wrap gap-6">
      <div className="min-w-[280px] flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tickets por estado</h3>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">Distribución actual</p>
        <div className="h-[280px] w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusSeries}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name ?? ""} ${Math.round((percent ?? 0) * 100)}%`}
              >
                {statusSeries.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="min-w-[280px] flex-1 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Tickets por provincia</h3>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">Volumen abierto + en curso</p>
        <div className="h-[280px] w-full min-h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-700" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#71717a" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#71717a" />
              <Tooltip contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
