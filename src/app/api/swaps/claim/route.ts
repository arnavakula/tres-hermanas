import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
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
      },
    });

    if (!swapRequest) {
      return NextResponse.json(
        { error: "Swap request not found" },
        { status: 404 }
      );
    }

    if (swapRequest.status !== "OPEN") {
      return NextResponse.json(
        { error: "This shift is no longer available" },
        { status: 400 }
      );
    }

    if (swapRequest.requestedById === session.user.id) {
      return NextResponse.json(
        { error: "You cannot claim your own shift" },
        { status: 400 }
      );
    }

    await prisma.shiftSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        claimedById: session.user.id,
        status: "CLAIMED",
      },
    });

    // Notify the original employee that someone claimed their shift
    const shift = swapRequest.originalAssignment.shift;
    const dateStr = format(shift.date, "EEE, MMM d");
    await createNotification(
      swapRequest.requestedById,
      `${session.user.name} wants to pick up your ${shift.role} shift on ${dateStr} (${shift.startTime}–${shift.endTime}). Awaiting manager approval.`,
      "swap_claimed"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Claim shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
