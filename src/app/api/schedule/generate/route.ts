import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { generateSchedule } from "@/lib/schedule-generator";
import { getWeekStart } from "@/lib/schedule-utils";

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
    const result = await generateSchedule(restaurantId, weekStart);

    if (result.message) {
      return NextResponse.json(
        { error: result.message, shifts: result.shifts },
        { status: result.shifts.length === 0 ? 400 : 200 }
      );
    }

    return NextResponse.json({
      success: true,
      created: result.created,
    });
  } catch (error) {
    console.error("Generate schedule error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
