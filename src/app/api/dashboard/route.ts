import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getWeekStart, getWeekEnd } from "@/lib/schedule-utils";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant" }, { status: 400 });
  }

  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = getWeekStart(now);
    const weekEnd = getWeekEnd(weekStart);

    // Run queries in parallel
    const [
      totalEmployees,
      weekShifts,
      todayShifts,
      openSwaps,
      pendingSwaps,
      pendingTimeOff,
    ] = await Promise.all([
      // Total employees
      prisma.user.count({ where: { role: "EMPLOYEE" } }),

      // All shifts this week
      prisma.shift.findMany({
        where: {
          restaurantId,
          date: { gte: weekStart, lte: weekEnd },
        },
        include: {
          assignments: {
            include: { employee: { select: { id: true, name: true } } },
          },
        },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      }),

      // Today's shifts with assignments
      prisma.shift.findMany({
        where: {
          restaurantId,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          assignments: {
            include: { employee: { select: { id: true, name: true } } },
          },
        },
        orderBy: { startTime: "asc" },
      }),

      // Open swap requests (shifts needing coverage)
      prisma.shiftSwapRequest.findMany({
        where: { status: { in: ["OPEN", "CLAIMED"] } },
        include: {
          originalAssignment: {
            include: {
              shift: { select: { date: true, startTime: true, endTime: true, role: true } },
              employee: { select: { name: true } },
            },
          },
          requestedBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Pending swap approvals
      prisma.shiftSwapRequest.findMany({
        where: { status: "CLAIMED" },
        include: {
          originalAssignment: {
            include: {
              shift: { select: { date: true, startTime: true, endTime: true, role: true } },
            },
          },
          requestedBy: { select: { id: true, name: true } },
          claimedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Pending time-off requests
      prisma.timeOffRequest.findMany({
        where: { status: "PENDING" },
        include: {
          employee: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Weekly staffing: count unique assigned employees per day
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weeklyStaffing = weekDays.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const dayShifts = weekShifts.filter(
        (s) => s.date >= dayStart && s.date <= dayEnd
      );
      const staffCount = dayShifts.reduce(
        (sum, s) => sum + s.assignments.length,
        0
      );
      const shiftCount = dayShifts.length;
      return {
        date: day.toISOString(),
        staffCount,
        shiftCount,
      };
    });

    return NextResponse.json({
      stats: {
        totalEmployees,
        shiftsThisWeek: weekShifts.length,
        openShiftsCount: openSwaps.length,
        pendingRequestsCount: pendingTimeOff.length + pendingSwaps.length,
      },
      todayShifts: todayShifts.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        role: s.role,
        requiredCount: s.requiredCount,
        isPublished: s.isPublished,
        assignedCount: s.assignments.length,
        employees: s.assignments.map((a) => ({
          id: a.employee.id,
          name: a.employee.name,
          status: a.status,
        })),
      })),
      weeklyStaffing,
      openShifts: openSwaps.map((sr) => ({
        id: sr.id,
        status: sr.status,
        date: sr.originalAssignment.shift.date.toISOString(),
        startTime: sr.originalAssignment.shift.startTime,
        endTime: sr.originalAssignment.shift.endTime,
        role: sr.originalAssignment.shift.role,
        droppedBy: sr.requestedBy.name,
      })),
      pendingSwaps: pendingSwaps.map((sr) => ({
        id: sr.id,
        date: sr.originalAssignment.shift.date.toISOString(),
        startTime: sr.originalAssignment.shift.startTime,
        endTime: sr.originalAssignment.shift.endTime,
        role: sr.originalAssignment.shift.role,
        originalEmployee: sr.requestedBy,
        claimingEmployee: sr.claimedBy,
      })),
      pendingTimeOff: pendingTimeOff.map((t) => ({
        id: t.id,
        employee: t.employee,
        startDate: t.startDate.toISOString(),
        endDate: t.endDate.toISOString(),
        reason: t.reason,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
