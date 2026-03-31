# Step 5: Shift Swap Marketplace

## Prompt

Build the Shift Swap Marketplace.

**Employee side — My Schedule (at /employee/schedule):**
- Show the employee's assigned shifts for the current and next week
- Each shift card has a "Drop Shift" or "Request Swap" button
- "Drop Shift" changes the ShiftAssignment status to SWAPPING and creates a ShiftSwapRequest with status OPEN

**Employee side — Open Shifts (at /employee/open-shifts):**
- List all shifts with status OPEN or SWAPPING that the employee is NOT currently assigned to
- Each shows: date, time, role, who dropped it
- "Claim Shift" button creates a claim (sets claimedById on ShiftSwapRequest, status -> CLAIMED)
- Only show shifts the employee is available for (check their availability)

**Manager side — Swap Approvals (at /dashboard/swaps):**
- List all ShiftSwapRequests with status CLAIMED (waiting for approval)
- Show: original employee, shift details, claiming employee
- One-click Approve/Deny buttons
- Approve: update ShiftAssignment to new employee, swap status -> APPROVED
- Deny: revert swap status -> OPEN, clear claimedById

**Notifications (in-app):**
- Add a simple Notification model to the Prisma schema (id, userId -> User, message, type, read boolean, createdAt) and run a migration
- When a shift is posted as open: notify available employees (store notification in DB)
- When a swap is approved/denied: notify both employees
- Show notification bell icon in nav bar with unread count
- Notification dropdown showing recent notifications

Build all API routes. Mobile-responsive for employee pages.

## Testing

After implementation, verify the full shift swap flow:

1. Run `npm run dev`. Ensure there is a published schedule with shift assignments (from Step 4).
2. Log in as Employee A. Navigate to /employee/schedule. Confirm assigned shifts are listed.
3. Click "Drop Shift" on one of Employee A's shifts. Confirm the shift card updates to show it's being swapped.
4. Log in as Employee B (in incognito or another browser). Navigate to /employee/open-shifts. Confirm Employee A's dropped shift appears in the list.
5. Click "Claim Shift" on that shift as Employee B. Confirm the claim is recorded.
6. Log in as the manager. Navigate to /dashboard/swaps. Confirm the swap request appears showing Employee A -> Employee B.
7. Click "Approve". Confirm the swap status updates.
8. Check Employee B's schedule — confirm the shift now appears in their assignments.
9. Check Employee A's schedule — confirm the shift is removed from their assignments.
10. Test the deny flow: have an employee drop another shift, have someone claim it, then deny as manager. Confirm the shift goes back to "Open" status.
11. Check the notification bell for each user — confirm relevant notifications appeared (shift posted, swap approved/denied).
12. Test on a narrow viewport to verify mobile responsiveness of employee pages.
13. Run `npm run build` to confirm no build errors.
