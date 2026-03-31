# Step 7: Mobile Polish & PWA Setup

## Prompt

Polish the mobile experience and set up PWA for the Tres Hermanas scheduling app.

**Mobile Optimization:**
- Audit all /employee/* pages for mobile responsiveness
- Bottom navigation bar for employees (Schedule, Availability, Open Shifts, Notifications) instead of top nav on small screens
- Touch-friendly tap targets (min 44px)
- Swipeable week navigation on schedule views
- Compact card layouts for shift display on mobile

**PWA Setup:**
- Add next-pwa or manually create:
  - public/manifest.json with app name "Tres Hermanas", theme color, icons
  - Service worker for basic offline caching of the app shell
- Add appropriate meta tags in layout.tsx for mobile web app capability
- App icons in multiple sizes (use a simple placeholder icon — a circle with "TH")

**Final UI polish:**
- Loading skeletons for all data-fetching pages using shadcn Skeleton
- Empty states for lists (no shifts, no requests, etc.) with helpful messages
- Toast notifications using shadcn/ui Toaster for actions (saved, approved, error)
- Consistent color scheme: warm earthy tones fitting a restaurant brand (primary: warm terracotta/rust, secondary: sage green, neutral: warm grays)

## Testing

After implementation, run through the full end-to-end flow:

**Mobile testing (use Chrome DevTools → Toggle Device Toolbar → iPhone 14 or similar):**

1. Navigate to /login on mobile viewport. Confirm the form is usable — inputs are full width, button is tappable.
2. Log in as an employee. Confirm the bottom navigation bar appears (not top nav).
3. Tap each bottom nav item (Schedule, Availability, Open Shifts, Notifications). Confirm navigation works and pages render correctly.
4. On /employee/availability, toggle time blocks. Confirm tap targets are large enough and the grid doesn't overflow.
5. On /employee/schedule, swipe left/right to navigate weeks (if implemented) or use arrow buttons.
6. On /employee/time-off, submit a request. Confirm toast notification appears.

**PWA testing:**

7. Open Chrome on desktop, navigate to the app. Check the address bar for the install icon (or go to chrome://apps). Confirm the manifest loads.
8. On Chrome DevTools → Application tab, verify: Manifest is detected, Service Worker is registered.
9. (Optional) On a real phone, open the app in mobile Safari/Chrome and use "Add to Home Screen". Confirm it opens like a native app.

**UI polish testing:**

10. Navigate to a page with data loading. Confirm skeleton placeholders appear briefly before content.
11. Navigate to a page with no data (e.g., an employee with no shifts). Confirm a friendly empty state message appears.
12. Perform an action (approve a request, save availability). Confirm a toast notification appears.
13. Check the overall color scheme — confirm warm terracotta/rust primary, sage green accents, warm grays throughout.

**Full end-to-end flow:**

14. Manager creates a new employee at /dashboard/employees.
15. New employee logs in and sets their availability at /employee/availability.
16. Employee submits a time-off request at /employee/time-off.
17. Manager approves the time-off request at /dashboard/time-off.
18. Manager generates a schedule at /dashboard/schedule. Confirms the employee is assigned to shifts outside their time off.
19. Employee drops a shift at /employee/schedule.
20. Another employee claims the open shift at /employee/open-shifts.
21. Manager approves the swap at /dashboard/swaps.
22. Manager views the dashboard at /dashboard. Confirms all cards show accurate, up-to-date information.
23. Run `npm run build` to confirm the final build succeeds with no errors.
