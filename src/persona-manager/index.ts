import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { CreatePersonaInput, Persona, Contact } from './interfaces';
import { executeSQL } from '../shared/db-helpers';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async getPersonas(): Promise<Persona[]> {
    try {
      this.env.logger.info('Fetching personas');

      const result = await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'SELECT * FROM personas WHERE is_public = 1 ORDER BY created_at DESC',
        []
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        voice: row.voice,
        systemPrompt: row.system_prompt,
        isPublic: Boolean(row.is_public),
        createdBy: row.created_by,
        tags: row.tags,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      this.env.logger.error('Failed to fetch personas', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async createPersona(input: CreatePersonaInput): Promise<Persona> {
    try {
      this.env.logger.info('Creating persona', { name: input.name });

      const personaId = crypto.randomUUID();
      const createdBy = 'system';

      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO personas (id, name, description, voice, system_prompt, is_public, created_by, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          personaId,
          input.name,
          input.description,
          input.voice,
          input.systemPrompt,
          input.isPublic ? 1 : 0,
          createdBy,
          input.tags || null,
        ]
      );

      this.env.logger.info('Persona created', { personaId, name: input.name });

      return {
        id: personaId,
        name: input.name,
        description: input.description,
        voice: input.voice,
        systemPrompt: input.systemPrompt,
        isPublic: input.isPublic ?? false,
        createdBy,
        tags: input.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.env.logger.error('Failed to create persona', { error: error instanceof Error ? error.message : String(error), name: input.name });
      throw error;
    }
  }

  async addContact(input: { userId: string; personaId: string }): Promise<Contact> {
    try {
      this.env.logger.info('Adding contact', { userId: input.userId, personaId: input.personaId });

      const contactId = crypto.randomUUID();

      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO contacts (id, user_id, persona_id) VALUES (?, ?, ?)',
        [contactId, input.userId, input.personaId]
      );

      this.env.logger.info('Contact added', { contactId });

      return {
        id: contactId,
        userId: input.userId,
        personaId: input.personaId,
        addedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.env.logger.error('Failed to add contact', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
