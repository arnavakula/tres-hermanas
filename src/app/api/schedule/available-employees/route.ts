import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import {
  dayOfWeekFromDate,
  timeRangeOverlaps,
} from "@/lib/schedule-utils";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shiftId = searchParams.get("shiftId");

  if (!shiftId) {
    return NextResponse.json(
      { error: "shiftId is required" },
      { status: 400 }
    );
  }

  try {
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: { select: { employeeId: true } },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const shiftDate = shift.date;
    const dayOfWeek = dayOfWeekFromDate(shiftDate);

    // Get all employees
    const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: { id: true, name: true, email: true },
    });

    // Get availability for this day of week
    const availabilities = await prisma.availability.findMany({
      where: { dayOfWeek },
    });

    // Get approved time-off overlapping the shift date
    const timeOffRequests = await prisma.timeOffRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: shiftDate },
        endDate: { gte: shiftDate },
      },
    });

    // Get existing assignments for this date to check for overlapping shifts
    const dateShifts = await prisma.shift.findMany({
      where: {
        restaurantId: shift.restaurantId,
        date: shiftDate,
        id: { not: shiftId },
      },
      include: {
        assignments: { select: { employeeId: true } },
      },
    });

    const alreadyAssignedIds = new Set(
      shift.assignments.map((a) => a.employeeId)
    );
    const timeOffEmployeeIds = new Set(
      timeOffRequests.map((t) => t.employeeId)
    );
    const availabilityByEmployee = new Map<
      string,
      { startTime: string; endTime: string }[]
    >();
    for (const a of availabilities) {
      const list = availabilityByEmployee.get(a.employeeId) || [];
      list.push({ startTime: a.startTime, endTime: a.endTime });
      availabilityByEmployee.set(a.employeeId, list);
    }

    const available = employees.filter((emp) => {
      // Already assigned to this shift
      if (alreadyAssignedIds.has(emp.id)) return false;

      // On time off
      if (timeOffEmployeeIds.has(emp.id)) return false;

      // Check availability covers the shift time
      const empAvail = availabilityByEmployee.get(emp.id);
      if (!empAvail) return false;
      const hasAvailability = empAvail.some(
        (a) =>
          a.startTime <= shift.startTime && a.endTime >= shift.endTime
      );
      if (!hasAvailability) return false;

      // Check not assigned to overlapping shift on same day
      const hasOverlap = dateShifts.some(
        (ds) =>
          timeRangeOverlaps(
            ds.startTime,
            ds.endTime,
            shift.startTime,
            shift.endTime
          ) && ds.assignments.some((a) => a.employeeId === emp.id)
      );
      if (hasOverlap) return false;

      return true;
    });

    return NextResponse.json({
      employees: available.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
      })),
    });
  } catch (error) {
    console.error("Available employees error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
