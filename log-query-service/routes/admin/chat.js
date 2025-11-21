const express = require('express');
const crypto = require('crypto');
const { pool } = require('../../utils/database');
const jwtAuth = require('../../middleware/jwt-auth');

const router = express.Router();

// All routes require JWT auth
router.use(jwtAuth);

// Lazy-load Cerebras client
let cerebras = null;
function getCerebras() {
  if (!cerebras && process.env.CEREBRAS_API_KEY) {
    const Cerebras = require('@cerebras/cerebras_cloud_sdk').default;
    cerebras = new Cerebras({ apiKey: process.env.CEREBRAS_API_KEY });
  }
  return cerebras;
}

// In-memory session storage
const chatSessions = new Map();

// Cleanup old sessions every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000; // 1 hour
  for (const [id, session] of chatSessions) {
    if (session.createdAt.getTime() < cutoff) {
      chatSessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

// POST /api/admin/chat - Single-turn chat (quick testing)
router.post('/', async (req, res) => {
  const { persona_id, message, overrides = {} } = req.body;

  if (!persona_id || !message) {
    return res.status(400).json({ error: 'persona_id and message are required' });
  }

  try {
    const personaResult = await pool.query(
      'SELECT * FROM personas WHERE id = $1',
      [persona_id]
    );

    if (personaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const persona = personaResult.rows[0];
    const config = {
      max_tokens: overrides.max_tokens ?? persona.max_tokens ?? 100,
      temperature: overrides.temperature ?? persona.temperature ?? 0.7,
      system_prompt: overrides.core_system_prompt || persona.core_system_prompt
    };

    const client = getCerebras();
    if (!client) {
      return res.status(503).json({ error: 'Chat service not configured (CEREBRAS_API_KEY missing)' });
    }

    const startTime = Date.now();
    const completion = await client.chat.completions.create({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: config.system_prompt },
        { role: 'user', content: message }
      ],
      max_tokens: config.max_tokens,
      temperature: config.temperature
    });

    const latencyMs = Date.now() - startTime;
    const tokensIn = completion.usage?.prompt_tokens || 0;
    const tokensOut = completion.usage?.completion_tokens || 0;
    const cerebrasCost = (tokensIn + tokensOut) * 0.0000001;

    // Track cost
    try {
      await pool.query(`
        INSERT INTO call_cost_events
          (call_id, user_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost)
        VALUES (NULL, $1, 'cerebras', 'admin_debug_chat', $2, 'tokens', 0.0000001, $3)
      `, [req.admin.id, tokensIn + tokensOut, cerebrasCost]);
    } catch (costErr) {
      console.error('Failed to track cost:', costErr);
    }

    res.json({
      response: completion.choices[0].message.content,
      metrics: {
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        latency_ms: latencyMs
      },
      cost: { cerebras_usd: cerebrasCost },
      config_used: config
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed: ' + err.message });
  }
});

// POST /api/admin/chat/session - Create multi-turn session
router.post('/session', async (req, res) => {
  const { persona_id, overrides = {} } = req.body;

  if (!persona_id) {
    return res.status(400).json({ error: 'persona_id is required' });
  }

  try {
    const personaResult = await pool.query(
      'SELECT * FROM personas WHERE id = $1',
      [persona_id]
    );

    if (personaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    const persona = personaResult.rows[0];
    const sessionId = crypto.randomUUID();

    chatSessions.set(sessionId, {
      adminId: req.admin.id,
      persona: { ...persona, ...overrides },
      messages: [],
      totalCost: 0,
      createdAt: new Date()
    });

    res.json({
      session_id: sessionId,
      persona: {
        id: persona.id,
        name: persona.name,
        max_tokens: overrides.max_tokens ?? persona.max_tokens,
        temperature: overrides.temperature ?? persona.temperature
      }
    });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// POST /api/admin/chat/:sessionId/message - Send message to session
router.post('/:sessionId/message', async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;

  const session = chatSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Not your session' });
  }

  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }

  try {
    session.messages.push({ role: 'user', content });

    const messages = [
      { role: 'system', content: session.persona.core_system_prompt },
      ...session.messages
    ];

    const client = getCerebras();
    if (!client) {
      return res.status(503).json({ error: 'Chat service not configured (CEREBRAS_API_KEY missing)' });
    }

    const startTime = Date.now();
    const completion = await client.chat.completions.create({
      model: 'llama3.1-8b',
      messages,
      max_tokens: session.persona.max_tokens || 100,
      temperature: session.persona.temperature || 0.7
    });

    const latencyMs = Date.now() - startTime;
    const assistantContent = completion.choices[0].message.content;
    const tokensIn = completion.usage?.prompt_tokens || 0;
    const tokensOut = completion.usage?.completion_tokens || 0;
    const cerebrasCost = (tokensIn + tokensOut) * 0.0000001;

    session.messages.push({ role: 'assistant', content: assistantContent });
    session.totalCost += cerebrasCost;

    res.json({
      role: 'assistant',
      content: assistantContent,
      metrics: { tokens_in: tokensIn, tokens_out: tokensOut, latency_ms: latencyMs },
      cost: { cerebras_usd: cerebrasCost, session_total_usd: session.totalCost }
    });
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({ error: 'Failed to send message: ' + err.message });
  }
});

// GET /api/admin/chat/:sessionId - Get session history
router.get('/:sessionId', (req, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Not your session' });
  }

  res.json({
    session_id: req.params.sessionId,
    persona_id: session.persona.id,
    persona_name: session.persona.name,
    messages: session.messages,
    total_cost_usd: session.totalCost,
    created_at: session.createdAt
  });
});

// DELETE /api/admin/chat/:sessionId - End session
router.delete('/:sessionId', (req, res) => {
  const session = chatSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.adminId !== req.admin.id) {
    return res.status(403).json({ error: 'Not your session' });
  }

  chatSessions.delete(req.params.sessionId);
  res.json({ success: true });
});

module.exports = router;
