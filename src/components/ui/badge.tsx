import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
