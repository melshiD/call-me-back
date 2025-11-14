#!/bin/bash
set -e

# Load environment variables from .env
if [ -f .env ]; then
  source .env
else
  echo "ERROR: .env file not found"
  exit 1
fi

echo "Testing database query..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, name, category FROM personas ORDER BY created_at;"
