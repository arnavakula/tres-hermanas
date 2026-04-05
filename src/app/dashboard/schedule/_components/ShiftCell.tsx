"use client";

import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduleShift } from "@/types/schedule";
import { EmployeeBadge } from "./EmployeeBadge";
import { cn } from "@/lib/utils";

interface ShiftCellProps {
  shift: ScheduleShift;
  isPast: boolean;
  onAssignClick: (shift: ScheduleShift) => void;
  onUnassign: (assignmentId: string, employeeName: string) => void;
}

export function ShiftCell({
  shift,
  isPast,
  onAssignClick,
  onUnassign,
}: ShiftCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: shift.id,
    data: { shiftId: shift.id },
  });

  const isUnderstaffed = shift.assignments.length < shift.requiredCount;
  const hasPendingSwap = shift.assignments.some((a) => a.hasSwapRequest);
  const atCapacity = shift.assignments.length >= shift.requiredCount;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border p-2 text-sm transition-colors",
        isUnderstaffed && !isPast && "border-red-400 bg-red-50 dark:bg-red-950/20",
        hasPendingSwap &&
          !isUnderstaffed &&
          !isPast &&
          "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20",
        !isUnderstaffed &&
          !hasPendingSwap &&
          "border-border bg-card",
        isOver && !isPast && "ring-2 ring-primary/50",
        isPast && "opacity-60"
      )}
    >
      {/* Shift header */}
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="font-medium text-xs">
          {shift.startTime}–{shift.endTime}
        </span>
        <Badge variant="outline" className="text-[10px] px-1 py-0">
          {shift.role}
        </Badge>
      </div>

      {/* Staffing count */}
      <div
        className={cn(
          "text-[10px] mb-1.5",
          isUnderstaffed && !isPast
            ? "text-red-600 font-medium"
            : "text-muted-foreground"
        )}
      >
        {shift.assignments.length}/{shift.requiredCount} staffed
      </div>

      {/* Employee badges */}
      <div className="flex flex-wrap gap-1">
        {shift.assignments.map((assignment) => (
          <EmployeeBadge
            key={assignment.id}
            assignment={assignment}
            isPast={isPast}
            isPublished={shift.isPublished}
            onUnassign={onUnassign}
          />
        ))}
      </div>

      {/* Add button */}
      {!isPast && !shift.isPublished && !atCapacity && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-1 h-6 w-full text-xs text-muted-foreground"
          onClick={() => onAssignClick(shift)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Assign
        </Button>
      )}
    </div>
  );
}
