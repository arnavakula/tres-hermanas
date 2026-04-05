export interface ScheduleAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  status: "ASSIGNED" | "SWAPPING" | "OPEN";
  hasSwapRequest: boolean;
}

export interface ScheduleShift {
  id: string;
  date: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  role: string;
  requiredCount: number;
  isPublished: boolean;
  assignments: ScheduleAssignment[];
}

export interface WeekSchedule {
  weekStart: string;
  shifts: ScheduleShift[];
  isPublished: boolean;
}

export interface AssignAction {
  type: "assign";
  shiftId: string;
  employeeId: string;
}

export interface UnassignAction {
  type: "unassign";
  assignmentId: string;
}

export interface MoveAction {
  type: "move";
  assignmentId: string;
  toShiftId: string;
}

export type ScheduleAction = AssignAction | UnassignAction | MoveAction;
