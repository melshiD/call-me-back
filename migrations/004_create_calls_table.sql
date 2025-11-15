-- Create calls table for tracking phone call sessions
CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    persona_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    twilio_call_sid VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'initiating',

    -- Payment tracking
    payment_method VARCHAR(50), -- 'stripe', 'credit', 'subscription'
    payment_intent_id VARCHAR(255), -- Stripe PaymentIntent ID if applicable
    payment_status VARCHAR(50), -- 'pending', 'paid', 'failed', 'credit_used'
    estimated_cost_cents INTEGER,
    actual_cost_cents INTEGER,
    credits_used INTEGER,

    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id)
);

-- Create scheduled calls table for future calls
CREATE TABLE IF NOT EXISTS scheduled_calls (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    persona_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    executed_at TIMESTAMP,
    call_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (persona_id) REFERENCES personas(id),
    FOREIGN KEY (call_id) REFERENCES calls(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_persona_id ON calls(persona_id);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_user_id ON scheduled_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_time ON scheduled_calls(scheduled_time);