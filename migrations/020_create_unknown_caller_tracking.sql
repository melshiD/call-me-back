-- Migration 020: Create unknown caller tracking table
-- Created: 2025-12-02
-- Purpose: Track unknown callers who call persona numbers without a registered account
--          This enables analytics on trial usage and potential abuse prevention

CREATE TABLE IF NOT EXISTS unknown_caller_attempts (
    phone_number VARCHAR(50) PRIMARY KEY,
    persona_id VARCHAR(255),
    first_call_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_call_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    call_count INTEGER DEFAULT 1,
    converted_user_id VARCHAR(255),  -- Set when/if this number registers
    blocked BOOLEAN DEFAULT FALSE,    -- For abuse prevention
    notes TEXT
);

-- Index for finding repeat callers
CREATE INDEX IF NOT EXISTS idx_unknown_caller_call_count ON unknown_caller_attempts(call_count DESC);
CREATE INDEX IF NOT EXISTS idx_unknown_caller_last_call ON unknown_caller_attempts(last_call_at DESC);

-- Comment for documentation
COMMENT ON TABLE unknown_caller_attempts IS 'Tracks unknown phone numbers that call persona numbers for trial experience';
COMMENT ON COLUMN unknown_caller_attempts.converted_user_id IS 'Links to users.id if this caller later signed up';
COMMENT ON COLUMN unknown_caller_attempts.blocked IS 'Set to true to block repeat abusers';
