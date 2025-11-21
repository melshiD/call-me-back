const express = require('express');
const { pool } = require('../../utils/database');
const jwtAuth = require('../../middleware/jwt-auth');

const router = express.Router();

// All routes require JWT auth
router.use(jwtAuth);

// GET /api/admin/personas - List all personas with stats
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
             COALESCE(COUNT(c.id), 0)::int as total_calls,
             COALESCE(SUM(c.duration_seconds), 0)::int as total_duration
      FROM personas p
      LEFT JOIN calls c ON c.persona_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `);
    res.json({ personas: result.rows });
  } catch (err) {
    console.error('Get personas error:', err);
    res.status(500).json({ error: 'Failed to fetch personas' });
  }
});

// GET /api/admin/personas/:id - Get single persona
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM personas WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get persona error:', err);
    res.status(500).json({ error: 'Failed to fetch persona' });
  }
});

// PATCH /api/admin/personas/:id - Update persona
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowed = ['name', 'description', 'max_tokens', 'temperature',
                   'default_voice_id', 'core_system_prompt', 'category'];

  const setClauses = [];
  const values = [];
  let i = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowed.includes(key)) {
      setClauses.push(`${key} = $${i}`);
      values.push(value);
      i++;
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  try {
    values.push(id);
    const result = await pool.query(`
      UPDATE personas
      SET ${setClauses.join(', ')}, updated_at = NOW()
      WHERE id = $${i}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    res.json({ success: true, persona: result.rows[0] });
  } catch (err) {
    console.error('Update persona error:', err);
    res.status(500).json({ error: 'Failed to update persona' });
  }
});

// POST /api/admin/personas - Create new persona
router.post('/', async (req, res) => {
  const { id, name, description, category, default_voice_id,
          core_system_prompt, max_tokens, temperature } = req.body;

  if (!name || !core_system_prompt) {
    return res.status(400).json({ error: 'Name and core_system_prompt are required' });
  }

  const personaId = id || `${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  try {
    const result = await pool.query(`
      INSERT INTO personas (id, name, description, category, default_voice_id,
                            core_system_prompt, max_tokens, temperature, is_system_persona)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false)
      RETURNING *
    `, [personaId, name, description, category, default_voice_id,
        core_system_prompt, max_tokens || 100, temperature || 0.7]);

    res.json({ success: true, persona: result.rows[0] });
  } catch (err) {
    console.error('Create persona error:', err);
    res.status(500).json({ error: 'Failed to create persona' });
  }
});

// DELETE /api/admin/personas/:id - Delete persona
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM personas WHERE id = $1 AND is_system_persona = false RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Persona not found or is a system persona' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete persona error:', err);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
});

module.exports = router;
