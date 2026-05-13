import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

const styles = {
  danger: "border-red-200 bg-red-50 text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
  info: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100",
} as const;

export type AlertVariant = keyof typeof styles;

export function Alert({
  variant = "warning",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2 text-sm", styles[variant], className)} {...props}>
      {children}
    </div>
  );
}
