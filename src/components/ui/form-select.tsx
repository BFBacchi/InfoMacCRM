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
  disabled?: boolean;
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
  disabled,
}: FormSelectProps) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300",
          disabled && "opacity-60",
        )}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
        aria-invalid={error || undefined}
        className={cn(
          "min-h-10 w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-[color,box-shadow,border-color] dark:bg-zinc-950 dark:text-zinc-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-0",
          error
            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/35"
            : "border-zinc-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/25 dark:border-zinc-700 dark:focus-visible:border-blue-500",
          disabled && "cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-500",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {errorMessage ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
