#!/bin/bash
set -e

# Source environment variables
source .env

echo "Testing migration 006 in chunks to find syntax error..."
echo ""

# Function to run a SQL query
run_sql() {
    local sql=$1
    local description=$2

    echo "Testing: $description"

    # Escape SQL for JSON using Python
    local sql_json=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

    # Execute via Vultr API
    response=$(curl -X POST "$VULTR_DB_API_URL/query" \
        -H "Authorization: Bearer $VULTR_DB_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\":$sql_json}" \
        --silent --show-error)

    echo "Response: $response"
    echo ""
}

# Test 1: Simple CREATE TABLE without IF NOT EXISTS
echo "=== Test 1: Simple CREATE TABLE ==="
run_sql "CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    stripe_customer_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);" "Simple CREATE TABLE users"

echo "Test completed!"
