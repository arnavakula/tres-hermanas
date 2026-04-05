import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { addDays, startOfDay } from "date-fns";

export async function GET() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant" }, { status: 400 });
  }

  try {
    const now = startOfDay(new Date());
    const twoWeeksOut = addDays(now, 14);

    const events = await prisma.event.findMany({
      where: {
        restaurantId,
        date: { gte: now, lte: twoWeeksOut },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        description: e.description,
        expectedImpact: e.expectedImpact,
      })),
    });
  } catch (error) {
    console.error("Events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const restaurantId = session.user.restaurantId;
  if (!restaurantId) {
    return NextResponse.json({ error: "No restaurant" }, { status: 400 });
  }

  try {
    const { name, date, expectedImpact, description } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { error: "name and date are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        restaurantId,
        name,
        date: new Date(date),
        description: description || null,
        expectedImpact: expectedImpact || "MEDIUM",
      },
    });

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        description: event.description,
        expectedImpact: event.expectedImpact,
      },
    });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
