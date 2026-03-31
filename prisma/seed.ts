import { PrismaClient, Role, DayOfWeek, ImpactLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.shiftSwapRequest.deleteMany();
  await prisma.shiftAssignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.timeOffRequest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create manager
  const manager = await prisma.user.create({
    data: {
      email: "maria@treshermanas.com",
      passwordHash,
      name: "Maria Garcia",
      phone: "512-555-0100",
      role: Role.MANAGER,
    },
  });

  // Create employees
  const employeeData = [
    { name: "Carlos Rivera", email: "carlos@treshermanas.com", phone: "512-555-0101" },
    { name: "Sofia Martinez", email: "sofia@treshermanas.com", phone: "512-555-0102" },
    { name: "Diego Lopez", email: "diego@treshermanas.com", phone: "512-555-0103" },
    { name: "Ana Hernandez", email: "ana@treshermanas.com", phone: "512-555-0104" },
    { name: "Luis Morales", email: "luis@treshermanas.com", phone: "512-555-0105" },
    { name: "Isabella Torres", email: "isabella@treshermanas.com", phone: "512-555-0106" },
  ];

  const employees = await Promise.all(
    employeeData.map((emp) =>
      prisma.user.create({
        data: {
          ...emp,
          passwordHash,
          role: Role.EMPLOYEE,
        },
      })
    )
  );

  // Create restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Tres Hermanas",
      address: "123 Main St, Austin, TX 78701",
      timezone: "America/Chicago",
      managerId: manager.id,
    },
  });

  // Create employee availability (typical restaurant availability)
  const availabilitySlots = [
    // Carlos - available most days, morning/afternoon
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.MONDAY, startTime: "09:00", endTime: "17:00" },
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "09:00", endTime: "17:00" },
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "17:00" },
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: "09:00", endTime: "17:00" },
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: "09:00", endTime: "22:00" },
    { employeeId: employees[0].id, dayOfWeek: DayOfWeek.SATURDAY, startTime: "10:00", endTime: "22:00" },

    // Sofia - evening/weekend person
    { employeeId: employees[1].id, dayOfWeek: DayOfWeek.MONDAY, startTime: "16:00", endTime: "22:00" },
    { employeeId: employees[1].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "16:00", endTime: "22:00" },
    { employeeId: employees[1].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: "16:00", endTime: "23:00" },
    { employeeId: employees[1].id, dayOfWeek: DayOfWeek.SATURDAY, startTime: "10:00", endTime: "23:00" },
    { employeeId: employees[1].id, dayOfWeek: DayOfWeek.SUNDAY, startTime: "10:00", endTime: "20:00" },

    // Diego - full-time cook, most days
    { employeeId: employees[2].id, dayOfWeek: DayOfWeek.MONDAY, startTime: "08:00", endTime: "16:00" },
    { employeeId: employees[2].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "08:00", endTime: "16:00" },
    { employeeId: employees[2].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "08:00", endTime: "16:00" },
    { employeeId: employees[2].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: "08:00", endTime: "16:00" },
    { employeeId: employees[2].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: "08:00", endTime: "16:00" },

    // Ana - afternoons and weekends
    { employeeId: employees[3].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "11:00", endTime: "20:00" },
    { employeeId: employees[3].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: "11:00", endTime: "20:00" },
    { employeeId: employees[3].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: "11:00", endTime: "23:00" },
    { employeeId: employees[3].id, dayOfWeek: DayOfWeek.SATURDAY, startTime: "11:00", endTime: "23:00" },
    { employeeId: employees[3].id, dayOfWeek: DayOfWeek.SUNDAY, startTime: "11:00", endTime: "20:00" },

    // Luis - morning shifts
    { employeeId: employees[4].id, dayOfWeek: DayOfWeek.MONDAY, startTime: "07:00", endTime: "15:00" },
    { employeeId: employees[4].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "07:00", endTime: "15:00" },
    { employeeId: employees[4].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "07:00", endTime: "15:00" },
    { employeeId: employees[4].id, dayOfWeek: DayOfWeek.THURSDAY, startTime: "07:00", endTime: "15:00" },
    { employeeId: employees[4].id, dayOfWeek: DayOfWeek.SATURDAY, startTime: "08:00", endTime: "16:00" },

    // Isabella - flexible, most days
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.MONDAY, startTime: "10:00", endTime: "18:00" },
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.TUESDAY, startTime: "10:00", endTime: "18:00" },
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "16:00", endTime: "22:00" },
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.FRIDAY, startTime: "10:00", endTime: "22:00" },
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.SATURDAY, startTime: "10:00", endTime: "22:00" },
    { employeeId: employees[5].id, dayOfWeek: DayOfWeek.SUNDAY, startTime: "10:00", endTime: "18:00" },
  ];

  await prisma.availability.createMany({
    data: availabilitySlots.map((slot) => ({
      ...slot,
      isRecurring: true,
    })),
  });

  // Create shifts for 2 weeks
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1); // Get this Monday

  const shiftTemplates = [
    { startTime: "09:00", endTime: "15:00", role: "server", requiredCount: 2 },
    { startTime: "15:00", endTime: "22:00", role: "server", requiredCount: 2 },
    { startTime: "09:00", endTime: "15:00", role: "cook", requiredCount: 1 },
    { startTime: "15:00", endTime: "22:00", role: "cook", requiredCount: 1 },
    { startTime: "11:00", endTime: "15:00", role: "host", requiredCount: 1 },
    { startTime: "17:00", endTime: "22:00", role: "host", requiredCount: 1 },
  ];

  for (let week = 0; week < 2; week++) {
    for (let day = 0; day < 7; day++) {
      const shiftDate = new Date(monday);
      shiftDate.setDate(monday.getDate() + week * 7 + day);

      for (const template of shiftTemplates) {
        // Weekends need more staff
        const isWeekend = day === 5 || day === 6;
        const requiredCount = isWeekend
          ? template.requiredCount + 1
          : template.requiredCount;

        await prisma.shift.create({
          data: {
            restaurantId: restaurant.id,
            date: shiftDate,
            startTime: template.startTime,
            endTime: template.endTime,
            role: template.role,
            requiredCount,
          },
        });
      }
    }
  }

  // Create some events
  const nextFriday = new Date(monday);
  nextFriday.setDate(monday.getDate() + 4);

  const nextSaturday = new Date(monday);
  nextSaturday.setDate(monday.getDate() + 12);

  await prisma.event.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        name: "UT Football Game",
        date: nextFriday,
        description: "Home game - expect heavy traffic after 5pm",
        expectedImpact: ImpactLevel.HIGH,
      },
      {
        restaurantId: restaurant.id,
        name: "Local Food Festival",
        date: nextSaturday,
        description: "Downtown food festival may drive extra lunch traffic",
        expectedImpact: ImpactLevel.MEDIUM,
      },
    ],
  });

  // Create a time-off request
  const nextWeekWed = new Date(monday);
  nextWeekWed.setDate(monday.getDate() + 9);
  const nextWeekThu = new Date(monday);
  nextWeekThu.setDate(monday.getDate() + 10);

  await prisma.timeOffRequest.create({
    data: {
      employeeId: employees[1].id, // Sofia
      startDate: nextWeekWed,
      endDate: nextWeekThu,
      reason: "Family wedding",
      status: "PENDING",
    },
  });

  console.log("Seed data created successfully!");
  console.log(`  Manager: ${manager.email} (password: password123)`);
  console.log(`  Employees: ${employees.map((e) => e.email).join(", ")}`);
  console.log(`  Restaurant: ${restaurant.name}`);
  console.log(`  Shifts: 2 weeks of daily shifts`);
  console.log(`  Events: 2 upcoming events`);
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
