// ElevenLabs logs are captured by voice-pipeline on Vultr
// voice-pipeline logs format: "ElevenLabs TTS: characters: X voice_id: Y model: Z"

const VultrCollector = require('./vultr');

class ElevenLabsCollector {
  constructor() {
    // Uses VultrCollector to read voice-pipeline logs
    this.vultrCollector = new VultrCollector();
  }

  async search({ query, since = '1h', limit = 100 }) {
    const vultrLogs = await this.vultrCollector.search({
      query: 'elevenlabs',
      since,
      limit: limit * 2
    });

    return vultrLogs
      .filter(log => log.message.toLowerCase().includes('elevenlabs'))
      .map(log => ({
        ...log,
        service: 'elevenlabs',
        parsedData: this.parseElevenLabsLog(log.message)
      }))
      .slice(0, limit);
  }

  parseElevenLabsLog(message) {
    // Extract: characters, voice_id, latency
    const patterns = {
      characters: /characters:\s*(\d+)/i,
      voice_id: /voice_id:\s*([^\s,]+)/i,
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

module.exports = ElevenLabsCollector;
