import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { getWeekStart, getWeekEnd } from "@/lib/schedule-utils";

export async function POST(request: Request) {
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
    const { weekStart: weekStartStr } = body;

    if (!weekStartStr) {
      return NextResponse.json(
        { error: "weekStart is required (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const weekStart = getWeekStart(new Date(weekStartStr + "T00:00:00"));
    const weekEnd = getWeekEnd(weekStart);

    const result = await prisma.shift.updateMany({
      where: {
        restaurantId,
        date: { gte: weekStart, lte: weekEnd },
      },
      data: { isPublished: true },
    });

    return NextResponse.json({
      success: true,
      published: result.count,
    });
  } catch (error) {
    console.error("Publish schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
