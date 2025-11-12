/**
 * Twilio Media Streams WebSocket Handler
 *
 * Handles real-time bidirectional audio streaming with Twilio
 * Ref: https://www.twilio.com/docs/voice/media-streams/websocket-messages
 */

export interface MediaStreamConfig {
  sampleRate: number;  // 8000 for mulaw
  encoding: 'audio/x-mulaw';
  track: 'inbound' | 'outbound' | 'both';
}

export const DEFAULT_MEDIA_CONFIG: MediaStreamConfig = {
  sampleRate: 8000,
  encoding: 'audio/x-mulaw',
  track: 'inbound'  // Listen to user audio
};

/**
 * Twilio Media Stream message types FROM Twilio
 */
export interface TwilioConnectedMessage {
  event: 'connected';
  protocol: string;
  version: string;
}

export interface TwilioStartMessage {
  event: 'start';
  sequenceNumber: string;
  start: {
    accountSid: string;
    streamSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
    customParameters?: Record<string, string>;
  };
  streamSid: string;
}

export interface TwilioMediaMessage {
  event: 'media';
  sequenceNumber: string;
  media: {
    track: 'inbound' | 'outbound';
    chunk: string;
    timestamp: string;
    payload: string;  // Base64 encoded mulaw audio
  };
  streamSid: string;
}

export interface TwilioStopMessage {
  event: 'stop';
  sequenceNumber: string;
  stop: {
    accountSid: string;
    callSid: string;
  };
  streamSid: string;
}

export interface TwilioMarkMessage {
  event: 'mark';
  sequenceNumber: string;
  streamSid: string;
  mark: {
    name: string;
  };
}

export interface TwilioDtmfMessage {
  event: 'dtmf';
  streamSid: string;
  sequenceNumber: string;
  dtmf: {
    track: string;
    digit: string;
  };
}

export type TwilioMessage =
  | TwilioConnectedMessage
  | TwilioStartMessage
  | TwilioMediaMessage
  | TwilioStopMessage
  | TwilioMarkMessage
  | TwilioDtmfMessage;

/**
 * Messages sent TO Twilio
 */
export interface TwilioMediaPayload {
  event: 'media';
  streamSid: string;
  media: {
    payload: string;  // Base64 encoded mulaw audio (no headers!)
  };
}

export interface TwilioMarkPayload {
  event: 'mark';
  streamSid: string;
  mark: {
    name: string;
  };
}

export interface TwilioClearPayload {
  event: 'clear';
  streamSid: string;
}

/**
 * Event handlers for media stream
 */
export interface MediaStreamHandlers {
  onConnected?: (message: TwilioConnectedMessage) => void;
  onStart?: (message: TwilioStartMessage) => void;
  onMedia?: (audioChunk: Buffer, timestamp: string, track: 'inbound' | 'outbound') => void;
  onStop?: (message: TwilioStopMessage) => void;
  onMark?: (markName: string) => void;
  onDtmf?: (digit: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Twilio Media Stream WebSocket Handler
 */
export class TwilioMediaStreamHandler {
  private ws: WebSocket | null = null;
  private streamSid: string | null = null;
  private callSid: string | null = null;
  private accountSid: string | null = null;
  private handlers: MediaStreamHandlers;
  private config: MediaStreamConfig;

  constructor(handlers: MediaStreamHandlers, config: Partial<MediaStreamConfig> = {}) {
    this.handlers = handlers;
    this.config = { ...DEFAULT_MEDIA_CONFIG, ...config };
  }

  /**
   * Initialize WebSocket connection
   */
  handleConnection(ws: WebSocket): void {
    this.ws = ws;

    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data.toString()) as TwilioMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('[TwilioMediaStream] Failed to parse message:', error);
        this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    });

    ws.addEventListener('close', () => {
      console.log('[TwilioMediaStream] WebSocket closed');
      this.cleanup();
    });

    ws.addEventListener('error', (error) => {
      console.error('[TwilioMediaStream] WebSocket error:', error);
      this.handlers.onError?.(new Error('WebSocket error'));
    });
  }

  /**
   * Handle incoming Twilio messages
   */
  private handleMessage(message: TwilioMessage): void {
    switch (message.event) {
      case 'connected':
        this.handleConnected(message as TwilioConnectedMessage);
        break;

      case 'start':
        this.handleStart(message as TwilioStartMessage);
        break;

      case 'media':
        this.handleMedia(message as TwilioMediaMessage);
        break;

      case 'stop':
        this.handleStop(message as TwilioStopMessage);
        break;

      case 'mark':
        this.handleMark(message as TwilioMarkMessage);
        break;

      case 'dtmf':
        this.handleDtmf(message as TwilioDtmfMessage);
        break;

      default:
        console.warn('[TwilioMediaStream] Unknown message type:', (message as any).event);
    }
  }

  /**
   * Handle 'connected' message
   */
  private handleConnected(message: TwilioConnectedMessage): void {
    console.log('[TwilioMediaStream] Connected:', message.protocol, message.version);
    this.handlers.onConnected?.(message);
  }

  /**
   * Handle 'start' message
   */
  private handleStart(message: TwilioStartMessage): void {
    this.streamSid = message.streamSid;
    this.callSid = message.start.callSid;
    this.accountSid = message.start.accountSid;

    console.log('[TwilioMediaStream] Stream started:', {
      streamSid: this.streamSid,
      callSid: this.callSid,
      accountSid: this.accountSid,
      format: message.start.mediaFormat
    });

    this.handlers.onStart?.(message);
  }

  /**
   * Handle 'media' message - incoming audio from user
   */
  private handleMedia(message: TwilioMediaMessage): void {
    // Filter by configured track
    if (this.config.track !== 'both' && message.media.track !== this.config.track) {
      return;
    }

    try {
      // Decode base64 mulaw audio payload
      const audioBuffer = Buffer.from(message.media.payload, 'base64');

      // Forward to handler
      this.handlers.onMedia?.(audioBuffer, message.media.timestamp, message.media.track);
    } catch (error) {
      console.error('[TwilioMediaStream] Failed to process media:', error);
      this.handlers.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Handle 'stop' message
   */
  private handleStop(message: TwilioStopMessage): void {
    console.log('[TwilioMediaStream] Stream stopped:', message.stop.callSid);
    this.handlers.onStop?.(message);
    this.cleanup();
  }

  /**
   * Handle 'mark' message
   */
  private handleMark(message: TwilioMarkMessage): void {
    console.log('[TwilioMediaStream] Mark received:', message.mark.name);
    this.handlers.onMark?.(message.mark.name);
  }

  /**
   * Handle 'dtmf' message
   */
  private handleDtmf(message: TwilioDtmfMessage): void {
    console.log('[TwilioMediaStream] DTMF digit received:', message.dtmf.digit);
    this.handlers.onDtmf?.(message.dtmf.digit);
  }

  /**
   * Send audio to Twilio (AI speaking to user)
   * IMPORTANT: payload must be raw mulaw audio bytes (no headers!)
   */
  sendAudio(audioBuffer: Buffer): void {
    if (!this.ws || !this.streamSid) {
      console.error('[TwilioMediaStream] Cannot send audio: not connected');
      return;
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('[TwilioMediaStream] Cannot send audio: WebSocket not open');
      return;
    }

    // Encode raw mulaw audio as base64
    const payload = audioBuffer.toString('base64');

    const message: TwilioMediaPayload = {
      event: 'media',
      streamSid: this.streamSid,
      media: {
        payload
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send mark (for timing synchronization and playback tracking)
   */
  sendMark(markName: string): void {
    if (!this.ws || !this.streamSid) {
      console.error('[TwilioMediaStream] Cannot send mark: not connected');
      return;
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('[TwilioMediaStream] Cannot send mark: WebSocket not open');
      return;
    }

    const message: TwilioMarkPayload = {
      event: 'mark',
      streamSid: this.streamSid,
      mark: {
        name: markName
      }
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Clear outbound audio queue (for interrupts)
   */
  clearAudioQueue(): void {
    if (!this.ws || !this.streamSid) {
      console.error('[TwilioMediaStream] Cannot clear queue: not connected');
      return;
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error('[TwilioMediaStream] Cannot clear queue: WebSocket not open');
      return;
    }

    const message: TwilioClearPayload = {
      event: 'clear',
      streamSid: this.streamSid
    };

    this.ws.send(JSON.stringify(message));
    console.log('[TwilioMediaStream] Audio queue cleared');
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get stream info
   */
  getStreamInfo() {
    return {
      streamSid: this.streamSid,
      callSid: this.callSid,
      accountSid: this.accountSid,
      isConnected: this.isConnected()
    };
  }

  /**
   * Close connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.cleanup();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.ws = null;
    this.streamSid = null;
    this.callSid = null;
    this.accountSid = null;
  }
}

/**
 * Create TwiML for Media Streams
 */
export function generateMediaStreamTwiML(websocketUrl: string, customParams?: Record<string, string>): string {
  const params = customParams
    ? Object.entries(customParams)
        .map(([key, value]) => `<Parameter name="${key}" value="${value}" />`)
        .join('\n      ')
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${websocketUrl}">
      ${params}
    </Stream>
  </Connect>
</Response>`;
}
