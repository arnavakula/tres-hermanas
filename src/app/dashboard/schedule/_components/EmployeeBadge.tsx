"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ScheduleAssignment } from "@/types/schedule";
import { cn } from "@/lib/utils";

interface EmployeeBadgeProps {
  assignment: ScheduleAssignment;
  isPast: boolean;
  isPublished: boolean;
  onUnassign: (assignmentId: string, employeeName: string) => void;
}

export function EmployeeBadge({
  assignment,
  isPast,
  isPublished,
  onUnassign,
}: EmployeeBadgeProps) {
  const canDrag = !isPast && !isPublished;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: assignment.id,
      data: {
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        employeeName: assignment.employeeName,
      },
      disabled: !canDrag,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? { ...listeners, ...attributes } : {})}
      className={cn(
        "group flex items-center gap-1",
        isDragging && "opacity-50"
      )}
    >
      <Badge
        variant={assignment.status === "SWAPPING" ? "warning" : "secondary"}
        className={cn(
          "text-xs",
          canDrag && "cursor-grab active:cursor-grabbing"
        )}
      >
        {assignment.employeeName}
        {canDrag && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnassign(assignment.id, assignment.employeeName);
            }}
            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Badge>
    </div>
  );
}
