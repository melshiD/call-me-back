#!/bin/bash

# Query debug markers from the database
# This is MUCH more efficient than reading logs!

echo "======================================"
echo "Debug Markers Query"
echo "======================================"
echo ""
echo "Querying last 20 debug markers..."
echo ""

curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VULTR_DB_API_KEY}" \
  -d '{
    "sql": "SELECT id, call_id, marker_name, created_at FROM debug_markers ORDER BY created_at DESC LIMIT 20",
    "params": []
  }'

echo ""
echo "======================================"
echo "Query complete"
echo "======================================"
