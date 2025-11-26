-- Migration 011: Add Cost Tracking Infrastructure
-- Created: 2025-11-22
-- Purpose: Add cost tracking columns and tables for API cost monitoring

-- ============================================================================
-- 1. Add cost_usd column to calls table
-- ============================================================================

-- Add cost_usd column to track total cost per call
ALTER TABLE calls ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10, 4) DEFAULT 0;

-- Add index for cost queries
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_user_created ON calls(user_id, created_at DESC);

-- ============================================================================
-- 2. Create api_call_events table for granular cost tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Call context
  call_id VARCHAR(100),
  user_id VARCHAR(255),
  persona_id VARCHAR(50),

  -- API service details
  service VARCHAR(50) NOT NULL,  -- 'twilio', 'deepgram', 'cerebras', 'elevenlabs', 'stripe'
  operation VARCHAR(100) NOT NULL,  -- 'voice_call', 'stt_streaming', 'chat_completion', 'tts_generation'

  -- Usage metrics
  usage_amount DECIMAL(12, 6) NOT NULL,
  usage_unit VARCHAR(20) NOT NULL,  -- 'minutes', 'tokens', 'characters', 'transaction'

  -- Cost tracking
  unit_cost DECIMAL(10, 6) NOT NULL,
  total_cost DECIMAL(10, 4) NOT NULL,
  estimated BOOLEAN DEFAULT true,  -- False after verification

  -- Metadata
  metadata JSONB,
  external_id VARCHAR(200)
);

-- Indexes for api_call_events
CREATE INDEX IF NOT EXISTS idx_call_events_call_id ON api_call_events(call_id);
CREATE INDEX IF NOT EXISTS idx_call_events_user_id ON api_call_events(user_id);
CREATE INDEX IF NOT EXISTS idx_call_events_created_at ON api_call_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_events_service ON api_call_events(service);

-- ============================================================================
-- 3. Update user_budget_settings to include daily/monthly limits
-- ============================================================================

-- Add daily and monthly limit columns if they don't exist
ALTER TABLE user_budget_settings ADD COLUMN IF NOT EXISTS daily_limit_usd DECIMAL(10, 2);
ALTER TABLE user_budget_settings ADD COLUMN IF NOT EXISTS monthly_limit_usd DECIMAL(10, 2);
ALTER TABLE user_budget_settings ADD COLUMN IF NOT EXISTS alert_threshold_pct INTEGER DEFAULT 80;

-- ============================================================================
-- 4. Create service_pricing table for dynamic pricing
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service VARCHAR(50) NOT NULL,
  pricing_type VARCHAR(50) NOT NULL,  -- 'per_minute', 'per_token', 'per_character'

  -- Pricing details
  unit_price DECIMAL(12, 8) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Metadata
  metadata JSONB,

  -- Versioning
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMPTZ,  -- NULL if current

  -- Source tracking
  source VARCHAR(50) NOT NULL,  -- 'api', 'manual', 'inferred'
  last_verified TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pricing queries
CREATE INDEX IF NOT EXISTS idx_pricing_service_effective ON service_pricing(service, effective_to);

-- ============================================================================
-- 5. Seed current API pricing (as of 2025-11-22)
-- ============================================================================

-- Twilio pricing (outbound US calls)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'twilio',
  'per_minute',
  0.014,
  'manual',
  NOW(),
  '{"region": "US", "type": "outbound"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Deepgram pricing (Nova-2 streaming)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'deepgram',
  'per_minute',
  0.0059,
  'manual',
  NOW(),
  '{"model": "nova-2", "type": "streaming"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Cerebras pricing (Llama 3.1 8B)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'cerebras',
  'per_token',
  0.0000001,
  'manual',
  NOW(),
  '{"model": "llama3.1-8b", "combined_rate": true}'::jsonb
) ON CONFLICT DO NOTHING;

-- ElevenLabs pricing (Turbo v2.5)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'elevenlabs',
  'per_character',
  0.00015,
  'manual',
  NOW(),
  '{"model": "eleven_turbo_v2_5"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Stripe pricing (CNP transactions)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'stripe',
  'per_transaction',
  0.034,
  'manual',
  NOW(),
  '{"type": "CNP", "fixed_fee": 0.30}'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. Create helper function to calculate call cost
-- ============================================================================

-- Function to get current price for a service
CREATE OR REPLACE FUNCTION get_current_price(p_service VARCHAR, p_pricing_type VARCHAR)
RETURNS DECIMAL(12, 8) AS $$
DECLARE
  v_price DECIMAL(12, 8);
BEGIN
  SELECT unit_price INTO v_price
  FROM service_pricing
  WHERE service = p_service
    AND pricing_type = p_pricing_type
    AND effective_to IS NULL
  ORDER BY effective_from DESC
  LIMIT 1;

  RETURN COALESCE(v_price, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Verify tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('api_call_events', 'service_pricing')
ORDER BY table_name;
