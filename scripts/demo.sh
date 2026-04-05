#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEMO_DB="prisma/demo.db"

# Always generate the SQLite schema (cheap, keeps it in sync)
node scripts/generate-demo-schema.js

# Point Prisma at the SQLite file
export DATABASE_URL="file:./demo.db"

if [ -f "$DEMO_DB" ]; then
  echo "Existing demo database found — preserving your data."
  echo "  (Delete prisma/demo.db to start fresh)"
  # Regenerate client in case schema changed
  npx prisma generate --schema=prisma/schema.demo.prisma
else
  echo "Creating demo database..."
  npx prisma db push --schema=prisma/schema.demo.prisma --skip-generate --accept-data-loss
  npx prisma generate --schema=prisma/schema.demo.prisma
  npx tsx prisma/seed.ts
fi

echo ""
echo "Demo ready! Starting dev server..."
echo "  Manager: maria@treshermanas.com / password123"
echo "  Employee: carlos@treshermanas.com / password123"
echo ""

exec npx next dev
