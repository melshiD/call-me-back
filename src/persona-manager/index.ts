import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { CreatePersonaInput, Persona, Contact } from './interfaces';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async getPersonas(): Promise<Persona[]> {
    try {
      this.env.logger.info('Fetching personas via database-proxy service');

      // Call the database-proxy service (no external URL restrictions!)
      const rows = await this.env.DATABASE_PROXY.getPersonas();

      this.env.logger.info('Fetched personas via database-proxy', {
        count: rows.length
      });

      if (!rows || rows.length === 0) {
        this.env.logger.warn('No personas found in database');
        return [];
      }

      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        voice: row.default_voice_id,
        systemPrompt: row.core_system_prompt,
        isPublic: Boolean(row.is_system_persona),
        createdBy: row.is_system_persona ? 'system' : 'user',
        tags: row.category ? [row.category] : [],
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
      this.env.logger.info('Creating persona via database-proxy', { name: input.name });

      const personaId = crypto.randomUUID();
      const createdBy = 'user'; // User-created personas

      // Call the database-proxy service
      await this.env.DATABASE_PROXY.createPersona({
        id: personaId,
        name: input.name,
        description: input.description,
        systemPrompt: input.systemPrompt,
        voice: input.voice,
        category: (input.tags && input.tags.length > 0 ? input.tags[0] : null) ?? null
      });

      this.env.logger.info('Persona created via database-proxy', { personaId, name: input.name });

      return {
        id: personaId,
        name: input.name,
        description: input.description,
        voice: input.voice,
        systemPrompt: input.systemPrompt,
        isPublic: false,
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
      this.env.logger.info('Adding contact via database-proxy', { userId: input.userId, personaId: input.personaId });

      const contactId = crypto.randomUUID();

      // Call the database-proxy service
      await this.env.DATABASE_PROXY.addContact({
        id: contactId,
        userId: input.userId,
        personaId: input.personaId
      });

      this.env.logger.info('Contact added via database-proxy', { contactId });

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

  async getContacts(userId: string): Promise<any[]> {
    try {
      this.env.logger.info('Fetching contacts via database-proxy', { userId });

      // Call the database-proxy service
      const rows = await this.env.DATABASE_PROXY.getContacts(userId);

      this.env.logger.info('Fetched contacts via database-proxy', { count: rows.length });

      // Transform the data to match frontend expectations
      return rows.map((row: any) => ({
        id: row.persona_id,
        name: row.name,
        description: row.description,
        voice: row.voice,
        systemPrompt: row.system_prompt,
        isPublic: Boolean(row.is_public),
        createdBy: row.is_public ? 'system' : 'user',
        tags: row.category ? [row.category] : [],
        addedAt: row.added_at
      }));
    } catch (error) {
      this.env.logger.error('Failed to fetch contacts', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async removeContact(input: { userId: string; personaId: string }): Promise<void> {
    try {
      this.env.logger.info('Removing contact via database-proxy', { userId: input.userId, personaId: input.personaId });

      // Call the database-proxy service
      await this.env.DATABASE_PROXY.removeContact(input.userId, input.personaId);

      this.env.logger.info('Contact removed via database-proxy');
    } catch (error) {
      this.env.logger.error('Failed to remove contact', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
