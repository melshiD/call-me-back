-- Migration 017: Add direction column to calls table
-- Created: 2025-12-01
-- Purpose: Track whether a call is inbound (user calling persona) or outbound (persona calling user)
--          This enables proper call record creation for inbound calls

-- Add direction column to calls table
-- 'outbound' = persona calls user (default, how calls worked before)
-- 'inbound' = user calls persona's Twilio number
ALTER TABLE calls ADD COLUMN IF NOT EXISTS direction VARCHAR(20) DEFAULT 'outbound';

-- Add comment for documentation
COMMENT ON COLUMN calls.direction IS 'Call direction: outbound (persona calls user) or inbound (user calls persona)';

-- Create index for filtering by direction
CREATE INDEX IF NOT EXISTS idx_calls_direction ON calls(direction);

-- Update any existing records to have direction = 'outbound' (they were all outbound before this feature)
UPDATE calls SET direction = 'outbound' WHERE direction IS NULL;
