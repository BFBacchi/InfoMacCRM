import { cn } from "@/lib/cn";
import { forwardRef, type TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: boolean;
  errorMessage?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, errorMessage, className, id, disabled, ...props },
  ref,
) {
  return (
    <div className="w-full min-w-0 max-w-full">
      <label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300",
          disabled && "opacity-60",
        )}
      >
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={4}
        disabled={disabled}
        aria-invalid={error || undefined}
        className={cn(
          "w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-900 shadow-sm transition-[color,box-shadow,border-color] placeholder:text-zinc-400 dark:bg-zinc-950 dark:text-zinc-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 dark:focus-visible:ring-offset-0",
          error
            ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/35"
            : "border-zinc-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/25 dark:border-zinc-700 dark:focus-visible:border-blue-500",
          disabled && "cursor-not-allowed bg-zinc-50 text-zinc-500 dark:bg-zinc-900/80 dark:text-zinc-500",
          className,
        )}
        {...props}
      />
      {errorMessage ? (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
});
