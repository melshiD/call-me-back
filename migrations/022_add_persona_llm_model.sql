-- Migration 022: Add LLM Model Selection to Personas
-- Created: 2025-12-02 21:45 EST
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
-- 4. Add comment
-- ============================================================================

COMMENT ON COLUMN personas.llm_model IS 'Cerebras LLM model for chat inference. Options: llama3.1-8b (fast, $0.10/1M), llama-3.3-70b (smarter, $0.60/1M)';

-- ============================================================================
-- 5. Update service_pricing with model-specific operation keys
-- ============================================================================
-- The voice pipeline uses servicePricing.getPrice('cerebras', model_name) where
-- model_name is 'llama3.1-8b' or 'llama-3.3-70b'. The pricing cache builds keys
-- from metadata.operation, so we use the model name as the operation key.

-- Update existing 8B entry to use model name as operation key
UPDATE service_pricing
SET metadata = metadata || '{"model": "llama3.1-8b", "operation": "llama3.1-8b"}'::jsonb
WHERE service = 'cerebras'
  AND unit_price = 0.0000001
  AND effective_to IS NULL
  AND (metadata->>'operation' IS NULL OR metadata->>'operation' = 'chat');

-- Add 70B chat pricing entry with model name as operation key
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
SELECT
  'cerebras',
  'per_token',
  0.0000006,
  'manual',
  NOW(),
  '{"model": "llama-3.3-70b", "operation": "llama-3.3-70b", "notes": "70B model for enhanced chat responses"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM service_pricing
  WHERE service = 'cerebras'
  AND metadata->>'operation' = 'llama-3.3-70b'
  AND effective_to IS NULL
);

-- ============================================================================
-- 6. Verify
-- ============================================================================

SELECT id, name, llm_model, max_tokens, temperature
FROM personas
LIMIT 5;
