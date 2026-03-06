import { BookingsTabs } from "../bookings/_components/bookings-tabs";

export default function EnquiriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <BookingsTabs />
      {children}
    </div>
  );
}
