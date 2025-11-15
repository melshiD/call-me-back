-- SmartSQL Database Initialization for Call Me Back
-- This creates all necessary tables for the application

-- 1. Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(50),
    stripe_customer_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Personas table (AI personalities)
CREATE TABLE IF NOT EXISTS personas (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    voice_id VARCHAR(255) NOT NULL,
    voice_settings TEXT,
    description TEXT,
    system_prompt TEXT,
    personality_traits TEXT,
    conversation_style TEXT,
    topics_of_interest TEXT,
    availability_schedule TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Calls table
CREATE TABLE IF NOT EXISTS calls (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    persona_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    twilio_call_sid VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'initiating',
    payment_method VARCHAR(50),
    payment_intent_id VARCHAR(255),
    payment_status VARCHAR(50),
    estimated_cost_cents INTEGER,
    actual_cost_cents INTEGER,
    credits_used INTEGER,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Token blacklist for JWT revocation
CREATE TABLE IF NOT EXISTS token_blacklist (
    token_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User credits/entitlements
CREATE TABLE IF NOT EXISTS user_credits (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    available_credits INTEGER NOT NULL DEFAULT 0,
    lifetime_credits_purchased INTEGER NOT NULL DEFAULT 0,
    lifetime_credits_used INTEGER NOT NULL DEFAULT 0,
    subscription_id VARCHAR(255),
    subscription_status VARCHAR(50),
    subscription_tier VARCHAR(50),
    subscription_credits_per_month INTEGER DEFAULT 0,
    subscription_renews_at TIMESTAMP,
    max_call_duration_minutes INTEGER DEFAULT 10,
    allow_overage BOOLEAN DEFAULT false,
    overage_rate_per_minute_cents INTEGER DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. User-persona relationships (customization)
CREATE TABLE IF NOT EXISTS user_persona_relationships (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    persona_id VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'friend',
    custom_system_prompt TEXT,
    memory_config TEXT,
    voice_id VARCHAR(255),
    voice_settings TEXT,
    total_calls INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    last_call_at TIMESTAMP,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, persona_id)
);

-- 7. Scheduled calls
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Call cost breakdowns
CREATE TABLE IF NOT EXISTS call_cost_breakdowns (
    id VARCHAR(255) PRIMARY KEY,
    call_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    twilio_connection_fee_cents INTEGER DEFAULT 0,
    twilio_duration_seconds INTEGER DEFAULT 0,
    twilio_duration_cost_cents INTEGER DEFAULT 0,
    twilio_total_cents INTEGER DEFAULT 0,
    elevenlabs_total_characters INTEGER DEFAULT 0,
    elevenlabs_total_requests INTEGER DEFAULT 0,
    elevenlabs_total_cents INTEGER DEFAULT 0,
    cerebras_input_tokens INTEGER DEFAULT 0,
    cerebras_output_tokens INTEGER DEFAULT 0,
    cerebras_total_tokens INTEGER DEFAULT 0,
    cerebras_total_requests INTEGER DEFAULT 0,
    cerebras_total_cents INTEGER DEFAULT 0,
    openai_input_tokens INTEGER DEFAULT 0,
    openai_output_tokens INTEGER DEFAULT 0,
    openai_total_tokens INTEGER DEFAULT 0,
    openai_total_requests INTEGER DEFAULT 0,
    openai_total_cents INTEGER DEFAULT 0,
    openai_fallback_triggered BOOLEAN DEFAULT false,
    openai_fallback_reason VARCHAR(255),
    deepgram_audio_duration_seconds INTEGER DEFAULT 0,
    deepgram_total_requests INTEGER DEFAULT 0,
    deepgram_total_cents INTEGER DEFAULT 0,
    subtotal_cents INTEGER DEFAULT 0,
    stripe_fee_cents INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    finalized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Call scenario templates
CREATE TABLE IF NOT EXISTS call_scenario_templates (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    scenario_text TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '📞',
    use_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. User budget settings
CREATE TABLE IF NOT EXISTS user_budget_settings (
    user_id VARCHAR(255) PRIMARY KEY,
    max_cost_per_call_cents INTEGER DEFAULT 1000,
    max_monthly_spend_cents INTEGER DEFAULT 10000,
    warn_at_percent_per_call INTEGER DEFAULT 75,
    enable_auto_cutoff BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Credit transactions audit trail
CREATE TABLE IF NOT EXISTS credit_transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    credits_amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    description TEXT,
    reference_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Call cost events (granular tracking)
CREATE TABLE IF NOT EXISTS call_cost_events (
    id VARCHAR(255) PRIMARY KEY,
    call_id VARCHAR(255) NOT NULL,
    call_cost_breakdown_id VARCHAR(255),
    event_type VARCHAR(50),
    service VARCHAR(50),
    tokens_input INTEGER,
    tokens_output INTEGER,
    characters INTEGER,
    duration_seconds NUMERIC,
    audio_bytes INTEGER,
    unit_cost NUMERIC,
    calculated_cost_cents NUMERIC,
    model_used VARCHAR(100),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial personas
INSERT INTO personas (id, name, voice_id, description, system_prompt, personality_traits, conversation_style)
VALUES
    ('brad_001', 'Brad', 'EXAVITQu4vr4xnSDxMaL',
     'Your laid-back California bro who keeps it real',
     'You are Brad, a chill California dude who loves surfing and keeping things positive. Speak casually with lots of "dude", "bro", and "man". Keep responses brief and enthusiastic.',
     'Chill, optimistic, supportive, uses surfer slang',
     'Casual, brief, enthusiastic'),

    ('sarah_001', 'Sarah', 'MF3mGyEYCl7XYWbV9V6O',
     'A warm, empathetic friend who truly listens',
     'You are Sarah, a caring and empathetic friend. You listen actively and respond with warmth and understanding. Use supportive language and show genuine interest.',
     'Empathetic, warm, good listener, supportive',
     'Warm, thoughtful, encouraging'),

    ('alex_001', 'Alex', 'TxGEqnHWrfWFTfGW9XjX',
     'An energetic creative who sparks inspiration',
     'You are Alex, an energetic and creative personality. You love brainstorming ideas and encouraging creativity. Be enthusiastic and inspiring in your responses.',
     'Creative, energetic, inspiring, enthusiastic',
     'Energetic, creative, motivating')
ON CONFLICT (id) DO NOTHING;

-- Create a demo user for testing
INSERT INTO users (id, email, password_hash, name, phone)
VALUES (
    'demo_user',
    'demo@callmeback.ai',
    '$2b$10$K.0HiWs3d8F1hFezGzCYiO1w6J9yJF3sX.G3xXHhJhqWlH5B5pPnC', -- password: "demo123"
    'Demo User',
    '+15555551234'
) ON CONFLICT (id) DO NOTHING;

-- Give demo user some credits
INSERT INTO user_credits (id, user_id, available_credits, subscription_tier)
VALUES (
    'demo_credits_001',
    'demo_user',
    100,
    'demo'
) ON CONFLICT (user_id) DO UPDATE
SET available_credits = 100;

-- Set budget for demo user
INSERT INTO user_budget_settings (user_id, max_cost_per_call_cents, enable_auto_cutoff)
VALUES (
    'demo_user',
    2000,
    false
) ON CONFLICT (user_id) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_persona_id ON calls(persona_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user ON user_persona_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_time ON scheduled_calls(scheduled_time);