-- Migration 022a: Add LLM Model Column to Personas (without service_pricing changes)
-- Created: 2025-12-02
-- Purpose: Allow per-persona selection of Cerebras model (8B vs 70B)

-- ============================================================================
-- 1. Add llm_model column to personas table
-- ============================================================================

ALTER TABLE personas
ADD COLUMN IF NOT EXISTS llm_model VARCHAR(50) DEFAULT 'llama3.1-8b';

-- ============================================================================
-- 2. Update existing personas to use default model
-- ============================================================================

UPDATE personas
SET llm_model = 'llama3.1-8b'
WHERE llm_model IS NULL;

-- ============================================================================
-- 3. Add check constraint for valid model values
-- ============================================================================

-- Note: PostgreSQL doesn't support ALTER TABLE ADD CONSTRAINT IF NOT EXISTS
-- So we use DO block to check first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_personas_llm_model'
  ) THEN
    ALTER TABLE personas
    ADD CONSTRAINT chk_personas_llm_model
    CHECK (llm_model IN ('llama3.1-8b', 'llama-3.3-70b'));
  END IF;
END $$;

-- ============================================================================
-- 4. Verify
-- ============================================================================

SELECT id, name, llm_model, max_tokens, temperature
FROM personas
LIMIT 5;
