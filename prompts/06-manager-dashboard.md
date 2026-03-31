# Step 6: Manager Dashboard

## Prompt

Build the Manager Dashboard at /dashboard (the main landing page after manager login).

This is a single-page overview of daily operations using a card-based layout.

**Cards to display:**

1. "Today's Schedule" card
   - List of today's shifts with assigned employees
   - Color-coded by role (server=blue, cook=red, host=green, etc.)
   - Show coverage status (3/4 assigned = yellow warning)

2. "This Week at a Glance" card
   - Mini week view showing staffing levels per day
   - Simple bar or number for each day (e.g., "Mon: 8 staff, Tue: 6 staff")
   - Link to full schedule builder

3. "Open Shifts" card
   - Count and list of shifts needing coverage
   - Quick action: click to view in swap marketplace

4. "Pending Requests" card
   - Pending time-off requests (count + list)
   - Pending swap approvals (count + list)
   - One-click approve/deny directly from dashboard

5. "Upcoming Events" card
   - Events in the next 2 weeks
   - Quick-add event form (name, date, expected impact)
   - Events display with impact badge (LOW=green, MEDIUM=yellow, HIGH=red)

**Stats bar at top:**
- Total employees
- Shifts this week
- Open shifts count
- Pending requests count

Use shadcn/ui Card, Badge, Button components. Make it feel like a clean operational command center. Desktop-optimized but should work on tablet.

## Testing

After implementation, verify the dashboard:

1. Run `npm run dev`. Log in as the manager. Confirm you land on /dashboard.
2. Verify the stats bar at the top shows accurate counts (total employees, shifts this week, open shifts, pending requests). Cross-check against Prisma Studio data.
3. Check "Today's Schedule" card — confirm it shows today's shifts with correct employee assignments and role color-coding.
4. Check coverage indicators — if a shift has fewer assigned than required, confirm a yellow warning appears.
5. Check "This Week at a Glance" — confirm staffing numbers per day. Click the link to schedule builder and confirm navigation.
6. Check "Open Shifts" card — confirm it shows shifts with OPEN/SWAPPING status. Click one to navigate to /dashboard/swaps.
7. Check "Pending Requests" card — confirm pending time-off and swap requests appear. Test one-click approve/deny directly from the dashboard and verify the item disappears or updates.
8. Check "Upcoming Events" card — confirm any seeded events appear. Use the quick-add form to create a new event. Confirm it appears with the correct impact badge.
9. Resize the browser to tablet width — confirm the dashboard is still usable with cards stacking vertically.
10. Run `npm run build` to confirm no build errors.
