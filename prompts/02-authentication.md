# Step 2: Authentication & Role-Based Access

## Prompt

Set up NextAuth.js with credentials-based authentication in this Next.js app. Use the existing Prisma User model.

Implement:
1. A login page at /login with email + password form
2. A registration page at /register with name, email, phone, password, and role selection
3. NextAuth config in src/lib/auth.ts using CredentialsProvider with bcrypt password verification
4. Session includes user id, role, and restaurantId
5. Middleware in middleware.ts that:
   - Redirects unauthenticated users to /login
   - Redirects managers to /dashboard after login
   - Redirects employees to /my-schedule after login
   - Protects /dashboard/* routes (manager only)
   - Protects /employee/* routes (employee only)
6. A shared layout with a nav bar that shows different links based on role

Use shadcn/ui components (Card, Input, Button, Label) for the forms. Keep it clean and minimal.

## Testing

After implementation, verify auth works end-to-end:

1. Run `npm run dev` and navigate to http://localhost:3000. Confirm you are redirected to /login.
2. Click the link to /register. Fill in details with role "MANAGER" and submit. Confirm redirect to /dashboard.
3. Log out (or open an incognito window). Register a second user with role "EMPLOYEE". Confirm redirect to /my-schedule (or /employee/schedule).
4. Try navigating to /dashboard as the employee — confirm you are blocked or redirected.
5. Try navigating to /employee/availability as the manager — confirm you are blocked or redirected.
6. Log out, then log back in with the manager credentials. Confirm redirect to /dashboard.
7. Log out, then log back in with the employee credentials. Confirm redirect to /employee/schedule.
8. Open Prisma Studio (`npx prisma studio`) and verify both users exist in the User table with hashed passwords.
9. Run `npm run build` to confirm no build errors.
