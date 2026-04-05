"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ShiftData {
  assignmentId: string;
  assignmentStatus: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  hasOpenSwap: boolean;
  hasPendingClaim: boolean;
}

export default function EmployeeSchedulePage() {
  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [droppingId, setDroppingId] = useState<string | null>(null);

  const fetchShifts = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/shifts");
      const data = await res.json();
      setShifts(data.shifts || []);
    } catch {
      console.error("Failed to fetch shifts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  async function handleDrop(assignmentId: string) {
    setDroppingId(assignmentId);
    try {
      const res = await fetch("/api/swaps/drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      });
      if (res.ok) {
        toast.success("Shift posted for swap");
        await fetchShifts();
      } else {
        toast.error("Failed to drop shift");
      }
    } catch {
      toast.error("Failed to drop shift");
    } finally {
      setDroppingId(null);
    }
  }

  // Group shifts by week
  const grouped = shifts.reduce<Record<string, ShiftData[]>>((acc, shift) => {
    const date = parseISO(shift.date);
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    const key = format(weekStart, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(shift);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <p className="mt-1 text-muted-foreground">
          Your assigned shifts for the current and next week
        </p>
      </div>

      {shifts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No shifts assigned for the upcoming weeks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([weekKey, weekShifts]) => {
              const weekStart = parseISO(weekKey);
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              const label = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

              return (
                <div key={weekKey}>
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </h2>
                  <div className="space-y-2">
                    {weekShifts.map((shift) => {
                      const date = parseISO(shift.date);
                      const isSwapping =
                        shift.assignmentStatus === "SWAPPING" ||
                        shift.hasOpenSwap ||
                        shift.hasPendingClaim;

                      return (
                        <Card key={shift.assignmentId}>
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold">
                                  {format(date, "EEE, MMM d")}
                                </span>
                                <Badge variant="outline" className="capitalize">
                                  {shift.role}
                                </Badge>
                                {shift.hasOpenSwap && (
                                  <Badge variant="warning">Open for swap</Badge>
                                )}
                                {shift.hasPendingClaim && (
                                  <Badge variant="secondary">Claim pending</Badge>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {shift.startTime} – {shift.endTime}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {!isSwapping ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDrop(shift.assignmentId)}
                                  disabled={droppingId === shift.assignmentId}
                                >
                                  {droppingId === shift.assignmentId ? (
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                  ) : (
                                    <ArrowRightLeft className="mr-2 h-3 w-3" />
                                  )}
                                  Drop Shift
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  {shift.hasPendingClaim
                                    ? "Awaiting approval"
                                    : "Posted for swap"}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
