#!/bin/bash
set -e

source .env

echo "Seeding demo user into Vultr PostgreSQL..."
echo ""

# Function to run a SQL query
run_sql() {
    local sql=$1
    local description=$2

    echo "$description"

    local sql_json=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

    response=$(curl -X POST "$VULTR_DB_API_URL/query" \
        -H "Authorization: Bearer $VULTR_DB_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"sql\":$sql_json}" \
        --silent --show-error)

    echo "Response: $response"
    echo ""
}

# Insert demo user (with ON CONFLICT handled via separate check)
echo "=== Inserting Demo User ==="
run_sql "INSERT INTO users (id, email, password_hash, name, phone)
SELECT 'demo_user', 'demo@callmeback.ai', '\$2b\$10\$K.0HiWs3d8F1hFezGzCYiO1w6J9yJF3sX.G3xXHhJhqWlH5B5pPnC', 'Demo User', '+15555551234'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'demo_user');" "Insert demo user"

# Give demo user credits
echo "=== Setting Demo User Credits ==="
run_sql "INSERT INTO user_credits (id, user_id, available_credits, subscription_tier)
SELECT 'demo_credits_001', 'demo_user', 100, 'demo'
WHERE NOT EXISTS (SELECT 1 FROM user_credits WHERE user_id = 'demo_user');" "Insert demo credits"

# Set demo user budget
echo "=== Setting Demo User Budget ==="
run_sql "INSERT INTO user_budget_settings (user_id, max_cost_per_call_cents, enable_auto_cutoff)
SELECT 'demo_user', 2000, FALSE
WHERE NOT EXISTS (SELECT 1 FROM user_budget_settings WHERE user_id = 'demo_user');" "Insert demo budget"

echo ""
echo "=========================================="
echo "Demo user seeding completed!"
echo "=========================================="
echo ""
echo "Demo credentials:"
echo "  Email: demo@callmeback.ai"
echo "  Password: demo123"
echo "  Credits: 100"
