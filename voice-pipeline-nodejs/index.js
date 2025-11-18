import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import WebSocket from 'ws';

// Load environment variables from .env file
const envFile = readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/stream' });

const PORT = env.PORT || 8001;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'voice-pipeline',
    uptime: process.uptime()
  });
});

/**
 * Voice Pipeline Class
 * Manages the complete voice conversation flow with intelligent turn-taking
 */
class VoicePipeline {
  constructor(twilioWs, callParams) {
    this.twilioWs = twilioWs;
    this.callId = callParams.callId;
    this.userId = callParams.userId;
    this.personaId = callParams.personaId;

    // Service connections
    this.deepgramWs = null;
    this.elevenLabsWs = null;

    // State
    this.conversationHistory = [];
    this.transcriptSegments = [];
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
    this.isEvaluating = false;
    this.streamSid = null;
    this.silenceTimer = null;
    this.evaluationCount = 0;

    // Turn-taking config
    this.config = {
      shortSilenceMs: 500,       // Ignore pauses shorter than this
      llmEvalThresholdMs: 1200,  // Trigger LLM eval after this silence
      forceResponseMs: 3000,     // Force response after this silence
      maxEvaluations: 2          // Max LLM evals before forcing
    };

    console.log(`[VoicePipeline ${this.callId}] Initialized`, callParams);
  }

  /**
   * Start the voice pipeline
   */
  async start() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Starting...`);

      // Connect to Deepgram STT
      await this.connectDeepgram();

      // Connect to ElevenLabs TTS
      await this.connectElevenLabs();

      console.log(`[VoicePipeline ${this.callId}] All services connected`);

      // Send initial greeting
      await this.speak("Hey! Sorry it took me a minute to get to you!");

    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Failed to start:`, error);
      throw error;
    }
  }

  /**
   * Connect to Deepgram STT
   */
  async connectDeepgram() {
    return new Promise((resolve, reject) => {
      console.log(`[VoicePipeline ${this.callId}] Connecting to Deepgram...`);

      const deepgramUrl = 'wss://api.deepgram.com/v1/listen?model=nova-3&encoding=mulaw&sample_rate=8000';

      this.deepgramWs = new WebSocket(deepgramUrl, {
        headers: {
          'Authorization': `Token ${env.DEEPGRAM_API_KEY}`
        }
      });

      this.deepgramWs.on('open', () => {
        console.log(`[VoicePipeline ${this.callId}] Deepgram connected`);
        resolve();
      });

      this.deepgramWs.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            console.log(`[VoicePipeline ${this.callId}] User said:`, transcript);
            this.handleTranscriptSegment(transcript);
          }
        } catch (error) {
          console.error(`[VoicePipeline ${this.callId}] Error parsing Deepgram response:`, error);
        }
      });

      this.deepgramWs.on('error', (error) => {
        console.error(`[VoicePipeline ${this.callId}] Deepgram error:`, error);
        reject(error);
      });

      this.deepgramWs.on('close', () => {
        console.log(`[VoicePipeline ${this.callId}] Deepgram connection closed`);
      });

      setTimeout(() => reject(new Error('Deepgram connection timeout')), 5000);
    });
  }

  /**
   * Connect to ElevenLabs TTS
   */
  async connectElevenLabs() {
    return new Promise((resolve, reject) => {
      console.log(`[VoicePipeline ${this.callId}] Connecting to ElevenLabs...`);

      const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Brad's voice
      const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_turbo_v2_5&output_format=ulaw_8000`;

      this.elevenLabsWs = new WebSocket(wsUrl, {
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY
        }
      });

      this.elevenLabsWs.on('open', () => {
        console.log(`[VoicePipeline ${this.callId}] ElevenLabs connected`);

        // Send initial config
        this.elevenLabsWs.send(JSON.stringify({
          text: ' ',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
          generation_config: {
            chunk_length_schedule: [120, 160, 250, 290]
          }
        }));

        resolve();
      });

      this.elevenLabsWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.audio) {
            const audioBuffer = Buffer.from(message.audio, 'base64');
            this.sendAudioToTwilio(audioBuffer);
          }

          if (message.isFinal) {
            console.log(`[VoicePipeline ${this.callId}] ElevenLabs finished speaking`);
            this.finishSpeaking();
          }
        } catch (error) {
          // Binary audio data
          this.sendAudioToTwilio(data);
        }
      });

      this.elevenLabsWs.on('error', (error) => {
        console.error(`[VoicePipeline ${this.callId}] ElevenLabs error:`, error);
      });

      this.elevenLabsWs.on('close', () => {
        console.log(`[VoicePipeline ${this.callId}] ElevenLabs connection closed`);
      });

      setTimeout(() => reject(new Error('ElevenLabs connection timeout')), 5000);
    });
  }

  /**
   * Handle incoming transcript segment from Deepgram
   */
  handleTranscriptSegment(transcript) {
    // If AI was speaking and user interrupted
    if (this.isSpeaking) {
      console.log(`[VoicePipeline ${this.callId}] User interrupted!`);
      // TODO: Stop TTS playback
      this.isSpeaking = false;
      this.transcriptSegments = [];
      this.evaluationCount = 0;
    }

    // Add to transcript segments
    this.transcriptSegments.push({
      text: transcript,
      timestamp: Date.now()
    });

    this.lastSpeechTime = Date.now();

    // Reset silence timer
    this.resetSilenceTimer();
  }

  /**
   * Reset silence timer
   */
  resetSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Schedule silence check after LLM eval threshold
    this.silenceTimer = setTimeout(() => {
      this.onSilenceDetected();
    }, this.config.llmEvalThresholdMs);
  }

  /**
   * Detect silence and trigger appropriate action
   */
  onSilenceDetected() {
    const silenceDuration = Date.now() - this.lastSpeechTime;

    console.log(`[VoicePipeline ${this.callId}] Silence detected: ${silenceDuration}ms`);

    // Short silence - just a natural pause, keep listening
    if (silenceDuration < this.config.shortSilenceMs) {
      return;
    }

    // LLM evaluation threshold reached
    if (silenceDuration >= this.config.llmEvalThresholdMs &&
        this.evaluationCount < this.config.maxEvaluations &&
        !this.isEvaluating) {
      this.triggerTurnEvaluation();
      return;
    }

    // Force response after maximum wait time
    if (silenceDuration >= this.config.forceResponseMs) {
      console.log(`[VoicePipeline ${this.callId}] Force response timeout`);
      this.triggerResponse('force_timeout');
    }
  }

  /**
   * Trigger LLM evaluation of conversation completeness
   */
  async triggerTurnEvaluation() {
    this.isEvaluating = true;
    this.evaluationCount++;

    const partialTranscript = this.getPartialTranscript();
    console.log(`[VoicePipeline ${this.callId}] Evaluating turn (attempt ${this.evaluationCount}): "${partialTranscript}"`);

    const decision = await this.evaluateConversationalCompleteness(partialTranscript);

    console.log(`[VoicePipeline ${this.callId}] LLM Decision: ${decision}`);

    this.isEvaluating = false;

    if (decision === 'RESPOND') {
      this.triggerResponse('llm_eval_complete');
    } else {
      // WAIT or UNCLEAR - schedule next check
      this.silenceTimer = setTimeout(() => {
        this.onSilenceDetected();
      }, this.config.llmEvalThresholdMs);
    }
  }

  /**
   * LLM-based evaluation of whether user is done speaking
   */
  async evaluateConversationalCompleteness(transcript) {
    try {
      const prompt = `Analyze if the user has finished speaking:

User said: "${transcript}"

Incomplete indicators:
- Trailing "um", "uh", "so", "and", "but"
- Unfinished sentences
- Open-ended phrases like "I want to..."

Complete indicators:
- Full question or statement
- Natural end punctuation
- Clear intent expressed

Answer with ONE word only:
- WAIT (user likely has more to say)
- RESPOND (user is done, respond now)
- UNCLEAR (not sure, wait longer)

Answer:`;

      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 10,
          temperature: 0.3,
          stream: false
        })
      });

      const data = await response.json();
      const decision = data.choices[0]?.message?.content?.trim().toUpperCase();

      if (decision.includes('RESPOND')) return 'RESPOND';
      if (decision.includes('WAIT')) return 'WAIT';
      return 'UNCLEAR';

    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Turn evaluation failed:`, error);

      // Fallback to heuristic
      return this.heuristicTurnEvaluation(transcript);
    }
  }

  /**
   * Heuristic-based fallback for turn evaluation
   */
  heuristicTurnEvaluation(transcript) {
    const text = transcript.trim().toLowerCase();
    const words = text.split(/\s+/);

    // Very short - probably incomplete
    if (words.length < 2) return 'WAIT';

    // Ends with incomplete markers
    const incompleteEndings = ['um', 'uh', 'so', 'and', 'but', 'or', 'because', 'like'];
    const lastWord = words[words.length - 1];
    if (incompleteEndings.includes(lastWord)) return 'WAIT';

    // Contains question words and reasonable length
    const questionWords = ['what', 'where', 'when', 'who', 'why', 'how', 'can', 'could', 'would', 'should'];
    const hasQuestionWord = words.some(w => questionWords.includes(w));
    if (hasQuestionWord && words.length >= 3) return 'RESPOND';

    // Reasonable length statement
    if (words.length >= 5) return 'RESPOND';

    return 'UNCLEAR';
  }

  /**
   * Trigger full AI response generation
   */
  async triggerResponse(reason) {
    console.log(`[VoicePipeline ${this.callId}] Triggering response (reason: ${reason})`);

    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Get final transcript
    const userMessage = this.getPartialTranscript();

    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Reset for next turn
    this.transcriptSegments = [];
    this.evaluationCount = 0;

    // Generate AI response
    await this.generateResponse();
  }

  /**
   * Get partial transcript for evaluation
   */
  getPartialTranscript() {
    return this.transcriptSegments
      .map(seg => seg.text)
      .join(' ')
      .trim();
  }

  /**
   * Generate AI response using Cerebras
   */
  async generateResponse() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Generating response...`);

      const messages = [
        {
          role: 'system',
          content: 'You are Brad, a supportive bro who keeps it real. Be conversational, direct, and encouraging. Keep responses SHORT (1-2 sentences max) for natural conversation flow.'
        },
        ...this.conversationHistory.slice(-10)
      ];

      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
          stream: false
        })
      });

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        console.log(`[VoicePipeline ${this.callId}] AI says:`, aiResponse);
        this.conversationHistory.push({
          role: 'assistant',
          content: aiResponse
        });

        await this.speak(aiResponse);
      }
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Failed to generate response:`, error);
      await this.speak("Sorry bro, I lost my train of thought. What were you saying?");
    }
  }

  /**
   * Speak text using ElevenLabs TTS
   */
  async speak(text) {
    // Reconnect if disconnected
    if (!this.elevenLabsWs || this.elevenLabsWs.readyState !== WebSocket.OPEN) {
      console.log(`[VoicePipeline ${this.callId}] ElevenLabs disconnected, reconnecting...`);
      await this.connectElevenLabs();
    }

    console.log(`[VoicePipeline ${this.callId}] Speaking:`, text);
    this.isSpeaking = true;

    // Send text to ElevenLabs
    this.elevenLabsWs.send(JSON.stringify({
      text: text,
      try_trigger_generation: true
    }));

    // Send flush to complete generation
    this.elevenLabsWs.send(JSON.stringify({
      text: ''
    }));
  }

  /**
   * Mark AI as done speaking, ready for next turn
   */
  finishSpeaking() {
    console.log(`[VoicePipeline ${this.callId}] Finished speaking, ready for user input`);
    this.isSpeaking = false;
  }

  /**
   * Send audio to Twilio
   */
  sendAudioToTwilio(audioBuffer) {
    if (!this.streamSid) {
      console.warn(`[VoicePipeline ${this.callId}] No streamSid yet, skipping audio`);
      return;
    }

    const payload = audioBuffer.toString('base64');

    this.twilioWs.send(JSON.stringify({
      event: 'media',
      streamSid: this.streamSid,
      media: {
        payload: payload
      }
    }));
  }

  /**
   * Handle incoming audio from Twilio
   */
  handleTwilioMedia(audioPayload) {
    // Forward to Deepgram only when not speaking
    if (this.deepgramWs && !this.isSpeaking) {
      const audioBuffer = Buffer.from(audioPayload, 'base64');
      this.deepgramWs.send(audioBuffer);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    console.log(`[VoicePipeline ${this.callId}] Cleaning up...`);

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.deepgramWs) {
      this.deepgramWs.close();
      this.deepgramWs = null;
    }

    if (this.elevenLabsWs) {
      this.elevenLabsWs.close();
      this.elevenLabsWs = null;
    }
  }
}

// WebSocket connection handler
wss.on('connection', async (twilioWs, req) => {
  console.log('[Voice Pipeline] New WebSocket connection from Twilio');

  let pipeline = null;

  twilioWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.event === 'start') {
        console.log('[Voice Pipeline] Received START message from Twilio');

        const callId = message.start.customParameters?.callId || 'unknown';
        const userId = message.start.customParameters?.userId || 'unknown';
        const personaId = message.start.customParameters?.personaId || 'brad_001';

        console.log('[Voice Pipeline] Call params:', { callId, userId, personaId });

        const streamSid = message.start.streamSid;

        pipeline = new VoicePipeline(twilioWs, { callId, userId, personaId });
        pipeline.streamSid = streamSid;

        await pipeline.start();
      }

      else if (message.event === 'media' && pipeline) {
        const audioPayload = message.media.payload;
        pipeline.handleTwilioMedia(audioPayload);
      }

      else if (message.event === 'stop') {
        console.log('[Voice Pipeline] Received STOP message from Twilio');
        if (pipeline) {
          pipeline.cleanup();
        }
      }

    } catch (error) {
      console.error('[Voice Pipeline] Error processing Twilio message:', error);
    }
  });

  twilioWs.on('close', () => {
    console.log('[Voice Pipeline] Twilio WebSocket closed');
    if (pipeline) {
      pipeline.cleanup();
    }
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
