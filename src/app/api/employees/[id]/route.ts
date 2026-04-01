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
    const { name, phone } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const updateData: { name?: string; phone?: string | null } = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ employee: updated });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.shiftSwapRequest.deleteMany({
        where: { requestedById: id },
      });
      await tx.shiftSwapRequest.deleteMany({
        where: { claimedById: id },
      });
      await tx.shiftAssignment.deleteMany({
        where: { employeeId: id },
      });
      await tx.availability.deleteMany({
        where: { employeeId: id },
      });
      await tx.timeOffRequest.deleteMany({
        where: { employeeId: id },
      });
      await tx.user.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
