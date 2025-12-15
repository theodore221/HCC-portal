"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, MapPinIcon } from "lucide-react";
import type {
  BookingWithMeta,
  SpaceReservation,
  Space,
} from "@/lib/queries/bookings";

interface CustomerSpacesTabProps {
  booking: BookingWithMeta;
  reservations: SpaceReservation[];
  allSpaces: Space[];
}

export function CustomerSpacesTab({
  booking,
  reservations,
  allSpaces,
}: CustomerSpacesTabProps) {
  // Group reservations by space_id
  const reservationsBySpace = reservations.reduce((acc, res) => {
    if (!acc[res.space_id]) {
      acc[res.space_id] = [];
    }
    acc[res.space_id].push(res);
    return acc;
  }, {} as Record<string, SpaceReservation[]>);

  const spaceEntries = Object.entries(reservationsBySpace);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-soft">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reserved Spaces
        </h3>

        {spaceEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              No spaces have been reserved for this booking yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {spaceEntries.map(([spaceId, resList]) => {
              const space = allSpaces.find((s) => s.id === spaceId);
              return (
                <Card key={spaceId} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="truncate">{space?.name || spaceId}</span>
                      {space?.capacity && (
                        <Badge variant="outline" className="gap-1">
                          <UsersIcon className="h-3 w-3" />
                          {space.capacity}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPinIcon className="h-4 w-4" />
                        <span>
                          {resList.length} day{resList.length !== 1 ? "s" : ""}{" "}
                          reserved
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {resList.map((res) => (
                          <Badge
                            key={res.id}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {new Date(res.service_date).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" }
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
