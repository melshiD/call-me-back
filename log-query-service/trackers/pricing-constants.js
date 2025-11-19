// Per PCR2.md - API Costs 2025
module.exports = {
  twilio: {
    per_minute: 0.014,      // Outbound US
    per_call: 0.0           // No per-call fee
  },

  deepgram: {
    per_minute: 0.0059,     // nova-2, streaming
    per_character: null     // Billed by time
  },

  cerebras: {
    per_token: 0.0000001,   // $0.10 per 1M tokens
    per_1m_tokens: 0.10
  },

  elevenlabs: {
    per_character: 0.00015, // $0.15 per 1K chars
    per_1k_chars: 0.15
  },

  raindrop: {
    per_call: 0.02,         // Amortized @ 1000 calls/month
    base_monthly: 20.00
  },

  stripe: {
    percent: 0.029,         // 2.9%
    flat: 0.30              // + $0.30 per transaction
  },

  // Pricing last updated
  last_updated: '2025-01-15',

  // API docs for updates
  docs: {
    twilio: 'https://www.twilio.com/voice/pricing/us',
    deepgram: 'https://deepgram.com/pricing',
    cerebras: 'https://cerebras.ai/pricing',
    elevenlabs: 'https://elevenlabs.io/pricing'
  }
};
