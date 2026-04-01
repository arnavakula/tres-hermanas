import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  if (session.user.role === "EMPLOYEE") {
    const requests = await prisma.timeOffRequest.findMany({
      where: { employeeId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        reviewedBy: { select: { name: true } },
      },
    });
    return NextResponse.json({ requests });
  }

  // Manager view
  const status = searchParams.get("status");
  const recent = searchParams.get("recent");

  if (recent === "true") {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const requests = await prisma.timeOffRequest.findMany({
      where: {
        status: { not: "PENDING" },
        updatedAt: { gte: sevenDaysAgo },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        employee: { select: { name: true, email: true } },
        reviewedBy: { select: { name: true } },
      },
    });
    return NextResponse.json({ requests });
  }

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const requests = await prisma.timeOffRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      employee: { select: { name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session || session.user.role !== "EMPLOYEE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { startDate, endDate, reason } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        employeeId: session.user.id,
        startDate: start,
        endDate: end,
        reason: reason || null,
      },
      include: {
        reviewedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({ request: timeOffRequest }, { status: 201 });
  } catch (error) {
    console.error("Create time-off request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
