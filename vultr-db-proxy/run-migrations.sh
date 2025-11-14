#!/bin/bash
set -e

# Load environment variables from .env
if [ -f .env ]; then
  source .env
else
  echo "ERROR: .env file not found"
  exit 1
fi

echo "Running database migrations..."

# Run each migration file
for migration in /opt/migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "Running migration: $(basename $migration)"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$migration"
    echo "✓ Completed: $(basename $migration)"
  fi
done

echo ""
echo "✓ All migrations completed successfully"
