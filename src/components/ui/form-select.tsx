"use client";

import { cn } from "@/lib/cn";

export type SelectOption = { value: string; label: string };

export type FormSelectProps = {
  id: string;
  label: string;
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  error?: boolean;
  errorMessage?: string;
  className?: string;
};

export function FormSelect({
  id,
  label,
  options,
  value,
  onSelect,
  error,
  errorMessage,
  className,
}: FormSelectProps) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50",
          error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errorMessage ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
    </div>
  );
}
