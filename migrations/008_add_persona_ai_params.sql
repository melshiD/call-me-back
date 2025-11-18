-- Add AI parameters to personas table for controlling response generation
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7;

-- Update existing personas with sensible defaults
UPDATE personas
SET max_tokens = 150, temperature = 0.7
WHERE max_tokens IS NULL OR temperature IS NULL;

-- Add comments
COMMENT ON COLUMN personas.max_tokens IS 'Max tokens for AI response generation (lower = shorter responses)';
COMMENT ON COLUMN personas.temperature IS 'Temperature for AI creativity (0-2, higher = more creative)';
