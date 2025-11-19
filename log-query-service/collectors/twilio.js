const axios = require('axios');

class TwilioCollector {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
  }

  async search({ query, since = '1h', limit = 100 }) {
    const startDate = this.parseRelativeTime(since);

    try {
      // Get call logs
      const callsResponse = await axios.get(`${this.baseUrl}/Calls.json`, {
        auth: { username: this.accountSid, password: this.authToken },
        params: {
          StartTime: startDate,
          PageSize: limit
        }
      });

      const logs = callsResponse.data.calls.map(call => ({
        timestamp: call.start_time,
        service: 'twilio',
        type: 'call',
        callSid: call.sid,
        from: call.from,
        to: call.to,
        status: call.status,
        duration: call.duration,
        message: `Call ${call.sid}: ${call.status} - ${call.duration}s`,
        raw: call
      }));

      // Filter by query if provided
      if (query) {
        return logs.filter(log =>
          JSON.stringify(log).toLowerCase().includes(query.toLowerCase())
        );
      }

      return logs;
    } catch (error) {
      console.error('Twilio collector error:', error);
      throw error;
    }
  }

  async getCallLogs(callId) {
    // Get specific call details
    try {
      const response = await axios.get(`${this.baseUrl}/Calls/${callId}.json`, {
        auth: { username: this.accountSid, password: this.authToken }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Twilio call:', error);
      return null;
    }
  }

  parseRelativeTime(since) {
    const match = since.match(/^(\d+)([mhd])$/);
    if (!match) return new Date(Date.now() - 3600000); // Default 1h

    const [, amount, unit] = match;
    const multipliers = { m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(amount) * multipliers[unit];

    return new Date(Date.now() - ms);
  }
}

module.exports = TwilioCollector;
