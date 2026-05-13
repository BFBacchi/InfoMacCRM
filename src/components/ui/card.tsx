import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

const paddings = {
  none: "",
  sm: "p-3",
  m: "p-4",
  l: "p-6",
  xl: "p-8",
} as const;

const radii = {
  m: "rounded-lg",
  l: "rounded-xl",
  xl: "rounded-2xl",
} as const;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: keyof typeof paddings;
  radius?: keyof typeof radii;
};

export function Card({ padding = "m", radius = "l", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "border border-zinc-200/90 bg-white shadow-sm shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/20",
        paddings[padding],
        radii[radius],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
