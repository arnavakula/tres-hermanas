"use client";

import { format } from "date-fns";
import { ScheduleShift } from "@/types/schedule";
import { ShiftCell } from "./ShiftCell";
import { cn } from "@/lib/utils";

interface DayColumnProps {
  date: Date;
  shifts: ScheduleShift[];
  isPast: boolean;
  isToday: boolean;
  onAssignClick: (shift: ScheduleShift) => void;
  onUnassign: (assignmentId: string, employeeName: string) => void;
}

export function DayColumn({
  date,
  shifts,
  isPast,
  isToday,
  onAssignClick,
  onUnassign,
}: DayColumnProps) {
  return (
    <div
      className={cn(
        "min-w-[140px] flex flex-col",
        isPast && "opacity-50 pointer-events-none"
      )}
    >
      {/* Day header */}
      <div
        className={cn(
          "mb-2 text-center rounded-md py-1.5 px-1",
          isToday
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        <div className="text-xs font-medium uppercase">
          {format(date, "EEE")}
        </div>
        <div className="text-lg font-bold">{format(date, "d")}</div>
      </div>

      {/* Shift cells */}
      <div className="flex flex-col gap-2 flex-1">
        {shifts.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-2 border border-dashed rounded-md">
            No shifts
          </div>
        ) : (
          shifts.map((shift) => (
            <ShiftCell
              key={shift.id}
              shift={shift}
              isPast={isPast}
              onAssignClick={onAssignClick}
              onUnassign={onUnassign}
            />
          ))
        )}
      </div>
    </div>
  );
}
