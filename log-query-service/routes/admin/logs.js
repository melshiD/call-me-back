const express = require('express');
const router = express.Router();
const VultrCollector = require('../../collectors/vultr');
const TwilioCollector = require('../../collectors/twilio');

const vultrCollector = new VultrCollector();
const twilioCollector = new TwilioCollector();

// GET /api/admin/logs
// Search across all log sources
router.get('/', async (req, res) => {
  try {
    const {
      service = 'all',  // 'vultr', 'twilio', 'all'
      since = '1h',     // '10m', '1h', '24h'
      query = '',       // Search term
      limit = 100
    } = req.query;

    let logs = [];

    // Collect from Vultr PM2 logs
    if (service === 'vultr' || service === 'all') {
      try {
        const vultrLogs = await vultrCollector.search({
          query,
          since,
          limit: parseInt(limit)
        });
        logs = logs.concat(vultrLogs.map(log => ({
          ...log,
          source: 'vultr'
        })));
      } catch (error) {
        console.error('Error fetching Vultr logs:', error);
        // Continue even if Vultr logs fail
      }
    }

    // Collect from Twilio (if needed)
    if (service === 'twilio' || service === 'all') {
      try {
        const twilioLogs = await twilioCollector.search({
          query,
          since,
          limit: parseInt(limit)
        });
        logs = logs.concat(twilioLogs.map(log => ({
          ...log,
          source: 'twilio'
        })));
      } catch (error) {
        console.error('Error fetching Twilio logs:', error);
        // Continue even if Twilio logs fail
      }
    }

    // Sort by timestamp descending
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Limit results
    logs = logs.slice(0, parseInt(limit));

    res.json({
      total: logs.length,
      query: { service, since, query, limit: parseInt(limit) },
      logs
    });
  } catch (error) {
    console.error('Error searching logs:', error);
    res.status(500).json({
      error: 'Failed to search logs',
      message: error.message
    });
  }
});

module.exports = router;
