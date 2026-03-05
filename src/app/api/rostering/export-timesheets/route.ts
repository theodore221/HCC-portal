import { NextResponse } from "next/server";
import { getTimesheets } from "@/lib/queries/rostering.server";
import { buildTimesheetsWorkbook } from "@/lib/export/excel";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start") ?? undefined;
  const endDate = searchParams.get("end") ?? undefined;

  const timesheets = await getTimesheets({ startDate, endDate });
  const buffer = await buildTimesheetsWorkbook(timesheets);

  const filename =
    startDate && endDate
      ? `timesheets-${startDate}-to-${endDate}.xlsx`
      : `timesheets-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
