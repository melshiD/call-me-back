-- Migration 013: Add context fields to scheduled_calls table
-- Created: 2025-11-26
-- Purpose: Enable scheduled calls to carry context (pretext, scenario, etc.) for AI personas

-- Add call context fields to scheduled_calls table
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS call_pretext TEXT;
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS call_scenario VARCHAR(100);
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS custom_instructions TEXT;
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS max_duration_minutes INTEGER DEFAULT 5;
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS voice_id VARCHAR(255);
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS ai_parameters JSONB;
ALTER TABLE scheduled_calls ADD COLUMN IF NOT EXISTS memory_snapshot JSONB;

-- Add comments for documentation
COMMENT ON COLUMN scheduled_calls.call_pretext IS 'User-provided context for why they are calling (e.g., "Help me prepare for my marathon")';
COMMENT ON COLUMN scheduled_calls.call_scenario IS 'Pre-defined scenario type: fitness_coaching, interview_prep, therapy_session, language_practice, emergency_escape';
COMMENT ON COLUMN scheduled_calls.custom_instructions IS 'Additional instructions for the AI persona (e.g., "Be more challenging today")';
COMMENT ON COLUMN scheduled_calls.max_duration_minutes IS 'Maximum call duration user selected (default 5 minutes)';
COMMENT ON COLUMN scheduled_calls.voice_id IS 'Override default persona voice with specific ElevenLabs voice ID';
COMMENT ON COLUMN scheduled_calls.ai_parameters IS 'JSON blob for advanced AI configuration: {"temperature": 0.8, "style": "challenging"}';
COMMENT ON COLUMN scheduled_calls.memory_snapshot IS 'Snapshot of relevant memory context at schedule time for prompt generation';

-- memory_snapshot structure:
-- {
--   "scheduled_at": "2025-11-26T10:00:00Z",
--   "recent_storylines": [...],
--   "user_context_at_schedule": "...",
--   "ai_interpreted_reason": "...",
--   "relevant_past_conversations": [...]
-- }

-- ai_parameters structure:
-- {
--   "temperature": 0.8,
--   "style": "challenging",
--   "memory_context": "User mentioned marathon training last call"
-- }
