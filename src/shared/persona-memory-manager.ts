/**
 * Persona Memory Manager
 *
 * Manages multi-tiered SmartMemory for persona conversations:
 * - Working Memory: Active call context (per user-persona-call)
 * - Episodic Memory: Past conversation archives (per user-persona)
 * - Semantic Memory: Long-term knowledge (per user-persona)
 * - Procedural Memory: Behavioral patterns (per persona, shared across users)
 */

export interface PersonaMemoryConfig {
  userId: string;
  personaId: string;
  callId: string;
  smartMemoryClient: any;  // Raindrop SmartMemory client
}

export interface ConversationContext {
  corePersonality: string;           // From personas table
  relationshipContext: string;       // From user_persona_relationships
  longTermFacts: any;                // From semantic memory
  recentCallSummaries: any[];        // From semantic memory
  behavioralPatterns: any;           // From procedural memory
  episodicRecall?: any[];            // Optional: searched from episodic
}

export interface MemoryUpdate {
  newFacts?: Array<{
    category: string;
    content: string;
    importance: 'low' | 'medium' | 'high';
  }>;
  conversationSummary?: string;
  keyTopics?: string[];
  emotionalTone?: string;
  decisions?: string[];
  ongoingStorylines?: Array<{
    topic: string;
    status: 'new' | 'ongoing' | 'resolved';
    summary: string;
  }>;
}

/**
 * Manages persona memory across all tiers
 */
export class PersonaMemoryManager {
  private config: PersonaMemoryConfig;
  private workingMemorySession: any;

  constructor(config: PersonaMemoryConfig) {
    this.config = config;
  }

  /**
   * Initialize memory for a new call
   * Loads context from all memory tiers and builds composite prompt
   */
  async initializeCallMemory(
    corePersonality: any,
    relationship: any
  ): Promise<ConversationContext> {
    const { userId, personaId, callId } = this.config;

    console.log('[PersonaMemory] Initializing call memory', { userId, personaId, callId });

    // 1. Start Working Memory session for this call
    this.workingMemorySession = await this.config.smartMemoryClient.startSession();

    await this.config.smartMemoryClient.putMemory({
      sessionId: this.workingMemorySession.id,
      content: JSON.stringify({
        callId,
        userId,
        personaId,
        relationshipId: relationship.id,
        conversationHistory: []
      }),
      key: 'session_metadata',
      timeline: '*defaultTimeline'
    });

    // 2. Load Semantic Memory - Long-term facts about this user
    const longTermFacts = await this.loadLongTermMemory();

    // 3. Load Semantic Memory - Recent call summaries
    const recentCallSummaries = await this.loadRecentCallSummaries();

    // 4. Load Procedural Memory - Persona behavioral patterns (shared across users)
    const behavioralPatterns = await this.loadBehavioralPatterns();

    // 5. Optional: Search Episodic Memory for specific context
    // (Can be triggered by user query like "remember when we talked about X")
    const episodicRecall = null;  // Load on-demand during conversation

    console.log('[PersonaMemory] Memory context loaded', {
      longTermFactsCount: longTermFacts ? Object.keys(longTermFacts).length : 0,
      recentCallsCount: recentCallSummaries.length,
      hasBehavioralPatterns: !!behavioralPatterns
    });

    return {
      corePersonality: corePersonality.core_system_prompt,
      relationshipContext: relationship.custom_system_prompt || '',
      longTermFacts,
      recentCallSummaries,
      behavioralPatterns,
      episodicRecall
    };
  }

  /**
   * Load long-term semantic memory (user facts, preferences, relationship details)
   */
  private async loadLongTermMemory(): Promise<any> {
    const { userId, personaId } = this.config;
    const objectId = `long_term:${userId}:${personaId}`;

    try {
      const memory = await this.config.smartMemoryClient.getSemanticMemory(objectId);
      return memory || this.getDefaultLongTermMemory();
    } catch (error) {
      console.warn('[PersonaMemory] No long-term memory found, using defaults');
      return this.getDefaultLongTermMemory();
    }
  }

  /**
   * Load recent call summaries from semantic memory
   */
  private async loadRecentCallSummaries(): Promise<any[]> {
    const { userId, personaId } = this.config;
    const objectId = `recent_calls:${userId}:${personaId}`;

    try {
      const memory = await this.config.smartMemoryClient.getSemanticMemory(objectId);
      return memory?.recent_calls || [];
    } catch (error) {
      console.warn('[PersonaMemory] No recent calls found');
      return [];
    }
  }

  /**
   * Load procedural memory (behavioral patterns shared across all users)
   */
  private async loadBehavioralPatterns(): Promise<any> {
    const { personaId } = this.config;

    try {
      const proceduralMemory = await this.config.smartMemoryClient.getProceduralMemory();

      // Load patterns for this persona
      const patterns = {
        greeting: await proceduralMemory.getProcedure(`${personaId}_greeting`),
        farewell: await proceduralMemory.getProcedure(`${personaId}_farewell`),
        adviceStyle: await proceduralMemory.getProcedure(`${personaId}_advice_style`),
        toneGuidelines: await proceduralMemory.getProcedure(`${personaId}_tone`)
      };

      return patterns;
    } catch (error) {
      console.warn('[PersonaMemory] Failed to load behavioral patterns:', error);
      return null;
    }
  }

  /**
   * Add message to working memory during active call
   */
  async addToWorkingMemory(role: 'user' | 'assistant', content: string): Promise<void> {
    if (!this.workingMemorySession) {
      console.error('[PersonaMemory] No active working memory session');
      return;
    }

    await this.config.smartMemoryClient.putMemory({
      sessionId: this.workingMemorySession.id,
      content: JSON.stringify({
        role,
        content,
        timestamp: new Date().toISOString()
      }),
      key: `message_${role}`,
      timeline: '*defaultTimeline'
    });
  }

  /**
   * Search episodic memory for past conversations
   */
  async searchEpisodicMemory(query: string, limit: number = 5): Promise<any[]> {
    const { userId, personaId } = this.config;

    try {
      const results = await this.config.smartMemoryClient.searchEpisodicMemory({
        terms: query,
        nMostRecent: limit,
        // Filter by this user-persona pair (if API supports)
        metadata: {
          userId,
          personaId
        }
      });

      return results || [];
    } catch (error) {
      console.error('[PersonaMemory] Episodic search failed:', error);
      return [];
    }
  }

  /**
   * Build composite system prompt from all memory sources
   */
  buildSystemPrompt(context: ConversationContext): string {
    let prompt = '';

    // 1. Core Personality (shared across all users)
    prompt += '=== CORE IDENTITY ===\n';
    prompt += context.corePersonality + '\n\n';

    // 2. Relationship Context (user-specific)
    if (context.relationshipContext) {
      prompt += '=== YOUR RELATIONSHIP WITH THIS USER ===\n';
      prompt += context.relationshipContext + '\n\n';
    }

    // 3. Long-Term Facts (user-specific semantic memory)
    if (context.longTermFacts && Object.keys(context.longTermFacts).length > 0) {
      prompt += '=== WHAT YOU KNOW ABOUT THIS USER ===\n';
      prompt += this.formatLongTermFacts(context.longTermFacts) + '\n\n';
    }

    // 4. Recent Call Context (user-specific semantic memory)
    if (context.recentCallSummaries && context.recentCallSummaries.length > 0) {
      prompt += '=== RECENT CONTEXT ===\n';
      prompt += this.formatRecentCalls(context.recentCallSummaries) + '\n\n';
    }

    // 5. Behavioral Patterns (persona-wide procedural memory)
    if (context.behavioralPatterns) {
      prompt += '=== CONVERSATION STYLE ===\n';
      prompt += this.formatBehavioralPatterns(context.behavioralPatterns) + '\n\n';
    }

    // 6. Episodic Recall (if searched)
    if (context.episodicRecall && context.episodicRecall.length > 0) {
      prompt += '=== RELEVANT PAST CONVERSATIONS ===\n';
      prompt += this.formatEpisodicRecall(context.episodicRecall) + '\n\n';
    }

    prompt += '=== YOUR TASK ===\n';
    prompt += 'The user is calling you right now. Be authentic, remember what you know, and respond naturally.\n';

    return prompt;
  }

  /**
   * Finalize call and update all memory tiers
   */
  async finalizeCallMemory(update: MemoryUpdate): Promise<void> {
    const { userId, personaId, callId } = this.config;

    console.log('[PersonaMemory] Finalizing call memory', { callId });

    // 1. End Working Memory session and flush to Episodic
    if (this.workingMemorySession) {
      // Generate AI summary of the session
      const summary = await this.config.smartMemoryClient.summarizeMemory({
        sessionId: this.workingMemorySession.id,
        systemPrompt: 'Summarize this conversation concisely, highlighting key topics, decisions, and emotional context.'
      });

      // End session and flush to episodic memory
      await this.config.smartMemoryClient.endSession({
        sessionId: this.workingMemorySession.id,
        flush: true  // Archive to episodic memory
      });

      console.log('[PersonaMemory] Session archived to episodic memory');
    }

    // 2. Update Semantic Memory - Long-term facts
    if (update.newFacts && update.newFacts.length > 0) {
      await this.updateLongTermMemory(update.newFacts);
    }

    // 3. Update Semantic Memory - Recent calls list
    await this.updateRecentCallsSummary({
      callId,
      date: new Date().toISOString(),
      summary: update.conversationSummary || 'Conversation completed',
      keyTopics: update.keyTopics || [],
      emotionalTone: update.emotionalTone,
      decisions: update.decisions || []
    });

    // 4. Update ongoing storylines if needed
    if (update.ongoingStorylines) {
      await this.updateStorylines(update.ongoingStorylines);
    }

    console.log('[PersonaMemory] All memory tiers updated');
  }

  /**
   * Update long-term semantic memory with new facts
   */
  private async updateLongTermMemory(newFacts: any[]): Promise<void> {
    const { userId, personaId } = this.config;
    const objectId = `long_term:${userId}:${personaId}`;

    // Load existing memory
    const existing = await this.loadLongTermMemory();

    // Merge new facts (categorized by importance)
    const highImportance = newFacts.filter(f => f.importance === 'high');
    const mediumImportance = newFacts.filter(f => f.importance === 'medium');

    // Only store high and medium importance facts
    const factsToStore = [...highImportance, ...mediumImportance];

    if (factsToStore.length > 0) {
      // Update semantic memory
      await this.config.smartMemoryClient.putSemanticMemory({
        id: objectId,
        document: {
          ...existing,
          lastUpdated: new Date().toISOString(),
          facts: [...(existing.facts || []), ...factsToStore]
        }
      });

      console.log('[PersonaMemory] Updated long-term memory with', factsToStore.length, 'new facts');
    }
  }

  /**
   * Update recent calls summary in semantic memory
   */
  private async updateRecentCallsSummary(callSummary: any): Promise<void> {
    const { userId, personaId } = this.config;
    const objectId = `recent_calls:${userId}:${personaId}`;

    try {
      const existing = await this.config.smartMemoryClient.getSemanticMemory(objectId);
      const recentCalls = existing?.recent_calls || [];

      // Add new call to the beginning
      recentCalls.unshift(callSummary);

      // Keep only last 10 calls
      const updated = recentCalls.slice(0, 10);

      await this.config.smartMemoryClient.putSemanticMemory({
        id: objectId,
        document: {
          userId,
          personaId,
          recent_calls: updated,
          lastUpdated: new Date().toISOString()
        }
      });

      console.log('[PersonaMemory] Updated recent calls summary');
    } catch (error) {
      console.error('[PersonaMemory] Failed to update recent calls:', error);
    }
  }

  /**
   * Update ongoing storylines in semantic memory
   */
  private async updateStorylines(storylines: any[]): Promise<void> {
    const { userId, personaId } = this.config;
    const objectId = `long_term:${userId}:${personaId}`;

    const existing = await this.loadLongTermMemory();

    await this.config.smartMemoryClient.putSemanticMemory({
      id: objectId,
      document: {
        ...existing,
        ongoing_storylines: storylines,
        lastUpdated: new Date().toISOString()
      }
    });
  }

  // Helper formatting methods
  private formatLongTermFacts(facts: any): string {
    // Format facts into readable text for prompt
    // TODO: Implement based on actual fact structure
    return JSON.stringify(facts, null, 2);
  }

  private formatRecentCalls(calls: any[]): string {
    return calls
      .map((call, idx) => {
        const daysAgo = Math.floor((Date.now() - new Date(call.date).getTime()) / (1000 * 60 * 60 * 24));
        return `${daysAgo} day(s) ago: ${call.summary}`;
      })
      .join('\n');
  }

  private formatBehavioralPatterns(patterns: any): string {
    let text = '';
    if (patterns.greeting) text += `Greeting style: ${patterns.greeting}\n`;
    if (patterns.adviceStyle) text += `Advice approach: ${patterns.adviceStyle}\n`;
    if (patterns.toneGuidelines) text += `Tone: ${patterns.toneGuidelines}\n`;
    return text;
  }

  private formatEpisodicRecall(episodes: any[]): string {
    return episodes
      .map(ep => `${ep.createdAt}: ${ep.summary}`)
      .join('\n\n');
  }

  private getDefaultLongTermMemory(): any {
    return {
      user_facts: {},
      relationship_facts: {},
      important_memories: [],
      preferences: {},
      facts: []
    };
  }
}
