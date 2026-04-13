import { Hono } from 'hono';
import * as personaService from '../services/persona-service.js';
import { authMiddleware } from '../middleware/auth.js';

const personas = new Hono();

// Public: list all active personas
personas.get('/', async (c) => {
  const allPersonas = await personaService.getPersonas();
  return c.json(allPersonas);
});

// Authenticated: contacts CRUD
personas.get('/contacts', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const contacts = await personaService.getContacts(userId);
  return c.json(contacts);
});

personas.post('/contacts', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { personaId } = await c.req.json();
  if (!personaId) return c.json({ error: 'personaId required' }, 400);
  await personaService.addContact(userId, personaId);
  return c.json({ success: true });
});

personas.delete('/contacts/:personaId', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const personaId = c.req.param('personaId');
  if (!personaId) {
    return c.json({ error: 'Persona ID is required' }, 400);
  }
  await personaService.removeContact(userId, personaId);
  return c.json({ success: true });
});

export default personas;
