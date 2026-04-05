import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const swapRequests = await prisma.shiftSwapRequest.findMany({
      where: { status: "CLAIMED" },
      include: {
        originalAssignment: {
          include: {
            shift: {
              select: {
                id: true,
                date: true,
                startTime: true,
                endTime: true,
                role: true,
              },
            },
          },
        },
        requestedBy: { select: { id: true, name: true } },
        claimedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const pending = swapRequests.map((sr) => ({
      id: sr.id,
      shift: {
        date: sr.originalAssignment.shift.date.toISOString(),
        startTime: sr.originalAssignment.shift.startTime,
        endTime: sr.originalAssignment.shift.endTime,
        role: sr.originalAssignment.shift.role,
      },
      originalEmployee: sr.requestedBy,
      claimingEmployee: sr.claimedBy,
      createdAt: sr.createdAt.toISOString(),
    }));

    return NextResponse.json({ pending });
  } catch (error) {
    console.error("Pending swaps error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
