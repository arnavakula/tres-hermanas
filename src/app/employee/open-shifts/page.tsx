"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Hand } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface OpenShift {
  swapRequestId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  droppedBy: string;
  createdAt: string;
}

export default function OpenShiftsPage() {
  const [openShifts, setOpenShifts] = useState<OpenShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const fetchOpenShifts = useCallback(async () => {
    try {
      const res = await fetch("/api/swaps/open");
      const data = await res.json();
      setOpenShifts(data.openShifts || []);
    } catch {
      console.error("Failed to fetch open shifts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpenShifts();
  }, [fetchOpenShifts]);

  async function handleClaim(swapRequestId: string) {
    setClaimingId(swapRequestId);
    try {
      const res = await fetch("/api/swaps/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapRequestId }),
      });
      if (res.ok) {
        setClaimedIds((prev) => new Set(prev).add(swapRequestId));
        toast.success("Shift claimed! Awaiting manager approval.");
      } else {
        toast.error("Failed to claim shift");
      }
    } catch {
      toast.error("Failed to claim shift");
    } finally {
      setClaimingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-32" />
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
        <h1 className="text-3xl font-bold">Open Shifts</h1>
        <p className="mt-1 text-muted-foreground">
          Available shifts you can pick up
        </p>
      </div>

      {openShifts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No open shifts available right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {openShifts.map((shift) => {
            const date = parseISO(shift.date);
            const isClaimed = claimedIds.has(shift.swapRequestId);

            return (
              <Card key={shift.swapRequestId}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {format(date, "EEE, MMM d")}
                      </span>
                      <Badge variant="outline" className="capitalize">
                        {shift.role}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {shift.startTime} – {shift.endTime}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Dropped by {shift.droppedBy}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {isClaimed ? (
                      <Badge variant="success">Claimed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleClaim(shift.swapRequestId)}
                        disabled={claimingId === shift.swapRequestId}
                      >
                        {claimingId === shift.swapRequestId ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Hand className="mr-2 h-3 w-3" />
                        )}
                        Claim Shift
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
