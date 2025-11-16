import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { VoicePipelineOrchestrator, VoicePipelineConfig } from './voice-pipeline-orchestrator';
import { CallCostTracker } from '../shared/cost-tracker';
import { executeSQL } from '../shared/db-helpers';

/**
 * Voice Pipeline Service
 *
 * Raindrop service for handling real-time voice conversations with:
 * - Twilio Media Streams (WebSocket audio)
 * - ElevenLabs STT & TTS
 * - Cerebras LLM
 * - Intelligent turn-taking
 */
export default class extends Service<Env> {
  private activePipelines: Map<string, VoicePipelineOrchestrator> = new Map();

  async fetch(request: Request): Promise<Response> {
    return new Response('Voice Pipeline Service - Use WebSocket connections', { status: 200 });
  }

  /**
   * Handle WebSocket connection from Twilio Media Streams
   * Parameters are extracted from the "start" message customParameters
   */
  async handleConnection(ws: WebSocket): Promise<{ status: string }> {
    try {
      this.env.logger.info('WebSocket connection established, waiting for start message');

      // Wait for the "start" message from Twilio to get parameters
      const startMessage = await this.waitForStartMessage(ws);

      this.env.logger.info('Start message received', { startMessage });

      const callId = startMessage.customParameters.callId;
      const userId = startMessage.customParameters.userId;
      const personaId = startMessage.customParameters.personaId;

      this.env.logger.info('Extracted parameters from start message', { callId, userId, personaId });

      this.env.logger.info('Handling voice pipeline connection', { callId, userId, personaId });

      // Initialize cost tracker for this call
      const costTracker = new CallCostTracker(callId, userId, this.env.CALL_ME_BACK_DB);
      await costTracker.initialize();

      // Load persona from database
      const persona = await this.loadPersona(personaId);
      if (!persona) {
        throw new Error(`Persona not found: ${personaId}`);
      }

      // Load or create user-persona relationship
      const relationship = await this.loadOrCreateRelationship(userId, personaId);

      // Extract voice configuration from relationship
      const voiceId = relationship.voice_id || persona.default_voice_id || 'JBFqnCBsd6RMkjVDRZzb';
      const voiceSettings = relationship.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
        speed: 1.0
      };

      // Create pipeline configuration
      const config: VoicePipelineConfig = {
        elevenLabsApiKey: this.env.ELEVENLABS_API_KEY || '',
        cerebrasApiKey: this.env.CEREBRAS_API_KEY || '',
        voiceId,
        voiceSettings,
        callId,
        userId,
        personaId
      };

      // Create and start pipeline with SmartMemory
      const pipeline = new VoicePipelineOrchestrator(
        config,
        costTracker,
        this.env.CONVERSATION_MEMORY,  // SmartMemory binding
        persona,
        relationship
      );
      await pipeline.start(ws);

      // Store active pipeline
      this.activePipelines.set(callId, pipeline);

      this.env.logger.info('Voice pipeline started', { callId, personaId });

      return {
        status: 'connected',
      };
    } catch (error) {
      this.env.logger.error('Failed to handle WebSocket connection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // Close WebSocket on error
      try {
        ws.close(1011, 'Internal error');
      } catch (closeError) {
        // Ignore close errors
      }
      throw error;
    }
  }

  /**
   * Load persona from database
   */
  private async loadPersona(personaId: string): Promise<any> {
    const result = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      'SELECT * FROM personas WHERE id = ?',
      [personaId]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Load or create user-persona relationship
   */
  private async loadOrCreateRelationship(userId: string, personaId: string): Promise<any> {
    // Try to load existing relationship
    const result = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      'SELECT * FROM user_persona_relationships WHERE user_id = ? AND persona_id = ?',
      [userId, personaId]
    );

    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0];
    }

    // Create new relationship with defaults
    const relationshipId = crypto.randomUUID();
    await executeSQL(
      this.env.CALL_ME_BACK_DB,
      `INSERT INTO user_persona_relationships
       (id, user_id, persona_id, relationship_type, custom_system_prompt, voice_id, voice_settings, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        relationshipId,
        userId,
        personaId,
        'friend',  // Default relationship type
        '',        // No custom prompt initially
        null,      // Will use persona default
        JSON.stringify({
          stability: 0.5,
          similarity_boost: 0.75,
          speed: 1.0,
          style: 0.0
        }),
        new Date().toISOString()
      ]
    );

    // Load the newly created relationship
    const newResult = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      'SELECT * FROM user_persona_relationships WHERE user_id = ? AND persona_id = ?',
      [userId, personaId]
    );

    return newResult.rows[0];
  }

  /**
   * Get active pipeline by call ID
   */
  async getPipeline(callId: string): Promise<VoicePipelineOrchestrator | undefined> {
    return this.activePipelines.get(callId);
  }

  /**
   * Stop pipeline for a call
   */
  async stopPipeline(callId: string): Promise<void> {
    const pipeline = this.activePipelines.get(callId);

    if (pipeline) {
      await pipeline.stop();
      this.activePipelines.delete(callId);
      this.env.logger.info('Voice pipeline stopped', { callId });
    }
  }

  /**
   * Get statistics for a call
   */
  async getStats(callId: string): Promise<any> {
    const pipeline = this.activePipelines.get(callId);

    if (pipeline) {
      return pipeline.getStats();
    }

    return null;
  }

  /**
   * Wait for and parse the "start" message from Twilio Media Streams
   */
  private async waitForStartMessage(ws: WebSocket): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for start message'));
      }, 10000); // 10 second timeout

      ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data as string);

          if (message.event === 'start') {
            clearTimeout(timeout);
            this.env.logger.info('Received start message', {
              callSid: message.start.callSid,
              customParameters: message.start.customParameters
            });
            resolve(message.start);
          }
        } catch (error) {
          this.env.logger.error('Error parsing WebSocket message', {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      });

      ws.addEventListener('error', (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket error before start message'));
      });

      ws.addEventListener('close', (event) => {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before start message'));
      });
    });
  }
}

// Re-export voice pipeline components for external use
export { VoicePipelineOrchestrator } from './voice-pipeline-orchestrator';
export type { VoicePipelineConfig } from './voice-pipeline-orchestrator';
export { ConversationManager } from './conversation-manager';
export type { ConversationState, TurnDecision } from './conversation-manager';
export { TurnEvaluator } from './turn-evaluator';
export { TwilioMediaStreamHandler, generateMediaStreamTwiML } from './twilio-media-stream';
export { ElevenLabsSTTHandler } from './elevenlabs-stt';
export { ElevenLabsTTSHandler, VOICE_IDS } from './elevenlabs-tts';
