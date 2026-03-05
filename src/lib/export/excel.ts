import type { TimesheetRow } from "@/lib/queries/rostering.server";

function timeToString(t: string | null): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function buildTimesheetsWorkbook(timesheets: TimesheetRow[]): Promise<Buffer> {
  // Dynamic import to avoid including xlsx in client bundles
  const XLSX = await import("xlsx");

  const rows = timesheets.map((ts) => {
    const grossMinutes = ts.working_minutes + ts.break_minutes;
    return {
      "Staff Name": ts.staff_name ?? "",
      "Date": ts.work_date,
      "Work From": timeToString(ts.work_start),
      "Work To": timeToString(ts.work_end),
      "Working Hour": (grossMinutes / 60).toFixed(2),
      "Break From": timeToString(ts.break_start),
      "Break To": timeToString(ts.break_end),
      "Break Hour": ts.break_minutes > 0 ? (ts.break_minutes / 60).toFixed(2) : "",
      "Status": ts.status,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Timesheets");

  // Auto-size columns
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
  }));
  ws["!cols"] = colWidths;

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
