import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Filter,
  LayoutGrid,
  List,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

import { enrichMealJobs } from "@/lib/catering";
import type { BookingStatus, BookingWithMeta } from "@/lib/queries/bookings";
import { getBookingDisplayName } from "@/lib/queries/bookings";
import {
  getAssignedMealJobs,
  getBookingsForAdmin,
} from "@/lib/queries/bookings.server";
import { cn, formatDateRange } from "@/lib/utils";

const toneStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
} satisfies Record<string, string>;

type Tone = keyof typeof toneStyles;

type StatConfig = {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
  tone: Tone;
};

type QuickAction = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  tone: Tone;
};

const statusTone: Record<BookingStatus, { label: string; tone: Tone }> = {
  Pending: { label: "Pending", tone: "warning" },
  InTriage: { label: "In triage", tone: "primary" },
  Approved: { label: "Approved", tone: "primary" },
  Confirmed: { label: "Confirmed", tone: "success" },
  DepositPending: { label: "Deposit pending", tone: "warning" },
  DepositReceived: { label: "Deposit received", tone: "success" },
  InProgress: { label: "In progress", tone: "primary" },
  Completed: { label: "Completed", tone: "success" },
  Cancelled: { label: "Cancelled", tone: "danger" },
};

export default async function AdminDashboard() {
  const bookings = await getBookingsForAdmin();
  const mealJobs = await getAssignedMealJobs();
  const enrichedJobs = enrichMealJobs(mealJobs, bookings);

  const pending = bookings.filter((b) => b.status === "Pending");
  const depositPending = bookings.filter((b) => b.status === "DepositPending");
  const depositReceived = bookings.filter(
    (b) => b.status === "DepositReceived" || b.status === "Confirmed"
  );
  const activeCatering = enrichedJobs.length;
  const activeBookings = bookings.filter(
    (b) => !["Cancelled", "Completed"].includes(b.status)
  ).length;
  const arrivalsThisWeek = upcomingWithinDays(bookings, 7);

  const stats: StatConfig[] = [
    {
      label: "Active bookings",
      value: activeBookings,
      helper: `${arrivalsThisWeek} arriving this week`,
      icon: Calendar,
      tone: "primary",
    },
    {
      label: "Pending approvals",
      value: pending.length,
      helper: "Need triage",
      icon: CalendarClock,
      tone: "warning",
    },
    {
      label: "Deposits received",
      value: depositReceived.length,
      helper: `${depositPending.length} outstanding`,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Catering jobs active",
      value: activeCatering,
      helper: "Service windows scheduled",
      icon: Utensils,
      tone: "accent",
    },
  ];

  const recentBookings = [...bookings]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  const quickActions: QuickAction[] = [
    {
      icon: Calendar,
      title: "Schedule overview",
      description: "Review the upcoming week for all spaces.",
      href: "/admin/schedule",
      tone: "primary",
    },
    {
      icon: Utensils,
      title: "Catering planner",
      description: "Confirm meal services and dietary needs.",
      href: "/admin/catering/jobs",
      tone: "accent",
    },
    {
      icon: Users,
      title: "Team assignments",
      description: "Share run sheets and responsibilities.",
      href: "/admin/resources",
      tone: "success",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
        <div className="md:col-span-2 lg:col-span-2 xl:col-span-1">
          <DesignSystemCard />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-soft">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-text">Recent bookings</h2>
            <p className="text-sm text-text-light">
              Manage your upcoming reservations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ToolbarButton icon={Filter} label="Filter" />
            <ToolbarButton icon={List} label="List" />
            <ToolbarButton icon={LayoutGrid} label="Grid" active />
          </div>
        </div>

        <div className="space-y-4">
          {recentBookings.length ? (
            recentBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <EmptyState message="No recent bookings" />
          )}
        </div>

        <Link
          href="/admin/bookings"
          className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-border bg-neutral py-3 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-white"
        >
          View all bookings
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-light">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </section>
    </div>
  );
}

function upcomingWithinDays(bookings: BookingWithMeta[], days: number) {
  const today = startOfDay(new Date());
  const limit = new Date(today);
  limit.setDate(today.getDate() + days);

  return bookings.filter((booking) => {
    const arrival = new Date(booking.arrival_date);
    if (Number.isNaN(arrival.getTime())) return false;
    const normalized = startOfDay(arrival);
    return normalized >= today && normalized <= limit;
  }).length;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function DesignSystemCard() {
  const palette = [
    { label: "Primary", hex: "#2F5233", className: "bg-primary" },
    { label: "Accent", hex: "#FF6B35", className: "bg-accent" },
    {
      label: "Secondary",
      hex: "#E8F5E9",
      className: "bg-secondary border border-primary/20",
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-soft">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-text-light">
          Design system
        </p>
        <h3 className="mt-1 text-lg font-semibold text-text">Brand palette</h3>
        <p className="mt-2 text-sm text-text-light">
          Reference hues used throughout the admin dashboard.
        </p>
      </div>
      <div className="mt-6 space-y-4">
        {palette.map((tone) => (
          <div key={tone.label} className="flex items-center gap-3">
            <span
              className={cn("flex size-10 rounded-full", tone.className)}
              aria-hidden
            />
            <div>
              <p className="text-sm font-semibold text-text">{tone.label}</p>
              <p className="text-xs text-text-light">{tone.hex}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-border bg-neutral/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-light">
          Typography
        </p>
        <p className="text-sm font-semibold text-text">Inter</p>
        <p className="text-xs text-text-light">Primary sans-serif</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone }: StatConfig) {
  const { backgroundClass, textClass } = getToneClasses(tone);

  return (
    <div className="group rounded-2xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            backgroundClass
          )}
        >
          <Icon className={cn("size-6", textClass)} aria-hidden />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-3xl font-bold text-text">{value}</p>
        <p className="text-sm text-text-light">{label}</p>
        <p className={cn("text-xs font-semibold", textClass)}>{helper}</p>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center rounded-xl border px-3 py-2 text-sm transition-colors duration-200",
        active
          ? "border-transparent bg-gray-100 text-primary"
          : "border-transparent text-text-light hover:bg-neutral hover:text-text"
      )}
      aria-label={label}
    >
      <Icon className="size-5" aria-hidden />
    </button>
  );
}

function BookingCard({ booking }: { booking: BookingWithMeta }) {
  const status = statusTone[booking.status];
  const { backgroundClass, textClass } = getToneClasses(
    status?.tone ?? "primary"
  );
  let headcountLabel = "Headcount TBC";
  if (booking.headcount) {
    headcountLabel = booking.headcount.toLocaleString() + " guests";
  }

  return (
    <Link
      href={`/admin/bookings/${booking.id}`}
      className="group block rounded-2xl border border-border bg-white p-5 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-text">
            {getBookingDisplayName(booking)}
          </h3>
          <p className="mt-1 flex items-center gap-2 text-sm text-text-light">
            <Calendar className="size-4" aria-hidden />
            {formatDateRange(booking.arrival_date, booking.departure_date)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            backgroundClass,
            textClass
          )}
        >
          {status?.label ?? booking.status}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm text-text-light">
        <span className="flex items-center gap-2">
          <Users className="size-4" aria-hidden />
          {headcountLabel}
        </span>
        <ChevronRight
          className="size-5 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden
        />
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-neutral px-6 py-12 text-center text-text-light">
      <Wallet className="size-10 text-border" aria-hidden />
      <p className="text-sm font-semibold text-text">{message}</p>
      <p className="text-sm">
        Bookings will appear here once new enquiries arrive.
      </p>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  tone,
}: QuickAction) {
  const { backgroundClass, textClass } = getToneClasses(tone);

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-border bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-xl",
          backgroundClass
        )}
      >
        <Icon className={cn("size-6", textClass)} aria-hidden />
      </div>
      <h3 className="mt-4 text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-text-light">{description}</p>
      <ChevronRight
        className="mt-4 size-5 text-text-light transition-transform duration-200 group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}

function getToneClasses(tone: Tone) {
  const [backgroundClass, textClass] = toneStyles[tone].split(" ");
  return { backgroundClass, textClass };
}
