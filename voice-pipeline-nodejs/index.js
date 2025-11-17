import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/stream' });

const PORT = process.env.PORT || 8001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'voice-pipeline',
    uptime: process.uptime()
  });
});

// WebSocket connection handler
wss.on('connection', async (twilioWs, req) => {
  console.log('[Voice Pipeline] New WebSocket connection from Twilio');

  let callId = null;
  let userId = null;
  let personaId = null;

  // Deepgram STT WebSocket
  let deepgramWs = null;

  // ElevenLabs TTS WebSocket
  let elevenlabsWs = null;

  // Handle messages from Twilio
  twilioWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle Twilio start message
      if (message.event === 'start') {
        console.log('[Voice Pipeline] Received START message from Twilio');

        // Extract parameters from Twilio's customParameters
        callId = message.start.customParameters?.callId;
        userId = message.start.customParameters?.userId;
        personaId = message.start.customParameters?.personaId;

        console.log('[Voice Pipeline] Call params:', { callId, userId, personaId });

        // TODO: Load persona and relationship from database
        // TODO: Initialize memory manager
        // TODO: Connect to Deepgram STT
        // TODO: Connect to ElevenLabs TTS
        // TODO: Set up audio routing

        console.log('[Voice Pipeline] Pipeline initialized (stub)');
      }

      // Handle Twilio media messages (audio from user)
      else if (message.event === 'media') {
        // Audio payload is in message.media.payload (base64 encoded mulaw)
        const audioPayload = message.media.payload;

        // TODO: Forward to Deepgram STT
        if (deepgramWs && deepgramWs.readyState === 1) {
          // Convert base64 to buffer and send to Deepgram
          const audioBuffer = Buffer.from(audioPayload, 'base64');
          deepgramWs.send(audioBuffer);
        }
      }

      // Handle Twilio stop message
      else if (message.event === 'stop') {
        console.log('[Voice Pipeline] Received STOP message from Twilio');

        // Close all connections
        if (deepgramWs) deepgramWs.close();
        if (elevenlabsWs) elevenlabsWs.close();
      }

    } catch (error) {
      console.error('[Voice Pipeline] Error processing Twilio message:', error);
    }
  });

  twilioWs.on('close', () => {
    console.log('[Voice Pipeline] Twilio WebSocket closed');
    if (deepgramWs) deepgramWs.close();
    if (elevenlabsWs) elevenlabsWs.close();
  });

  twilioWs.on('error', (error) => {
    console.error('[Voice Pipeline] Twilio WebSocket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Voice Pipeline running on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/stream`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
