// Deepgram logs are captured by voice-pipeline on Vultr
// voice-pipeline logs format: "Deepgram transcript: ... duration: X confidence: Y"

const VultrCollector = require('./vultr');

class DeepgramCollector {
  constructor() {
    // Uses VultrCollector to read voice-pipeline logs
    this.vultrCollector = new VultrCollector();
  }

  async search({ query, since = '1h', limit = 100 }) {
    // Extract Deepgram/transcript events from voice-pipeline logs
    const searchQuery = query || 'transcript';
    const vultrLogs = await this.vultrCollector.search({
      query: searchQuery,
      since,
      limit: limit * 2 // Get more to filter down
    });

    return vultrLogs
      .filter(log => log.message.toLowerCase().includes('transcript'))
      .map(log => ({
        ...log,
        service: 'deepgram',
        parsedData: this.parseDeepgramLog(log.message)
      }))
      .slice(0, limit);
  }

  parseDeepgramLog(message) {
    // Extract: transcript, duration, confidence, etc.
    // Actual format: [VoicePipeline CALL_ID] Full user transcript: "text here"
    const patterns = {
      transcript: /Full user transcript:\s*"(.+?)"/i,
      duration: /duration:\s*(\d+\.?\d*)/i,
      confidence: /confidence:\s*(\d+\.?\d*)/i,
      isFinal: /is_final:\s*(true|false)/i,
      callId: /\[VoicePipeline\s+(CA[a-f0-9]+)\]/i
    };

    const data = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) data[key] = match[1];
    }

    // Default isFinal to true if not specified
    if (!data.isFinal) data.isFinal = 'true';

    return data;
  }

  async getCallLogs(callId) {
    // Get Deepgram events for specific call
    const logs = await this.search({ query: callId, limit: 1000 });
    return logs;
  }
}

module.exports = DeepgramCollector;
