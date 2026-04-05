"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { ScheduleShift } from "@/types/schedule";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface AssignDialogProps {
  shift: ScheduleShift | null;
  open: boolean;
  onClose: () => void;
  onAssign: (shiftId: string, employeeId: string) => void;
}

export function AssignDialog({
  shift,
  open,
  onClose,
  onAssign,
}: AssignDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !shift) return;

    setIsLoading(true);
    setSearch("");

    fetch(`/api/schedule/available-employees?shiftId=${shift.id}`)
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []))
      .catch(() => setEmployees([]))
      .finally(() => setIsLoading(false));
  }, [open, shift]);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign Employee
            {shift && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {shift.role} · {shift.startTime}–{shift.endTime}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {employees.length === 0
                ? "No available employees for this shift"
                : "No matches found"}
            </div>
          ) : (
            filtered.map((emp) => (
              <Button
                key={emp.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  if (shift) {
                    onAssign(shift.id, emp.id);
                    onClose();
                  }
                }}
              >
                <div className="text-left">
                  <div className="font-medium">{emp.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {emp.email}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
