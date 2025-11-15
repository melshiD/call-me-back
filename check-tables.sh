#!/bin/bash
set -e

source .env

echo "Checking existing tables in Vultr PostgreSQL..."
echo ""

# Query to list all tables
sql="SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

sql_json=$(echo "$sql" | python3 -c "import sys, json; print(json.dumps(sys.stdin.read()))")

curl -X POST "$VULTR_DB_API_URL/query" \
    -H "Authorization: Bearer $VULTR_DB_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql\":$sql_json}" \
    --silent | python3 -m json.tool

echo ""
