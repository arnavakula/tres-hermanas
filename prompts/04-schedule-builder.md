# Step 4: Weekly Schedule Builder

## Prompt

Build the Weekly Schedule Builder at /dashboard/schedule.

This is the main scheduling interface for the manager.

**Layout:**
- Week view grid: columns = days (Mon-Sun), rows = shift time slots
- Each cell shows assigned employees as colored badges/cards
- Week navigation (prev/next week, jump to date)
- Filter by role (server, cook, host, etc.)

**Auto-Generate Schedule:**
- "Generate Schedule" button that creates a weekly schedule by:
  1. Looking at each Shift defined for the restaurant
  2. Checking employee availability for that day/time
  3. Assigning available employees to shifts, distributing hours fairly
  4. Respecting time-off requests (exclude approved time-off)
- Algorithm should be in a server action or API route at /api/schedule/generate

**Manual Editing:**
- Drag-and-drop: move employee badges between shift cells using @dnd-kit/core and @dnd-kit/sortable
- Click an empty slot to assign an employee from a dropdown of available people
- Click an assigned employee to unassign or swap
- "Publish Schedule" button that finalizes the week (marks it as published)

**Visual Indicators:**
- Red highlight on understaffed shifts (assigned < required)
- Yellow highlight on shifts with pending swap requests
- Gray out past days

**API routes needed:**
- GET /api/schedule?week=YYYY-MM-DD — fetch week's shifts and assignments
- PUT /api/schedule/assignments — update assignments (drag-drop)
- POST /api/schedule/generate — auto-generate assignments
- POST /api/schedule/publish — publish the week

Use shadcn/ui components. The schedule grid should be responsive but optimized for desktop/tablet (managers use larger screens).

## Testing

After implementation, verify the schedule builder works:

1. Run `npm run dev`. Log in as the manager.
2. Navigate to /dashboard/schedule. Confirm the week grid renders with the current week.
3. Use the prev/next week navigation — confirm the dates update correctly.
4. Click "Generate Schedule". Confirm employees are auto-assigned to shifts based on their availability.
5. Verify that employees with approved time-off are NOT assigned to shifts during their time off.
6. Drag an employee badge from one shift cell to another. Confirm the assignment updates after drop.
7. Click an empty slot and assign an employee from the dropdown. Confirm the badge appears.
8. Click an assigned employee and unassign them. Confirm the badge is removed.
9. Check understaffed shifts — confirm they have a red highlight when assigned count < required.
10. Click "Publish Schedule". Confirm the week is marked as published (visual change or confirmation).
11. Log in as an employee in another window. Navigate to /employee/schedule and confirm the published schedule is visible.
12. Test role filtering — select "server" only and confirm only server shifts are shown.
13. Run `npm run build` to confirm no build errors.
