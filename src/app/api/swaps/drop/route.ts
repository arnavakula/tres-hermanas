import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { dayOfWeekFromDate } from "@/lib/schedule-utils";
import { format } from "date-fns";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is required" },
        { status: 400 }
      );
    }

    // Validate assignment belongs to this employee and is ASSIGNED
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        shift: true,
        employee: { select: { name: true } },
      },
    });

    if (!assignment || assignment.employeeId !== session.user.id) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.status !== "ASSIGNED") {
      return NextResponse.json(
        { error: "Shift is already being swapped" },
        { status: 400 }
      );
    }

    // Update assignment status and create swap request
    await prisma.$transaction([
      prisma.shiftAssignment.update({
        where: { id: assignmentId },
        data: { status: "SWAPPING" },
      }),
      prisma.shiftSwapRequest.create({
        data: {
          originalAssignmentId: assignmentId,
          requestedById: session.user.id,
          status: "OPEN",
        },
      }),
    ]);

    // Notify available employees
    const shift = assignment.shift;
    const dayOfWeek = dayOfWeekFromDate(shift.date);
    const dateStr = format(shift.date, "EEE, MMM d");

    // Find employees with availability for this shift
    const availableEmployees = await prisma.availability.findMany({
      where: {
        dayOfWeek,
        startTime: { lte: shift.startTime },
        endTime: { gte: shift.endTime },
        employeeId: { not: session.user.id },
      },
      select: { employeeId: true },
    });

    const employeeIds = Array.from(
      new Set(availableEmployees.map((a) => a.employeeId))
    );

    if (employeeIds.length > 0) {
      await createNotifications(
        employeeIds,
        `${assignment.employee.name} dropped their ${shift.role} shift on ${dateStr} (${shift.startTime}–${shift.endTime}). Pick it up in Open Shifts!`,
        "swap_posted"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Drop shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
