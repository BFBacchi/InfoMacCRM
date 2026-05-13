import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Exporta tickets visibles para el usuario (RLS) en CSV o XLSX.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: rows, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = rows ?? [];

  if (!list.length) {
    if (format === "xlsx") {
      const wb = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([["sin_datos"]]);
      XLSX.utils.book_append_sheet(wb, sheet, "Tickets");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": 'attachment; filename="tickets.xlsx"',
        },
      });
    }
    return new NextResponse("id\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tickets.csv"',
      },
    });
  }

  if (format === "xlsx") {
    const sheet = XLSX.utils.json_to_sheet(list);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Tickets");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="tickets.xlsx"',
      },
    });
  }

  const headers = Object.keys(list[0] as object);
  const lines = [
    headers.join(","),
    ...list.map((row) =>
      headers
        .map((h) => {
          const v = (row as Record<string, unknown>)[h];
          const s = v == null ? "" : String(v);
          return `"${s.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];
  const csv = lines.join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tickets.csv"',
    },
  });
}
