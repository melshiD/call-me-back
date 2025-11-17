#!/bin/bash
# Extract only needed variables from parent .env

source ../.env

cat > .env << EOF
PORT=8001
DEEPGRAM_API_KEY=${DEEPGRAM_API_KEY}
ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
CEREBRAS_API_KEY=${CEREBRAS_API_KEY}
VULTR_DB_API_URL=${VULTR_DB_API_URL}
VULTR_DB_API_KEY=${VULTR_DB_API_KEY}
EOF

echo "Environment variables loaded from parent .env"
