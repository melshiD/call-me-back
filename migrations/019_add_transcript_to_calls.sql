-- Add transcript column to calls table for storing conversation transcripts
-- 2025-12-02: Added to support displaying call transcripts in Dashboard

ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT;

-- Also add call_scenario if it's missing (used for displaying in Dashboard)
ALTER TABLE calls ADD COLUMN IF NOT EXISTS call_scenario TEXT;
