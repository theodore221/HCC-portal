import type { Metadata } from "next";
import RoomsClient from "./client";
import { getRoomStatusForDate } from "@/lib/queries/rooms.server";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Room status and housekeeping management",
};

export default async function StaffRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = date || today;

  const roomsWithStatus = await getRoomStatusForDate(selectedDate);

  return <RoomsClient rooms={roomsWithStatus} selectedDate={selectedDate} />;
}
