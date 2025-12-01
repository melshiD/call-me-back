-- Add Stripe purchases table for tracking payment sessions
-- This tracks Stripe Checkout sessions and links them to user credits

CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    stripe_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    sku VARCHAR(50) NOT NULL,
    minutes INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'usd',
    coupon_code VARCHAR(100),
    discount_cents INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, completed, failed, refunded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session ON purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_created ON purchases(created_at);

-- Note: We'll use the existing user_credits table for balance tracking
-- available_credits = minutes balance (1 credit = 1 minute)
-- We'll also use credit_transactions for the audit trail
