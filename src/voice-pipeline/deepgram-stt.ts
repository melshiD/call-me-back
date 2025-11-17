/**
 * Deepgram Streaming Speech-to-Text Handler
 *
 * WebSocket-based streaming transcription compatible with Cloudflare Workers
 * Ref: https://developers.deepgram.com/docs/streaming-speech-to-text
 */

export type DeepgramModel =
  | 'nova-3'  // Latest and most accurate
  | 'nova-2'
  | 'nova'
  | 'enhanced'
  | 'base';

export type AudioEncoding =
  | 'linear16'
  | 'mulaw'
  | 'alaw'
  | 'flac'
  | 'opus';

export interface DeepgramSTTConfig {
  apiKey: string;
  model?: DeepgramModel;
  language?: string;  // BCP-47 language tag, e.g., 'en-US'
  encoding?: AudioEncoding;
  sampleRate?: number;
  channels?: number;
  punctuate?: boolean;
  interimResults?: boolean;
  endpointing?: number | boolean;  // Milliseconds or false to disable
  vadEvents?: boolean;  // Voice activity detection events
  utteranceEndMs?: number;  // End utterance after N ms of silence
}

export const DEFAULT_DEEPGRAM_CONFIG: Partial<DeepgramSTTConfig> = {
  model: 'nova-3',  // Latest Deepgram model (most accurate)
  language: 'en-US',
  encoding: 'mulaw',
  sampleRate: 8000,
  channels: 1,
  punctuate: true,
  interimResults: false,  // Only final transcripts to reduce noise
  endpointing: 300,  // 300ms of silence to finalize
  vadEvents: false,
  utteranceEndMs: 1000,  // 1 second of silence ends utterance
};

/**
 * Messages received FROM Deepgram
 */
export interface DeepgramTranscriptResult {
  type: 'Results';
  channel_index: number[][];
  duration: number;
  start: number;
  is_final: boolean;
  speech_final?: boolean;
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence: number;
      words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence: number;
      }>;
    }>;
  };
}

export interface DeepgramMetadata {
  type: 'Metadata';
  transaction_key: string;
  request_id: string;
  sha256: string;
  created: string;
  duration: number;
  channels: number;
}

export interface DeepgramSpeechStarted {
  type: 'SpeechStarted';
}

export interface DeepgramUtteranceEnd {
  type: 'UtteranceEnd';
}

export interface DeepgramError {
  type: 'Error';
  description: string;
  message: string;
}

export type DeepgramMessage =
  | DeepgramTranscriptResult
  | DeepgramMetadata
  | DeepgramSpeechStarted
  | DeepgramUtteranceEnd
  | DeepgramError;

/**
 * Event handlers for STT stream
 */
export interface DeepgramSTTHandlers {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onUtteranceEnd?: () => void;
  onSpeechStarted?: () => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * Optional debug context for database markers
 */
export interface DeepgramDebugContext {
  callId: string;
  databaseProxy?: any;
}

/**
 * Deepgram Streaming STT Handler
 */
export class DeepgramSTTHandler {
  private ws: WebSocket | null = null;
  private config: DeepgramSTTConfig;
  private handlers: DeepgramSTTHandlers;
  private debugContext?: DeepgramDebugContext;
  private messageCount: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(
    config: DeepgramSTTConfig,
    handlers: DeepgramSTTHandlers,
    debugContext?: DeepgramDebugContext
  ) {
    this.config = { ...DEFAULT_DEEPGRAM_CONFIG, ...config };
    this.handlers = handlers;
    this.debugContext = debugContext;
  }

  /**
   * Connect to Deepgram Streaming STT WebSocket
   *
   * IMPORTANT: Cloudflare Workers requires fetch-upgrade pattern for outbound WebSockets
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const url = this.buildWebSocketUrl();

        // DEBUG: Log URL (mask API key for security)
        const maskedUrl = url.replace(/token=[^&]+/, 'token=***MASKED***');
        console.log('[DeepgramSTT] Connecting to:', maskedUrl);
        console.log('[DeepgramSTT] API key length:', this.config.apiKey?.length || 0);

        // DEBUG MARKER: Log API key length to database
        if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
          try {
            await this.debugContext.databaseProxy.executeQuery(
              `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
              [this.debugContext.callId, 'DEEPGRAM_API_KEY_CHECK', JSON.stringify({
                apiKeyLength: this.config.apiKey?.length || 0,
                hasApiKey: !!this.config.apiKey,
                urlMasked: maskedUrl
              })]
            );
          } catch (e) {
            // Ignore errors
          }
        }

        // CRITICAL: Cloudflare Workers requires fetch with Upgrade header for outbound WebSockets
        // The standard new WebSocket(url) constructor doesn't work properly for outbound connections
        // Reference: https://developers.cloudflare.com/workers/examples/websockets
        console.log('[DeepgramSTT] Using fetch-upgrade pattern for Cloudflare Workers...');

        // DEBUG MARKER: About to attempt fetch-upgrade
        if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
          try {
            await this.debugContext.databaseProxy.executeQuery(
              `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
              [this.debugContext.callId, 'DEEPGRAM_STT_FETCH_UPGRADE_ATTEMPT']
            );
          } catch (e) {
            // Ignore errors
          }
        }

        const response = await fetch(url, {
          headers: {
            'Upgrade': 'websocket',
          },
        });

        // DEBUG MARKER: fetch completed, check for webSocket property
        const hasWebSocket = !!(response as any).webSocket;
        if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
          try {
            await this.debugContext.databaseProxy.executeQuery(
              `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
              [this.debugContext.callId, 'DEEPGRAM_STT_FETCH_RESPONSE', JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                hasWebSocket: hasWebSocket
              })]
            );
          } catch (e) {
            // Ignore errors
          }
        }

        const ws = (response as any).webSocket as WebSocket;
        if (!ws) {
          // DEBUG MARKER: webSocket property is missing
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
                [this.debugContext.callId, 'DEEPGRAM_STT_NO_WEBSOCKET_PROPERTY', JSON.stringify({
                  responseType: typeof response,
                  responseKeys: Object.keys(response)
                })]
              );
            } catch (e) {
              // Ignore errors
            }
          }
          throw new Error('[DeepgramSTT] Server didn\'t accept WebSocket (webSocket property missing from response)');
        }

        // CRITICAL: Must call accept() on the client-side WebSocket
        (ws as any).accept();
        console.log('[DeepgramSTT] WebSocket accepted, setting up event listeners...');

        this.ws = ws;

        const timeout = setTimeout(() => {
          reject(new Error('[DeepgramSTT] Connection timeout'));
        }, 10000); // 10 second timeout

        ws.addEventListener('open', async () => {
          clearTimeout(timeout);
          console.log('[DeepgramSTT] WebSocket connected');

          // DEBUG MARKER: STT WebSocket opened
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
                [this.debugContext.callId, 'DEEPGRAM_STT_WEBSOCKET_OPENED']
              );
            } catch (e) {
              // Ignore errors - don't fail connection due to debug marker issues
            }
          }

          this.reconnectAttempts = 0;
          this.handlers.onConnected?.();
          resolve();
        });

        ws.addEventListener('message', async (event) => {
          try {
            const message = JSON.parse(event.data.toString()) as DeepgramMessage;

            // DEBUG MARKER: First STT message received
            if (this.debugContext?.databaseProxy && this.debugContext?.callId && this.messageCount === 0) {
              try {
                await this.debugContext.databaseProxy.executeQuery(
                  `INSERT INTO debug_markers (call_id, marker_name) VALUES ($1, $2)`,
                  [this.debugContext.callId, 'DEEPGRAM_STT_FIRST_MESSAGE_RECEIVED']
                );
              } catch (e) {
                // Ignore errors
              }
            }
            this.messageCount++;

            await this.handleMessage(message);
          } catch (error) {
            console.error('[DeepgramSTT] Failed to parse message:', error);
            this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
          }
        });

        ws.addEventListener('close', async (event) => {
          console.log('[DeepgramSTT] WebSocket closed:', event.code, event.reason);

          // DEBUG MARKER: STT WebSocket closed
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
                [this.debugContext.callId, 'DEEPGRAM_STT_WEBSOCKET_CLOSED', JSON.stringify({ code: event.code, reason: event.reason })]
              );
            } catch (e) {
              // Ignore errors
            }
          }

          this.handlers.onDisconnected?.();

          // Attempt reconnection if not intentional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[DeepgramSTT] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
          }
        });

        ws.addEventListener('error', async (error) => {
          clearTimeout(timeout);
          console.error('[DeepgramSTT] WebSocket error:', error);

          // DEBUG MARKER: STT WebSocket error
          if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
            try {
              await this.debugContext.databaseProxy.executeQuery(
                `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
                [this.debugContext.callId, 'DEEPGRAM_STT_WEBSOCKET_ERROR', JSON.stringify({ error: String(error) })]
              );
            } catch (e) {
              // Ignore errors
            }
          }

          this.handlers.onError?.(new Error('WebSocket error'));
          reject(new Error('[DeepgramSTT] WebSocket error'));
        });

      } catch (error) {
        console.error('[DeepgramSTT] Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Build WebSocket URL with query parameters
   *
   * CRITICAL: Cloudflare Workers require wss:// (secure WebSocket), not ws://
   * Our proxy uses ws:// so we can't use it. Connecting directly to Deepgram instead.
   */
  private buildWebSocketUrl(): string {
    // MUST use wss:// for Cloudflare Workers (ws:// causes fetch to hang)
    const baseUrl = 'wss://api.deepgram.com/v1/listen';
    const params = new URLSearchParams();

    // Add API key as token parameter
    params.append('token', this.config.apiKey);

    // Model configuration
    if (this.config.model) {
      params.append('model', this.config.model);
    }
    if (this.config.language) {
      params.append('language', this.config.language);
    }
    if (this.config.encoding) {
      params.append('encoding', this.config.encoding);
    }
    if (this.config.sampleRate) {
      params.append('sample_rate', this.config.sampleRate.toString());
    }
    if (this.config.channels) {
      params.append('channels', this.config.channels.toString());
    }
    if (this.config.punctuate !== undefined) {
      params.append('punctuate', this.config.punctuate.toString());
    }
    if (this.config.interimResults !== undefined) {
      params.append('interim_results', this.config.interimResults.toString());
    }
    if (this.config.endpointing !== undefined) {
      params.append('endpointing', this.config.endpointing === false ? 'false' : this.config.endpointing.toString());
    }
    if (this.config.vadEvents !== undefined) {
      params.append('vad_events', this.config.vadEvents.toString());
    }
    if (this.config.utteranceEndMs !== undefined) {
      params.append('utterance_end_ms', this.config.utteranceEndMs.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Handle incoming messages from Deepgram
   */
  private async handleMessage(message: DeepgramMessage): Promise<void> {
    // DEBUG: Log ALL messages from Deepgram to database for diagnosis
    if (this.debugContext?.databaseProxy && this.debugContext?.callId) {
      try {
        await this.debugContext.databaseProxy.executeQuery(
          `INSERT INTO debug_markers (call_id, marker_name, metadata) VALUES ($1, $2, $3)`,
          [this.debugContext.callId, 'DEEPGRAM_STT_MESSAGE_CONTENT', JSON.stringify(message)]
        );
      } catch (e) {
        // Ignore errors
      }
    }

    switch (message.type) {
      case 'Results':
        if (message.channel?.alternatives?.[0]?.transcript) {
          const transcript = message.channel.alternatives[0].transcript;
          const isFinal = message.is_final || message.speech_final || false;

          if (transcript.trim()) {
            this.handlers.onTranscript?.(transcript, isFinal);
          }
        }
        break;

      case 'UtteranceEnd':
        this.handlers.onUtteranceEnd?.();
        break;

      case 'SpeechStarted':
        this.handlers.onSpeechStarted?.();
        break;

      case 'Metadata':
        console.log('[DeepgramSTT] Connection metadata:', message);
        break;

      case 'Error':
        console.error('[DeepgramSTT] Error from Deepgram:', message);
        this.handlers.onError?.(new Error(`Deepgram error: ${message.message}`));
        break;

      default:
        console.warn('[DeepgramSTT] Unknown message type:', (message as any).type);
    }
  }

  /**
   * Send audio data to Deepgram
   *
   * @param audioBuffer - Raw audio data (mulaw, linear16, etc.)
   */
  sendAudio(audioBuffer: Buffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[DeepgramSTT] Cannot send audio: not connected');
      return;
    }

    // Deepgram expects raw binary audio data, not base64
    this.ws.send(audioBuffer);
  }

  /**
   * Finalize the stream (tells Deepgram no more audio is coming)
   */
  finalize(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[DeepgramSTT] Cannot finalize: not connected');
      return;
    }

    // Send empty message to indicate end of audio stream
    this.ws.send(JSON.stringify({ type: 'CloseStream' }));
    console.log('[DeepgramSTT] Stream finalized');
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
  getConfig(): DeepgramSTTConfig {
    return { ...this.config };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.finalize();
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}
