# Tres Hermanas — Demo Setup

## Prerequisites

You need two things installed. If you don't have them, ask Arnav for help.

- **Node.js** (version 18 or newer) — [download here](https://nodejs.org)
- **Git** — [download here](https://git-scm.com)

## Getting Started

1. Open **Terminal** (Mac) or **Command Prompt** (Windows)
2. Run these commands one at a time:

```bash
git clone https://github.com/arnavakula/tres-hermanas.git
cd tres-hermanas
npm install
npm run demo
```

3. Wait until you see **"Demo ready!"** then open your browser to **http://localhost:3000**

## Login Accounts

All accounts use the password **`password123`**

| Role     | Email                        | What you'll see                                      |
| -------- | ---------------------------- | ---------------------------------------------------- |
| Manager  | maria@treshermanas.com       | Dashboard, weekly schedule, swap approvals, time-off  |
| Employee | carlos@treshermanas.com      | My shifts, open shifts to pick up, availability       |
| Employee | sofia@treshermanas.com       | Has an active swap request posted                     |
| Employee | ana@treshermanas.com         | Has a swap pending manager approval                   |

## Things to Try

- **As Maria (manager):** Check the dashboard for pending requests. Open the schedule page to see the full week. Approve or deny Ana's swap request.
- **As Carlos (employee):** View your shifts for the week. Check open shifts — Sofia dropped one you might be able to pick up.
- **As Sofia (employee):** See your posted swap request. Check your time-off request status.

## Stopping and Restarting

- **To stop:** Press `Ctrl + C` in the terminal
- **To restart:** Run `npm run demo` again — any changes you made will still be there
- **To reset everything:** Delete the file `prisma/demo.db` and run `npm run demo` again
