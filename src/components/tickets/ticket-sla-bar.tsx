"use client";

import { differenceInHours, parseISO } from "date-fns";
import { ProgressBar } from "@/components/ui/progress-bar";
import { VStack } from "@/components/ui/stack";

type Props = {
  receivedAt: string | null;
  slaHours: number;
};

/**
 * Barra de progreso de SLA: se torna crítica con menos del 20 % restante.
 */
export function TicketSlaBar({ receivedAt, slaHours }: Props) {
  if (!receivedAt) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Sin fecha de recepción — SLA no calculado</p>;
  }
  const start = parseISO(receivedAt);
  const now = new Date();
  const used = differenceInHours(now, start);
  const pct = Math.min(100, Math.round((used / slaHours) * 100));
  const remainingPct = 100 - pct;
  const critical = remainingPct <= 20 && remainingPct >= 0;

  return (
    <VStack className="gap-2">
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        SLA: {used}h / {slaHours}h ({pct}% usado)
      </p>
      <ProgressBar
        value={pct}
        max={100}
        barClassName={critical ? "bg-red-600 dark:bg-red-500" : "bg-blue-600 dark:bg-blue-500"}
      />
      {critical ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">Riesgo: menos del 20 % del SLA restante</p>
      ) : null}
    </VStack>
  );
}
