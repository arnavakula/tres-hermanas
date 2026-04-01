import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow API auth routes, static assets
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Public pages: login and register
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      // Already logged in — redirect to role-appropriate page
      const dest =
        token.role === "MANAGER" ? "/dashboard" : "/employee/schedule";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Root path — redirect by role
  if (pathname === "/") {
    const dest =
      token.role === "MANAGER" ? "/dashboard" : "/employee/schedule";
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // Manager-only routes
  if (pathname.startsWith("/dashboard") && token.role !== "MANAGER") {
    return NextResponse.redirect(new URL("/employee/schedule", req.url));
  }

  // Employee-only routes
  if (pathname.startsWith("/employee") && token.role !== "EMPLOYEE") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
