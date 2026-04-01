import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { DayOfWeek } from "@prisma/client";

const VALID_DAYS = Object.values(DayOfWeek);

export async function GET() {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const availability = await prisma.availability.findMany({
    where: { employeeId: session.user.id },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json({ availability });
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slots } = body as {
      slots: Array<{
        dayOfWeek: string;
        startTime: string;
        endTime: string;
      }>;
    };

    if (!Array.isArray(slots)) {
      return NextResponse.json(
        { error: "slots must be an array" },
        { status: 400 }
      );
    }

    const timeRegex = /^\d{2}:\d{2}$/;
    for (const slot of slots) {
      if (!VALID_DAYS.includes(slot.dayOfWeek as DayOfWeek)) {
        return NextResponse.json(
          { error: `Invalid day: ${slot.dayOfWeek}` },
          { status: 400 }
        );
      }
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return NextResponse.json(
          { error: "Times must be in HH:mm format" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { employeeId: session.user.id },
      });
      if (slots.length > 0) {
        await tx.availability.createMany({
          data: slots.map((slot) => ({
            employeeId: session.user.id,
            dayOfWeek: slot.dayOfWeek as DayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            isRecurring: true,
          })),
        });
      }
    });

    const availability = await prisma.availability.findMany({
      where: { employeeId: session.user.id },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Update availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
