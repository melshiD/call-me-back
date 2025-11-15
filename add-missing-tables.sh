#!/bin/bash
set -e

source .env

echo "Adding missing auth tables to Vultr PostgreSQL..."
echo ""

# Function to run a SQL query
run_sql() {
    local file=$1
    local name=$(basename "$file")

    echo "Running: $name"

    local sql=$(cat "$file" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

    curl -X POST "$VULTR_DB_API_URL/query" \
        -H "Authorization: Bearer $VULTR_DB_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\":$sql}" \
        --silent --show-error

    echo ""
    echo "✓ Completed: $name"
    echo ""
}

run_sql "migrations/006_add_missing_auth_tables.sql"

echo ""
echo "=========================================="
echo "Missing auth tables created successfully!"
echo "=========================================="
