import { prisma } from "@/lib/db";
import { addDays } from "date-fns";
import {
  getWeekStart,
  getWeekEnd,
  dayOfWeekFromDate,
  timeRangeOverlaps,
  isDateInRange,
  shiftDurationHours,
} from "@/lib/schedule-utils";
import { Shift } from "@prisma/client";

interface GenerateResult {
  shifts: Shift[];
  created: number;
  message?: string;
}

/**
 * Auto-generates shift assignments for a given week.
 *
 * 1. If no shifts exist for the week, copies previous week's shift structure.
 * 2. Clears existing assignments on unpublished shifts.
 * 3. Assigns available employees fairly (fewest hours first, most-constrained shifts first).
 */
export async function generateSchedule(
  restaurantId: string,
  weekStartDate: Date
): Promise<GenerateResult> {
  const weekStart = getWeekStart(weekStartDate);
  const weekEnd = getWeekEnd(weekStart);

  // 1. Get or create shifts for the week
  let shifts = await prisma.shift.findMany({
    where: {
      restaurantId,
      date: { gte: weekStart, lte: weekEnd },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  if (shifts.length === 0) {
    // Copy from previous week
    const prevWeekStart = addDays(weekStart, -7);
    const prevWeekEnd = addDays(weekEnd, -7);

    const prevShifts = await prisma.shift.findMany({
      where: {
        restaurantId,
        date: { gte: prevWeekStart, lte: prevWeekEnd },
      },
    });

    if (prevShifts.length === 0) {
      return {
        shifts: [],
        created: 0,
        message:
          "No shifts found for this week or the previous week. Please create shifts first.",
      };
    }

    // Create new shifts based on previous week's structure, offset by +7 days
    const newShifts = await prisma.$transaction(
      prevShifts.map((ps) =>
        prisma.shift.create({
          data: {
            restaurantId,
            date: addDays(ps.date, 7),
            startTime: ps.startTime,
            endTime: ps.endTime,
            role: ps.role,
            requiredCount: ps.requiredCount,
            isPublished: false,
          },
        })
      )
    );

    shifts = newShifts;
  }

  // Filter to only unpublished shifts for assignment
  const unpublishedShifts = shifts.filter((s) => !s.isPublished);
  if (unpublishedShifts.length === 0) {
    return {
      shifts,
      created: 0,
      message: "All shifts are already published. Cannot regenerate.",
    };
  }

  // 2. Clear existing assignments on unpublished shifts
  const unpublishedIds = unpublishedShifts.map((s) => s.id);

  // Delete swap requests first (referential integrity)
  await prisma.shiftSwapRequest.deleteMany({
    where: {
      originalAssignment: {
        shiftId: { in: unpublishedIds },
      },
    },
  });

  await prisma.shiftAssignment.deleteMany({
    where: { shiftId: { in: unpublishedIds } },
  });

  // 3. Gather employee data
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true },
  });

  const availabilities = await prisma.availability.findMany({
    where: { employeeId: { in: employees.map((e) => e.id) } },
  });

  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      status: "APPROVED",
      employeeId: { in: employees.map((e) => e.id) },
      startDate: { lte: weekEnd },
      endDate: { gte: weekStart },
    },
  });

  // Build lookup structures
  const availByEmployee = new Map<
    string,
    Map<string, { startTime: string; endTime: string }[]>
  >();
  for (const a of availabilities) {
    if (!availByEmployee.has(a.employeeId)) {
      availByEmployee.set(a.employeeId, new Map());
    }
    const dayMap = availByEmployee.get(a.employeeId)!;
    const list = dayMap.get(a.dayOfWeek) || [];
    list.push({ startTime: a.startTime, endTime: a.endTime });
    dayMap.set(a.dayOfWeek, list);
  }

  const timeOffByEmployee = new Map<
    string,
    { startDate: Date; endDate: Date }[]
  >();
  for (const t of timeOffRequests) {
    const list = timeOffByEmployee.get(t.employeeId) || [];
    list.push({ startDate: t.startDate, endDate: t.endDate });
    timeOffByEmployee.set(t.employeeId, list);
  }

  // 4. Build eligibility map for each shift
  const eligibilityMap = new Map<string, string[]>();

  for (const shift of unpublishedShifts) {
    const dayOfWeek = dayOfWeekFromDate(shift.date);
    const eligible: string[] = [];

    for (const emp of employees) {
      // Check time-off
      const empTimeOff = timeOffByEmployee.get(emp.id) || [];
      if (empTimeOff.some((t) => isDateInRange(shift.date, t.startDate, t.endDate))) {
        continue;
      }

      // Check availability covers the shift
      const empDayAvail = availByEmployee.get(emp.id)?.get(dayOfWeek) || [];
      const hasAvailability = empDayAvail.some(
        (a) => a.startTime <= shift.startTime && a.endTime >= shift.endTime
      );
      if (!hasAvailability) continue;

      eligible.push(emp.id);
    }

    eligibilityMap.set(shift.id, eligible);
  }

  // 5. Assign employees greedily: most-constrained shifts first, fewest-hours employees first
  const hoursAssigned = new Map<string, number>();
  for (const emp of employees) {
    hoursAssigned.set(emp.id, 0);
  }

  // Track assignments per employee per date to prevent double-booking
  const employeeDateShifts = new Map<string, { startTime: string; endTime: string }[]>();

  const makeKey = (empId: string, date: string) => `${empId}:${date}`;

  // Sort shifts by eligibility count ascending (most constrained first)
  const sortedShifts = [...unpublishedShifts].sort((a, b) => {
    const aElig = eligibilityMap.get(a.id)?.length || 0;
    const bElig = eligibilityMap.get(b.id)?.length || 0;
    return aElig - bElig;
  });

  const assignmentsToCreate: { shiftId: string; employeeId: string }[] = [];

  for (const shift of sortedShifts) {
    const eligible = eligibilityMap.get(shift.id) || [];
    const dateStr = shift.date.toISOString().split("T")[0];

    // Filter out employees with overlapping shifts on the same day
    const available = eligible.filter((empId) => {
      const key = makeKey(empId, dateStr);
      const existing = employeeDateShifts.get(key) || [];
      return !existing.some((s) =>
        timeRangeOverlaps(s.startTime, s.endTime, shift.startTime, shift.endTime)
      );
    });

    // Sort by fewest hours assigned
    available.sort(
      (a, b) => (hoursAssigned.get(a) || 0) - (hoursAssigned.get(b) || 0)
    );

    const toAssign = available.slice(0, shift.requiredCount);
    const duration = shiftDurationHours(shift.startTime, shift.endTime);

    for (const empId of toAssign) {
      assignmentsToCreate.push({ shiftId: shift.id, employeeId: empId });
      hoursAssigned.set(empId, (hoursAssigned.get(empId) || 0) + duration);

      const key = makeKey(empId, dateStr);
      const existing = employeeDateShifts.get(key) || [];
      existing.push({ startTime: shift.startTime, endTime: shift.endTime });
      employeeDateShifts.set(key, existing);
    }
  }

  // 6. Create assignments in a transaction
  if (assignmentsToCreate.length > 0) {
    await prisma.$transaction(
      assignmentsToCreate.map((a) =>
        prisma.shiftAssignment.create({
          data: {
            shiftId: a.shiftId,
            employeeId: a.employeeId,
            status: "ASSIGNED",
          },
        })
      )
    );
  }

  return {
    shifts,
    created: assignmentsToCreate.length,
  };
}
