"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Send,
  Lock,
  Loader2,
} from "lucide-react";
import { formatWeekLabel } from "@/lib/schedule-utils";

interface ScheduleHeaderProps {
  weekStart: Date;
  onNavigate: (delta: -1 | 1) => void;
  onJumpToDate: (date: Date) => void;
  roleFilter: string | null;
  onRoleFilterChange: (role: string | null) => void;
  onGenerate: () => void;
  onPublish: () => void;
  isPublished: boolean;
  isGenerating: boolean;
  isPublishing: boolean;
  hasShifts: boolean;
}

const ROLES = ["server", "cook", "host", "busser"];

export function ScheduleHeader({
  weekStart,
  onNavigate,
  onJumpToDate,
  roleFilter,
  onRoleFilterChange,
  onGenerate,
  onPublish,
  isPublished,
  isGenerating,
  isPublishing,
  hasShifts,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: Week navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="min-w-[200px] text-center text-lg font-semibold">
          {formatWeekLabel(weekStart)}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <CalendarDays className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={weekStart}
              onSelect={(date) => date && onJumpToDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: Filters and actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={roleFilter || "all"}
          onValueChange={(val) =>
            onRoleFilterChange(val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={onGenerate}
          disabled={isGenerating || isPublished}
          variant="outline"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate
        </Button>

        <Button
          onClick={onPublish}
          disabled={isPublishing || isPublished || !hasShifts}
        >
          {isPublishing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : isPublished ? (
            <Lock className="mr-2 h-4 w-4" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {isPublished ? "Published" : "Publish"}
        </Button>
      </div>
    </div>
  );
}
