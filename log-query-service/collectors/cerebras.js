// Cerebras logs are captured by voice-pipeline on Vultr
// voice-pipeline logs format: "Cerebras inference: prompt_tokens: X completion_tokens: Y total_tokens: Z"

const VultrCollector = require('./vultr');

class CerebrasCollector {
  constructor() {
    // Uses VultrCollector to read voice-pipeline logs
    this.vultrCollector = new VultrCollector();
  }

  async search({ query, since = '1h', limit = 100 }) {
    const vultrLogs = await this.vultrCollector.search({
      query: 'cerebras',
      since,
      limit: limit * 2
    });

    return vultrLogs
      .filter(log => log.message.toLowerCase().includes('cerebras'))
      .map(log => ({
        ...log,
        service: 'cerebras',
        parsedData: this.parseCerebrasLog(log.message)
      }))
      .slice(0, limit);
  }

  parseCerebrasLog(message) {
    // Extract: tokens, model, latency
    const patterns = {
      prompt_tokens: /prompt_tokens:\s*(\d+)/i,
      completion_tokens: /completion_tokens:\s*(\d+)/i,
      total_tokens: /total_tokens:\s*(\d+)/i,
      model: /model:\s*([^\s,]+)/i,
      latency: /latency:\s*(\d+\.?\d*)/i
    };

    const data = {};
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern);
      if (match) data[key] = match[1];
    }

    return data;
  }

  async getCallLogs(callId) {
    const logs = await this.search({ query: callId, limit: 1000 });
    return logs;
  }
}

module.exports = CerebrasCollector;
