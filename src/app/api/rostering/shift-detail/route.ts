import { NextRequest, NextResponse } from "next/server";
import { getShiftDetail } from "@/lib/queries/rostering.server";

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const data = await getShiftDetail(id);
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
