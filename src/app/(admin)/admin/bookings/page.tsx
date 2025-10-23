import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { DataTable } from "@/components/data-table";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

import { bookingsColumns } from "./columns";

export default function AdminBookings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>
              Filter by status, dates, catering or spaces
            </CardDescription>
          </div>
          <Button>New booking</Button>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bookings list</CardTitle>
          <CardDescription>
            Review new requests and progress them through triage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={bookingsColumns} data={MOCK_BOOKINGS} pageSize={8} />
        </CardContent>
      </Card>
      <ConflictBanner
        issues={[
          "Corbett Room clash with Retreat 12 Nov",
          "Dining Hall capacity exceeded on 13 Nov",
        ]}
      />
    </div>
  );
}
