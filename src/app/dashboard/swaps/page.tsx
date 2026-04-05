"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingSwap {
  id: string;
  shift: {
    date: string;
    startTime: string;
    endTime: string;
    role: string;
  };
  originalEmployee: { id: string; name: string };
  claimingEmployee: { id: string; name: string };
  createdAt: string;
}

export default function SwapApprovalsPage() {
  const [pending, setPending] = useState<PendingSwap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/swaps/pending");
      const data = await res.json();
      setPending(data.pending || []);
    } catch {
      console.error("Failed to fetch pending swaps");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  async function handleAction(swapRequestId: string, action: "approve" | "deny") {
    setProcessingId(swapRequestId);
    try {
      const res = await fetch(`/api/swaps/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapRequestId }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((s) => s.id !== swapRequestId));
        toast.success(`Swap ${action === "approve" ? "approved" : "denied"}`);
      } else {
        toast.error(`Failed to ${action} swap`);
      }
    } catch {
      toast.error(`Failed to ${action} swap`);
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Swap Approvals</h1>
        <p className="mt-1 text-muted-foreground">
          Review and approve or deny shift swap requests
        </p>
      </div>

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No swap requests waiting for approval.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((swap) => {
            const date = parseISO(swap.shift.date);
            const isProcessing = processingId === swap.id;

            return (
              <Card key={swap.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {format(date, "EEE, MMM d")}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {swap.shift.startTime} – {swap.shift.endTime}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {swap.shift.role}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="font-medium">{swap.originalEmployee.name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{swap.claimingEmployee.name}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleAction(swap.id, "approve")}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-3 w-3" />
                        )}
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(swap.id, "deny")}
                        disabled={isProcessing}
                      >
                        <X className="mr-2 h-3 w-3" />
                        Deny
                      </Button>
                    </div>
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
