import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getWeekStart, getWeekEnd } from "@/lib/schedule-utils";
import { ScheduleShift } from "@/types/schedule";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant found" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const weekParam = searchParams.get("week");

  const weekStart = weekParam
    ? getWeekStart(new Date(weekParam + "T00:00:00"))
    : getWeekStart(new Date());
  const weekEnd = getWeekEnd(weekStart);

  try {
    const shifts = await prisma.shift.findMany({
      where: {
        restaurantId,
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        assignments: {
          include: {
            employee: { select: { id: true, name: true } },
            swapRequests: { where: { status: { in: ["OPEN", "CLAIMED"] } } },
          },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const scheduleShifts: ScheduleShift[] = shifts.map((shift) => ({
      id: shift.id,
      date: shift.date.toISOString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
      requiredCount: shift.requiredCount,
      isPublished: shift.isPublished,
      assignments: shift.assignments.map((a) => ({
        id: a.id,
        employeeId: a.employee.id,
        employeeName: a.employee.name,
        status: a.status,
        hasSwapRequest: a.swapRequests.length > 0,
      })),
    }));

    const isPublished =
      scheduleShifts.length > 0 && scheduleShifts.every((s) => s.isPublished);

    return NextResponse.json({
      weekStart: weekStart.toISOString().split("T")[0],
      shifts: scheduleShifts,
      isPublished,
    });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
