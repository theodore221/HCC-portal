"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MealSlotCard } from "@/components/ui/meal-slot-card";
import type { EnrichedMealJob } from "@/lib/catering";
import type { DietaryProfile } from "@/lib/queries/bookings";

interface CustomerCateringTabProps {
  cateringJobs: EnrichedMealJob[];
  dietaryProfiles: DietaryProfile[];
}

export function CustomerCateringTab({
  cateringJobs,
  dietaryProfiles,
}: CustomerCateringTabProps) {
  return (
    <div className="space-y-6">
      {/* Meal Selection Section */}
      <Card>
        <CardHeader>
          <CardTitle>Meal Selection</CardTitle>
          <CardDescription>
            Review the scheduled meals for your stay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {cateringJobs.length ? (
              cateringJobs.map((job) => <MealSlotCard key={job.id} job={job} />)
            ) : (
              <p className="text-sm text-muted-foreground">
                No catering services scheduled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dietary Requirements Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Dietary Requirements</CardTitle>
            <CardDescription>
              Manage dietary needs and allergies for your guests.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Add Requirement
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest Name</TableHead>
                  <TableHead>Diet Type</TableHead>
                  <TableHead>Allergy Details</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dietaryProfiles.length ? (
                  dietaryProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">
                        {profile.person_name}
                      </TableCell>
                      <TableCell>{profile.diet_type}</TableCell>
                      <TableCell>{profile.allergy || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            profile.severity === "Fatal"
                              ? "destructive"
                              : profile.severity === "High"
                              ? "default" // Use default (usually dark) for High
                              : "secondary"
                          }
                        >
                          {profile.severity || "Low"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground h-24"
                    >
                      No dietary requirements recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
