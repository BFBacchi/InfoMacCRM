import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-zinc-200 dark:bg-zinc-800",
        "motion-reduce:animate-none motion-reduce:after:hidden",
        "after:pointer-events-none after:absolute after:inset-0 after:-translate-x-full after:animate-skeleton-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/10",
        className,
      )}
      {...props}
    />
  );
}
