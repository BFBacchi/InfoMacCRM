import { cn } from "@/lib/cn";
import { forwardRef, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: boolean;
  errorMessage?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, errorMessage, className, id, ...props },
  ref,
) {
  return (
    <div className="w-full min-w-0 max-w-md">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 dark:bg-zinc-950 dark:text-zinc-50",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-zinc-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700",
          className,
        )}
        {...props}
      />
      {errorMessage ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}
    </div>
  );
});
