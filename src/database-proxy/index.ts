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
      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.info('Database proxy executing query', {
      //   sqlPreview: sql.substring(0, 100),
      //   paramsCount: params?.length || 0
      // });
      // TESTING: Using console instead as binding test
      console.log('Database proxy executing query:', sql.substring(0, 100), 'params:', params?.length || 0);

      // BINDING FIX: Store env reference to avoid this binding issues
      const env = this.env;
      const dbConfig: VultrDbConfig = {
        apiUrl: 'https://db.ai-tools-marketplace.io',
        apiKey: env.VULTR_DB_API_KEY
      };

      const result = await executeSQL(dbConfig, sql, params);

      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.info('Query executed successfully', {
      //   rowCount: result.rows?.length || 0
      // });
      // TESTING: Using console instead as binding test
      console.log('Query executed successfully, rows:', result.rows?.length || 0);

      return result;
    } catch (error) {
      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.error('Database proxy query failed', {
      //   error: error instanceof Error ? error.message : String(error),
      //   sqlPreview: sql.substring(0, 100)
      // });
      // TESTING: Using console instead as binding test
      console.error('Database proxy query failed:', error instanceof Error ? error.message : String(error), sql.substring(0, 100));
      throw error;
    }
  }

  /**
   * Get all personas from the database
   */
  async getPersonas(): Promise<any[]> {
    try {
      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.info('Database proxy: Fetching personas');
      // TESTING: Using console instead as binding test
      console.log('Database proxy: Fetching personas');

      const result = await this.executeQuery(
        'SELECT * FROM personas ORDER BY created_at DESC',
        []
      );

      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.info('Personas fetched', { count: result.rows.length });
      // TESTING: Using console instead as binding test
      console.log('Personas fetched:', result.rows.length);
      return result.rows;
    } catch (error) {
      // COMMENTED FOR LOGGER BINDING FIX - cross-service calls lose this binding
      // this.env.logger.error('Failed to fetch personas via database proxy', {
      //   error: error instanceof Error ? error.message : String(error)
      // });
      // TESTING: Using console instead as binding test
      console.error('Failed to fetch personas via database proxy:', error instanceof Error ? error.message : String(error));
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

  async updatePersona(personaId: string, data: {
    core_system_prompt?: string;
    default_voice_id?: string;
    temperature?: number;
    max_tokens?: number;
    llm_model?: string;
    max_call_duration?: number;
  }): Promise<void> {
    try {
      console.log('Database proxy: Updating persona', { personaId, fields: Object.keys(data) });

      // Build dynamic UPDATE query based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.core_system_prompt !== undefined) {
        updates.push(`core_system_prompt = $${paramIndex++}`);
        values.push(data.core_system_prompt);
      }
      if (data.default_voice_id !== undefined) {
        updates.push(`default_voice_id = $${paramIndex++}`);
        values.push(data.default_voice_id);
      }
      if (data.temperature !== undefined) {
        updates.push(`temperature = $${paramIndex++}`);
        values.push(data.temperature);
      }
      if (data.max_tokens !== undefined) {
        updates.push(`max_tokens = $${paramIndex++}`);
        values.push(data.max_tokens);
      }
      if (data.llm_model !== undefined) {
        updates.push(`llm_model = $${paramIndex++}`);
        values.push(data.llm_model);
      }
      if (data.max_call_duration !== undefined) {
        updates.push(`max_call_duration = $${paramIndex++}`);
        values.push(data.max_call_duration);
      }

      if (updates.length === 0) {
        console.log('Database proxy: No fields to update');
        return;
      }

      // Always update updated_at
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add personaId as the last parameter
      values.push(personaId);

      const query = `UPDATE personas SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
      
      console.log('Database proxy: Executing update query', { query, valueCount: values.length });
      await this.executeQuery(query, values);

      console.log('Persona updated via database proxy', { personaId });
    } catch (error) {
      console.error('Failed to update persona via database proxy', {
        error: error instanceof Error ? error.message : String(error),
        personaId
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

      // Insert into user_persona_relationships with is_favorite = true
      await this.executeQuery(
        'INSERT INTO user_persona_relationships (id, user_id, persona_id, is_favorite) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, persona_id) DO UPDATE SET is_favorite = true',
        [data.id, data.userId, data.personaId, true]
      );

      this.env.logger.info('Contact added via database proxy', { id: data.id });
    } catch (error) {
      this.env.logger.error('Failed to add contact via database proxy', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get all contacts for a user
   */
  async getContacts(userId: string): Promise<any[]> {
    try {
      this.env.logger.info('Database proxy: Fetching contacts for user', { userId });

      const result = await this.executeQuery(
        `SELECT r.id, r.user_id, r.persona_id, r.created_at as added_at,
                p.id as persona_id, p.name, p.description, p.default_voice_id as voice,
                p.core_system_prompt as system_prompt, p.is_system_persona as is_public,
                p.category
         FROM user_persona_relationships r
         JOIN personas p ON r.persona_id = p.id
         WHERE r.user_id = $1 AND r.is_favorite = true
         ORDER BY r.created_at DESC`,
        [userId]
      );

      this.env.logger.info('Contacts fetched via database proxy', { count: result.rows.length });
      return result.rows;
    } catch (error) {
      this.env.logger.error('Failed to fetch contacts via database proxy', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Remove a contact from the database
   */
  async removeContact(userId: string, personaId: string): Promise<void> {
    try {
      this.env.logger.info('Database proxy: Removing contact', { userId, personaId });

      // Set is_favorite to false instead of deleting (preserve call history)
      await this.executeQuery(
        'UPDATE user_persona_relationships SET is_favorite = false WHERE user_id = $1 AND persona_id = $2',
        [userId, personaId]
      );

      this.env.logger.info('Contact removed via database proxy');
    } catch (error) {
      this.env.logger.error('Failed to remove contact via database proxy', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Record a cost event for tracking API usage
   * RECREATED: Lost in git checkout - see NSL 2025-11-22_12-30
   */
  async recordCostEvent(data: {
    callId: string;
    userId?: string;
    personaId?: string;
    service: string;
    operation: string;
    usageAmount: number;
    usageUnit: string;
    unitCost: number;
    totalCost: number;
    metadata?: any;
  }): Promise<void> {
    try {
      // TESTING: Using console for cross-service calls - logger binding issue
      console.log('Database proxy: Recording cost event', {
        service: data.service,
        operation: data.operation,
        totalCost: data.totalCost
      });

      await this.executeQuery(
        `INSERT INTO api_call_events
         (call_id, user_id, persona_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          data.callId,
          data.userId || null,
          data.personaId || null,
          data.service,
          data.operation,
          data.usageAmount,
          data.usageUnit,
          data.unitCost,
          data.totalCost,
          data.metadata ? JSON.stringify(data.metadata) : null
        ]
      );

      console.log('Cost event recorded', { service: data.service });
    } catch (error) {
      console.error('Failed to record cost event', {
        error: error instanceof Error ? error.message : String(error),
        service: data.service
      });
      throw error;
    }
  }

  /**
   * Update total costs for a call
   * RECREATED: Lost in git checkout - see NSL 2025-11-22_12-30
   */
  async updateCallCosts(callId: string, totalCostUsd: number): Promise<void> {
    try {
      // TESTING: Using console for cross-service calls - logger binding issue
      console.log('Database proxy: Updating call costs', { callId, totalCostUsd });

      await this.executeQuery(
        'UPDATE calls SET cost_usd = $1 WHERE id = $2',
        [totalCostUsd, callId]
      );

      console.log('Call costs updated', { callId });
    } catch (error) {
      console.error('Failed to update call costs', {
        error: error instanceof Error ? error.message : String(error),
        callId
      });
      throw error;
    }
  }

  /**
   * Get current price for a service from database
   * RECREATED: Lost in git checkout - see NSL 2025-11-22_12-30
   */
  async getCurrentPrice(service: string, pricingType: string): Promise<number> {
    try {
      const result = await this.executeQuery(
        'SELECT get_current_price($1, $2) as price',
        [service, pricingType]
      );

      const price = result.rows?.[0]?.price || 0;

      if (price === 0) {
        console.warn('No price found for service', { service, pricingType });
      }

      return parseFloat(String(price));
    } catch (error) {
      console.error('Failed to get current price', {
        error: error instanceof Error ? error.message : String(error),
        service,
        pricingType
      });
      return 0; // Return 0 instead of throwing - graceful degradation
    }
  }
}
