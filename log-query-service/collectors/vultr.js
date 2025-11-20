const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class VultrCollector {
  constructor() {
    // PRIMARY LOG SOURCE: voice-pipeline logs contain Deepgram/Cerebras/ElevenLabs data
    this.voiceLogPath = process.env.VULTR_VOICE_LOG_PATH || '/root/.pm2/logs/voice-pipeline-out.log';
    this.dbLogPath = process.env.VULTR_DB_LOG_PATH || '/root/.pm2/logs/db-proxy-out.log';
  }

  async search({ query, since = '1h', limit = 100 }) {
    const logs = [
      ...(await this.readLogFile(this.voiceLogPath, since, limit)),
      ...(await this.readLogFile(this.dbLogPath, since, limit))
    ];

    if (query) {
      return logs.filter(log =>
        log.message.toLowerCase().includes(query.toLowerCase())
      );
    }

    return logs.slice(0, limit);
  }

  async readLogFile(filePath, since, limit) {
    try {
      // Use tail to get recent logs
      const lines = this.parseRelativeTime(since);
      const { stdout } = await execAsync(`tail -n ${lines} ${filePath}`);

      return stdout.split('\n')
        .filter(line => line.trim())
        .map(line => this.parseLogLine(line, filePath));
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return [];
    }
  }

  parseLogLine(line, filePath) {
    // PM2 log format: timestamp | message
    const service = filePath.includes('voice-pipeline') ? 'voice-pipeline' : 'db-proxy';

    return {
      timestamp: new Date(),
      service: `vultr-${service}`,
      message: line,
      raw: line
    };
  }

  parseRelativeTime(since) {
    const match = since.match(/^(\d+)([mhd])$/);
    if (!match) return 1000; // Default 1000 lines

    const [, amount, unit] = match;
    const multipliers = { m: 100, h: 1000, d: 10000 };
    return parseInt(amount) * multipliers[unit];
  }

  async getCallLogs(callId) {
    const logs = await this.search({ query: callId, limit: 10000 });
    return logs;
  }
}

module.exports = VultrCollector;
