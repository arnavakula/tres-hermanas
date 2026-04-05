import { startOfWeek, addDays, format } from "date-fns";
import { DayOfWeek } from "@prisma/client";

/**
 * Returns Monday 00:00:00 for the week containing the given date.
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Returns an array of 7 Date objects (Mon through Sun) for a given week start.
 */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/**
 * Formats a week range label, e.g. "Mar 30 - Apr 5, 2026"
 */
export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startStr = format(weekStart, "MMM d");
  const endStr = format(weekEnd, "MMM d, yyyy");
  return `${startStr} – ${endStr}`;
}

const DAY_MAP: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/**
 * Maps a JS Date to the Prisma DayOfWeek enum.
 */
export function dayOfWeekFromDate(date: Date): DayOfWeek {
  return DAY_MAP[date.getDay()];
}

/**
 * Checks if two HH:mm time ranges overlap.
 */
export function timeRangeOverlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Checks if a date falls within a range (inclusive on both ends).
 * Compares date portions only (ignores time).
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = stripTime(date);
  const s = stripTime(start);
  const e = stripTime(end);
  return d >= s && d <= e;
}

function stripTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Computes the Sunday end-of-week from a Monday start.
 */
export function getWeekEnd(weekStart: Date): Date {
  return addDays(weekStart, 6);
}

/**
 * Calculates shift duration in hours from HH:mm strings.
 */
export function shiftDurationHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  return (eh * 60 + em - (sh * 60 + sm)) / 60;
}
