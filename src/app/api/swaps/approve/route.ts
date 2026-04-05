import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { createNotifications } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { swapRequestId } = await request.json();

    if (!swapRequestId) {
      return NextResponse.json(
        { error: "swapRequestId is required" },
        { status: 400 }
      );
    }

    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapRequestId },
      include: {
        originalAssignment: {
          include: { shift: true },
        },
        claimedBy: { select: { name: true } },
        requestedBy: { select: { name: true } },
      },
    });

    if (!swapRequest || swapRequest.status !== "CLAIMED" || !swapRequest.claimedById) {
      return NextResponse.json(
        { error: "Invalid swap request" },
        { status: 400 }
      );
    }

    // Update assignment to new employee and mark swap as approved
    await prisma.$transaction([
      prisma.shiftAssignment.update({
        where: { id: swapRequest.originalAssignmentId },
        data: {
          employeeId: swapRequest.claimedById,
          status: "ASSIGNED",
        },
      }),
      prisma.shiftSwapRequest.update({
        where: { id: swapRequestId },
        data: { status: "APPROVED" },
      }),
    ]);

    // Notify both employees
    const shift = swapRequest.originalAssignment.shift;
    const dateStr = format(shift.date, "EEE, MMM d");
    const shiftDesc = `${shift.role} shift on ${dateStr} (${shift.startTime}–${shift.endTime})`;

    await createNotifications(
      [swapRequest.requestedById, swapRequest.claimedById],
      `Swap approved! The ${shiftDesc} has been transferred from ${swapRequest.requestedBy.name} to ${swapRequest.claimedBy!.name}.`,
      "swap_approved"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Approve swap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
