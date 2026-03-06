import { BookingsTabs } from "./_components/bookings-tabs";

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BookingsTabs />
      {children}
    </div>
  );
}
