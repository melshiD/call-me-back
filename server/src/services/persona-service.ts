import { query } from '../db.js';
import { generateId, getCurrentTimestamp } from '../lib/utils.js';

export async function getPersonas() {
  const result = await query(
    'SELECT id, name, description, default_voice_id, core_system_prompt, category, is_system_persona, is_active, temperature, max_tokens, llm_model, max_call_duration, twilio_phone_number, created_at FROM personas WHERE is_active = true ORDER BY name'
  );
  return result.rows;
}

export async function getPersonaById(personaId: string) {
  const result = await query('SELECT * FROM personas WHERE id = $1', [personaId]);
  return result.rows[0] || null;
}

export async function updatePersona(personaId: string, updates: Record<string, any>) {
  const allowedFields = ['core_system_prompt', 'default_voice_id', 'temperature', 'max_tokens', 'llm_model', 'max_call_duration', 'name', 'description', 'category', 'is_active'];
  const setClauses: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) return;

  setClauses.push(`updated_at = $${paramIndex}`);
  values.push(getCurrentTimestamp());
  paramIndex++;

  values.push(personaId);
  await query(
    `UPDATE personas SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

export async function getContacts(userId: string) {
  const result = await query(
    `SELECT p.id, p.name, p.description, p.default_voice_id, p.category, p.twilio_phone_number,
            upr.relationship_type, upr.is_favorite, upr.created_at as contact_since
     FROM user_persona_relationships upr
     JOIN personas p ON p.id = upr.persona_id
     WHERE upr.user_id = $1 AND upr.is_favorite = true
     ORDER BY upr.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addContact(userId: string, personaId: string) {
  const existing = await query(
    'SELECT id FROM user_persona_relationships WHERE user_id = $1 AND persona_id = $2',
    [userId, personaId]
  );

  if (existing.rows.length > 0) {
    await query(
      'UPDATE user_persona_relationships SET is_favorite = true, updated_at = $1 WHERE user_id = $2 AND persona_id = $3',
      [getCurrentTimestamp(), userId, personaId]
    );
  } else {
    await query(
      `INSERT INTO user_persona_relationships (id, user_id, persona_id, relationship_type, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, 'friend', true, $4, $4)`,
      [generateId(), userId, personaId, getCurrentTimestamp()]
    );
  }
}

export async function removeContact(userId: string, personaId: string) {
  await query(
    'UPDATE user_persona_relationships SET is_favorite = false, updated_at = $1 WHERE user_id = $2 AND persona_id = $3',
    [getCurrentTimestamp(), userId, personaId]
  );
}
