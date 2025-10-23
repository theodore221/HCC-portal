import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MOCK_BOOKINGS, MOCK_MEAL_JOBS, type BookingSummary, type MealJob } from "@/lib/mock-data";

interface WeekScheduleCardProps {
  title?: string;
  subtitle?: string;
  bookings?: BookingSummary[];
  mealJobs?: MealJob[];
}

export function WeekScheduleCard({
  title = "Week schedule",
  subtitle = "Spaces and meals across groups",
  bookings = MOCK_BOOKINGS,
  mealJobs = MOCK_MEAL_JOBS,
}: WeekScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-hidden rounded-2xl border border-olive-100 p-0">
        <table className="w-full text-sm text-olive-800">
          <thead className="bg-olive-50 text-xs uppercase tracking-wide text-olive-600">
            <tr className="text-left">
              <th className="px-4 py-3">Group</th>
              <th className="px-4 py-3">Spaces</th>
              <th className="px-4 py-3">Meals</th>
              <th className="px-4 py-3">Coffee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-olive-100">
            {bookings.map((booking) => {
              const meals = mealJobs.filter((job) => job.bookingId === booking.id);
              const coffeeCount = meals.filter((job) => job.percolatedCoffee).length;

              return (
                <tr key={booking.id} className="hover:bg-olive-50/60">
                  <td className="px-4 py-3 font-medium text-olive-900">{booking.groupName}</td>
                  <td className="px-4 py-3">{booking.spaces.join(", ")}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {meals.map((job) => (
                        <span key={job.id} className="rounded-full bg-olive-100 px-2 py-1 text-xs">
                          {job.date.split("-").slice(1).join("/")} {job.timeSlot}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-lg">{coffeeCount ? "☕" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
