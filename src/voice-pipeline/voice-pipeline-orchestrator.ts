/**
 * Voice Pipeline Orchestrator
 *
 * Integrates all voice services:
 * - Twilio Media Streams (audio I/O)
 * - ElevenLabs STT (speech recognition)
 * - ConversationManager (turn-taking logic)
 * - Cerebras LLM (AI responses)
 * - ElevenLabs TTS (speech synthesis)
 * - Cost Tracker (usage monitoring)
 */

import { TwilioMediaStreamHandler, MediaStreamHandlers } from './twilio-media-stream';
import { ElevenLabsSTTHandler, STTHandlers } from './elevenlabs-stt';
import { ElevenLabsTTSHandler, TTSHandlers, VOICE_IDS } from './elevenlabs-tts';
import { ConversationManager, ConversationState, TranscriptSegment } from './conversation-manager';
import { LLMServiceFactory } from '../shared/ai-services';
import { CostTracker } from '../shared/cost-tracker';

export interface VoicePipelineConfig {
  // API Keys
  elevenLabsApiKey: string;
  cerebrasApiKey: string;

  // Voice Settings
  voiceId: string;

  // Database & Cost Tracking
  callId: string;
  userId: string;

  // Optional overrides
  conversationConfig?: any;
  sttConfig?: any;
  ttsConfig?: any;
}

export interface PipelineStats {
  callDuration: number;
  transcriptLength: number;
  responseCount: number;
  interruptCount: number;
  conversationState: ConversationState;
  estimatedCost: number;
}

/**
 * Main Voice Pipeline Orchestrator
 */
export class VoicePipelineOrchestrator {
  private config: VoicePipelineConfig;

  // Service handlers
  private twilioHandler: TwilioMediaStreamHandler;
  private sttHandler: ElevenLabsSTTHandler;
  private ttsHandler: ElevenLabsTTSHandler;
  private conversationManager: ConversationManager;
  private costTracker: CostTracker;

  // State
  private callStartTime: number = 0;
  private responseCount: number = 0;
  private interruptCount: number = 0;
  private currentTranscript: string = '';
  private conversationHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];

  constructor(config: VoicePipelineConfig, costTracker: CostTracker) {
    this.config = config;
    this.costTracker = costTracker;

    // Initialize conversation manager
    this.conversationManager = new ConversationManager(config.conversationConfig);

    // Initialize Twilio handler
    this.twilioHandler = new TwilioMediaStreamHandler(this.createTwilioHandlers());

    // Initialize STT handler
    this.sttHandler = new ElevenLabsSTTHandler(
      {
        apiKey: config.elevenLabsApiKey,
        modelId: 'scribe_v2_realtime',
        audioFormat: 'ulaw_8000',
        commitStrategy: 'manual',
        ...config.sttConfig
      },
      this.createSTTHandlers()
    );

    // Initialize TTS handler
    this.ttsHandler = new ElevenLabsTTSHandler(
      {
        apiKey: config.elevenLabsApiKey,
        voiceId: config.voiceId || VOICE_IDS.RACHEL,
        modelId: 'eleven_turbo_v2',
        outputFormat: 'ulaw_8000',
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
          speed: 1.0
        },
        ...config.ttsConfig
      },
      this.createTTSHandlers()
    );
  }

  /**
   * Start the voice pipeline
   */
  async start(twilioWs: WebSocket): Promise<void> {
    console.log('[VoicePipeline] Starting pipeline');
    this.callStartTime = Date.now();

    // Connect Twilio WebSocket
    this.twilioHandler.handleConnection(twilioWs);

    // Connect STT and TTS
    await Promise.all([
      this.sttHandler.connect(),
      this.ttsHandler.connect()
    ]);

    console.log('[VoicePipeline] All services connected');
  }

  /**
   * Create Twilio event handlers
   */
  private createTwilioHandlers(): MediaStreamHandlers {
    return {
      onConnected: (message) => {
        console.log('[VoicePipeline] Twilio connected:', message.protocol, message.version);
      },

      onStart: (message) => {
        console.log('[VoicePipeline] Call started:', message.start.callSid);
      },

      onMedia: (audioBuffer, timestamp, track) => {
        // Forward incoming user audio to STT
        if (track === 'inbound' && this.sttHandler.isConnected()) {
          this.sttHandler.sendAudio(audioBuffer, 8000, false);
        }
      },

      onStop: async (message) => {
        console.log('[VoicePipeline] Call ended');
        await this.stop();
      },

      onMark: (markName) => {
        console.log('[VoicePipeline] Mark received:', markName);

        // Mark indicates TTS audio finished playing
        if (markName === 'response_complete') {
          this.conversationManager.finishSpeaking();
        }
      },

      onError: (error) => {
        console.error('[VoicePipeline] Twilio error:', error);
      }
    };
  }

  /**
   * Create STT event handlers
   */
  private createSTTHandlers(): STTHandlers {
    return {
      onPartialTranscript: (text) => {
        // Update current transcript with partial result
        this.currentTranscript = text;

        // Add partial transcript to conversation manager
        const segment: TranscriptSegment = {
          text,
          timestamp: Date.now(),
          isFinal: false
        };

        this.conversationManager.addTranscriptSegment(segment);
      },

      onCommittedTranscript: async (text) => {
        console.log('[VoicePipeline] Final transcript:', text);

        // Add to conversation history
        this.conversationHistory.push({
          role: 'user',
          content: text
        });

        // Mark as final transcript
        const segment: TranscriptSegment = {
          text,
          timestamp: Date.now(),
          isFinal: true
        };

        this.conversationManager.addTranscriptSegment(segment);

        // Track STT cost
        const charCount = text.length;
        const durationSecs = charCount / 15; // Rough estimate: ~15 chars/second
        await this.costTracker.trackSTT(durationSecs, 'elevenlabs', 'scribe_v2_realtime');

        // Trigger response generation based on conversation state
        this.checkAndGenerateResponse();
      },

      onError: (error) => {
        console.error('[VoicePipeline] STT error:', error);
      }
    };
  }

  /**
   * Create TTS event handlers
   */
  private createTTSHandlers(): TTSHandlers {
    return {
      onAudioChunk: (audioBuffer) => {
        // Forward TTS audio to Twilio
        if (this.twilioHandler.isConnected()) {
          this.twilioHandler.sendAudio(audioBuffer);
        }
      },

      onComplete: () => {
        console.log('[VoicePipeline] TTS generation complete');

        // Send mark to track when playback finishes
        if (this.twilioHandler.isConnected()) {
          this.twilioHandler.sendMark('response_complete');
        }
      },

      onError: (error) => {
        console.error('[VoicePipeline] TTS error:', error);
      }
    };
  }

  /**
   * Check conversation state and generate response if needed
   */
  private async checkAndGenerateResponse(): Promise<void> {
    // Manually trigger silence detection
    this.conversationManager.onSilenceDetected();

    const state = this.conversationManager.getState();

    // If conversation manager decided to process, generate response
    if (state === ConversationState.PROCESSING) {
      await this.generateAIResponse();
    }
  }

  /**
   * Generate AI response using Cerebras
   */
  private async generateAIResponse(): Promise<void> {
    try {
      console.log('[VoicePipeline] Generating AI response');

      const userMessage = this.conversationManager.getFinalTranscript();

      if (!userMessage || userMessage.trim().length === 0) {
        console.warn('[VoicePipeline] No user message to respond to');
        return;
      }

      // Build conversation context
      const messages = this.conversationHistory.slice(-10); // Last 10 messages

      // Generate response with Cerebras
      const llmService = LLMServiceFactory.getCerebras();

      const systemPrompt = 'You are a helpful AI assistant in a voice conversation. Keep responses concise and natural for speech.';
      const userPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const startTime = Date.now();
      const response = await llmService.complete({
        systemPrompt,
        prompt: userPrompt,
        maxTokens: 150,
        temperature: 0.7
      });

      const responseText = response.text.trim();
      const duration = Date.now() - startTime;

      console.log('[VoicePipeline] AI response generated:', responseText);
      console.log('[VoicePipeline] Response time:', duration, 'ms');

      // Track AI inference cost
      await this.costTracker.trackAIInference(
        response.usage.inputTokens,
        response.usage.outputTokens,
        'cerebras',
        'llama3.1-8b'
      );

      // Add to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: responseText
      });

      // Mark AI as speaking
      this.conversationManager.startSpeaking();

      // Generate speech with TTS
      await this.generateSpeech(responseText);

      this.responseCount++;

    } catch (error) {
      console.error('[VoicePipeline] Failed to generate response:', error);

      // Fallback response
      await this.generateSpeech("I'm sorry, I encountered an error. Could you please repeat that?");
    }
  }

  /**
   * Generate speech from text
   */
  private async generateSpeech(text: string): Promise<void> {
    console.log('[VoicePipeline] Generating speech:', text);

    // Send text to TTS
    this.ttsHandler.sendText(text, true);

    // Complete the generation
    this.ttsHandler.complete();

    // Track TTS cost
    await this.costTracker.trackTTS(text.length, 'elevenlabs', 'eleven_turbo_v2');
  }

  /**
   * Handle user interrupt
   */
  private handleInterrupt(): void {
    console.log('[VoicePipeline] User interrupted');
    this.interruptCount++;

    // Cancel current TTS generation
    this.ttsHandler.cancel();

    // Clear Twilio audio queue
    this.twilioHandler.clearAudioQueue();

    // Reconnect TTS for next response
    this.ttsHandler.connect().catch(err => {
      console.error('[VoicePipeline] Failed to reconnect TTS:', err);
    });
  }

  /**
   * Commit current STT transcript segment
   */
  commitTranscript(): void {
    if (this.sttHandler.isConnected()) {
      this.sttHandler.commit(8000);
    }
  }

  /**
   * Get pipeline statistics
   */
  getStats(): PipelineStats {
    const callDuration = (Date.now() - this.callStartTime) / 1000;

    return {
      callDuration,
      transcriptLength: this.conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0),
      responseCount: this.responseCount,
      interruptCount: this.interruptCount,
      conversationState: this.conversationManager.getState(),
      estimatedCost: 0  // Would fetch from cost tracker
    };
  }

  /**
   * Stop the pipeline and cleanup
   */
  async stop(): Promise<void> {
    console.log('[VoicePipeline] Stopping pipeline');

    // Disconnect all services
    this.sttHandler.disconnect();
    this.ttsHandler.disconnect();
    this.twilioHandler.close();

    // Finalize cost tracking
    const callDuration = (Date.now() - this.callStartTime) / 1000;
    await this.costTracker.finalize(callDuration);

    console.log('[VoicePipeline] Pipeline stopped');
  }
}
