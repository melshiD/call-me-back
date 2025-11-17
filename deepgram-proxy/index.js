/**
 * Deepgram WebSocket Proxy
 *
 * Solves the Cloudflare Workers outbound WebSocket limitation by providing
 * a simple proxy that maintains connections to Deepgram STT API.
 *
 * Flow:
 * Cloudflare Workers → This Proxy (WebSocket) → Deepgram API (WebSocket)
 */

require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 8080;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'deepgram-websocket-proxy' });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Deepgram WebSocket Proxy running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server, path: '/deepgram' });

console.log('📡 WebSocket server listening on /deepgram');

wss.on('connection', (clientWs, req) => {
  console.log('🔌 Client connected from:', req.socket.remoteAddress);

  // Parse query parameters from WebSocket connection URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const params = url.searchParams;

  // Build Deepgram WebSocket URL with query parameters
  const deepgramUrl = buildDeepgramUrl(params);
  console.log('🎤 Connecting to Deepgram:', deepgramUrl.replace(/token=[^&]+/, 'token=***'));

  // Create WebSocket connection to Deepgram
  const deepgramWs = new WebSocket(deepgramUrl, {
    headers: {
      'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
    }
  });

  // Track connection state
  let isDeepgramConnected = false;

  // Deepgram WebSocket opened
  deepgramWs.on('open', () => {
    console.log('✅ Connected to Deepgram');
    isDeepgramConnected = true;
  });

  // Deepgram → Client: Forward transcription results
  deepgramWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Log transcript results
      if (message.type === 'Results' && message.channel?.alternatives?.[0]?.transcript) {
        const transcript = message.channel.alternatives[0].transcript;
        if (transcript.trim()) {
          console.log('📝 Transcript:', transcript);
        }
      }

      // Forward to client
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    } catch (error) {
      console.error('❌ Error processing Deepgram message:', error);
    }
  });

  // Client → Deepgram: Forward audio data
  clientWs.on('message', (data) => {
    if (isDeepgramConnected && deepgramWs.readyState === WebSocket.OPEN) {
      deepgramWs.send(data);
    } else {
      console.warn('⚠️ Deepgram not connected, buffering dropped');
    }
  });

  // Handle Deepgram errors
  deepgramWs.on('error', (error) => {
    console.error('❌ Deepgram WebSocket error:', error.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'Error',
        message: 'Deepgram connection error',
        error: error.message
      }));
    }
  });

  // Handle Deepgram close
  deepgramWs.on('close', (code, reason) => {
    console.log(`🔌 Deepgram disconnected: ${code} - ${reason}`);
    isDeepgramConnected = false;

    // Close client connection
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });

  // Handle client close
  clientWs.on('close', (code, reason) => {
    console.log(`🔌 Client disconnected: ${code} - ${reason}`);

    // Close Deepgram connection
    if (deepgramWs.readyState === WebSocket.OPEN) {
      // Send close stream message to Deepgram
      deepgramWs.send(JSON.stringify({ type: 'CloseStream' }));
      deepgramWs.close(1000, 'Client disconnected');
    }
  });

  // Handle client errors
  clientWs.on('error', (error) => {
    console.error('❌ Client WebSocket error:', error.message);

    // Close Deepgram connection
    if (deepgramWs.readyState === WebSocket.OPEN) {
      deepgramWs.close(1011, 'Client error');
    }
  });
});

/**
 * Build Deepgram WebSocket URL with query parameters
 */
function buildDeepgramUrl(params) {
  const baseUrl = 'wss://api.deepgram.com/v1/listen';
  const queryParams = new URLSearchParams();

  // Model configuration
  queryParams.append('model', params.get('model') || 'nova-3');
  queryParams.append('language', params.get('language') || 'en-US');
  queryParams.append('encoding', params.get('encoding') || 'mulaw');
  queryParams.append('sample_rate', params.get('sample_rate') || '8000');
  queryParams.append('channels', params.get('channels') || '1');
  queryParams.append('punctuate', params.get('punctuate') || 'true');
  queryParams.append('interim_results', params.get('interim_results') || 'false');
  queryParams.append('endpointing', params.get('endpointing') || '300');
  queryParams.append('vad_events', params.get('vad_events') || 'false');
  queryParams.append('utterance_end_ms', params.get('utterance_end_ms') || '1000');

  return `${baseUrl}?${queryParams.toString()}`;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
