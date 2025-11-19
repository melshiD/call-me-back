const pricing = require('./pricing-constants');
const TwilioCollector = require('../collectors/twilio');
const DeepgramCollector = require('../collectors/deepgram');
const CerebrasCollector = require('../collectors/cerebras');
const ElevenLabsCollector = require('../collectors/elevenlabs');

class UsageTracker {
  constructor() {
    this.collectors = {
      twilio: new TwilioCollector(),
      deepgram: new DeepgramCollector(),
      cerebras: new CerebrasCollector(),
      elevenlabs: new ElevenLabsCollector()
    };
  }

  async getCallUsage(callId) {
    // Aggregate usage from all services for a specific call
    const [twilioLogs, deepgramLogs, cerebrasLogs, elevenLabsLogs] = await Promise.all([
      this.collectors.twilio.getCallLogs(callId),
      this.collectors.deepgram.getCallLogs(callId),
      this.collectors.cerebras.getCallLogs(callId),
      this.collectors.elevenlabs.getCallLogs(callId)
    ]);

    // Extract usage metrics
    const usage = {
      callId,
      timestamp: new Date(),

      twilio: {
        duration_seconds: twilioLogs?.duration || 0,
        duration_minutes: (twilioLogs?.duration || 0) / 60,
        status: twilioLogs?.status
      },

      deepgram: {
        duration_minutes: this.sumDeepgramDuration(deepgramLogs),
        transcript_length: this.sumTranscriptLength(deepgramLogs)
      },

      cerebras: {
        prompt_tokens: this.sumTokens(cerebrasLogs, 'prompt_tokens'),
        completion_tokens: this.sumTokens(cerebrasLogs, 'completion_tokens'),
        total_tokens: this.sumTokens(cerebrasLogs, 'total_tokens'),
        request_count: cerebrasLogs.length
      },

      elevenlabs: {
        total_characters: this.sumCharacters(elevenLabsLogs),
        request_count: elevenLabsLogs.length
      }
    };

    return usage;
  }

  async calculateCallCost(callId) {
    const usage = await this.getCallUsage(callId);

    const costs = {
      twilio: usage.twilio.duration_minutes * pricing.twilio.per_minute,
      deepgram: usage.deepgram.duration_minutes * pricing.deepgram.per_minute,
      cerebras: usage.cerebras.total_tokens * pricing.cerebras.per_token,
      elevenlabs: usage.elevenlabs.total_characters * pricing.elevenlabs.per_character,
      raindrop: pricing.raindrop.per_call
    };

    const subtotal = Object.values(costs).reduce((sum, cost) => sum + cost, 0);

    // Stripe fee (if user paid $4.99)
    const userCharge = 4.99;
    const stripeFee = (userCharge * pricing.stripe.percent) + pricing.stripe.flat;

    const totalCost = subtotal + stripeFee;
    const profit = userCharge - totalCost;
    const margin = (profit / userCharge) * 100;

    return {
      callId,
      usage,
      costs,
      subtotal,
      stripeFee,
      totalCost,
      userCharge,
      profit,
      margin: margin.toFixed(2) + '%'
    };
  }

  // Helper methods
  sumDeepgramDuration(logs) {
    // Sum up duration from parsed logs
    return logs.reduce((sum, log) => {
      const duration = parseFloat(log.parsedData?.duration || 0);
      return sum + duration;
    }, 0) / 60; // Convert to minutes
  }

  sumTranscriptLength(logs) {
    return logs.reduce((sum, log) => {
      const transcript = log.parsedData?.transcript || '';
      return sum + transcript.length;
    }, 0);
  }

  sumTokens(logs, field) {
    return logs.reduce((sum, log) => {
      const tokens = parseInt(log.parsedData?.[field] || 0);
      return sum + tokens;
    }, 0);
  }

  sumCharacters(logs) {
    return logs.reduce((sum, log) => {
      const chars = parseInt(log.parsedData?.characters || 0);
      return sum + chars;
    }, 0);
  }
}

module.exports = UsageTracker;
