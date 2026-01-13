"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateNavigationProps {
  selectedDate: string; // YYYY-MM-DD format
  basePath: string; // e.g., "/staff/rooms" or "/admin/rooms"
}

export function DateNavigation({ selectedDate, basePath }: DateNavigationProps) {
  const router = useRouter();

  // Parse date parts to avoid timezone issues
  const [year, month, day] = selectedDate.split("-").map(Number);
  const currentDate = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday =
    currentDate.getFullYear() === today.getFullYear() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getDate() === today.getDate();

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateString = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleDateChange = (dateStr: string) => {
    if (!dateStr) return;
    console.log("Navigating to date:", dateStr);
    router.push(`${basePath}?date=${dateStr}`);
  };

  const navigateDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    const dateStr = formatDateString(newDate);
    console.log("Navigate offset:", offset, "New date:", dateStr);
    handleDateChange(dateStr);
  };

  const goToToday = () => {
    const todayStr = formatDateString(today);
    handleDateChange(todayStr);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => navigateDay(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-[180px]"
        />
        <span className="hidden text-sm text-neutral-600 sm:block">
          {formatDateDisplay(currentDate)}
        </span>
      </div>

      <Button variant="outline" size="icon" onClick={() => navigateDay(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="outline" onClick={goToToday}>
          Today
        </Button>
      )}
    </div>
  );
}
