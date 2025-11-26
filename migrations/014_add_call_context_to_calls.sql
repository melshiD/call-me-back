-- Migration 014: Add call context fields to calls table
-- Created: 2025-11-26 11:22 EST
-- Purpose: Store call context (pretext, scenario, etc.) directly in calls table
--          This allows voice pipeline to fetch context via callId instead of
--          passing it through TwiML parameters (which have 500 char limit)

-- Add call context fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_pretext TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_scenario VARCHAR(100);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS max_duration_minutes INTEGER;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS voice_id_override VARCHAR(255);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS scheduled_call_id VARCHAR(255);

-- Add foreign key to link to scheduled call if applicable
ALTER TABLE calls ADD CONSTRAINT fk_calls_scheduled_call_id
    FOREIGN KEY (scheduled_call_id) REFERENCES scheduled_calls(id);

-- Add comments for documentation
COMMENT ON COLUMN calls.call_pretext IS 'User-provided context for why they are calling (fetched by voice pipeline via callId)';
COMMENT ON COLUMN calls.call_scenario IS 'Pre-defined scenario type: fitness_coaching, interview_prep, therapy_session, etc.';
COMMENT ON COLUMN calls.custom_instructions IS 'Additional instructions for the AI persona';
COMMENT ON COLUMN calls.max_duration_minutes IS 'Maximum call duration (for scheduled calls)';
COMMENT ON COLUMN calls.voice_id_override IS 'Override default persona voice with specific ElevenLabs voice ID';
COMMENT ON COLUMN calls.scheduled_call_id IS 'Link to scheduled_calls table if this call originated from a schedule';
