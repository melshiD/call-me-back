#!/bin/bash
set -e

# Source environment variables
source .env

echo "Running Vultr PostgreSQL migrations..."
echo "API URL: ${VULTR_DB_API_URL:0:30}..."
echo ""

# Function to run a migration file
run_migration() {
    local file=$1
    local name=$(basename "$file")

    echo "Running migration: $name"

    # Read SQL file and escape it for JSON using Python
    local sql=$(cat "$file" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

    # Execute via Vultr API
    curl -X POST "$VULTR_DB_API_URL/query" \
        -H "Authorization: Bearer $VULTR_DB_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\":$sql}" \
        --silent --show-error

    echo ""
    echo "✓ Completed: $name"
    echo ""
}

# Run migrations in order
echo "=== Running Migration 004: Calls Tables ==="
run_migration "migrations/004_create_calls_table.sql"

echo "=== Running Migration 005: User Credits Tables ==="
run_migration "migrations/005_create_user_credits_table.sql"

echo "=== Running Migration 006: Users and Auth Tables ==="
run_migration "migrations/006_create_users_and_auth_tables.sql"

echo ""
echo "=========================================="
echo "All migrations completed successfully!"
echo "=========================================="
