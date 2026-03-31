# Step 1: Project Scaffolding & Database Schema

## Prompt

Initialize a Next.js 14 project with App Router, TypeScript, and Tailwind CSS in the current directory. Set up Prisma with PostgreSQL.

Create the full database schema in prisma/schema.prisma for a restaurant scheduling app with these models:

- User (id, email, password hash, name, phone, role enum: MANAGER/EMPLOYEE, createdAt, updatedAt)
- Restaurant (id, name, address, timezone, managerId -> User)
- Availability (id, employeeId -> User, dayOfWeek enum, startTime, endTime, isRecurring boolean, effectiveDate, expirationDate)
- TimeOffRequest (id, employeeId -> User, startDate, endDate, reason, status enum: PENDING/APPROVED/DENIED, reviewedBy -> User nullable, createdAt)
- Shift (id, restaurantId -> Restaurant, date, startTime, endTime, role string e.g. "server"/"cook", requiredCount int)
- ShiftAssignment (id, shiftId -> Shift, employeeId -> User, status enum: ASSIGNED/SWAPPING/OPEN, createdAt)
- ShiftSwapRequest (id, originalAssignmentId -> ShiftAssignment, requestedById -> User, claimedById -> User nullable, status enum: OPEN/CLAIMED/APPROVED/DENIED, createdAt)
- Event (id, restaurantId -> Restaurant, name, date, description, expectedImpact enum: LOW/MEDIUM/HIGH)

Add proper indexes and relations. Include a seed script in prisma/seed.ts with realistic sample data for a small restaurant (1 manager, 6 employees, 2 weeks of shifts).

Also set up the project structure:
- src/app/ (pages)
- src/components/ (reusable UI)
- src/lib/ (utilities, db client, auth config)

Install dependencies: prisma, @prisma/client, next-auth, bcryptjs, and shadcn/ui. Initialize shadcn/ui with the "new-york" style and neutral base color.

## Testing

After implementation, verify the setup:

1. Run `npx prisma validate` to check the schema is valid.
2. Start a local PostgreSQL instance (or use a Docker container: `docker run --name tres-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tres_hermanas -p 5432:5432 -d postgres:16`).
3. Create a `.env` file with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tres_hermanas"`.
4. Run `npx prisma migrate dev --name init` to apply the schema.
5. Run `npx prisma db seed` to populate sample data.
6. Run `npx prisma studio` and verify all tables exist with seed data.
7. Run `npm run dev` and confirm the app loads at http://localhost:3000 without errors.
8. Run `npm run build` to confirm there are no TypeScript or build errors.
