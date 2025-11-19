const express = require('express');
const router = express.Router();
const UsageTracker = require('../../trackers/usage-tracker');
const Database = require('../../utils/database');

router.post('/', async (req, res) => {
  try {
    const { callId, userId } = req.body;

    if (!callId || !userId) {
      return res.status(400).json({ error: 'callId and userId required' });
    }

    const tracker = new UsageTracker();
    const costBreakdown = await tracker.calculateCallCost(callId);

    // Write to database
    const db = new Database();
    await db.writeCallCostEvents(callId, userId, costBreakdown);

    res.json({
      success: true,
      callId,
      costBreakdown,
      message: 'Cost data written to call_cost_events table'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
