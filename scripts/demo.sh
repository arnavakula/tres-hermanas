#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEMO_DB="prisma/demo.db"

echo "Setting up demo mode..."

# Generate SQLite-compatible schema from the PostgreSQL one
node scripts/generate-demo-schema.js

# Remove stale demo DB so we start fresh
rm -f "$DEMO_DB"

# Point Prisma at the SQLite file
export DATABASE_URL="file:./demo.db"

# Create tables and generate client
npx prisma db push --schema=prisma/schema.demo.prisma --skip-generate --accept-data-loss
npx prisma generate --schema=prisma/schema.demo.prisma

# Seed
npx tsx prisma/seed.ts

echo ""
echo "Demo ready! Starting dev server..."
echo "  Login: maria@treshermanas.com / password123"
echo ""

exec npx next dev
