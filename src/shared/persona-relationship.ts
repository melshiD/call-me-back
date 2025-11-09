// Persona Relationship Management - User-specific persona contexts
import type { SmartSql, SmartMemory } from '@liquidmetal-ai/raindrop-framework';
import { executeSQL } from './db-helpers';

export interface PersonaRelationship {
  id: string;
  user_id: string;
  persona_id: string;
  relationship_type: string;
  custom_system_prompt: string | null;
  memory_config: {
    remember_relationship_details: boolean;
    remember_past_conversations: boolean;
    remember_personal_facts: boolean;
    auto_recall_depth: number;
  };
  total_calls: number;
  total_minutes: number;
  last_call_at: string | null;
}

export interface LongTermMemory {
  relationship_facts: Record<string, any>;
  user_facts: Record<string, any>;
  inside_jokes: string[];
  important_memories: Array<{
    event: string;
    date: string;
    significance: 'high' | 'medium' | 'low';
    summary: string;
  }>;
  preferences: Record<string, any>;
}

export interface CompositePrompt {
  core_prompt: string;
  relationship_context: string;
  user_facts: string;
  recent_context: string;
  full_prompt: string;
  token_count: number;
}

export class PersonaRelationshipManager {
  private db: SmartSql;
  private memory: SmartMemory;

  constructor(db: SmartSql, memory: SmartMemory) {
    this.db = db;
    this.memory = memory;
  }

  /**
   * Get or create relationship between user and persona
   */
  async getOrCreateRelationship(
    userId: string,
    personaId: string,
    initialType: string = 'friend'
  ): Promise<PersonaRelationship> {
    // Try to get existing relationship
    const existing = await executeSQL(
      this.db,
      'SELECT * FROM user_persona_relationships WHERE user_id = ? AND persona_id = ?',
      [userId, personaId]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      return {
        ...row,
        memory_config: typeof row.memory_config === 'string' ? JSON.parse(row.memory_config) : row.memory_config
      };
    }

    // Create new relationship
    const id = this.generateId();
    const memoryConfig = JSON.stringify({
      remember_relationship_details: true,
      remember_past_conversations: true,
      remember_personal_facts: true,
      auto_recall_depth: 10
    });

    await executeSQL(
      this.db,
      `INSERT INTO user_persona_relationships (
        id, user_id, persona_id, relationship_type, memory_config
      ) VALUES (?, ?, ?, ?, ?)`,
      [id, userId, personaId, initialType, memoryConfig]
    );

    return {
      id,
      user_id: userId,
      persona_id: personaId,
      relationship_type: initialType,
      custom_system_prompt: null,
      memory_config: JSON.parse(memoryConfig),
      total_calls: 0,
      total_minutes: 0,
      last_call_at: null
    };
  }

  /**
   * Update relationship context
   */
  async updateRelationship(
    userId: string,
    personaId: string,
    updates: {
      relationship_type?: string;
      custom_system_prompt?: string;
      memory_config?: any;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];

    if (updates.relationship_type !== undefined) {
      setClauses.push('relationship_type = ?');
      values.push(updates.relationship_type);
    }

    if (updates.custom_system_prompt !== undefined) {
      setClauses.push('custom_system_prompt = ?');
      values.push(updates.custom_system_prompt);
    }

    if (updates.memory_config !== undefined) {
      setClauses.push('memory_config = ?');
      values.push(JSON.stringify(updates.memory_config));
    }

    setClauses.push("updated_at = datetime('now')");

    values.push(userId, personaId);

    await executeSQL(
      this.db,
      `UPDATE user_persona_relationships
       SET ${setClauses.join(', ')}
       WHERE user_id = ? AND persona_id = ?`,
      values
    );
  }

  /**
   * Increment call statistics
   */
  async incrementCallStats(userId: string, personaId: string, durationMinutes: number): Promise<void> {
    await executeSQL(
      this.db,
      `UPDATE user_persona_relationships
       SET total_calls = total_calls + 1,
           total_minutes = total_minutes + ?,
           last_call_at = datetime('now'),
           updated_at = datetime('now')
       WHERE user_id = ? AND persona_id = ?`,
      [durationMinutes, userId, personaId]
    );
  }

  /**
   * Get long-term memory for user-persona relationship
   */
  async getLongTermMemory(userId: string, personaId: string): Promise<LongTermMemory | null> {
    const objectId = `long_term:${userId}:${personaId}`;

    try {
      const result = await this.memory.getSemanticMemory(objectId);

      if (result.success && result.document) {
        return result.document as unknown as LongTermMemory;
      }

      return null;
    } catch (error) {
      console.error('Error fetching long-term memory:', error);
      return null;
    }
  }

  /**
   * Set long-term memory
   */
  async setLongTermMemory(userId: string, personaId: string, memory: LongTermMemory): Promise<void> {
    try {
      const document = {
        id: `long_term:${userId}:${personaId}`,
        userId,
        personaId,
        ...memory
      };

      const result = await this.memory.putSemanticMemory(document);

      if (!result.success) {
        throw new Error(result.error || 'Failed to store long-term memory');
      }
    } catch (error) {
      console.error('Error setting long-term memory:', error);
      throw error;
    }
  }

  /**
   * Add a fact to long-term memory
   */
  async addFact(
    userId: string,
    personaId: string,
    category: 'user_facts' | 'relationship_facts',
    key: string,
    value: any
  ): Promise<void> {
    let memory = await this.getLongTermMemory(userId, personaId);

    if (!memory) {
      memory = {
        relationship_facts: {},
        user_facts: {},
        inside_jokes: [],
        important_memories: [],
        preferences: {}
      };
    }

    memory[category][key] = value;

    await this.setLongTermMemory(userId, personaId, memory);
  }

  /**
   * Delete a specific fact from long-term memory
   */
  async deleteFact(
    userId: string,
    personaId: string,
    category: 'user_facts' | 'relationship_facts',
    key: string
  ): Promise<void> {
    const memory = await this.getLongTermMemory(userId, personaId);

    if (!memory) return;

    delete memory[category][key];

    await this.setLongTermMemory(userId, personaId, memory);
  }

  /**
   * Get recent call context (short-term memory)
   */
  async getRecentContext(userId: string, personaId: string, maxCalls: number = 10): Promise<any | null> {
    const objectId = `recent_calls:${userId}:${personaId}`;

    try {
      const result = await this.memory.getSemanticMemory(objectId);

      if (result.success && result.document) {
        return result.document;
      }

      return null;
    } catch (error) {
      console.error('Error fetching recent context:', error);
      return null;
    }
  }

  /**
   * Update recent context with latest call summary
   */
  async updateRecentContext(
    userId: string,
    personaId: string,
    callId: string,
    summary: string,
    keyTopics: string[],
    outcome: string
  ): Promise<void> {
    let context = await this.getRecentContext(userId, personaId);

    if (!context) {
      context = { recent_calls: [], ongoing_storylines: [] };
    }

    // Add new call to recent history
    context.recent_calls.unshift({
      call_id: callId,
      date: new Date().toISOString(),
      summary,
      key_topics: keyTopics,
      outcome
    });

    // Keep only last 10 calls
    if (context.recent_calls.length > 10) {
      context.recent_calls = context.recent_calls.slice(0, 10);
    }

    const document = {
      id: `recent_calls:${userId}:${personaId}`,
      userId,
      personaId,
      ...context
    };

    const result = await this.memory.putSemanticMemory(document);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update recent context');
    }
  }

  /**
   * Build composite system prompt for AI
   */
  async buildCompositePrompt(
    userId: string,
    personaId: string,
    corePrompt: string,
    personalityTraits: Record<string, any>,
    callScenario?: string,
    tokenBudget: number = 4300
  ): Promise<CompositePrompt> {
    const relationship = await this.getOrCreateRelationship(userId, personaId);
    const longTermMemory = await this.getLongTermMemory(userId, personaId);
    const recentContext = await this.getRecentContext(userId, personaId);

    // Build sections
    const sections: string[] = [];

    // Core identity (always included)
    sections.push('=== CORE IDENTITY ===');
    sections.push(corePrompt);
    sections.push('');

    // Call scenario (HIGHEST PRIORITY - if provided)
    if (callScenario) {
      sections.push('=== THIS CALL\'S SCENARIO (IMPORTANT!) ===');
      sections.push(callScenario);
      sections.push('');
      sections.push('CRITICAL: The user has set up a specific scenario for this call.');
      sections.push('Follow the scenario exactly. Stay in character and play along naturally.');
      sections.push('');
    }

    // Relationship context (if customized)
    if (relationship.custom_system_prompt) {
      sections.push('=== YOUR RELATIONSHIP WITH THIS USER ===');
      sections.push(relationship.custom_system_prompt);
      sections.push('');
    } else {
      sections.push('=== YOUR RELATIONSHIP WITH THIS USER ===');
      sections.push(`You and the user are ${relationship.relationship_type}s.`);
      sections.push('');
    }

    // User facts from long-term memory
    if (longTermMemory && Object.keys(longTermMemory.user_facts).length > 0) {
      sections.push('=== WHAT YOU KNOW ABOUT THE USER ===');

      for (const [key, value] of Object.entries(longTermMemory.user_facts)) {
        sections.push(`- ${key}: ${JSON.stringify(value)}`);
      }

      sections.push('');
    }

    // Inside jokes
    if (longTermMemory && longTermMemory.inside_jokes.length > 0) {
      sections.push('=== INSIDE JOKES YOU SHARE ===');
      longTermMemory.inside_jokes.forEach(joke => {
        sections.push(`- ${joke}`);
      });
      sections.push('');
    }

    // Recent context
    if (recentContext && recentContext.recent_calls && recentContext.recent_calls.length > 0) {
      sections.push('=== RECENT CONTEXT ===');
      const lastCall = recentContext.recent_calls[0];
      sections.push(`Last call: ${lastCall.summary}`);
      sections.push('');
    }

    // Conversation style from personality
    if (personalityTraits) {
      sections.push('=== CONVERSATION STYLE ===');
      for (const [key, value] of Object.entries(personalityTraits)) {
        sections.push(`- ${key}: ${value}`);
      }
      sections.push('');
    }

    // Task
    sections.push('=== YOUR TASK ===');
    sections.push('The user is calling you right now. Respond naturally as this persona.');

    const fullPrompt = sections.join('\n');

    // Rough token count (4 chars ≈ 1 token)
    const tokenCount = Math.ceil(fullPrompt.length / 4);

    return {
      core_prompt: corePrompt,
      relationship_context: relationship.custom_system_prompt || `${relationship.relationship_type} relationship`,
      user_facts: longTermMemory ? JSON.stringify(longTermMemory.user_facts) : '{}',
      recent_context: recentContext ? JSON.stringify(recentContext.recent_calls?.[0]) : '{}',
      full_prompt: fullPrompt,
      token_count: tokenCount
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Extract facts from conversation (AI-powered memory extraction)
 * This would use Cerebras/OpenAI to analyze the transcript and extract important information
 */
export async function extractMemoryFromTranscript(
  transcript: string,
  existingMemory: LongTermMemory | null
): Promise<Partial<LongTermMemory>> {
  // TODO: Implement AI-powered fact extraction
  // For now, return empty object
  // In production, this would call Cerebras with a prompt like:
  // "Analyze this conversation and extract: user facts, relationship details, inside jokes, important events"

  return {
    user_facts: {},
    relationship_facts: {},
    inside_jokes: [],
    important_memories: []
  };
}
