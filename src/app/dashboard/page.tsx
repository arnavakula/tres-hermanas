"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
  Check,
  X,
  Plus,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_COLORS: Record<string, string> = {
  server: "bg-blue-100 text-blue-800 border-blue-200",
  cook: "bg-red-100 text-red-800 border-red-200",
  host: "bg-green-100 text-green-800 border-green-200",
  busser: "bg-purple-100 text-purple-800 border-purple-200",
};

const IMPACT_VARIANTS: Record<string, "success" | "warning" | "destructive"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "destructive",
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DashboardData {
  stats: {
    totalEmployees: number;
    shiftsThisWeek: number;
    openShiftsCount: number;
    pendingRequestsCount: number;
  };
  todayShifts: Array<{
    id: string;
    startTime: string;
    endTime: string;
    role: string;
    requiredCount: number;
    isPublished: boolean;
    assignedCount: number;
    employees: Array<{ id: string; name: string; status: string }>;
  }>;
  weeklyStaffing: Array<{
    date: string;
    staffCount: number;
    shiftCount: number;
  }>;
  openShifts: Array<{
    id: string;
    status: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    droppedBy: string;
  }>;
  pendingSwaps: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    role: string;
    originalEmployee: { id: string; name: string };
    claimingEmployee: { id: string; name: string };
  }>;
  pendingTimeOff: Array<{
    id: string;
    employee: { id: string; name: string };
    startDate: string;
    endDate: string;
    reason: string | null;
  }>;
}

interface EventData {
  id: string;
  name: string;
  date: string;
  description: string | null;
  expectedImpact: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Event form
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventImpact, setEventImpact] = useState("MEDIUM");
  const [addingEvent, setAddingEvent] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, eventsRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch("/api/events"),
      ]);
      const dashData = await dashRes.json();
      const eventsData = await eventsRes.json();
      setData(dashData);
      setEvents(eventsData.events || []);
    } catch {
      console.error("Failed to fetch dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSwapAction(swapRequestId: string, action: "approve" | "deny") {
    setProcessingId(swapRequestId);
    try {
      const res = await fetch(`/api/swaps/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ swapRequestId }),
      });
      if (res.ok) {
        toast.success(`Swap ${action === "approve" ? "approved" : "denied"}`);
        await fetchData();
      } else {
        toast.error(`Failed to ${action} swap`);
      }
    } catch {
      toast.error(`Failed to ${action} swap`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleTimeOffAction(id: string, status: "APPROVED" | "DENIED") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/time-off/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Time-off ${status === "APPROVED" ? "approved" : "denied"}`);
        await fetchData();
      } else {
        toast.error("Failed to update time-off");
      }
    } catch {
      toast.error("Failed to update time-off");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!eventName || !eventDate) return;
    setAddingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: eventName,
          date: eventDate,
          expectedImpact: eventImpact,
        }),
      });
      if (res.ok) {
        const { event } = await res.json();
        setEvents((prev) => [...prev, event].sort((a, b) => a.date.localeCompare(b.date)));
        setEventName("");
        setEventDate("");
        setEventImpact("MEDIUM");
        toast.success("Event added");
      } else {
        toast.error("Failed to add event");
      }
    } catch {
      toast.error("Failed to add event");
    } finally {
      setAddingEvent(false);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <Skeleton className="mb-6 h-9 w-56" />
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-3 p-4">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div>
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const maxStaff = Math.max(...data.weeklyStaffing.map((d) => d.staffCount), 1);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <h1 className="mb-6 text-3xl font-bold">Manager Dashboard</h1>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Employees"
          value={data.stats.totalEmployees}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Shifts This Week"
          value={data.stats.shiftsThisWeek}
        />
        <StatCard
          icon={<AlertCircle className="h-4 w-4" />}
          label="Open Shifts"
          value={data.stats.openShiftsCount}
          alert={data.stats.openShiftsCount > 0}
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Pending Requests"
          value={data.stats.pendingRequestsCount}
          alert={data.stats.pendingRequestsCount > 0}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
            <CardDescription>
              {format(new Date(), "EEEE, MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.todayShifts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No shifts scheduled today
              </p>
            ) : (
              <div className="space-y-2">
                {data.todayShifts.map((shift) => {
                  const isUnder = shift.assignedCount < shift.requiredCount;
                  return (
                    <div
                      key={shift.id}
                      className={cn(
                        "rounded-lg border p-3",
                        isUnder && "border-yellow-300 bg-yellow-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-xs font-semibold capitalize",
                              ROLE_COLORS[shift.role] || "bg-gray-100 text-gray-800"
                            )}
                          >
                            {shift.role}
                          </span>
                          <span className="text-sm font-medium">
                            {shift.startTime} – {shift.endTime}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isUnder ? "text-yellow-700" : "text-green-700"
                          )}
                        >
                          {shift.assignedCount}/{shift.requiredCount} assigned
                        </span>
                      </div>
                      {shift.employees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {shift.employees.map((emp) => (
                            <span
                              key={emp.id}
                              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                            >
                              {emp.name}
                            </span>
                          ))}
                        </div>
                      )}
                      {isUnder && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-yellow-700">
                          <AlertCircle className="h-3 w-3" />
                          Needs {shift.requiredCount - shift.assignedCount} more
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* This Week at a Glance */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">This Week at a Glance</CardTitle>
              <Link href="/dashboard/schedule">
                <Button variant="ghost" size="sm">
                  Schedule Builder <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.weeklyStaffing.map((day, i) => {
                const barWidth = maxStaff > 0 ? (day.staffCount / maxStaff) * 100 : 0;
                const isToday =
                  format(parseISO(day.date), "yyyy-MM-dd") ===
                  format(new Date(), "yyyy-MM-dd");
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "w-8 text-sm font-medium",
                        isToday && "text-primary font-bold"
                      )}
                    >
                      {DAY_LABELS[i]}
                    </span>
                    <div className="flex-1">
                      <div className="h-6 w-full rounded-md bg-secondary">
                        <div
                          className={cn(
                            "flex h-6 items-center rounded-md px-2 text-xs font-medium text-white transition-all",
                            isToday ? "bg-primary" : "bg-primary/70"
                          )}
                          style={{ width: `${Math.max(barWidth, 8)}%` }}
                        >
                          {day.staffCount > 0 && day.staffCount}
                        </div>
                      </div>
                    </div>
                    <span className="w-20 text-right text-xs text-muted-foreground">
                      {day.shiftCount} shift{day.shiftCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Open Shifts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Open Shifts
                {data.openShifts.length > 0 && (
                  <Badge variant="warning" className="ml-2">
                    {data.openShifts.length}
                  </Badge>
                )}
              </CardTitle>
              <Link href="/dashboard/swaps">
                <Button variant="ghost" size="sm">
                  View All <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.openShifts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                All shifts are covered
              </p>
            ) : (
              <div className="space-y-2">
                {data.openShifts.slice(0, 5).map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {format(parseISO(shift.date), "EEE, MMM d")}
                        </span>
                        <span
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-xs font-semibold capitalize",
                            ROLE_COLORS[shift.role] || "bg-gray-100"
                          )}
                        >
                          {shift.role}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {shift.startTime} – {shift.endTime} &middot; Dropped by{" "}
                        {shift.droppedBy}
                      </p>
                    </div>
                    <Badge
                      variant={shift.status === "CLAIMED" ? "secondary" : "warning"}
                    >
                      {shift.status === "CLAIMED" ? "Claimed" : "Open"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Pending Requests
              {data.stats.pendingRequestsCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {data.stats.pendingRequestsCount}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.pendingSwaps.length === 0 && data.pendingTimeOff.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No pending requests
              </p>
            ) : (
              <div className="space-y-3">
                {/* Swap approvals */}
                {data.pendingSwaps.map((swap) => (
                  <div
                    key={swap.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge variant="outline" className="mb-1">
                          Swap
                        </Badge>
                        <p className="text-sm">
                          <span className="font-medium">
                            {swap.originalEmployee.name}
                          </span>
                          <ArrowRight className="mx-1 inline h-3 w-3" />
                          <span className="font-medium">
                            {swap.claimingEmployee.name}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(swap.date), "EEE, MMM d")} &middot;{" "}
                          {swap.startTime}–{swap.endTime} &middot;{" "}
                          <span className="capitalize">{swap.role}</span>
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleSwapAction(swap.id, "approve")}
                          disabled={processingId === swap.id}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleSwapAction(swap.id, "deny")}
                          disabled={processingId === swap.id}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Time-off requests */}
                {data.pendingTimeOff.map((req) => (
                  <div
                    key={req.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Badge variant="outline" className="mb-1">
                          Time Off
                        </Badge>
                        <p className="text-sm font-medium">
                          {req.employee.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(req.startDate), "MMM d")} –{" "}
                          {format(parseISO(req.endDate), "MMM d, yyyy")}
                          {req.reason && ` · ${req.reason}`}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleTimeOffAction(req.id, "APPROVED")}
                          disabled={processingId === req.id}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                          onClick={() => handleTimeOffAction(req.id, "DENIED")}
                          disabled={processingId === req.id}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Events in the next 2 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Quick-add form */}
            <form
              onSubmit={handleAddEvent}
              className="mb-4 flex flex-col gap-2 rounded-lg border bg-secondary/30 p-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium">Event Name</label>
                <Input
                  placeholder="e.g. Cinco de Mayo Special"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="h-8 bg-background"
                />
              </div>
              <div className="w-full sm:w-40">
                <label className="mb-1 block text-xs font-medium">Date</label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="h-8 bg-background"
                />
              </div>
              <div className="w-full sm:w-32">
                <label className="mb-1 block text-xs font-medium">Impact</label>
                <select
                  value={eventImpact}
                  onChange={(e) => setEventImpact(e.target.value)}
                  className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={addingEvent || !eventName || !eventDate}
              >
                {addingEvent ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-3 w-3" />
                )}
                Add
              </Button>
            </form>

            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No upcoming events
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-md bg-secondary text-center">
                      <span className="text-[10px] font-medium uppercase leading-none text-muted-foreground">
                        {format(parseISO(event.date), "MMM")}
                      </span>
                      <span className="text-sm font-bold leading-tight">
                        {format(parseISO(event.date), "d")}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{event.name}</p>
                      <Badge
                        variant={IMPACT_VARIANTS[event.expectedImpact] || "secondary"}
                        className="mt-1"
                      >
                        {event.expectedImpact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  alert,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <Card className={alert ? "border-yellow-300" : ""}>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            alert ? "bg-yellow-100 text-yellow-700" : "bg-secondary text-muted-foreground"
          )}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
