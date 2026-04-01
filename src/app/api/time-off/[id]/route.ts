import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (status !== "APPROVED" && status !== "DENIED") {
      return NextResponse.json(
        { error: "Status must be APPROVED or DENIED" },
        { status: 400 }
      );
    }

    const existing = await prisma.timeOffRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { error: "Request has already been reviewed" },
        { status: 400 }
      );
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: {
        status,
        reviewedById: session.user.id,
      },
      include: {
        employee: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("Update time-off request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
