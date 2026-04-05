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

    // Revert: clear claimedBy, set status back to OPEN
    await prisma.shiftSwapRequest.update({
      where: { id: swapRequestId },
      data: {
        claimedById: null,
        status: "OPEN",
      },
    });

    // Notify both employees
    const shift = swapRequest.originalAssignment.shift;
    const dateStr = format(shift.date, "EEE, MMM d");
    const shiftDesc = `${shift.role} shift on ${dateStr} (${shift.startTime}–${shift.endTime})`;

    await createNotifications(
      [swapRequest.requestedById, swapRequest.claimedById],
      `Swap denied for the ${shiftDesc}. The shift is back on the open market.`,
      "swap_denied"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Deny swap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
