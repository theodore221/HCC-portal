// @ts-nocheck
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { enrichMealJobs } from "@/lib/catering";
import {
  getMealJobsForCurrentCaterer,
  getBookingsForAdmin,
} from "@/lib/queries/bookings.server";
import { sbServer } from "@/lib/supabase-server";
import { Calendar, CheckCircle2, Clock, MessageCircle } from "lucide-react";

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CatererDashboard() {
  const supabase = await sbServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, caterer_id")
        .eq("id", user.id)
        .single()
    : { data: null };

  const today = toLocalDate(new Date());

  const [bookings, mealJobsRaw] = await Promise.all([
    getBookingsForAdmin({ excludeCancelled: true }),
    getMealJobsForCurrentCaterer(),
  ]);

  const allJobs = enrichMealJobs(mealJobsRaw, bookings);
  const upcomingJobs = allJobs.filter((j) => j.date >= today);

  const pendingConfirmation = upcomingJobs.filter((j) => j.status === "Assigned").length;
  const thisWeekEnd = toLocalDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const thisWeek = upcomingJobs.filter((j) => j.date <= thisWeekEnd).length;
  const confirmed = upcomingJobs.filter((j) => j.status === "Confirmed").length;
  const todayJobs = upcomingJobs.filter((j) => j.date === today);

  const catererName = profile?.full_name ?? "there";

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-secondary to-primary/5 border border-primary/10 p-6">
        <p className="text-sm font-medium text-primary/70 mb-1">
          Good {getTimeOfDay()}
        </p>
        <h2 className="text-2xl font-bold text-gray-900">{catererName}</h2>
        {pendingConfirmation > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            You have{" "}
            <span className="font-semibold text-status-ochre">
              {pendingConfirmation} job{pendingConfirmation !== 1 ? "s" : ""}
            </span>{" "}
            awaiting your confirmation.
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Needs Confirmation"
          value={pendingConfirmation}
          colorClass="text-status-ochre bg-status-ochre/5 border-status-ochre/10"
          icon={Clock}
        />
        <StatCard
          label="This Week"
          value={thisWeek}
          colorClass="text-status-sage bg-status-sage/5 border-status-sage/10"
          icon={Calendar}
        />
        <StatCard
          label="Confirmed"
          value={confirmed}
          colorClass="text-status-forest bg-status-forest/5 border-status-forest/10"
          icon={CheckCircle2}
        />
        <StatCard
          label="Total Upcoming"
          value={upcomingJobs.length}
          colorClass="text-status-slate bg-status-slate/5 border-status-slate/10"
          icon={MessageCircle}
        />
      </div>

      {/* Today's jobs */}
      {todayJobs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="font-semibold text-gray-900">Today&apos;s Jobs</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{job.meal}</p>
                    <p className="text-xs text-gray-500">{job.groupName} · {job.countsTotal} guests</p>
                  </div>
                  <span
                    className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                      job.status === "Confirmed"
                        ? "bg-status-forest/10 text-status-forest"
                        : "bg-status-ochre/10 text-status-ochre"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {upcomingJobs.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-12 text-center">
          <CheckCircle2 className="size-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">No upcoming catering jobs</p>
          <p className="text-xs text-gray-400 mt-1">Check back after new jobs are assigned to you.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  colorClass,
  icon: Icon,
}: {
  label: string;
  value: number;
  colorClass: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="size-4 opacity-70" />
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
