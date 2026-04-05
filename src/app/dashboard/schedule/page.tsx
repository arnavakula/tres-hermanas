"use client";

import { useState, useEffect, useCallback } from "react";
import { addDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { ScheduleShift, WeekSchedule } from "@/types/schedule";
import { getWeekStart } from "@/lib/schedule-utils";
import { ScheduleHeader } from "./_components/ScheduleHeader";
import { ScheduleGrid } from "./_components/ScheduleGrid";
import { AssignDialog } from "./_components/AssignDialog";

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getWeekStart(new Date())
  );
  const [shifts, setShifts] = useState<ScheduleShift[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [assignDialogShift, setAssignDialogShift] =
    useState<ScheduleShift | null>(null);
  const [error, setError] = useState<string | null>(null);

  const weekStartStr = weekStart.toISOString().split("T")[0];

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schedule?week=${weekStartStr}`);
      const data: WeekSchedule = await res.json();
      setShifts(data.shifts || []);
      setIsPublished(data.isPublished || false);
    } catch {
      setError("Failed to load schedule");
      setShifts([]);
    } finally {
      setIsLoading(false);
    }
  }, [weekStartStr]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  function navigateWeek(delta: -1 | 1) {
    setWeekStart((prev) => addDays(prev, delta * 7));
  }

  function jumpToDate(date: Date) {
    setWeekStart(getWeekStart(date));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStartStr }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate schedule");
      }
      await fetchSchedule();
    } catch {
      setError("Failed to generate schedule");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePublish() {
    if (!confirm("Publish this week's schedule? Employees will be able to see it.")) {
      return;
    }
    setIsPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/schedule/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart: weekStartStr }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to publish");
      }
      await fetchSchedule();
    } catch {
      setError("Failed to publish schedule");
    } finally {
      setIsPublishing(false);
    }
  }

  async function handleAssign(shiftId: string, employeeId: string) {
    setError(null);
    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: [{ type: "assign", shiftId, employeeId }],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to assign employee");
      }
      await fetchSchedule();
    } catch {
      setError("Failed to assign employee");
    }
  }

  async function handleUnassign(assignmentId: string, employeeName: string) {
    if (!confirm(`Remove ${employeeName} from this shift?`)) return;
    setError(null);
    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: [{ type: "unassign", assignmentId }],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to unassign employee");
      }
      await fetchSchedule();
    } catch {
      setError("Failed to unassign employee");
    }
  }

  async function handleDragEnd(assignmentId: string, toShiftId: string) {
    // Optimistic update: move the assignment locally
    const prevShifts = [...shifts];

    setShifts((currentShifts) => {
      const newShifts = currentShifts.map((s) => ({
        ...s,
        assignments: [...s.assignments],
      }));

      // Find the assignment being moved
      let movedAssignment = null;
      for (const shift of newShifts) {
        const idx = shift.assignments.findIndex((a) => a.id === assignmentId);
        if (idx !== -1) {
          movedAssignment = shift.assignments.splice(idx, 1)[0];
          break;
        }
      }

      // Add to target shift
      if (movedAssignment) {
        const targetShift = newShifts.find((s) => s.id === toShiftId);
        if (targetShift) {
          targetShift.assignments.push(movedAssignment);
        }
      }

      return newShifts;
    });

    // Send to API
    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: [{ type: "move", assignmentId, toShiftId }],
        }),
      });
      if (!res.ok) {
        // Revert on failure
        setShifts(prevShifts);
        const data = await res.json();
        setError(data.error || "Failed to move assignment");
      } else {
        await fetchSchedule();
      }
    } catch {
      setShifts(prevShifts);
      setError("Failed to move assignment");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading schedule...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Weekly Schedule</h1>

        <ScheduleHeader
          weekStart={weekStart}
          onNavigate={navigateWeek}
          onJumpToDate={jumpToDate}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          onGenerate={handleGenerate}
          onPublish={handlePublish}
          isPublished={isPublished}
          isGenerating={isGenerating}
          isPublishing={isPublishing}
          hasShifts={shifts.length > 0}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <ScheduleGrid
        weekStart={weekStart}
        shifts={shifts}
        roleFilter={roleFilter}
        onDragEnd={handleDragEnd}
        onAssignClick={(shift) => setAssignDialogShift(shift)}
        onUnassign={handleUnassign}
      />

      <AssignDialog
        shift={assignDialogShift}
        open={assignDialogShift !== null}
        onClose={() => setAssignDialogShift(null)}
        onAssign={handleAssign}
      />
    </div>
  );
}
