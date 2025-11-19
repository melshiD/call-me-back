const express = require('express');
const router = express.Router();
const UsageTracker = require('../../trackers/usage-tracker');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    // Check cache first
    const cached = cache.get(`usage:${callId}`);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const tracker = new UsageTracker();
    const costBreakdown = await tracker.calculateCallCost(callId);

    // Cache result
    cache.set(`usage:${callId}`, costBreakdown);

    res.json(costBreakdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
