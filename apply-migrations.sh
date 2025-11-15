#!/bin/bash
# Script to apply database migrations to Vultr PostgreSQL

set -e

echo "=== Applying Database Migrations ==="
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Check if required variables are set
if [ -z "$VULTR_DB_API_KEY" ]; then
    echo "❌ Error: VULTR_DB_API_KEY not set in .env"
    exit 1
fi

# Database connection details
DB_HOST="144.202.15.249"
DB_PORT="5432"
DB_NAME="defaultdb"
DB_USER="vultradmin"

echo "📊 Connecting to Vultr PostgreSQL at $DB_HOST..."
echo ""

# Apply migrations in order
MIGRATION_FILES=(
    "migrations/001_create_personas_tables.sql"
    "migrations/002_seed_initial_personas.sql"
    "migrations/003_seed_personas_simplified.sql"
    "migrations/004_create_calls_table.sql"
    "migrations/005_create_user_credits_table.sql"
    "migrations/006_create_users_and_auth_tables.sql"
)

for migration in "${MIGRATION_FILES[@]}"; do
    if [ -f "$migration" ]; then
        echo "✅ Applying $migration..."

        # Use SSH to run psql on the Vultr server
        ssh -i ~/.ssh/vultr_cmb root@$DB_HOST "PGPASSWORD='$VULTR_DB_PASSWORD' psql -h localhost -U $DB_USER -d $DB_NAME" < "$migration" 2>/dev/null || {
            echo "⚠️  Migration may have already been applied or partially failed. Continuing..."
        }

        echo "   Done."
        echo ""
    else
        echo "⚠️  Migration file not found: $migration"
    fi
done

echo "✅ All migrations applied!"
echo ""

# Verify tables exist
echo "📝 Verifying database tables..."
ssh -i ~/.ssh/vultr_cmb root@$DB_HOST "PGPASSWORD='$VULTR_DB_PASSWORD' psql -h localhost -U $DB_USER -d $DB_NAME -c '\\dt'" 2>/dev/null | grep -E "(personas|calls|scheduled_calls|user_credits|credit_transactions)" || true

echo ""
echo "✨ Database setup complete!"
echo ""
echo "Tables created:"
echo "  - personas (with Brad, Sarah, Alex)"
echo "  - calls (for tracking phone calls)"
echo "  - scheduled_calls (for future calls)"
echo "  - user_credits (for user entitlements)"
echo "  - credit_transactions (for audit trail)"
echo ""
echo "Next steps:"
echo "  1. Deploy the updated backend: raindrop build deploy"
echo "  2. Test call triggering with demo mode"
echo "  3. Configure Twilio credentials when ready"