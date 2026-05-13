import { cn } from "@/lib/cn";

type Props = {
  value: number;
  max?: number;
  className?: string;
  /** Tailwind color classes for the filled portion */
  barClassName?: string;
};

export function ProgressBar({ value, max = 100, className, barClassName }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          barClassName ?? "bg-blue-600 dark:bg-blue-500",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
