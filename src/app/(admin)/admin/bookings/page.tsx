import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConflictBanner } from "@/components/ui/conflict-banner";
import { StatusChip } from "@/components/ui/status-chip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MOCK_BOOKINGS } from "@/lib/mock-data";

export default function AdminBookings() {
  const counts = {
    Pending: MOCK_BOOKINGS.filter((b) => b.status === "Pending").length,
    InTriage: MOCK_BOOKINGS.filter((b) => b.status === "InTriage").length,
    Approved: MOCK_BOOKINGS.filter((b) => b.status === "Approved").length,
  };

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
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-olive-700">
          <Badge variant="warning">Pending {counts.Pending}</Badge>
          <Badge variant="outline">In triage {counts.InTriage}</Badge>
          <Badge variant="success">Approved {counts.Approved}</Badge>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bookings list</CardTitle>
          <CardDescription>
            Review new requests and progress them through triage
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden rounded-2xl border border-olive-100 p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-olive-50">
                <TableHead>Ref</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Headcount</TableHead>
                <TableHead>Spaces</TableHead>
                <TableHead>Catering</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_BOOKINGS.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-semibold text-olive-900">
                    {booking.reference}
                  </TableCell>
                  <TableCell>{booking.groupName}</TableCell>
                  <TableCell>
                    {booking.arrival} → {booking.departure}
                  </TableCell>
                  <TableCell>{booking.headcount}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {booking.spaces.map((space) => (
                        <Badge key={space} variant="outline">
                          {space}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{booking.cateringRequired ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <StatusChip status={booking.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm">
                        Triage
                      </Button>
                      <Button variant="outline" size="sm">
                        Approve
                      </Button>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        Open
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <ConflictBanner issues={["Corbett Room clash with Retreat 12 Nov", "Dining Hall capacity exceeded on 13 Nov"]} />
    </div>
  );
}
