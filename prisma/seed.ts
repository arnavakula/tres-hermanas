import { PrismaClient, Role, DayOfWeek, ImpactLevel, AssignmentStatus, SwapStatus, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.shiftSwapRequest.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.timeOffRequest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // ── Users ──────────────────────────────────────────────────────────────
  const manager = await prisma.user.create({
    data: {
      email: "maria@treshermanas.com",
      passwordHash,
      name: "Maria Garcia",
      phone: "512-555-0100",
      role: Role.MANAGER,
    },
  });

  const employeeData = [
    { name: "Carlos Rivera",    email: "carlos@treshermanas.com",   phone: "512-555-0101" },
    { name: "Sofia Martinez",   email: "sofia@treshermanas.com",    phone: "512-555-0102" },
    { name: "Diego Lopez",      email: "diego@treshermanas.com",    phone: "512-555-0103" },
    { name: "Ana Hernandez",    email: "ana@treshermanas.com",      phone: "512-555-0104" },
    { name: "Luis Morales",     email: "luis@treshermanas.com",     phone: "512-555-0105" },
    { name: "Isabella Torres",  email: "isabella@treshermanas.com", phone: "512-555-0106" },
  ];

  const employees = await Promise.all(
    employeeData.map((emp) =>
      prisma.user.create({
        data: { ...emp, passwordHash, role: Role.EMPLOYEE },
      })
    )
  );

  const [carlos, sofia, diego, ana, luis, isabella] = employees;

  // ── Restaurant ─────────────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Tres Hermanas",
      address: "123 Main St, Austin, TX 78701",
      timezone: "America/Chicago",
      managerId: manager.id,
    },
  });

  // ── Availability ───────────────────────────────────────────────────────
  const avail = (empId: string, day: DayOfWeek, start: string, end: string) => ({
    employeeId: empId, dayOfWeek: day, startTime: start, endTime: end, isRecurring: true,
  });

  await prisma.availability.createMany({
    data: [
      // Carlos — reliable opener, weekdays + Saturday
      avail(carlos.id, DayOfWeek.MONDAY,    "09:00", "17:00"),
      avail(carlos.id, DayOfWeek.TUESDAY,   "09:00", "17:00"),
      avail(carlos.id, DayOfWeek.WEDNESDAY, "09:00", "17:00"),
      avail(carlos.id, DayOfWeek.THURSDAY,  "09:00", "17:00"),
      avail(carlos.id, DayOfWeek.FRIDAY,    "09:00", "22:00"),
      avail(carlos.id, DayOfWeek.SATURDAY,  "10:00", "22:00"),

      // Sofia — evening/weekend
      avail(sofia.id, DayOfWeek.MONDAY,    "16:00", "22:00"),
      avail(sofia.id, DayOfWeek.WEDNESDAY, "16:00", "22:00"),
      avail(sofia.id, DayOfWeek.FRIDAY,    "16:00", "23:00"),
      avail(sofia.id, DayOfWeek.SATURDAY,  "10:00", "23:00"),
      avail(sofia.id, DayOfWeek.SUNDAY,    "10:00", "20:00"),

      // Diego — full-time cook, Mon-Fri
      avail(diego.id, DayOfWeek.MONDAY,    "08:00", "16:00"),
      avail(diego.id, DayOfWeek.TUESDAY,   "08:00", "16:00"),
      avail(diego.id, DayOfWeek.WEDNESDAY, "08:00", "16:00"),
      avail(diego.id, DayOfWeek.THURSDAY,  "08:00", "16:00"),
      avail(diego.id, DayOfWeek.FRIDAY,    "08:00", "16:00"),

      // Ana — afternoons and weekends
      avail(ana.id, DayOfWeek.TUESDAY,  "11:00", "20:00"),
      avail(ana.id, DayOfWeek.THURSDAY, "11:00", "20:00"),
      avail(ana.id, DayOfWeek.FRIDAY,   "11:00", "23:00"),
      avail(ana.id, DayOfWeek.SATURDAY, "11:00", "23:00"),
      avail(ana.id, DayOfWeek.SUNDAY,   "11:00", "20:00"),

      // Luis — morning shifts
      avail(luis.id, DayOfWeek.MONDAY,    "07:00", "15:00"),
      avail(luis.id, DayOfWeek.TUESDAY,   "07:00", "15:00"),
      avail(luis.id, DayOfWeek.WEDNESDAY, "07:00", "15:00"),
      avail(luis.id, DayOfWeek.THURSDAY,  "07:00", "15:00"),
      avail(luis.id, DayOfWeek.SATURDAY,  "08:00", "16:00"),

      // Isabella — flexible, most days
      avail(isabella.id, DayOfWeek.MONDAY,    "10:00", "18:00"),
      avail(isabella.id, DayOfWeek.TUESDAY,   "10:00", "18:00"),
      avail(isabella.id, DayOfWeek.WEDNESDAY, "16:00", "22:00"),
      avail(isabella.id, DayOfWeek.FRIDAY,    "10:00", "22:00"),
      avail(isabella.id, DayOfWeek.SATURDAY,  "10:00", "22:00"),
      avail(isabella.id, DayOfWeek.SUNDAY,    "10:00", "18:00"),
    ],
  });

  // ── Shifts (current week + next week) ──────────────────────────────────
  const today = new Date();
  const monday = getMonday(today);

  const shiftTemplates = [
    { startTime: "09:00", endTime: "15:00", role: "server",  requiredCount: 2 },
    { startTime: "15:00", endTime: "22:00", role: "server",  requiredCount: 2 },
    { startTime: "09:00", endTime: "15:00", role: "cook",    requiredCount: 1 },
    { startTime: "15:00", endTime: "22:00", role: "cook",    requiredCount: 1 },
    { startTime: "11:00", endTime: "15:00", role: "host",    requiredCount: 1 },
    { startTime: "17:00", endTime: "22:00", role: "host",    requiredCount: 1 },
  ];

  // Track all created shifts by [week][day][templateIndex]
  const allShifts: Record<string, Awaited<ReturnType<typeof prisma.shift.create>>> = {};

  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 7; day++) {
      const shiftDate = addDays(monday, week * 7 + day);
      const isWeekend = day === 5 || day === 6;
      // Current week is published, next week is draft
      const isPublished = week === 0;

      for (let t = 0; t < shiftTemplates.length; t++) {
        const template = shiftTemplates[t];
        const requiredCount = isWeekend ? template.requiredCount + 1 : template.requiredCount;

        const shift = await prisma.shift.create({
          data: {
            restaurantId: restaurant.id,
            date: shiftDate,
            startTime: template.startTime,
            endTime: template.endTime,
            role: template.role,
            requiredCount,
            isPublished,
          },
        });
        allShifts[`${week}-${day}-${t}`] = shift;
      }
    }
  }

  // Helper to get a shift
  const s = (week: number, day: number, tmplIdx: number) => allShifts[`${week}-${day}-${tmplIdx}`];

  // ── Shift Assignments (current week — published, staffed) ──────────────
  // Template indices: 0=AM server, 1=PM server, 2=AM cook, 3=PM cook, 4=lunch host, 5=evening host

  // Build assignment helper
  const assign = async (shiftKey: string, employeeId: string, status: AssignmentStatus = AssignmentStatus.ASSIGNED) => {
    const shift = allShifts[shiftKey];
    return prisma.shiftAssignment.create({
      data: { shiftId: shift.id, employeeId, status },
    });
  };

  // ── Monday (day 0) ──
  await assign("0-0-0", carlos.id);       // AM server
  await assign("0-0-0", isabella.id);     // AM server
  await assign("0-0-1", sofia.id);        // PM server
  await assign("0-0-1", ana.id);          // PM server (Ana not avail Mon, but manager assigned)
  await assign("0-0-2", diego.id);        // AM cook
  await assign("0-0-3", diego.id);        // PM cook (double)
  await assign("0-0-4", luis.id);         // lunch host
  await assign("0-0-5", isabella.id);     // evening host

  // ── Tuesday (day 1) ──
  await assign("0-1-0", carlos.id);
  await assign("0-1-0", luis.id);
  await assign("0-1-1", ana.id);
  await assign("0-1-1", isabella.id);
  await assign("0-1-2", diego.id);
  await assign("0-1-3", diego.id);
  await assign("0-1-4", isabella.id);
  await assign("0-1-5", sofia.id);

  // ── Wednesday (day 2) ──
  await assign("0-2-0", carlos.id);
  await assign("0-2-0", luis.id);
  await assign("0-2-1", sofia.id);
  await assign("0-2-1", isabella.id);
  await assign("0-2-2", diego.id);
  await assign("0-2-3", diego.id);
  await assign("0-2-4", carlos.id);       // Carlos covers lunch host
  await assign("0-2-5", sofia.id);

  // ── Thursday (day 3) ──
  await assign("0-3-0", carlos.id);
  await assign("0-3-0", luis.id);
  await assign("0-3-1", ana.id);
  await assign("0-3-1", sofia.id);
  await assign("0-3-2", diego.id);
  await assign("0-3-3", diego.id);
  await assign("0-3-4", isabella.id);
  await assign("0-3-5", ana.id);

  // ── Friday (day 4) ──
  await assign("0-4-0", carlos.id);
  await assign("0-4-0", isabella.id);
  await assign("0-4-1", sofia.id);
  await assign("0-4-1", ana.id);
  await assign("0-4-2", diego.id);
  await assign("0-4-3", luis.id);
  await assign("0-4-4", isabella.id);
  await assign("0-4-5", ana.id);

  // ── Saturday (day 5) — weekend, more staff ──
  await assign("0-5-0", carlos.id);
  await assign("0-5-0", luis.id);
  await assign("0-5-0", isabella.id);     // extra weekend server
  await assign("0-5-1", sofia.id);
  await assign("0-5-1", ana.id);
  await assign("0-5-1", isabella.id);
  await assign("0-5-2", diego.id);
  await assign("0-5-3", diego.id);
  await assign("0-5-4", carlos.id);
  await assign("0-5-5", sofia.id);

  // ── Sunday (day 6) ──
  await assign("0-6-0", isabella.id);
  await assign("0-6-0", ana.id);
  await assign("0-6-1", sofia.id);
  await assign("0-6-1", ana.id);
  await assign("0-6-2", luis.id);          // Luis fills in cook Sunday
  await assign("0-6-3", isabella.id);
  await assign("0-6-4", ana.id);
  await assign("0-6-5", sofia.id);

  // ── Next week (week 1) — partial assignments for draft schedule ────────
  // Only assign a few to show the schedule being built
  await assign("1-0-0", carlos.id);
  await assign("1-0-2", diego.id);
  await assign("1-0-4", luis.id);
  await assign("1-1-0", carlos.id);
  await assign("1-1-1", sofia.id);
  await assign("1-1-2", diego.id);
  await assign("1-2-0", carlos.id);
  await assign("1-2-2", diego.id);
  await assign("1-3-0", luis.id);
  await assign("1-3-2", diego.id);
  await assign("1-4-0", carlos.id);
  await assign("1-4-1", ana.id);
  await assign("1-4-2", diego.id);

  // ── Swap Requests ──────────────────────────────────────────────────────

  // Sofia wants to drop her Friday PM server shift (OPEN — anyone can claim)
  const sofiaFriPmAssignment = await prisma.shiftAssignment.findFirst({
    where: { shiftId: s(0, 4, 1).id, employeeId: sofia.id },
  });
  if (sofiaFriPmAssignment) {
    await prisma.shiftAssignment.update({
      where: { id: sofiaFriPmAssignment.id },
      data: { status: AssignmentStatus.SWAPPING },
    });
    await prisma.shiftSwapRequest.create({
      data: {
        originalAssignmentId: sofiaFriPmAssignment.id,
        requestedById: sofia.id,
        status: SwapStatus.OPEN,
      },
    });
  }

  // Ana wants to swap her Thursday PM server shift — Isabella claimed it (pending manager approval)
  const anaThurPmAssignment = await prisma.shiftAssignment.findFirst({
    where: { shiftId: s(0, 3, 1).id, employeeId: ana.id },
  });
  if (anaThurPmAssignment) {
    await prisma.shiftAssignment.update({
      where: { id: anaThurPmAssignment.id },
      data: { status: AssignmentStatus.SWAPPING },
    });
    await prisma.shiftSwapRequest.create({
      data: {
        originalAssignmentId: anaThurPmAssignment.id,
        requestedById: ana.id,
        claimedById: isabella.id,
        status: SwapStatus.CLAIMED,
      },
    });
  }

  // ── Time-Off Requests ──────────────────────────────────────────────────
  const nextWed = addDays(monday, 9);
  const nextThu = addDays(monday, 10);
  const nextFriDate = addDays(monday, 11);

  // Sofia — family wedding next Wed-Thu (pending)
  await prisma.timeOffRequest.create({
    data: {
      employeeId: sofia.id,
      startDate: nextWed,
      endDate: nextThu,
      reason: "Family wedding in San Antonio",
      status: RequestStatus.PENDING,
    },
  });

  // Diego — dentist appointment next Friday (pending)
  await prisma.timeOffRequest.create({
    data: {
      employeeId: diego.id,
      startDate: nextFriDate,
      endDate: nextFriDate,
      reason: "Dentist appointment",
      status: RequestStatus.PENDING,
    },
  });

  // Carlos — took last Monday off (approved, in the past for history)
  const lastMonday = addDays(monday, -7);
  await prisma.timeOffRequest.create({
    data: {
      employeeId: carlos.id,
      startDate: lastMonday,
      endDate: lastMonday,
      reason: "Car maintenance",
      status: RequestStatus.APPROVED,
      reviewedById: manager.id,
    },
  });

  // ── Events ─────────────────────────────────────────────────────────────
  const thisFriday = addDays(monday, 4);
  const nextSaturday = addDays(monday, 12);
  const nextSunday = addDays(monday, 13);

  await prisma.event.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        name: "UT Football Game",
        date: thisFriday,
        description: "Home game vs. Oklahoma — expect heavy traffic after 5 PM. Staff up evening server shifts.",
        expectedImpact: ImpactLevel.HIGH,
      },
      {
        restaurantId: restaurant.id,
        name: "Pecan Street Festival",
        date: nextSaturday,
        description: "Downtown food & arts festival on 6th St. Expect +40% lunch traffic from foot traffic.",
        expectedImpact: ImpactLevel.HIGH,
      },
      {
        restaurantId: restaurant.id,
        name: "Mother's Day Brunch Rush",
        date: nextSunday,
        description: "Reservation book is full 10 AM–2 PM. Need all hands for brunch service.",
        expectedImpact: ImpactLevel.HIGH,
      },
      {
        restaurantId: restaurant.id,
        name: "Local Marathon",
        date: addDays(monday, 5),
        description: "Road closures on Main St until noon. Deliveries rerouted — prep early.",
        expectedImpact: ImpactLevel.MEDIUM,
      },
    ],
  });

  // ── Notifications ──────────────────────────────────────────────────────

  // Manager notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: manager.id,
        message: "Ana requested to swap her Thursday PM server shift. Isabella has claimed it — approve or deny.",
        type: "swap_claimed",
        read: false,
      },
      {
        userId: manager.id,
        message: "Sofia posted her Friday PM server shift for swap. No one has claimed it yet.",
        type: "swap_posted",
        read: false,
      },
      {
        userId: manager.id,
        message: "Sofia requested time off Wed–Thu next week for a family wedding.",
        type: "swap_posted",
        read: false,
      },
      {
        userId: manager.id,
        message: "Diego requested Friday off next week for a dentist appointment.",
        type: "swap_posted",
        read: true,
      },
    ],
  });

  // Employee notifications
  await prisma.notification.createMany({
    data: [
      // Carlos
      {
        userId: carlos.id,
        message: "This week's schedule has been published. You have 6 shifts Mon–Sat.",
        type: "swap_approved",
        read: true,
      },
      {
        userId: carlos.id,
        message: "Sofia dropped her Friday PM server shift. Interested? Check open shifts.",
        type: "swap_posted",
        read: false,
      },
      // Sofia
      {
        userId: sofia.id,
        message: "Your swap request for Friday PM server has been posted. We'll notify you when someone claims it.",
        type: "swap_posted",
        read: true,
      },
      // Ana
      {
        userId: ana.id,
        message: "Isabella claimed your Thursday PM server shift. Waiting for manager approval.",
        type: "swap_claimed",
        read: false,
      },
      // Isabella
      {
        userId: isabella.id,
        message: "You claimed Ana's Thursday PM server shift. Waiting for manager approval.",
        type: "swap_claimed",
        read: false,
      },
      // Diego
      {
        userId: diego.id,
        message: "This week's schedule has been published. You're on cook shifts Mon–Sat.",
        type: "swap_approved",
        read: true,
      },
      // Luis
      {
        userId: luis.id,
        message: "This week's schedule has been published. Check your shifts.",
        type: "swap_approved",
        read: true,
      },
      {
        userId: luis.id,
        message: "Sofia dropped her Friday PM server shift. Interested? Check open shifts.",
        type: "swap_posted",
        read: false,
      },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("");
  console.log("  Accounts (all use password: password123):");
  console.log(`    Manager:  ${manager.email}`);
  employees.forEach((e) => console.log(`    Employee: ${e.email}`));
  console.log("");
  console.log(`  Restaurant: ${restaurant.name}`);
  console.log("  This week:  Published schedule, fully staffed");
  console.log("  Next week:  Draft schedule, partially assigned");
  console.log("  Swaps:      1 open (Sofia), 1 pending approval (Ana→Isabella)");
  console.log("  Time-off:   2 pending requests (Sofia, Diego)");
  console.log("  Events:     4 upcoming");
  console.log("  Notifications: Unread items for manager + employees");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
