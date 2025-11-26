-- Migration: Add max_call_duration field
-- Created: 2025-11-22
-- Description: Add configurable max call duration for personas and scheduled calls

-- Add max_call_duration to personas table (in minutes, default 15)
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS max_call_duration INTEGER DEFAULT 15;

COMMENT ON COLUMN personas.max_call_duration IS 'Maximum call duration in minutes (default: 15)';

-- Add max_call_duration_override to scheduled_calls table
-- This allows users to override the persona default when scheduling
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS max_call_duration_override INTEGER;

COMMENT ON COLUMN scheduled_calls.max_call_duration_override IS 'User-specified max duration override (minutes, null = use persona default)';

-- Add max_call_duration_override to calls table for active sessions
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS max_call_duration INTEGER DEFAULT 15;

COMMENT ON COLUMN calls.max_call_duration IS 'Maximum call duration in minutes for this session';
