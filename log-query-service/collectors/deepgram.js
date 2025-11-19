// Deepgram logs are captured by voice-pipeline on Vultr
// voice-pipeline logs format: "Deepgram transcript: ... duration: X confidence: Y"

const VultrCollector = require('./vultr');

class DeepgramCollector {
  constructor() {
    // Uses VultrCollector to read voice-pipeline logs
    this.vultrCollector = new VultrCollector();
  }

  async search({ query, since = '1h', limit = 100 }) {
    // Extract Deepgram events from voice-pipeline logs
    const vultrLogs = await this.vultrCollector.search({
      query: 'deepgram',
      since,
      limit: limit * 2 // Get more to filter down
    });

    return vultrLogs
      .filter(log => log.message.toLowerCase().includes('deepgram'))
      .map(log => ({
        ...log,
        service: 'deepgram',
        parsedData: this.parseDeepgramLog(log.message)
      }))
      .slice(0, limit);
  }

  parseDeepgramLog(message) {
    // Extract: transcript, duration, confidence, etc.
    const patterns = {
      transcript: /transcript:\s*(.+?)(?=\s*\[|$)/i,
      duration: /duration:\s*(\d+\.?\d*)/i,
      confidence: /confidence:\s*(\d+\.?\d*)/i,
      isFinal: /is_final:\s*(true|false)/i
    };

    const data = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) data[key] = match[1];
    }

    return data;
  }

  async getCallLogs(callId) {
    // Get Deepgram events for specific call
    const logs = await this.search({ query: callId, limit: 1000 });
    return logs;
  }
}

module.exports = DeepgramCollector;
