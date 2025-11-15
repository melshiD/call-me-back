-- Create user credits/entitlements table
CREATE TABLE IF NOT EXISTS user_credits (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,

    -- Credit balance
    available_credits INTEGER NOT NULL DEFAULT 0,
    lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_credits_used INTEGER NOT NULL DEFAULT 0,

    -- Subscription info
    subscription_id VARCHAR(255),
    subscription_status VARCHAR(50), -- 'active', 'canceled', 'past_due', etc.
    subscription_tier VARCHAR(50), -- 'free', 'basic', 'pro', 'enterprise'
    subscription_credits_per_month INTEGER DEFAULT 0,
    subscription_renews_at TIMESTAMP,

    -- Limits and preferences
    max_call_duration_minutes INTEGER DEFAULT 10,
    allow_overage BOOLEAN DEFAULT FALSE,
    overage_rate_per_minute_cents INTEGER DEFAULT 50,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create credit transactions table for audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'usage', 'refund', 'subscription_renewal'
    credits_amount INTEGER NOT NULL, -- positive for additions, negative for usage
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(255), -- call_id, payment_intent_id, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);