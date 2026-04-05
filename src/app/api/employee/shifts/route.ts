import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getWeekStart, getWeekEnd } from "@/lib/schedule-utils";
import { addDays } from "date-fns";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = session.user.id;

  try {
    // Current week + next week range
    const now = new Date();
    const currentWeekStart = getWeekStart(now);
    const nextWeekEnd = getWeekEnd(addDays(currentWeekStart, 7));

    const assignments = await prisma.shiftAssignment.findMany({
      where: {
        employeeId,
        shift: {
          isPublished: true,
          date: {
            gte: currentWeekStart,
            lte: nextWeekEnd,
          },
        },
      },
      include: {
        shift: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            role: true,
            requiredCount: true,
          },
        },
        swapRequests: {
          where: { status: { in: ["OPEN", "CLAIMED"] } },
          select: { id: true, status: true },
        },
      },
      orderBy: { shift: { date: "asc" } },
    });

    const shifts = assignments.map((a) => ({
      assignmentId: a.id,
      assignmentStatus: a.status,
      shiftId: a.shift.id,
      date: a.shift.date.toISOString(),
      startTime: a.shift.startTime,
      endTime: a.shift.endTime,
      role: a.shift.role,
      hasOpenSwap: a.swapRequests.some((sr) => sr.status === "OPEN"),
      hasPendingClaim: a.swapRequests.some((sr) => sr.status === "CLAIMED"),
    }));

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error("Employee shifts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
