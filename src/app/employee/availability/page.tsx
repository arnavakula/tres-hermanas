"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Save, Loader2, Check } from "lucide-react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const TIME_BLOCKS = [
  { label: "Morning", shortLabel: "AM", startTime: "06:00", endTime: "12:00" },
  {
    label: "Afternoon",
    shortLabel: "PM",
    startTime: "12:00",
    endTime: "17:00",
  },
  {
    label: "Evening",
    shortLabel: "Eve",
    startTime: "17:00",
    endTime: "23:00",
  },
] as const;

type GridState = Record<string, Record<string, boolean>>;

function createEmptyGrid(): GridState {
  const grid: GridState = {};
  for (const day of DAYS) {
    grid[day] = {};
    for (const block of TIME_BLOCKS) {
      grid[day][`${block.startTime}-${block.endTime}`] = false;
    }
  }
  return grid;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
}

export default function AvailabilityPage() {
  const [grid, setGrid] = useState<GridState>(createEmptyGrid);
  const [savedGrid, setSavedGrid] = useState<GridState>(createEmptyGrid);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const hasChanges = JSON.stringify(grid) !== JSON.stringify(savedGrid);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/availability");
      const data = await res.json();

      const newGrid = createEmptyGrid();
      for (const record of data.availability) {
        for (const block of TIME_BLOCKS) {
          if (
            overlaps(
              record.startTime,
              record.endTime,
              block.startTime,
              block.endTime
            )
          ) {
            newGrid[record.dayOfWeek][
              `${block.startTime}-${block.endTime}`
            ] = true;
          }
        }
      }

      setGrid(newGrid);
      setSavedGrid(newGrid);
    } catch {
      console.error("Failed to fetch availability");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  function toggleCell(day: string, blockKey: string) {
    setGrid((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [blockKey]: !prev[day][blockKey],
      },
    }));
  }

  async function handleSave() {
    setIsSaving(true);

    const slots: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }> = [];

    for (const day of DAYS) {
      for (const block of TIME_BLOCKS) {
        const key = `${block.startTime}-${block.endTime}`;
        if (grid[day][key]) {
          slots.push({
            dayOfWeek: day,
            startTime: block.startTime,
            endTime: block.endTime,
          });
        }
      }
    }

    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });

      if (res.ok) {
        setSavedGrid({ ...grid });
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
      }
    } catch {
      console.error("Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-8">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading availability...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Availability</h1>
        <p className="mt-1 text-muted-foreground">
          Tap to toggle when you&apos;re available to work
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weekly Schedule</CardTitle>
          <CardDescription>
            Green = available, Gray = unavailable
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Header row */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            <div />
            {TIME_BLOCKS.map((block) => (
              <div
                key={block.startTime}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                <span className="hidden sm:inline">{block.label}</span>
                <span className="sm:hidden">{block.shortLabel}</span>
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className="grid grid-cols-4 gap-2">
                <div className="flex items-center text-sm font-medium">
                  {DAY_LABELS[day]}
                </div>
                {TIME_BLOCKS.map((block) => {
                  const key = `${block.startTime}-${block.endTime}`;
                  const isOn = grid[day][key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleCell(day, key)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-md border-2 text-sm font-medium transition-colors",
                        isOn
                          ? "border-green-300 bg-green-100 text-green-700"
                          : "border-gray-200 bg-gray-50 text-gray-400 hover:bg-gray-100"
                      )}
                    >
                      {isOn && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Save button */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Availability
            </Button>
            {showSaved && (
              <span className="text-sm text-green-600">Saved!</span>
            )}
            {hasChanges && !showSaved && (
              <span className="text-sm text-muted-foreground">
                Unsaved changes
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
