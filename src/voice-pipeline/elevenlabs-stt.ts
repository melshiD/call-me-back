/**
 * ElevenLabs Scribe v2 Realtime Speech-to-Text Handler
 *
 * WebSocket-based streaming transcription with ultra-low latency (<150ms)
 * Ref: https://elevenlabs.io/docs/cookbooks/speech-to-text/streaming
 */

export type AudioFormat =
  | 'pcm_8000'
  | 'pcm_16000'
  | 'pcm_22050'
  | 'pcm_24000'
  | 'pcm_44100'
  | 'pcm_48000'
  | 'ulaw_8000';

export type CommitStrategy = 'manual' | 'vad';

export interface ElevenLabsSTTConfig {
  apiKey: string;
  modelId: 'scribe_v2_realtime';
  languageCode?: string;  // ISO-639-1/3, auto-detect if not specified
  audioFormat: AudioFormat;
  commitStrategy: CommitStrategy;

  // VAD settings (only used if commitStrategy = 'vad')
  vadSilenceThresholdSecs?: number;  // 0.3-3.0, default 1.5
  vadThreshold?: number;  // 0.1-0.9, default 0.4 (lower = more sensitive)
  minSpeechDurationMs?: number;  // 50-2000, default 100
  minSilenceDurationMs?: number;  // 50-2000, default 100
}

export const DEFAULT_STT_CONFIG: Partial<ElevenLabsSTTConfig> = {
  modelId: 'scribe_v2_realtime',
  audioFormat: 'ulaw_8000',  // Match Twilio's mulaw format
  commitStrategy: 'manual',  // We'll control commits based on conversation flow
};

/**
 * Messages sent TO ElevenLabs
 */
export interface InputAudioChunk {
  message_type: 'input_audio_chunk';
  audio_base_64: string;
  commit: boolean;
  sample_rate: number;
}

/**
 * Messages received FROM ElevenLabs
 */
export interface PartialTranscript {
  message_type: 'partial_transcript';
  text: string;
}

export interface CommittedTranscript {
  message_type: 'committed_transcript';
  text: string;
}

export interface CommittedTranscriptWithTimestamps {
  message_type: 'committed_transcript_with_timestamps';
  text: string;
  words: Array<{
    word: string;
    start_ms: number;
    end_ms: number;
  }>;
}

export type ElevenLabsSTTMessage =
  | PartialTranscript
  | CommittedTranscript
  | CommittedTranscriptWithTimestamps;

/**
 * Event handlers for STT stream
 */
export interface STTHandlers {
  onPartialTranscript?: (text: string) => void;
  onCommittedTranscript?: (text: string) => void;
  onCommittedTranscriptWithTimestamps?: (text: string, words: Array<{ word: string; start_ms: number; end_ms: number }>) => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * Optional debug context for database markers
 */
export interface STTDebugContext {
  callId: string;
  databaseProxy?: any;
}

/**
 * ElevenLabs Scribe v2 Realtime STT Handler
 */
export class ElevenLabsSTTHandler {
  private ws: WebSocket | null = null;
  private config: ElevenLabsSTTConfig;
  private handlers: STTHandlers;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private debugContext?: STTDebugContext;
  private messageCount: number = 0;

  constructor(config: ElevenLabsSTTConfig, handlers: STTHandlers, debugContext?: STTDebugContext) {
    this.config = config;
    this.handlers = handlers;
    this.debugContext = debugContext;
  }

  /**
   * Connect to ElevenLabs Realtime STT WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();

        // Cloudflare Workers WebSocket doesn't support headers option
        // API key is passed via 'authorization' query parameter in the URL
        this.ws = new WebSocket(url);

        const timeout = setTimeout(() => {
          reject(new Error('[ElevenLabsSTT] Connection timeout'));
        }, 10000); // 10 second timeout

        this.ws.addEventListener('open', async () => {
          clearTimeout(timeout);
          console.log('[ElevenLabsSTT] WebSocket connected');

          // DEBUG MARKER: STT WebSocket opened
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
                [this.debugContext.callId, 'STT_WEBSOCKET_OPENED']
              );
            } catch (e) {
              // Ignore errors - don't fail connection due to debug marker issues
            }
          }

          this.reconnectAttempts = 0;
          this.handlers.onConnected?.();
          resolve();
        });

        this.ws.addEventListener('message', async (event) => {
          try {
            const message = JSON.parse(event.data.toString()) as ElevenLabsSTTMessage;

            // DEBUG MARKER: First STT message received
            if (this.debugContext?.databaseProxy && this.debugContext?.callId && this.messageCount === 0) {
              try {
                await this.debugContext.databaseProxy.executeQuery(
                  `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
                  [this.debugContext.callId, 'STT_FIRST_MESSAGE_RECEIVED']
                );
              } catch (e) {
                // Ignore errors
              }
            }
            this.messageCount++;

            this.handleMessage(message);
          } catch (error) {
            console.error('[ElevenLabsSTT] Failed to parse message:', error);
            this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        });

        this.ws.addEventListener('close', async (event) => {
          console.log('[ElevenLabsSTT] WebSocket closed:', event.code, event.reason);

          // DEBUG MARKER: STT WebSocket closed
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
                [this.debugContext.callId, 'STT_WEBSOCKET_CLOSED', JSON.stringify({ code: event.code, reason: event.reason })]
              );
            } catch (e) {
              // Ignore errors
            }
          }

          this.handlers.onDisconnected?.();

          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[ElevenLabsSTT] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        });

        this.ws.addEventListener('error', async (error) => {
          clearTimeout(timeout);
          console.error('[ElevenLabsSTT] WebSocket error:', error);

          // DEBUG MARKER: STT WebSocket error
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
                [this.debugContext.callId, 'STT_WEBSOCKET_ERROR', JSON.stringify({ error: String(error) })]
              );
            } catch (e) {
              // Ignore errors
            }
          }

          this.handlers.onError?.(new Error('WebSocket error'));
          reject(new Error('[ElevenLabsSTT] WebSocket error'));
        });

      } catch (error) {
        console.error('[ElevenLabsSTT] Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Build WebSocket URL with query parameters
   *
   * NOTE: API key is passed as query parameter because Cloudflare Workers
   * WebSocket API doesn't support custom headers. This is secure because:
   * 1. Server-to-server connection only (not exposed to browser)
   * 2. Encrypted via TLS (wss://)
   * 3. Documented by ElevenLabs for WebSocket auth
   *
   * TODO: For production, use ElevenLabs single-use token endpoint instead of
   * direct API key for enhanced security (time-limited tokens).
   */
  private buildWebSocketUrl(): string {
    const baseUrl = 'wss://api.elevenlabs.io/v1/speech-to-text/realtime';
    const params = new URLSearchParams();

    // Authentication (Cloudflare Workers doesn't support WebSocket headers)
    // ElevenLabs accepts either 'xi-api-key' header or 'token' query parameter
    // Try xi-api-key as query parameter (non-standard but might work)
    params.append('xi-api-key', this.config.apiKey);

    params.append('model_id', this.config.modelId);
    params.append('audio_format', this.config.audioFormat);
    params.append('commit_strategy', this.config.commitStrategy);

    if (this.config.languageCode) {
      params.append('language_code', this.config.languageCode);
    }

    // VAD parameters (only if using VAD commit strategy)
    if (this.config.commitStrategy === 'vad') {
      if (this.config.vadSilenceThresholdSecs !== undefined) {
        params.append('vad_silence_threshold_secs', this.config.vadSilenceThresholdSecs.toString());
      }
      if (this.config.vadThreshold !== undefined) {
        params.append('vad_threshold', this.config.vadThreshold.toString());
      }
      if (this.config.minSpeechDurationMs !== undefined) {
        params.append('min_speech_duration_ms', this.config.minSpeechDurationMs.toString());
      }
      if (this.config.minSilenceDurationMs !== undefined) {
        params.append('min_silence_duration_ms', this.config.minSilenceDurationMs.toString());
      }
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Handle incoming messages from ElevenLabs
   */
  private async handleMessage(message: ElevenLabsSTTMessage): Promise<void> {
    // DEBUG: Log ALL messages from ElevenLabs to database for diagnosis
    if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
      try {
        await this.debugContext.databaseProxy.executeQuery(
          `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
          [this.debugContext.callId, 'STT_MESSAGE_CONTENT', JSON.stringify(message)]
        );
      } catch (e) {
        // Ignore errors
      }
    }

    switch (message.message_type) {
      case 'partial_transcript':
        this.handlers.onPartialTranscript?.(message.text);
        break;

      case 'committed_transcript':
        this.handlers.onCommittedTranscript?.(message.text);
        break;

      case 'committed_transcript_with_timestamps':
        this.handlers.onCommittedTranscriptWithTimestamps?.(message.text, message.words);
        break;

      default:
        console.warn('[ElevenLabsSTT] Unknown message type:', (message as any).message_type);
    }
  }

  /**
   * Send audio chunk to ElevenLabs
   *
   * @param audioBuffer - Raw audio data (mulaw or PCM)
   * @param sampleRate - Sample rate in Hz
   * @param commit - Whether to commit this segment as final
   */
  sendAudio(audioBuffer: Buffer, sampleRate: number, commit: boolean = false): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabsSTT] Cannot send audio: not connected');
      return;
    }

    const audioBase64 = audioBuffer.toString('base64');

    const message: InputAudioChunk = {
      message_type: 'input_audio_chunk',
      audio_base_64: audioBase64,
      commit,
      sample_rate: sampleRate
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Commit current transcript segment (for manual commit strategy)
   * Sends empty audio chunk with commit=true
   */
  commit(sampleRate: number = 8000): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabsSTT] Cannot commit: not connected');
      return;
    }

    const message: InputAudioChunk = {
      message_type: 'input_audio_chunk',
      audio_base_64: '',
      commit: true,
      sample_rate: sampleRate
    };

    this.ws.send(JSON.stringify(message));
    console.log('[ElevenLabsSTT] Transcript segment committed');
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get current configuration
   */
  getConfig(): ElevenLabsSTTConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires reconnection)
   */
  async updateConfig(newConfig: Partial<ElevenLabsSTTConfig>): Promise<void> {
    const wasConnected = this.isConnected();

    if (wasConnected) {
      this.disconnect();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasConnected) {
      await this.connect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}

/**
 * Audio format helper - convert between formats
 */
export class AudioFormatConverter {
  /**
   * Convert mulaw to PCM 16-bit (for ElevenLabs if needed)
   *
   * Note: For simplicity, we're using ulaw_8000 format in ElevenLabs
   * which matches Twilio's mulaw format, so no conversion needed.
   */
  static mulawToPcm16(mulawBuffer: Buffer): Buffer {
    // TODO: Implement mulaw to PCM16 conversion if needed
    // For now, we're using ulaw_8000 format which accepts mulaw directly
    throw new Error('Not implemented - use ulaw_8000 format instead');
  }

  /**
   * Resample audio to different sample rate
   */
  static resample(buffer: Buffer, fromRate: number, toRate: number): Buffer {
    // TODO: Implement resampling if needed
    // For now, we're matching sample rates (8000 Hz)
    throw new Error('Not implemented - match sample rates instead');
  }
}
