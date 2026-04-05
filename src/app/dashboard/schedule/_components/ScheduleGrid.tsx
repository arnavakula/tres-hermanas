"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { isBefore, isToday as checkIsToday, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScheduleShift } from "@/types/schedule";
import { getWeekDays } from "@/lib/schedule-utils";
import { DayColumn } from "./DayColumn";

interface ScheduleGridProps {
  weekStart: Date;
  shifts: ScheduleShift[];
  roleFilter: string | null;
  onDragEnd: (assignmentId: string, toShiftId: string) => void;
  onAssignClick: (shift: ScheduleShift) => void;
  onUnassign: (assignmentId: string, employeeName: string) => void;
}

export function ScheduleGrid({
  weekStart,
  shifts,
  roleFilter,
  onDragEnd,
  onAssignClick,
  onUnassign,
}: ScheduleGridProps) {
  const [activeDragName, setActiveDragName] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const days = getWeekDays(weekStart);
  const today = startOfDay(new Date());

  // Group shifts by date
  const shiftsByDate = new Map<string, ScheduleShift[]>();
  for (const shift of shifts) {
    if (roleFilter && shift.role !== roleFilter) continue;
    const dateKey = shift.date.split("T")[0];
    const list = shiftsByDate.get(dateKey) || [];
    list.push(shift);
    shiftsByDate.set(dateKey, list);
  }

  function handleDragStart(event: { active: { data: { current?: { employeeName?: string } } } }) {
    setActiveDragName(event.active.data.current?.employeeName || null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragName(null);
    const { active, over } = event;
    if (!over) return;

    const assignmentId = active.id as string;
    const fromShiftId = active.data.current?.shiftId;
    const toShiftId = over.id as string;

    // Don't move to the same shift
    if (fromShiftId === toShiftId) return;

    onDragEnd(assignmentId, toShiftId);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-7 gap-3 overflow-x-auto">
        {days.map((date) => {
          const dateKey = date.toISOString().split("T")[0];
          const dayShifts = shiftsByDate.get(dateKey) || [];
          const isPast = isBefore(date, today);
          const isToday = checkIsToday(date);

          return (
            <DayColumn
              key={dateKey}
              date={date}
              shifts={dayShifts}
              isPast={isPast}
              isToday={isToday}
              onAssignClick={onAssignClick}
              onUnassign={onUnassign}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeDragName ? (
          <Badge variant="secondary" className="text-xs shadow-lg">
            {activeDragName}
          </Badge>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
