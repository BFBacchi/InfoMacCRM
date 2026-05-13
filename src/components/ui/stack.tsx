import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function VStack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />;
}

export function HStack({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-row flex-wrap items-center gap-4", className)} {...props} />;
}
