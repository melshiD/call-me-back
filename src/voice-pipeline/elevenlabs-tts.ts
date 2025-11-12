/**
 * ElevenLabs Text-to-Speech WebSocket Handler
 *
 * Streaming TTS with low latency for real-time voice responses
 * Ref: https://elevenlabs.io/docs/api-reference/text-to-speech/v-1-text-to-speech-voice-id-stream-input
 */

export type OutputFormat =
  | 'mp3_22050_32'
  | 'mp3_44100_128'
  | 'mp3_44100_192'
  | 'pcm_8000'
  | 'pcm_16000'
  | 'pcm_44100'
  | 'opus_48000_32'
  | 'opus_48000_128'
  | 'ulaw_8000'    // For Twilio compatibility
  | 'alaw_8000';

export interface VoiceSettings {
  stability: number;          // 0.0 - 1.0
  similarity_boost: number;   // 0.0 - 1.0
  style?: number;             // 0.0 - 1.0
  use_speaker_boost?: boolean;
  speed?: number;             // 0.25 - 4.0, default 1.0
}

export interface GenerationConfig {
  chunk_length_schedule?: number[];  // [10, 20] means 10ms, then 20ms chunks
}

export interface PronunciationDictionaryLocator {
  pronunciation_dictionary_id: string;
  version_id: string;
}

export interface ElevenLabsTTSConfig {
  apiKey: string;
  voiceId: string;
  modelId?: string;  // e.g., 'eleven_turbo_v2', 'eleven_multilingual_v2'
  outputFormat: OutputFormat;
  voiceSettings: VoiceSettings;
  languageCode?: string;
  applyTextNormalization?: boolean;
  generationConfig?: GenerationConfig;
  pronunciationDictionaryLocators?: PronunciationDictionaryLocator[];
}

export const DEFAULT_TTS_CONFIG: Partial<ElevenLabsTTSConfig> = {
  modelId: 'eleven_turbo_v2',  // Fast, optimized for streaming
  outputFormat: 'ulaw_8000',   // Match Twilio format
  voiceSettings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.0
  },
  applyTextNormalization: true
};

/**
 * Messages sent TO ElevenLabs
 */
export interface TTSTextInput {
  text: string;
  try_trigger_generation?: boolean;
  voice_settings?: VoiceSettings;
  generation_config?: GenerationConfig;
  flush?: boolean;  // Force flush remaining audio
}

/**
 * Messages received FROM ElevenLabs
 */
export interface TTSAudioChunk {
  audio: string;  // Base64 encoded audio
  normalizedAlignment?: {
    charStartTimesMs: number[];
    charDurationsMs: number[];
    chars: string[];
  };
  alignment?: {
    charStartTimesMs: number[];
    charDurationsMs: number[];
    chars: string[];
  };
}

export interface TTSFinalMessage {
  isFinal: true;
}

export type ElevenLabsTTSMessage = TTSAudioChunk | TTSFinalMessage;

/**
 * Event handlers for TTS stream
 */
export interface TTSHandlers {
  onAudioChunk?: (audioBuffer: Buffer, alignment?: any) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

/**
 * ElevenLabs TTS WebSocket Handler
 */
export class ElevenLabsTTSHandler {
  private ws: WebSocket | null = null;
  private config: ElevenLabsTTSConfig;
  private handlers: TTSHandlers;
  private isGenerating: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  constructor(config: ElevenLabsTTSConfig, handlers: TTSHandlers) {
    this.config = config;
    this.handlers = handlers;
  }

  /**
   * Connect to ElevenLabs TTS WebSocket
   */
  async connect(): Promise<void> {
    try {
      const url = this.buildWebSocketUrl();

      this.ws = new WebSocket(url, {
        headers: {
          'xi-api-key': this.config.apiKey
        }
      });

      this.ws.addEventListener('open', () => {
        console.log('[ElevenLabsTTS] WebSocket connected');
        this.reconnectAttempts = 0;
        this.sendInitialConfig();
        this.handlers.onConnected?.();
      });

      this.ws.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data.toString()) as ElevenLabsTTSMessage;
          this.handleMessage(message);
        } catch (error) {
          console.error('[ElevenLabsTTS] Failed to parse message:', error);
          this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
        }
      });

      this.ws.addEventListener('close', (event) => {
        console.log('[ElevenLabsTTS] WebSocket closed:', event.code, event.reason);
        this.handlers.onDisconnected?.();

        // Attempt reconnection if not intentional
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[ElevenLabsTTS] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
        }
      });

      this.ws.addEventListener('error', (error) => {
        console.error('[ElevenLabsTTS] WebSocket error:', error);
        this.handlers.onError?.(new Error('WebSocket error'));
      });

    } catch (error) {
      console.error('[ElevenLabsTTS] Failed to connect:', error);
      throw error;
    }
  }

  /**
   * Build WebSocket URL with query parameters
   */
  private buildWebSocketUrl(): string {
    const baseUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.config.voiceId}/stream-input`;
    const params = new URLSearchParams();

    if (this.config.modelId) {
      params.append('model_id', this.config.modelId);
    }

    params.append('output_format', this.config.outputFormat);

    if (this.config.languageCode) {
      params.append('language_code', this.config.languageCode);
    }

    if (this.config.applyTextNormalization !== undefined) {
      params.append('apply_text_normalization', this.config.applyTextNormalization.toString());
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Send initial configuration message
   */
  private sendInitialConfig(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message: TTSTextInput = {
      text: ' ',  // Initial space to establish connection
      voice_settings: this.config.voiceSettings,
      generation_config: this.config.generationConfig
    };

    if (this.config.pronunciationDictionaryLocators) {
      // Note: pronunciation_dictionary_locators would be added here
      // but it's not in the TTSTextInput interface for ongoing messages
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming messages from ElevenLabs
   */
  private handleMessage(message: ElevenLabsTTSMessage): void {
    if ('isFinal' in message && message.isFinal) {
      console.log('[ElevenLabsTTS] Generation complete');
      this.isGenerating = false;
      this.handlers.onComplete?.();
      return;
    }

    if ('audio' in message) {
      try {
        // Decode base64 audio
        const audioBuffer = Buffer.from(message.audio, 'base64');

        // Forward to handler with alignment info if available
        this.handlers.onAudioChunk?.(audioBuffer, message.alignment || message.normalizedAlignment);
      } catch (error) {
        console.error('[ElevenLabsTTS] Failed to process audio chunk:', error);
        this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  /**
   * Send text to generate speech
   *
   * @param text - Text to synthesize
   * @param tryTriggerGeneration - Try to trigger generation immediately
   */
  sendText(text: string, tryTriggerGeneration: boolean = true): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabsTTS] Cannot send text: not connected');
      return;
    }

    const message: TTSTextInput = {
      text,
      try_trigger_generation: tryTriggerGeneration
    };

    this.ws.send(JSON.stringify(message));
    this.isGenerating = true;

    console.log('[ElevenLabsTTS] Text sent for synthesis:', text.substring(0, 50) + '...');
  }

  /**
   * Send text chunk for streaming generation
   */
  streamText(textChunk: string): void {
    this.sendText(textChunk, false);
  }

  /**
   * Flush remaining audio (complete generation)
   */
  flush(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabsTTS] Cannot flush: not connected');
      return;
    }

    const message: TTSTextInput = {
      text: '',
      flush: true
    };

    this.ws.send(JSON.stringify(message));
    console.log('[ElevenLabsTTS] Flushed audio generation');
  }

  /**
   * Complete generation and close stream
   */
  complete(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabsTTS] Cannot complete: not connected');
      return;
    }

    // Send empty text to signal end of stream
    const message: TTSTextInput = {
      text: ''
    };

    this.ws.send(JSON.stringify(message));
    console.log('[ElevenLabsTTS] Generation completed');
  }

  /**
   * Cancel current generation
   */
  cancel(): void {
    if (this.ws) {
      this.ws.close(1000, 'Generation cancelled');
      this.ws = null;
      this.isGenerating = false;
    }
  }

  /**
   * Check if currently generating
   */
  isActive(): boolean {
    return this.isGenerating;
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
  getConfig(): ElevenLabsTTSConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires reconnection)
   */
  async updateConfig(newConfig: Partial<ElevenLabsTTSConfig>): Promise<void> {
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
      this.isGenerating = false;
    }
  }
}

/**
 * Voice ID constants for common voices
 * Get full list from: https://api.elevenlabs.io/v1/voices
 */
export const VOICE_IDS = {
  RACHEL: 'JBFqnCBsd6RMkjVDRZzb',
  DOMI: 'AZnzlk1XvdvUeBnXmlld',
  BELLA: 'EXAVITQu4vr4xnSDxMaL',
  ANTONI: 'ErXwobaYiN019PkySvjV',
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',
  ARNOLD: 'VR6AewLTigWG4xSOukaG',
  ADAM: 'pNInz6obpgDQGcFmaJgB',
  SAM: 'yoZ06aMxZJJ28mfd3POQ'
};
