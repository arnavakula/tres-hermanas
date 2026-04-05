import { prisma } from "@/lib/db";

export async function createNotification(
  userId: string,
  message: string,
  type: string
) {
  return prisma.notification.create({
    data: { userId, message, type },
  });
}

export async function createNotifications(
  userIds: string[],
  message: string,
  type: string
) {
  if (userIds.length === 0) return;
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, message, type })),
  });
}
