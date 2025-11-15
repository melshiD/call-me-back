#!/bin/bash
set -e

# Source environment variables
source .env

echo "Running Vultr PostgreSQL migrations (fixed version)..."
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

# Run migration 006 with fixed version (without IF NOT EXISTS and ON CONFLICT)
echo "=== Running Migration 006: Users and Auth Tables (Fixed) ==="
run_migration "migrations/006_create_users_and_auth_tables_fixed.sql"

echo ""
echo "=========================================="
echo "Migration 006 completed successfully!"
echo "=========================================="
