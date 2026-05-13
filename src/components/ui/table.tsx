import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type TableHeader = { key: string; content: ReactNode };

export type TableProps = {
  data: { headers: TableHeader[]; rows: ReactNode[][] };
  className?: string;
};

export function Table({ data, className }: TableProps) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            {data.headers.map((h) => (
              <th key={h.key} className="whitespace-nowrap px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                {h.content}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800/80 dark:hover:bg-zinc-800/40"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 align-middle text-zinc-800 dark:text-zinc-200">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
