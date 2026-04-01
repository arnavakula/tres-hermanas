"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const managerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/schedule", label: "Schedule" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/time-off", label: "Time Off" },
  { href: "/dashboard/swaps", label: "Swaps" },
];

const employeeLinks = [
  { href: "/employee/schedule", label: "My Schedule" },
  { href: "/employee/availability", label: "Availability" },
  { href: "/employee/open-shifts", label: "Open Shifts" },
  { href: "/employee/time-off", label: "Time Off" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (
    status === "loading" ||
    !session ||
    pathname === "/login" ||
    pathname === "/register"
  ) {
    return null;
  }

  const links =
    session.user.role === "MANAGER" ? managerLinks : employeeLinks;

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold">
            Tres Hermanas
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-accent font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </nav>
  );
}
