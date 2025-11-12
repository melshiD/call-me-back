import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import { VoicePipelineOrchestrator, VoicePipelineConfig } from './voice-pipeline-orchestrator';
import { CostTracker } from '../shared/cost-tracker';

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
   */
  async handleConnection(ws: WebSocket, callId: string, userId: string, personaId?: string): Promise<{ status: string }> {
    try {
      this.env.logger.info('Handling voice pipeline connection', { callId, userId });

      // Initialize cost tracker for this call
      const costTracker = new CostTracker(this.env.CALL_ME_BACK_DB, callId, userId);
      await costTracker.initialize();

      // Create pipeline configuration
      const config: VoicePipelineConfig = {
        elevenLabsApiKey: this.env.ELEVENLABS_API_KEY,
        cerebrasApiKey: this.env.CEREBRAS_API_KEY,
        voiceId: personaId || this.env.DEFAULT_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb', // Rachel
        callId,
        userId
      };

      // Create and start pipeline
      const pipeline = new VoicePipelineOrchestrator(config, costTracker);
      await pipeline.start(ws);

      // Store active pipeline
      this.activePipelines.set(callId, pipeline);

      this.env.logger.info('Voice pipeline started', { callId });

      return {
        status: 'connected',
      };
    } catch (error) {
      this.env.logger.error('Failed to handle connection', {
        callId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
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
}

// Re-export voice pipeline components for external use
export { VoicePipelineOrchestrator, VoicePipelineConfig } from './voice-pipeline-orchestrator';
export { ConversationManager, ConversationState, TurnDecision } from './conversation-manager';
export { TurnEvaluator } from './turn-evaluator';
export { TwilioMediaStreamHandler, generateMediaStreamTwiML } from './twilio-media-stream';
export { ElevenLabsSTTHandler } from './elevenlabs-stt';
export { ElevenLabsTTSHandler, VOICE_IDS } from './elevenlabs-tts';
