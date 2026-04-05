import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { dayOfWeekFromDate, timeRangeOverlaps } from "@/lib/schedule-utils";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = session.user.id;

  try {
    // Get all OPEN swap requests
    const swapRequests = await prisma.shiftSwapRequest.findMany({
      where: { status: "OPEN" },
      include: {
        originalAssignment: {
          include: {
            shift: true,
            employee: { select: { id: true, name: true } },
          },
        },
        requestedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter out shifts already assigned to this employee
    const filtered = swapRequests.filter(
      (sr) => sr.originalAssignment.employeeId !== employeeId
    );

    // Get employee availability
    const availabilities = await prisma.availability.findMany({
      where: { employeeId },
    });

    // Get employee's approved time-off
    const timeOff = await prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
      },
    });

    // Get employee's current assignments to check for overlaps
    const myAssignments = await prisma.shiftAssignment.findMany({
      where: { employeeId },
      include: { shift: { select: { date: true, startTime: true, endTime: true } } },
    });

    // Build availability map by day
    const availByDay = new Map<string, { startTime: string; endTime: string }[]>();
    for (const a of availabilities) {
      const list = availByDay.get(a.dayOfWeek) || [];
      list.push({ startTime: a.startTime, endTime: a.endTime });
      availByDay.set(a.dayOfWeek, list);
    }

    const openShifts = filtered.filter((sr) => {
      const shift = sr.originalAssignment.shift;
      const dayOfWeek = dayOfWeekFromDate(shift.date);

      // Check availability
      const dayAvail = availByDay.get(dayOfWeek) || [];
      const hasAvailability = dayAvail.some(
        (a) => a.startTime <= shift.startTime && a.endTime >= shift.endTime
      );
      if (!hasAvailability) return false;

      // Check time-off
      const hasTimeOff = timeOff.some((t) => {
        const start = new Date(
          t.startDate.getFullYear(),
          t.startDate.getMonth(),
          t.startDate.getDate()
        ).getTime();
        const end = new Date(
          t.endDate.getFullYear(),
          t.endDate.getMonth(),
          t.endDate.getDate()
        ).getTime();
        const sd = new Date(
          shift.date.getFullYear(),
          shift.date.getMonth(),
          shift.date.getDate()
        ).getTime();
        return sd >= start && sd <= end;
      });
      if (hasTimeOff) return false;

      // Check overlapping assignments
      const dateStr = shift.date.toISOString().split("T")[0];
      const hasOverlap = myAssignments.some((ma) => {
        const maDateStr = ma.shift.date.toISOString().split("T")[0];
        return (
          maDateStr === dateStr &&
          timeRangeOverlaps(
            ma.shift.startTime,
            ma.shift.endTime,
            shift.startTime,
            shift.endTime
          )
        );
      });
      if (hasOverlap) return false;

      return true;
    });

    return NextResponse.json({
      openShifts: openShifts.map((sr) => ({
        swapRequestId: sr.id,
        date: sr.originalAssignment.shift.date.toISOString(),
        startTime: sr.originalAssignment.shift.startTime,
        endTime: sr.originalAssignment.shift.endTime,
        role: sr.originalAssignment.shift.role,
        droppedBy: sr.requestedBy.name,
        createdAt: sr.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Open shifts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
