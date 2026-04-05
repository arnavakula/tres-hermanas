import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { ScheduleAction } from "@/types/schedule";

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { actions } = body as { actions: ScheduleAction[] };

    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: "actions array is required" },
        { status: 400 }
      );
    }

    // Validate all referenced shifts belong to manager's restaurant and aren't published
    const shiftIds = new Set<string>();
    const assignmentIds = new Set<string>();

    for (const action of actions) {
      if (action.type === "assign") {
        shiftIds.add(action.shiftId);
      } else if (action.type === "unassign") {
        assignmentIds.add(action.assignmentId);
      } else if (action.type === "move") {
        assignmentIds.add(action.assignmentId);
        shiftIds.add(action.toShiftId);
      }
    }

    // Validate shifts
    if (shiftIds.size > 0) {
      const shifts = await prisma.shift.findMany({
        where: { id: { in: Array.from(shiftIds) } },
        select: { id: true, restaurantId: true, isPublished: true },
      });

      for (const shift of shifts) {
        if (shift.restaurantId !== restaurantId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (shift.isPublished) {
          return NextResponse.json(
            { error: "Cannot modify published shifts" },
            { status: 400 }
          );
        }
      }
    }

    // Validate assignments
    if (assignmentIds.size > 0) {
      const assignments = await prisma.shiftAssignment.findMany({
        where: { id: { in: Array.from(assignmentIds) } },
        include: { shift: { select: { restaurantId: true, isPublished: true } } },
      });

      for (const assignment of assignments) {
        if (assignment.shift.restaurantId !== restaurantId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (assignment.shift.isPublished) {
          return NextResponse.json(
            { error: "Cannot modify published shifts" },
            { status: 400 }
          );
        }
      }
    }

    // Execute actions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const action of actions) {
        if (action.type === "assign") {
          await tx.shiftAssignment.create({
            data: {
              shiftId: action.shiftId,
              employeeId: action.employeeId,
              status: "ASSIGNED",
            },
          });
        } else if (action.type === "unassign") {
          // Delete associated swap requests first
          await tx.shiftSwapRequest.deleteMany({
            where: { originalAssignmentId: action.assignmentId },
          });
          await tx.shiftAssignment.delete({
            where: { id: action.assignmentId },
          });
        } else if (action.type === "move") {
          const assignment = await tx.shiftAssignment.findUnique({
            where: { id: action.assignmentId },
          });
          if (!assignment) throw new Error("Assignment not found");

          // Delete swap requests for old assignment
          await tx.shiftSwapRequest.deleteMany({
            where: { originalAssignmentId: action.assignmentId },
          });
          // Delete old assignment
          await tx.shiftAssignment.delete({
            where: { id: action.assignmentId },
          });
          // Create new assignment on target shift
          await tx.shiftAssignment.create({
            data: {
              shiftId: action.toShiftId,
              employeeId: assignment.employeeId,
              status: "ASSIGNED",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update assignments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
