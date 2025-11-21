import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import WebSocket from 'ws';
import { RealTimeVAD } from 'avr-vad';

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
    this.callPretext = callParams.callPretext || ''; // e.g., "Save me from a bad date"

    // Persona metadata (will be fetched from database)
    this.personaName = null;
    this.voiceId = null;
    this.systemPrompt = null;
    this.smartMemory = null;

    // Service connections
    this.deepgramWs = null;
    this.elevenLabsWs = null;

    // Connection state tracking
    this.deepgramReady = false;
    this.elevenLabsReady = false;
    this.audioBuffer = [];  // Buffer audio until Deepgram connected
    this.connectionHealthTimer = null; // Periodic connection health check

    // Silero-VAD
    this.vad = null;
    this.vadEnabled = true;  // Feature flag
    this.isUserSpeaking = false;
    this.audioChunkBuffer = [];  // Buffer for VAD processing

    // State
    this.conversationHistory = [];
    this.transcriptSegments = [];
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
    this.isEvaluating = false;
    this.streamSid = null;
    this.silenceTimer = null;
    this.evaluationCount = 0;

    // Turn-taking config (reduced thresholds with VAD enabled)
    this.config = {
      shortSilenceMs: 300,       // Reduced from 500 (VAD handles detection)
      llmEvalThresholdMs: 800,   // Reduced from 1200 (33% faster)
      forceResponseMs: 2000,     // Reduced from 3000
      maxEvaluations: 2          // Max LLM evals before forcing
    };

    console.log(`[VoicePipeline ${this.callId}] Initialized`, callParams);
  }

  /**
   * Fetch persona metadata from database
   * Fetches: name, voice_id, system_prompt, smart_memory
   */
  async fetchPersonaMetadata() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Fetching persona metadata for ${this.personaId}...`);

      const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`  // Fixed: Changed from X-API-Key to Authorization: Bearer
        },
        body: JSON.stringify({
          sql: `
            SELECT p.name, p.core_system_prompt, p.default_voice_id,
                   p.max_tokens, p.temperature,
                   upr.custom_system_prompt, upr.voice_id
            FROM personas p
            LEFT JOIN user_persona_relationships upr
              ON upr.persona_id = p.id AND upr.user_id = $1
            WHERE p.id = $2
          `,
          params: [this.userId, this.personaId]
        })
      });

      console.log(`[VoicePipeline ${this.callId}] Database response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database query failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[VoicePipeline ${this.callId}] Database result:`, JSON.stringify(result, null, 2));

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        this.personaName = row.name || 'Brad';
        // Use custom voice if set, otherwise use persona's default voice
        this.voiceId = row.voice_id || row.default_voice_id || 'pNInz6obpgDQGcFmaJgB';
        // Use custom system prompt if set, otherwise use persona's core prompt
        this.systemPrompt = row.custom_system_prompt || row.core_system_prompt ||
          'You are a supportive friend who keeps it real. Be conversational, direct, and encouraging. Keep responses SHORT (1-2 sentences max) for natural conversation flow.';
        // Store AI params from database (configurable from admin panel)
        this.maxTokens = row.max_tokens || 100;  // Default: 100 tokens (prevents mid-sentence truncation)
        this.temperature = row.temperature || 0.7;  // Default: 0.7 (balanced creativity)
        // Note: smart_memory column doesn't exist in current schema - will be added later for static relationship context
        this.smartMemory = '';

        console.log(`[VoicePipeline ${this.callId}] ✅ Loaded persona successfully:`, {
          name: this.personaName,
          voiceId: this.voiceId,
          systemPromptLength: this.systemPrompt.length,
          hasCallPretext: !!this.callPretext,
          maxTokens: this.maxTokens,
          temperature: this.temperature
        });
      } else {
        console.warn(`[VoicePipeline ${this.callId}] ⚠️  Persona not found in database, using defaults`);
        this.personaName = 'Brad';
        this.voiceId = 'pNInz6obpgDQGcFmaJgB';
        this.systemPrompt = 'You are Brad, a supportive bro who keeps it real. Be conversational, direct, and encouraging. Keep responses SHORT (1-2 sentences max) for natural conversation flow.';
        this.maxTokens = 100;
        this.temperature = 0.7;
        this.smartMemory = '';
      }
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] ❌ Failed to fetch persona metadata:`, error);
      console.error(`[VoicePipeline ${this.callId}] Error stack:`, error.stack);
      // Use defaults on error
      this.personaName = 'Brad';
      this.maxTokens = 100;
      this.temperature = 0.7;
      this.voiceId = 'pNInz6obpgDQGcFmaJgB';
      this.systemPrompt = 'You are Brad, a supportive bro who keeps it real. Be conversational, direct, and encouraging. Keep responses SHORT (1-2 sentences max) for natural conversation flow.';
      this.smartMemory = '';
    }
  }

  /**
   * Start the voice pipeline
   */
  async start() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Starting...`);

      // STEP 1: Fetch persona metadata from database
      await this.fetchPersonaMetadata();

      // STEP 2: Connect to Deepgram STT
      await this.connectDeepgram();

      // STEP 3: Connect to ElevenLabs TTS (using persona's voiceId)
      await this.connectElevenLabs();

      // STEP 4: Initialize Silero-VAD
      if (this.vadEnabled) {
        await this.initializeVAD();
      }

      console.log(`[VoicePipeline ${this.callId}] All services connected`);

      // STEP 5: Start connection health monitoring
      this.startConnectionHealthMonitoring();

      // STEP 6: Wait for user to speak first (no auto-greeting)

    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Failed to start:`, error);
      throw error;
    }
  }

  /**
   * Monitor connection health and attempt reconnection if needed
   */
  startConnectionHealthMonitoring() {
    // Check connections every 30 seconds
    this.connectionHealthTimer = setInterval(async () => {
      console.log(`[VoicePipeline ${this.callId}] Health check - Deepgram: ${this.deepgramReady}, ElevenLabs: ${this.elevenLabsReady}`);

      // Check Deepgram connection
      if (this.deepgramWs && this.deepgramWs.readyState !== WebSocket.OPEN) {
        console.warn(`[VoicePipeline ${this.callId}] Deepgram connection lost, attempting reconnect...`);
        this.deepgramReady = false;
        try {
          await this.connectDeepgram();
        } catch (error) {
          console.error(`[VoicePipeline ${this.callId}] Deepgram reconnection failed:`, error);
        }
      }

      // Check ElevenLabs connection
      if (this.elevenLabsWs && this.elevenLabsWs.readyState !== WebSocket.OPEN) {
        console.warn(`[VoicePipeline ${this.callId}] ElevenLabs connection lost, attempting reconnect...`);
        this.elevenLabsReady = false;
        try {
          await this.connectElevenLabs();
        } catch (error) {
          console.error(`[VoicePipeline ${this.callId}] ElevenLabs reconnection failed:`, error);
        }
      }
    }, 30000); // Every 30 seconds
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
        this.deepgramReady = true;

        // Flush buffered audio
        if (this.audioBuffer.length > 0) {
          console.log(`[VoicePipeline ${this.callId}] Flushing ${this.audioBuffer.length} buffered audio chunks`);
          this.audioBuffer.forEach(audioPayload => {
            const audioBuffer = Buffer.from(audioPayload, 'base64');
            this.deepgramWs.send(audioBuffer);
          });
          this.audioBuffer = [];
        }

        resolve();
      });

      this.deepgramWs.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            console.log(`[VoicePipeline ${this.callId}] User said:`, transcript);

            // Log Deepgram usage for cost tracking
            const duration = response.duration;
            const confidence = response.channel?.alternatives?.[0]?.confidence;
            const isFinal = response.is_final;
            if (duration !== undefined || confidence !== undefined) {
              console.log(`[VoicePipeline ${this.callId}] Deepgram transcript: duration: ${duration || 0} confidence: ${confidence || 0} is_final: ${isFinal || false}`);
            }

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
      console.log(`[VoicePipeline ${this.callId}] Connecting to ElevenLabs with voice: ${this.voiceId}...`);

      const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=eleven_flash_v2_5&optimize_streaming_latency=4&output_format=ulaw_8000`;

      this.elevenLabsWs = new WebSocket(wsUrl, {
        headers: {
          'xi-api-key': env.ELEVENLABS_API_KEY
        }
      });

      this.elevenLabsWs.on('open', () => {
        console.log(`[VoicePipeline ${this.callId}] ElevenLabs connected`);
        this.elevenLabsReady = true;

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
            chunk_length_schedule: [50, 120, 160, 290]
          }
        }));

        resolve();
      });

      // Track audio chunks for debugging
      let audioChunkCount = 0;

      this.elevenLabsWs.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          // Log all non-audio messages for debugging
          if (!message.audio) {
            console.log(`[VoicePipeline ${this.callId}] ElevenLabs message:`, JSON.stringify(message));
          }

          if (message.audio) {
            audioChunkCount++;
            const audioBuffer = Buffer.from(message.audio, 'base64');

            // Log first and every 10th chunk for debugging
            if (audioChunkCount === 1 || audioChunkCount % 10 === 0) {
              console.log(`[VoicePipeline ${this.callId}] 🔊 Audio chunk #${audioChunkCount}, size: ${audioBuffer.length} bytes`);
            }

            this.sendAudioToTwilio(audioBuffer);
          }

          if (message.isFinal) {
            console.log(`[VoicePipeline ${this.callId}] ElevenLabs finished speaking (received ${audioChunkCount} audio chunks total)`);
            audioChunkCount = 0; // Reset for next response
            this.finishSpeaking();
          }

          // Check for errors
          if (message.error) {
            console.error(`[VoicePipeline ${this.callId}] ElevenLabs error message:`, message.error);
          }
        } catch (error) {
          // Binary audio data
          audioChunkCount++;
          if (audioChunkCount === 1 || audioChunkCount % 10 === 0) {
            console.log(`[VoicePipeline ${this.callId}] 🔊 Binary audio chunk #${audioChunkCount}, size: ${data.length} bytes`);
          }
          this.sendAudioToTwilio(data);
        }
      });

      this.elevenLabsWs.on('error', (error) => {
        console.error(`[VoicePipeline ${this.callId}] ElevenLabs error:`, error);
      });

      this.elevenLabsWs.on('close', (code, reason) => {
        console.log(`[VoicePipeline ${this.callId}] ElevenLabs connection closed - Code: ${code}, Reason: ${reason}`);
        this.elevenLabsReady = false;
      });

      setTimeout(() => reject(new Error('ElevenLabs connection timeout')), 5000);
    });
  }

  /**
   * Initialize Silero-VAD for real-time speech detection
   */
  async initializeVAD() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Initializing Silero-VAD...`);

      this.vad = await RealTimeVAD.new({
        model: 'v5',                      // Use latest Silero v5 model
        positiveSpeechThreshold: 0.5,    // Detect speech when probability > 50%
        negativeSpeechThreshold: 0.35,   // End speech when probability < 35%
        preSpeechPadFrames: 1,           // Capture audio before speech starts
        redemptionFrames: 10,            // Allow 300ms pauses (10 × 30ms frames)
        minSpeechFrames: 3,              // Require 3 consecutive frames to confirm speech
        frameSamples: 1536,              // Frame size for 16kHz audio

        // Callbacks
        onSpeechStart: (audio) => {
          if (!this.isSpeaking) {  // Only track user speech, not AI
            console.log(`[VoicePipeline ${this.callId}] 🎤 VAD: User started speaking`);
            this.isUserSpeaking = true;
            this.lastSpeechTime = Date.now();
          }
        },

        onSpeechEnd: (audio) => {
          if (!this.isSpeaking && this.isUserSpeaking) {  // User finished speaking
            console.log(`[VoicePipeline ${this.callId}] 🔇 VAD: User stopped speaking`);
            this.isUserSpeaking = false;
            this.onVADSpeechEnd();
          }
        }
      });

      console.log(`[VoicePipeline ${this.callId}] ✅ Silero-VAD initialized (model: v5, local inference)`);
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] ❌ Failed to initialize VAD:`, error);
      console.error(`[VoicePipeline ${this.callId}] Disabling VAD, falling back to timer-based detection`);
      this.vadEnabled = false;
    }
  }

  /**
   * Handle VAD speech end event - user has stopped speaking
   */
  async onVADSpeechEnd() {
    const transcript = this.getPartialTranscript();
    const silenceDuration = Date.now() - this.lastSpeechTime;

    console.log(`[VoicePipeline ${this.callId}] VAD detected speech end (${silenceDuration}ms silence, transcript: "${transcript}")`);

    // If very short utterance or pause, verify with heuristic
    if (silenceDuration < 400 || transcript.length < 8) {
      console.log(`[VoicePipeline ${this.callId}] Short utterance detected, using heuristic check...`);

      const heuristic = this.heuristicTurnEvaluation(transcript);

      if (heuristic === 'RESPOND') {
        // Heuristic confirms it's complete
        this.triggerResponse('vad_plus_heuristic');
      } else {
        // Likely false alarm, wait for more speech
        console.log(`[VoicePipeline ${this.callId}] Heuristic says WAIT, continuing to listen...`);
      }
    } else {
      // Clear speech boundary - respond immediately!
      this.triggerResponse('vad_confident');
    }
  }

  /**
   * Handle incoming transcript segment from Deepgram
   */
  handleTranscriptSegment(transcript) {
    // If AI was speaking and user interrupted
    if (this.isSpeaking) {
      console.log(`[VoicePipeline ${this.callId}] User interrupted!`);

      // Stop TTS playback by sending flush message
      if (this.elevenLabsWs && this.elevenLabsWs.readyState === WebSocket.OPEN) {
        try {
          this.elevenLabsWs.send(JSON.stringify({
            text: '',
            flush: true  // Force immediate completion of current audio
          }));
          console.log(`[VoicePipeline ${this.callId}] Sent flush to stop TTS`);
        } catch (error) {
          console.error(`[VoicePipeline ${this.callId}] Failed to flush TTS:`, error);
        }
      }

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
   * Trigger turn evaluation (heuristic + LLM) to determine if user is done speaking
   * This is ONLY turn detection - does NOT trigger AI response generation yet
   */
  async triggerTurnEvaluation() {
    this.isEvaluating = true;
    this.evaluationCount++;

    const currentTranscript = this.getPartialTranscript();
    console.log(`[VoicePipeline ${this.callId}] Evaluating turn (attempt ${this.evaluationCount}): "${currentTranscript}"`);

    const decision = await this.evaluateConversationalCompleteness(currentTranscript);

    console.log(`[VoicePipeline ${this.callId}] Turn Decision: ${decision}`);

    this.isEvaluating = false;

    if (decision === 'RESPOND') {
      // User has finished speaking - NOW we can send the full transcript to AI for response generation
      this.triggerResponse('turn_complete');
    } else if (this.evaluationCount >= this.config.maxEvaluations) {
      // Reached max evaluations - force response now
      console.log(`[VoicePipeline ${this.callId}] Max evaluations reached, forcing response`);
      this.triggerResponse('max_evaluations');
    } else {
      // WAIT - user is still speaking, schedule next check
      this.silenceTimer = setTimeout(() => {
        this.onSilenceDetected();
      }, this.config.llmEvalThresholdMs);
    }
  }

  /**
   * Combined heuristic + LLM evaluation with heuristic override
   */
  async evaluateConversationalCompleteness(transcript) {
    // First check heuristic - it's fast and catches obvious cases
    const heuristicDecision = this.heuristicTurnEvaluation(transcript);

    // If heuristic says RESPOND (obvious complete statement/question), trust it
    if (heuristicDecision === 'RESPOND') {
      console.log(`[VoicePipeline ${this.callId}] Heuristic override: RESPOND`);
      return 'RESPOND';
    }

    // If heuristic says WAIT (obvious incomplete), trust it
    if (heuristicDecision === 'WAIT') {
      console.log(`[VoicePipeline ${this.callId}] Heuristic override: WAIT`);
      return 'WAIT';
    }

    // Only use LLM for unclear cases
    try {
      const prompt = `Analyze if the user has finished speaking in a natural phone conversation:

User said: "${transcript}"

RESPOND immediately if:
- Complete question (e.g., "did you get the invoice?", "how are you?")
- Complete statement with clear intent
- Greeting or acknowledgment (e.g., "thanks", "okay", "got it")
- Natural conversation turn-ending

WAIT only if:
- Trailing "um", "uh", "so", "and then", "but"
- Mid-sentence pause (clearly incomplete thought)
- Building up to something ("I was thinking..." with nothing after)

Default to RESPOND unless clearly incomplete.

Answer with ONE word only: WAIT, RESPOND, or UNCLEAR

Answer:`;

      // Add 5-second timeout for turn evaluation to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Turn evaluation timeout after 5 seconds')), 5000)
      );

      const fetchPromise = fetch('https://api.cerebras.ai/v1/chat/completions', {
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

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await response.json();
      const decision = data.choices[0]?.message?.content?.trim().toUpperCase();

      if (decision.includes('RESPOND')) return 'RESPOND';
      if (decision.includes('WAIT')) return 'WAIT';
      return 'RESPOND'; // Default to RESPOND for UNCLEAR

    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Turn evaluation failed:`, error);
      return 'RESPOND'; // Default to responding on error (prevents hanging)
    }
  }

  /**
   * Semantic-based turn evaluation (inspired by OpenAI's semantic_vad)
   * Analyzes linguistic completeness rather than just word counts
   */
  heuristicTurnEvaluation(transcript) {
    const text = transcript.trim().toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) return 'WAIT';

    const lastWord = words[words.length - 1];
    const firstWord = words[0];

    // 1. WAIT indicators - obvious incompleteness
    const fillerEndings = ['um', 'uh', 'er', 'ah', 'hmm'];
    if (fillerEndings.includes(lastWord)) return 'WAIT';

    const conjunctionEndings = ['and', 'but', 'or', 'so', 'because', 'since', 'while', 'although'];
    if (conjunctionEndings.includes(lastWord)) return 'WAIT';

    const prepositionEndings = ['to', 'in', 'on', 'at', 'for', 'with', 'about', 'from'];
    if (prepositionEndings.includes(lastWord)) return 'WAIT';

    const articleEndings = ['a', 'an', 'the'];
    if (articleEndings.includes(lastWord)) return 'WAIT';

    // Incomplete phrase patterns
    if (text.endsWith('i was') || text.endsWith('i am') || text.endsWith('i will') ||
        text.endsWith('you were') || text.endsWith('you are') || text.endsWith('that is')) {
      return 'WAIT';
    }

    // 2. RESPOND indicators - clear semantic completeness

    // Question patterns - complete questions should respond
    const questionStarts = ['what', 'where', 'when', 'who', 'why', 'how', 'can', 'could',
                           'would', 'should', 'did', 'do', 'does', 'is', 'are', 'was', 'were'];
    if (questionStarts.includes(firstWord) && words.length >= 3) {
      return 'RESPOND'; // e.g., "how are you", "did you get it"
    }

    // Imperative/request patterns
    const imperativeStarts = ['please', 'let', 'go', 'send', 'give', 'show', 'tell'];
    if (imperativeStarts.includes(firstWord) && words.length >= 2) {
      return 'RESPOND'; // e.g., "please send it", "tell me"
    }

    // Acknowledgments and affirmations
    const acknowledgments = ['yeah', 'yes', 'yep', 'okay', 'ok', 'sure', 'alright', 'right',
                            'thanks', 'thank you', 'got it', 'i see', 'no problem'];
    if (acknowledgments.includes(text) || acknowledgments.some(ack => text === ack)) {
      return 'RESPOND';
    }

    // Complete statements with subject-verb-object structure (rough heuristic)
    // If contains pronouns + verbs + reasonable length, likely complete
    const pronouns = ['i', 'you', 'he', 'she', 'it', 'we', 'they'];
    const commonVerbs = ['is', 'are', 'was', 'were', 'have', 'has', 'had', 'will', 'would',
                        'can', 'could', 'do', 'does', 'did', 'get', 'got', 'want', 'need',
                        'think', 'know', 'see', 'said', 'make', 'go', 'send', 'sent'];

    const hasPronoun = words.some(w => pronouns.includes(w));
    const hasVerb = words.some(w => commonVerbs.includes(w));

    if (hasPronoun && hasVerb && words.length >= 4) {
      return 'RESPOND'; // e.g., "i sent you the invoice"
    }

    // 3. Default to UNCLEAR for edge cases
    return 'UNCLEAR';
  }

  /**
   * Trigger full AI response generation
   * This is called ONLY AFTER turn detection has decided the user is done speaking
   * The full user transcript is now sent to the chatbot flow for response generation
   */
  async triggerResponse(reason) {
    console.log(`[VoicePipeline ${this.callId}] User finished speaking (reason: ${reason}). Sending full transcript to AI...`);

    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    // Get FINAL complete user transcript (accumulated from all segments)
    const userMessage = this.getPartialTranscript();
    console.log(`[VoicePipeline ${this.callId}] Full user transcript: "${userMessage}"`);

    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Reset for next turn
    this.transcriptSegments = [];
    this.evaluationCount = 0;

    // Generate AI response using the COMPLETE user message
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

      // Build system prompt with persona configuration, smartMemory, and callPretext
      let systemPrompt = this.systemPrompt;

      // Add smartMemory if available (configured relationships/behavior)
      if (this.smartMemory) {
        systemPrompt += `\n\nRELATIONSHIP CONTEXT:\n${this.smartMemory}`;
      }

      // Add callPretext if available (reason for the call, e.g., "Save me from a bad date")
      if (this.callPretext) {
        systemPrompt += `\n\nCALL CONTEXT: The user requested this call for the following reason: "${this.callPretext}". Keep this context in mind and be helpful with their situation.`;
      }

      // CRITICAL: Enforce brevity and natural conversation
      systemPrompt += `\n\nPhone Call Guidelines:
- Keep responses brief and natural (1-2 short sentences)
- Respond to what the user actually says - stay grounded in the real conversation
- Speak conversationally, no stage directions like "(laughs)"
- If something's unclear, just ask!`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...this.conversationHistory.slice(-10)
      ];

      // Add 15-second timeout for AI response generation
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI response generation timeout')), 15000)
      );

      const fetchPromise = fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: messages,
          max_tokens: this.maxTokens,  // Configurable from admin panel (stored in personas table)
          temperature: this.temperature,  // Configurable from admin panel (stored in personas table)
          stream: false
        })
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        console.log(`[VoicePipeline ${this.callId}] AI says:`, aiResponse);
        console.log(`[VoicePipeline ${this.callId}] AI response length: ${aiResponse.length} chars`);
        console.log(`[VoicePipeline ${this.callId}] Finish reason:`, data.choices[0]?.finish_reason);

        // Log Cerebras usage for cost tracking
        if (data.usage) {
          console.log(`[VoicePipeline ${this.callId}] Cerebras usage: model: ${data.model || 'llama3.1-8b'} prompt_tokens: ${data.usage.prompt_tokens} completion_tokens: ${data.usage.completion_tokens} total_tokens: ${data.usage.total_tokens}`);
        }

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
    try {
      // Reconnect if disconnected (with 10-second timeout)
      if (!this.elevenLabsWs || this.elevenLabsWs.readyState !== WebSocket.OPEN) {
        console.log(`[VoicePipeline ${this.callId}] ElevenLabs disconnected, reconnecting...`);
        this.elevenLabsReady = false; // Reset state

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('ElevenLabs reconnection timeout')), 10000)
        );

        await Promise.race([
          this.connectElevenLabs(),
          timeoutPromise
        ]);

        // Verify connection succeeded
        if (!this.elevenLabsReady || this.elevenLabsWs.readyState !== WebSocket.OPEN) {
          throw new Error('ElevenLabs reconnection failed - connection not ready');
        }
      }

      console.log(`[VoicePipeline ${this.callId}] Speaking:`, text);
      this.isSpeaking = true;

      // Send text to ElevenLabs with flush flag
      // ElevenLabs stream-input API: Send text with flush=true to trigger generation
      this.elevenLabsWs.send(JSON.stringify({
        text: text,
        flush: true
      }));

      // Send empty string to signal end of input (prevents 20s timeout)
      this.elevenLabsWs.send(JSON.stringify({
        text: ''
      }));

      // Log ElevenLabs usage for cost tracking
      console.log(`[VoicePipeline ${this.callId}] ElevenLabs TTS: characters: ${text.length} voice_id: ${this.voiceId} model: eleven_turbo_v2_5`);
      console.log(`[VoicePipeline ${this.callId}] Sent text with end-of-input signal to ElevenLabs`);
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Failed to speak:`, error);

      // Mark as not ready so we retry next time
      this.elevenLabsReady = false;

      // Fallback: just finish speaking so call doesn't hang
      this.finishSpeaking();

      // Try reconnecting in background for next time
      setTimeout(() => {
        console.log(`[VoicePipeline ${this.callId}] Attempting background ElevenLabs reconnection...`);
        this.connectElevenLabs().catch(e =>
          console.error(`[VoicePipeline ${this.callId}] Background reconnection failed:`, e)
        );
      }, 1000);
    }
  }

  /**
   * Mark AI as done speaking, ready for next turn
   */
  finishSpeaking() {
    console.log(`[VoicePipeline ${this.callId}] ✅ Finished speaking (sent ${this.sentAudioChunks || 0} chunks to Twilio), ready for user input`);
    this.isSpeaking = false;
    this.sentAudioChunks = 0; // Reset counter for next response
  }

  /**
   * Send audio to Twilio
   */
  sendAudioToTwilio(audioBuffer) {
    if (!this.streamSid) {
      console.warn(`[VoicePipeline ${this.callId}] ⚠️  No streamSid yet, skipping audio`);
      return;
    }

    // Track sent audio chunks
    if (!this.sentAudioChunks) this.sentAudioChunks = 0;
    this.sentAudioChunks++;

    const payload = audioBuffer.toString('base64');

    // Log first and every 10th sent chunk
    if (this.sentAudioChunks === 1 || this.sentAudioChunks % 10 === 0) {
      console.log(`[VoicePipeline ${this.callId}] 📤 Sent audio chunk #${this.sentAudioChunks} to Twilio (${audioBuffer.length} bytes → ${payload.length} base64 chars)`);
    }

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
    // Buffer audio if Deepgram not ready yet
    if (!this.deepgramReady) {
      this.audioBuffer.push(audioPayload);
      return;
    }

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

    if (this.connectionHealthTimer) {
      clearInterval(this.connectionHealthTimer);
      this.connectionHealthTimer = null;
    }

    if (this.deepgramWs) {
      this.deepgramWs.close();
      this.deepgramWs = null;
      this.deepgramReady = false;
    }

    if (this.elevenLabsWs) {
      this.elevenLabsWs.close();
      this.elevenLabsWs = null;
      this.elevenLabsReady = false;
    }

    if (this.vad) {
      try {
        this.vad.destroy();
        console.log(`[VoicePipeline ${this.callId}] VAD destroyed`);
      } catch (error) {
        console.error(`[VoicePipeline ${this.callId}] Error destroying VAD:`, error);
      }
      this.vad = null;
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
        const callPretext = message.start.customParameters?.callPretext || '';

        console.log('[Voice Pipeline] Call params:', { callId, userId, personaId, callPretext });

        const streamSid = message.start.streamSid;

        pipeline = new VoicePipeline(twilioWs, { callId, userId, personaId, callPretext });
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
