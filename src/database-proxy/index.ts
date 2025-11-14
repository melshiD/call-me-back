import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { executeSQL, type VultrDbConfig } from '../shared/db-helpers-vultr';

/**
 * Database Proxy Service
 *
 * This service acts as a proxy between Cloudflare Workers and Vultr PostgreSQL.
 * It handles all external database connections, allowing other Workers to call it
 * via service-to-service communication without hitting Cloudflare's external URL restrictions.
 */
export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Database Proxy Service - Not implemented', { status: 501 });
  }

  /**
   * Execute a SQL query against the Vultr PostgreSQL database
   */
  async executeQuery(sql: string, params?: any[]): Promise<{ rows: any[] }> {
    try {
      this.env.logger.info('Database proxy executing query', {
        sqlPreview: sql.substring(0, 100),
        paramsCount: params?.length || 0
      });

      const dbConfig: VultrDbConfig = {
        apiUrl: 'https://db.ai-tools-marketplace.io',
        apiKey: this.env.VULTR_DB_API_KEY
      };

      const result = await executeSQL(dbConfig, sql, params);

      this.env.logger.info('Query executed successfully', {
        rowCount: result.rows?.length || 0
      });

      return result;
    } catch (error) {
      this.env.logger.error('Database proxy query failed', {
        error: error instanceof Error ? error.message : String(error),
        sqlPreview: sql.substring(0, 100)
      });
      throw error;
    }
  }

  /**
   * Get all personas from the database
   */
  async getPersonas(): Promise<any[]> {
    try {
      this.env.logger.info('Database proxy: Fetching personas');

      const result = await this.executeQuery(
        'SELECT * FROM personas ORDER BY created_at DESC',
        []
      );

      this.env.logger.info('Personas fetched', { count: result.rows.length });
      return result.rows;
    } catch (error) {
      this.env.logger.error('Failed to fetch personas via database proxy', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create a new persona in the database
   */
  async createPersona(data: {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    voice: string;
    category: string | null;
  }): Promise<void> {
    try {
      this.env.logger.info('Database proxy: Creating persona', { name: data.name });

      await this.executeQuery(
        'INSERT INTO personas (id, name, description, core_system_prompt, default_voice_id, category, is_active, is_system_persona) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          data.id,
          data.name,
          data.description,
          data.systemPrompt,
          data.voice,
          data.category,
          true,
          false
        ]
      );

      this.env.logger.info('Persona created via database proxy', { id: data.id });
    } catch (error) {
      this.env.logger.error('Failed to create persona via database proxy', {
        error: error instanceof Error ? error.message : String(error),
        name: data.name
      });
      throw error;
    }
  }

  /**
   * Add a contact to the database
   */
  async addContact(data: {
    id: string;
    userId: string;
    personaId: string;
  }): Promise<void> {
    try {
      this.env.logger.info('Database proxy: Adding contact', {
        userId: data.userId,
        personaId: data.personaId
      });

      await this.executeQuery(
        'INSERT INTO contacts (id, user_id, persona_id) VALUES ($1, $2, $3)',
        [data.id, data.userId, data.personaId]
      );

      this.env.logger.info('Contact added via database proxy', { id: data.id });
    } catch (error) {
      this.env.logger.error('Failed to add contact via database proxy', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}
