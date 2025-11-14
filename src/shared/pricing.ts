/**
 * Centralized Pricing Configuration
 *
 * All service costs are stored here for easy maintenance and updates.
 * Use getPricing() to look up costs by provider and model.
 *
 * IMPORTANT: Update lastUpdated date when modifying prices
 */

export type PricingUnit =
  | 'per_1k_chars'
  | 'per_1m_tokens'
  | 'per_minute'
  | 'per_call'
  | 'per_transaction'
  | 'per_audio_byte';

export interface ModelPricing {
  // Cost structure (in cents)
  inputCost?: number;      // For models with separate input/output pricing
  outputCost?: number;     // For models with separate input/output pricing
  cost?: number;           // For models with single pricing (TTS, STT, etc.)
  connectionFee?: number;  // One-time fees (e.g., Twilio)

  // Metadata
  unit: PricingUnit;
  lastUpdated: string;
  source: string;
  notes?: string;
}

export interface ProviderPricing {
  [modelName: string]: ModelPricing;
}

export interface PricingConfig {
  [provider: string]: ProviderPricing;
}

/**
 * Master pricing configuration
 * Structure: PRICING_CONFIG[provider][model] = ModelPricing
 */
export const PRICING_CONFIG: PricingConfig = {
  elevenlabs: {
    'eleven_turbo_v2': {
      cost: 0.30,
      unit: 'per_1k_chars',
      lastUpdated: '2025-01-15',
      source: 'https://elevenlabs.io/pricing',
      notes: 'Standard quality, optimized for speed'
    },
    'eleven_multilingual_v2': {
      cost: 0.30,
      unit: 'per_1k_chars',
      lastUpdated: '2025-01-15',
      source: 'https://elevenlabs.io/pricing',
      notes: 'Supports multiple languages'
    },
    'eleven_turbo_v2_5': {
      cost: 0.30,
      unit: 'per_1k_chars',
      lastUpdated: '2025-01-15',
      source: 'https://elevenlabs.io/pricing',
      notes: 'Latest turbo model'
    }
  },

  cerebras: {
    'llama3.1-8b': {
      cost: 10.00,
      unit: 'per_1m_tokens',
      lastUpdated: '2025-01-15',
      source: 'https://cerebras.ai/pricing',
      notes: 'Combined input + output pricing'
    },
    'llama3.1-70b': {
      cost: 60.00,
      unit: 'per_1m_tokens',
      lastUpdated: '2025-01-15',
      source: 'https://cerebras.ai/pricing',
      notes: 'Combined input + output pricing, larger model'
    }
  },

  openai: {
    'gpt-4-turbo-preview': {
      inputCost: 1000.00,
      outputCost: 3000.00,
      unit: 'per_1m_tokens',
      lastUpdated: '2025-01-15',
      source: 'https://openai.com/api/pricing/',
      notes: 'GPT-4 Turbo with 128K context'
    },
    'gpt-4': {
      inputCost: 3000.00,
      outputCost: 6000.00,
      unit: 'per_1m_tokens',
      lastUpdated: '2025-01-15',
      source: 'https://openai.com/api/pricing/',
      notes: 'Standard GPT-4'
    },
    'gpt-3.5-turbo': {
      inputCost: 50.00,
      outputCost: 150.00,
      unit: 'per_1m_tokens',
      lastUpdated: '2025-01-15',
      source: 'https://openai.com/api/pricing/',
      notes: 'Cheaper alternative to GPT-4'
    },
    'gpt-4-realtime-preview': {
      cost: 600.00,
      unit: 'per_minute',
      lastUpdated: '2025-01-15',
      source: 'https://openai.com/api/pricing/',
      notes: 'Real-time audio API'
    }
  },

  deepgram: {
    'nova-2': {
      cost: 0.43,
      unit: 'per_minute',
      lastUpdated: '2025-01-15',
      source: 'https://deepgram.com/pricing',
      notes: 'Most accurate model'
    },
    'nova-2-general': {
      cost: 0.43,
      unit: 'per_minute',
      lastUpdated: '2025-01-15',
      source: 'https://deepgram.com/pricing',
      notes: 'General purpose transcription'
    },
    'base': {
      cost: 0.25,
      unit: 'per_minute',
      lastUpdated: '2025-01-15',
      source: 'https://deepgram.com/pricing',
      notes: 'Lower cost, good accuracy'
    }
  },

  twilio: {
    'voice': {
      cost: 40.00,
      connectionFee: 25.00,
      unit: 'per_minute',
      lastUpdated: '2025-01-15',
      source: 'https://www.twilio.com/voice/pricing',
      notes: 'Per minute + one-time connection fee'
    }
  },

  stripe: {
    'payment': {
      cost: 2.9, // percentage
      connectionFee: 30.00, // fixed fee in cents
      unit: 'per_transaction',
      lastUpdated: '2025-01-15',
      source: 'https://stripe.com/pricing',
      notes: '2.9% + $0.30 per successful charge'
    }
  }
};

/**
 * Get pricing for a specific provider and model
 */
export function getPricing(provider: string, model: string): ModelPricing | null {
  const providerPricing = PRICING_CONFIG[provider];
  if (!providerPricing) {
    console.warn(`Pricing not found for provider: ${provider}`);
    return null;
  }

  const modelPricing = providerPricing[model];
  if (!modelPricing) {
    console.warn(`Pricing not found for model: ${provider}/${model}`);
    return null;
  }

  return modelPricing;
}

/**
 * Calculate cost for text-to-speech (character-based)
 */
export function calculateTTSCost(provider: string, model: string, characters: number): number {
  const pricing = getPricing(provider, model);
  if (!pricing || !pricing.cost) {
    throw new Error(`TTS pricing not found for ${provider}/${model}`);
  }

  if (pricing.unit === 'per_1k_chars') {
    return (characters / 1000) * pricing.cost;
  }

  throw new Error(`Unsupported unit for TTS: ${pricing.unit}`);
}

/**
 * Calculate cost for AI inference (token-based)
 */
export function calculateAICost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = getPricing(provider, model);
  if (!pricing) {
    throw new Error(`AI pricing not found for ${provider}/${model}`);
  }

  if (pricing.unit === 'per_1m_tokens') {
    // Check if model has separate input/output pricing (OpenAI style)
    if (pricing.inputCost !== undefined && pricing.outputCost !== undefined) {
      const inputCost = (inputTokens / 1_000_000) * pricing.inputCost;
      const outputCost = (outputTokens / 1_000_000) * pricing.outputCost;
      return inputCost + outputCost;
    }

    // Combined pricing (Cerebras style)
    if (pricing.cost !== undefined) {
      const totalTokens = inputTokens + outputTokens;
      return (totalTokens / 1_000_000) * pricing.cost;
    }
  }

  throw new Error(`Unsupported pricing structure for ${provider}/${model}`);
}

/**
 * Calculate cost for speech-to-text (time-based)
 */
export function calculateSTTCost(provider: string, model: string, durationSeconds: number): number {
  const pricing = getPricing(provider, model);
  if (!pricing || !pricing.cost) {
    throw new Error(`STT pricing not found for ${provider}/${model}`);
  }

  if (pricing.unit === 'per_minute') {
    const minutes = durationSeconds / 60;
    return minutes * pricing.cost;
  }

  throw new Error(`Unsupported unit for STT: ${pricing.unit}`);
}

/**
 * Calculate cost for phone calls (time-based with connection fee)
 */
export function calculateCallCost(provider: string, model: string, durationSeconds: number): number {
  const pricing = getPricing(provider, model);
  if (!pricing || !pricing.cost) {
    throw new Error(`Call pricing not found for ${provider}/${model}`);
  }

  if (pricing.unit === 'per_minute') {
    const minutes = durationSeconds / 60;
    const durationCost = minutes * pricing.cost;
    const connectionFee = pricing.connectionFee || 0;
    return connectionFee + durationCost;
  }

  throw new Error(`Unsupported unit for calls: ${pricing.unit}`);
}

/**
 * Calculate payment processing fee (percentage + fixed)
 */
export function calculatePaymentFee(provider: string, model: string, amountCents: number): number {
  const pricing = getPricing(provider, model);
  if (!pricing || !pricing.cost) {
    throw new Error(`Payment fee pricing not found for ${provider}/${model}`);
  }

  if (pricing.unit === 'per_transaction') {
    const percentageFee = (amountCents * pricing.cost) / 100;
    const fixedFee = pricing.connectionFee || 0;
    return percentageFee + fixedFee;
  }

  throw new Error(`Unsupported unit for payment: ${pricing.unit}`);
}

/**
 * Get all available models for a provider
 */
export function getProviderModels(provider: string): string[] {
  const providerPricing = PRICING_CONFIG[provider];
  return providerPricing ? Object.keys(providerPricing) : [];
}

/**
 * Get pricing metadata for display/admin purposes
 */
export function getPricingMetadata() {
  const metadata: any = {};

  for (const [provider, models] of Object.entries(PRICING_CONFIG)) {
    metadata[provider] = {};
    for (const [model, pricing] of Object.entries(models)) {
      let costDisplay: string = 'N/A';

      if (pricing.inputCost && pricing.outputCost) {
        costDisplay = `$${pricing.inputCost / 100} input / $${pricing.outputCost / 100} output ${pricing.unit}`;
      } else if (pricing.cost) {
        costDisplay = `$${pricing.cost / 100} ${pricing.unit}`;
      } else {
        costDisplay = 'N/A';
      }

      if (pricing.connectionFee) {
        costDisplay += ` + $${pricing.connectionFee / 100} connection fee`;
      }

      metadata[provider][model] = {
        cost: costDisplay,
        lastUpdated: pricing.lastUpdated,
        source: pricing.source,
        notes: pricing.notes
      };
    }
  }

  return metadata;
}

/**
 * Check if pricing data is stale (older than 90 days)
 */
export function checkPricingFreshness(): { stale: boolean; oldestDate: string; daysOld: number } {
  let oldestDate = new Date();

  for (const provider of Object.values(PRICING_CONFIG)) {
    for (const model of Object.values(provider)) {
      const modelDate = new Date(model.lastUpdated);
      if (modelDate < oldestDate) {
        oldestDate = modelDate;
      }
    }
  }

  const daysOld = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
  const stale = daysOld > 90;

  return {
    stale,
    oldestDate: oldestDate.toISOString().split('T')[0] || '',
    daysOld
  };
}
