"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, Loader2 } from "lucide-react";

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "DENIED";
  createdAt: string;
  employee: { name: string; email: string };
  reviewedBy: { name: string } | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ManagerTimeOffPage() {
  const [pendingRequests, setPendingRequests] = useState<TimeOffRequest[]>([]);
  const [recentRequests, setRecentRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const [pendingRes, recentRes] = await Promise.all([
        fetch("/api/time-off?status=PENDING"),
        fetch("/api/time-off?recent=true"),
      ]);
      const pendingData = await pendingRes.json();
      const recentData = await recentRes.json();
      setPendingRequests(pendingData.requests);
      setRecentRequests(recentData.requests);
    } catch {
      console.error("Failed to fetch time-off requests");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function handleReview(id: string, status: "APPROVED" | "DENIED") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchRequests();
      }
    } catch {
      console.error("Failed to review request");
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading requests...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      <h1 className="mb-6 text-3xl font-bold">Time Off Requests</h1>

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Pending Requests</h2>
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
              <Clock className="h-4 w-4" />
              No pending requests
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{req.employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(req.startDate)} — {formatDate(req.endDate)}
                    </p>
                    {req.reason && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 text-white hover:bg-green-700"
                      disabled={processingId === req.id}
                      onClick={() => handleReview(req.id, "APPROVED")}
                    >
                      {processingId === req.id ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={processingId === req.id}
                      onClick={() => handleReview(req.id, "DENIED")}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recently Reviewed */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Recently Reviewed</h2>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent reviews</p>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <Card key={req.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        req.status === "APPROVED" ? "success" : "destructive"
                      }
                    >
                      {req.status}
                    </Badge>
                    <div>
                      <span className="font-medium">{req.employee.name}</span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {formatDate(req.startDate)} —{" "}
                        {formatDate(req.endDate)}
                      </span>
                    </div>
                  </div>
                  {req.reviewedBy && (
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      by {req.reviewedBy.name}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
