-- Migration 021: Add Cerebras 70B Model Pricing
-- Created: 2025-12-02 21:20 EST
-- Purpose: Add separate pricing for Cerebras llama-3.3-70b model used for fact extraction

-- ============================================================================
-- 1. Add Cerebras 70B pricing entry
-- ============================================================================

-- Cerebras Llama 3.3 70B pricing (used for post-call fact extraction)
-- Price: $0.60 per million tokens ($0.0000006 per token)
-- Source: https://cerebras.ai/pricing (as of 2025-12-02)
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'cerebras',
  'per_token',
  0.0000006,
  'manual',
  NOW(),
  '{"model": "llama-3.3-70b", "operation": "extraction", "notes": "Used for post-call fact extraction"}'::jsonb
);

-- ============================================================================
-- 2. Update existing 8B entry metadata for clarity
-- ============================================================================

-- Add operation type to existing 8B entry to distinguish from 70B
UPDATE service_pricing
SET metadata = metadata || '{"operation": "chat"}'::jsonb
WHERE service = 'cerebras'
  AND metadata->>'model' = 'llama3.1-8b'
  AND effective_to IS NULL;

-- ============================================================================
-- 3. Add Deepgram Flux pricing (different from Nova-2)
-- ============================================================================

-- Deepgram Flux model pricing (used for turn-taking detection)
-- Price may differ from Nova-2 - using same rate for now, metadata distinguishes
INSERT INTO service_pricing (service, pricing_type, unit_price, source, effective_from, metadata)
VALUES (
  'deepgram',
  'per_minute',
  0.0059,
  'manual',
  NOW(),
  '{"model": "flux-general-en", "type": "streaming", "features": ["turn_detection"]}'::jsonb
);

-- ============================================================================
-- 4. Verify pricing entries
-- ============================================================================

SELECT service, pricing_type, unit_price, metadata->>'model' as model, metadata->>'operation' as operation
FROM service_pricing
WHERE effective_to IS NULL
ORDER BY service, unit_price;
