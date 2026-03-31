# Step 3: Employee Management & Availability Portal

## Prompt

Build the Employee Availability Portal for the scheduling app.

**Manager side — Employee Management (at /dashboard/employees):**
- List all employees with name, phone, role
- Add new employee form (creates account with temporary password)
- Edit/deactivate employees

**Employee side — Availability (at /employee/availability):**
- Weekly grid showing Mon-Sun with time slots
- Employee taps to toggle available/unavailable for each time block (morning/afternoon/evening or custom time ranges)
- Save button persists to the Availability model
- Show current availability state on load
- Visual: green = available, gray = unavailable

**Employee side — Time Off Requests (at /employee/time-off):**
- Form to request time off: start date, end date, reason (optional)
- List of past/pending requests with status badges (pending=yellow, approved=green, denied=red)

**Manager side — Time Off Review (at /dashboard/time-off):**
- List all pending time-off requests
- One-click approve/deny buttons
- Show who's requesting and for when

Build API routes for all CRUD operations under src/app/api/. Use shadcn/ui components throughout. Make the employee pages mobile-responsive (they'll use phones).

## Testing

After implementation, verify the full availability flow:

1. Run `npm run dev`. Log in as the manager.
2. Navigate to /dashboard/employees. Confirm seed employees are listed (or add a new employee via the form).
3. Add a new employee — verify the employee appears in the list and in Prisma Studio.
4. Open an incognito window. Log in as an employee.
5. Navigate to /employee/availability. Toggle some time blocks on/off. Click Save. Refresh the page and confirm the saved state persists.
6. Navigate to /employee/time-off. Submit a time-off request for a date range. Confirm it appears in the pending list.
7. Switch to the manager window. Navigate to /dashboard/time-off. Confirm the pending request appears.
8. Click "Approve" on the request. Switch back to the employee window, refresh /employee/time-off, and confirm the status changed to "Approved".
9. Submit another time-off request from the employee. Have the manager deny it. Confirm the status updates to "Denied".
10. Test the employee pages on a narrow browser window (or Chrome DevTools mobile view) to verify responsive layout.
11. Run `npm run build` to confirm no build errors.
