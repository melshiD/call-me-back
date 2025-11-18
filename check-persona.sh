#!/bin/bash
source .env
curl -X POST https://db.ai-tools-marketplace.io/query \
  -H "Authorization: Bearer ${VULTR_DB_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT id, name, core_system_prompt FROM personas WHERE id = $1", "params": ["sarah_001"]}'
