#!/usr/bin/env sh
# Container entrypoint — runs every time the backend container starts.
#
# Responsibilities, in order:
#   1. Apply database migrations (bring the schema up to date).
#   2. Seed the first admin account (idempotent — skips if it already exists).
#   3. Start the API server on the port the platform assigns via $PORT.
#
# `set -e` makes the script abort immediately if any command fails, so a broken
# migration stops the deploy instead of starting a server against a bad schema.
set -e

echo "==> Applying database migrations (alembic upgrade head)"
alembic upgrade head

echo "==> Seeding admin account (idempotent)"
python -m src.scripts.seed_admin

# Railway (and most PaaS) inject the port to listen on via $PORT.
# Fall back to 8000 for local runs where $PORT is not set.
echo "==> Starting API server on port ${PORT:-8000}"
exec uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
