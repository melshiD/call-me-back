#!/bin/bash

# Add metadata column to debug_markers table
# This allows us to store additional context with markers

source .env

curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${VULTR_DB_API_KEY}" \
  -d '{
    "sql": "ALTER TABLE debug_markers ADD COLUMN IF NOT EXISTS metadata TEXT",
    "params": []
  }'

echo ""
echo "Metadata column added to debug_markers table"
