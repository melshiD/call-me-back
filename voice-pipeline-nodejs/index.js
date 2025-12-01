import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';
import { RealTimeVAD } from 'avr-vad';

/**
 * Mulaw decoding table - converts 8-bit mulaw to 16-bit PCM
 */
const MULAW_DECODE_TABLE = new Int16Array([
  -32124,-31100,-30076,-29052,-28028,-27004,-25980,-24956,
  -23932,-22908,-21884,-20860,-19836,-18812,-17788,-16764,
  -15996,-15484,-14972,-14460,-13948,-13436,-12924,-12412,
  -11900,-11388,-10876,-10364,-9852,-9340,-8828,-8316,
  -7932,-7676,-7420,-7164,-6908,-6652,-6396,-6140,
  -5884,-5628,-5372,-5116,-4860,-4604,-4348,-4092,
  -3900,-3772,-3644,-3516,-3388,-3260,-3132,-3004,
  -2876,-2748,-2620,-2492,-2364,-2236,-2108,-1980,
  -1884,-1820,-1756,-1692,-1628,-1564,-1500,-1436,
  -1372,-1308,-1244,-1180,-1116,-1052,-988,-924,
  -876,-844,-812,-780,-748,-716,-684,-652,
  -620,-588,-556,-524,-492,-460,-428,-396,
  -372,-356,-340,-324,-308,-292,-276,-260,
  -244,-228,-212,-196,-180,-164,-148,-132,
  -120,-112,-104,-96,-88,-80,-72,-64,
  -56,-48,-40,-32,-24,-16,-8,0,
  32124,31100,30076,29052,28028,27004,25980,24956,
  23932,22908,21884,20860,19836,18812,17788,16764,
  15996,15484,14972,14460,13948,13436,12924,12412,
  11900,11388,10876,10364,9852,9340,8828,8316,
  7932,7676,7420,7164,6908,6652,6396,6140,
  5884,5628,5372,5116,4860,4604,4348,4092,
  3900,3772,3644,3516,3388,3260,3132,3004,
  2876,2748,2620,2492,2364,2236,2108,1980,
  1884,1820,1756,1692,1628,1564,1500,1436,
  1372,1308,1244,1180,1116,1052,988,924,
  876,844,812,780,748,716,684,652,
  620,588,556,524,492,460,428,396,
  372,356,340,324,308,292,276,260,
  244,228,212,196,180,164,148,132,
  120,112,104,96,88,80,72,64,
  56,48,40,32,24,16,8,0
]);

/**
 * Decode mulaw buffer to 16-bit PCM
 * @param {Buffer} mulawBuffer - Input mulaw audio (8-bit samples)
 * @returns {Int16Array} - Output PCM audio (16-bit samples)
 */
function decodeMulaw(mulawBuffer) {
  const pcm = new Int16Array(mulawBuffer.length);
  for (let i = 0; i < mulawBuffer.length; i++) {
    pcm[i] = MULAW_DECODE_TABLE[mulawBuffer[i]];
  }
  return pcm;
}

/**
 * Upsample PCM from 8kHz to 16kHz using linear interpolation
 * @param {Int16Array} samples8k - 8kHz PCM samples
 * @returns {Float32Array} - 16kHz PCM samples normalized to [-1, 1]
 */
function upsample8kTo16k(samples8k) {
  const samples16k = new Float32Array(samples8k.length * 2);
  for (let i = 0; i < samples8k.length; i++) {
    const normalized = samples8k[i] / 32768.0; // Normalize to [-1, 1]
    samples16k[i * 2] = normalized;
    // Interpolate next sample (linear interpolation)
    if (i < samples8k.length - 1) {
      const nextNormalized = samples8k[i + 1] / 32768.0;
      samples16k[i * 2 + 1] = (normalized + nextNormalized) / 2;
    } else {
      samples16k[i * 2 + 1] = normalized;
    }
  }
  return samples16k;
}

// Load environment variables from .env file
const envFile = readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim();
});

/**
 * Phone Call Guidelines - Layer 5
 * Appended to all persona prompts. TODO: Move to database for per-persona or global editing.
 */
const PHONE_CALL_GUIDELINES = `

IMPORTANT - PHONE CALL FORMAT:
You are on a LIVE PHONE CALL with the user right now. This is a real-time voice conversation over the phone.
- Keep responses brief and natural (1-2 short sentences max)
- Respond to what the user actually says - stay grounded in the real conversation
- Speak conversationally like you're on a phone call
- Don't narrate your actions - just speak naturally as if talking on the phone
- If something's unclear, just ask!
- Remember: they hear your voice, not text - keep it natural and flowing

CRITICAL: NEVER output bracketed actions like [laughs], [sighs], (pauses), *smiles*, etc. These will be spoken aloud verbatim and sound robotic. Just speak naturally without stage directions.`;

const app = express();
const server = createServer(app);

// CRITICAL: Multiple WebSocket servers require noServer mode + manual upgrade handling
// See: https://github.com/websockets/ws#multiple-servers-sharing-a-single-https-server
const wss = new WebSocketServer({
  noServer: true,
  perMessageDeflate: false,
  clientTracking: true
});

console.log('[INIT] Twilio WebSocket server created (noServer mode)');

// Browser stream handler for admin debugger
const browserWss = new WebSocketServer({
  noServer: true,
  perMessageDeflate: false,
  clientTracking: true
});

console.log('[INIT] Browser WebSocket server created (noServer mode)');

// Handle WebSocket upgrade requests - route to correct server based on path
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url, 'wss://base.url');

  console.log('[UPGRADE] WebSocket upgrade request for path:', pathname);

  if (pathname === '/stream') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/browser-stream') {
    browserWss.handleUpgrade(request, socket, head, (ws) => {
      browserWss.emit('connection', ws, request);
    });
  } else {
    console.log('[UPGRADE] Unknown path, destroying socket:', pathname);
    socket.destroy();
  }
});

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
    this.twilioCallSid = callParams.twilioCallSid || null;
    this.userId = callParams.userId;
    this.personaId = callParams.personaId;
    // callPretext is fetched from database via callId (not passed via TwiML due to 500 char limit)
    this.callPretext = '';

    // Persona metadata (will be fetched from database)
    this.personaName = null;
    this.voiceId = null;
    this.systemPrompt = null;
    this.relationshipContext = null;
    this.longTermMemory = null;  // Layer 4: User facts from KV storage

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
    this.currentFluxTranscript = '';  // Current transcript from Flux (accumulated)
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
    this.isEvaluating = false;
    this.streamSid = null;
    this.silenceTimer = null;
    this.evaluationCount = 0;

    // Turn-taking config
    // Note: With Flux, most turn-taking is handled natively via EndOfTurn events
    // These are fallback values for legacy/VAD paths
    this.config = {
      shortSilenceMs: 300,       // Fallback: short pause threshold
      llmEvalThresholdMs: 800,   // Fallback: when to evaluate turn completion
      forceResponseMs: 2000,     // Fallback: force response after this silence
      maxEvaluations: 2          // Fallback: max LLM evals before forcing
    };

    // Call tracking and cleanup
    this.cleanedUp = false;
    this.sessionStartTime = Date.now();

    // Cost tracking
    this.costTracking = {
      deepgramMinutes: 0,
      elevenLabsCharacters: 0,
      cerebrasTokens: 0,
      sessionDuration: 0
    };

    // Phase 2: Speculative response state (EagerEndOfTurn optimization)
    this.draftAbortController = null;  // AbortController for cancellable LLM fetch
    this.draftResponse = null;          // Cached speculative response
    this.draftTranscript = null;        // Transcript used for draft (to verify match)

    console.log(`[VoicePipeline ${this.callId}] Initialized`, callParams);
  }

  /**
   * Fetch persona metadata from database
   * Fetches: name, voice_id, system_prompt, smart_memory
   */
  async fetchPersonaMetadata() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Fetching persona metadata for ${this.personaId}...`);

      // Fetch persona data
      const personaResponse = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
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

      console.log(`[VoicePipeline ${this.callId}] Persona query response status: ${personaResponse.status}`);

      if (!personaResponse.ok) {
        const errorText = await personaResponse.text();
        throw new Error(`Persona query failed: ${personaResponse.status} - ${errorText}`);
      }

      const personaResult = await personaResponse.json();

      // Fetch call context (pretext, scenario, etc.) from calls table using callId
      // This is where scheduled call context gets passed to the voice pipeline
      let callContext = null;
      if (this.callId && this.callId !== 'unknown') {
        console.log(`[VoicePipeline ${this.callId}] Fetching call context from database...`);
        try {
          const callResponse = await fetch(`${env.VULTR_DB_API_URL}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
            },
            body: JSON.stringify({
              sql: `
                SELECT call_pretext, call_scenario, custom_instructions,
                       max_duration_minutes, voice_id_override
                FROM calls
                WHERE id = $1
              `,
              params: [this.callId]
            })
          });

          if (callResponse.ok) {
            const callResult = await callResponse.json();
            if (callResult.rows && callResult.rows.length > 0) {
              callContext = callResult.rows[0];
              console.log(`[VoicePipeline ${this.callId}] ✅ Found call context:`, {
                hasPretext: !!callContext.call_pretext,
                scenario: callContext.call_scenario,
                maxDuration: callContext.max_duration_minutes
              });
            }
          }
        } catch (callError) {
          console.warn(`[VoicePipeline ${this.callId}] ⚠️ Could not fetch call context:`, callError.message);
        }
      }

      if (personaResult.rows && personaResult.rows.length > 0) {
        const row = personaResult.rows[0];
        this.personaName = row.name || 'Brad';
        // Use custom voice if set, otherwise use persona's default voice
        // Call-level voice override takes precedence
        this.voiceId = callContext?.voice_id_override || row.voice_id || row.default_voice_id || 'pNInz6obpgDQGcFmaJgB';
        // Use custom system prompt if set, otherwise use persona's core prompt
        this.systemPrompt = row.custom_system_prompt || row.core_system_prompt ||
          'You are a supportive friend who keeps it real. Be conversational, direct, and encouraging. Keep responses SHORT (1-2 sentences max) for natural conversation flow.';
        // Store AI params from database (configurable from admin panel)
        this.maxTokens = row.max_tokens || 100;  // Default: 100 tokens (prevents mid-sentence truncation)
        this.temperature = row.temperature || 0.7;  // Default: 0.7 (balanced creativity)
        // Note: smart_memory column doesn't exist in current schema - will be added later for static relationship context
        this.relationshipContext = '';

        // Set call context from database (fetched via callId, not passed via TwiML)
        if (callContext) {
          this.callPretext = callContext.call_pretext || '';
          this.callScenario = callContext.call_scenario || '';
          this.customInstructions = callContext.custom_instructions || '';
          this.maxDurationMinutes = callContext.max_duration_minutes || null;
        }

        console.log(`[VoicePipeline ${this.callId}] ✅ Loaded persona successfully:`, {
          name: this.personaName,
          voiceId: this.voiceId,
          systemPromptLength: this.systemPrompt.length,
          hasCallPretext: !!this.callPretext,
          callScenario: this.callScenario,
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
        this.relationshipContext = '';
        this.callPretext = callContext?.call_pretext || '';
        this.callScenario = callContext?.call_scenario || '';
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
      this.relationshipContext = '';
      this.callPretext = '';
      this.callScenario = '';
    }
  }

  /**
   * Load user-specific context from KV storage (Layers 2, 3, 4)
   * Key pattern: user_context:{userId}:{personaId}
   * Contains: callPretext (L2), relationshipPrompt (L3), facts (L4)
   */
  async loadUserContext() {
    if (!this.userId || !this.personaId) {
      console.log(`[VoicePipeline ${this.callId}] Skipping user context - no userId or personaId`);
      return;
    }

    const key = `user_context:${this.userId}:${this.personaId}`;

    try {
      const response = await fetch(`${env.API_GATEWAY_URL}/api/userdata/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ADMIN_SECRET_TOKEN}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        if (data && !data.deleted) {
          // Layer 2: Call context (only if not already set from call record)
          if (!this.callPretext && data.callPretext) {
            this.callPretext = data.callPretext;
            console.log(`[VoicePipeline ${this.callId}] ✅ Layer 2: call pretext loaded`);
          }

          // Layer 3: Relationship context
          if (data.relationshipPrompt) {
            this.relationshipContext = data.relationshipPrompt;
            console.log(`[VoicePipeline ${this.callId}] ✅ Layer 3: relationship context loaded`);
          }

          // Layer 4: User facts
          const facts = data.facts || [];
          if (facts.length > 0) {
            this.longTermMemory = facts
              .map(f => typeof f === 'string' ? f : (f.fact || f.content))
              .filter(Boolean)
              .join('\n- ');
            console.log(`[VoicePipeline ${this.callId}] ✅ Layer 4: ${facts.length} user facts loaded`);
          }
        }
      } else if (response.status === 404) {
        console.log(`[VoicePipeline ${this.callId}] No user context yet (first call)`);
      } else {
        console.log(`[VoicePipeline ${this.callId}] Failed to load user context (${response.status})`);
      }
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Error loading user context:`, error.message);
    }
  }

  /**
   * Start the voice pipeline
   */
  async start() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Starting...`);

      // STEP 1: Fetch persona metadata from database (Layer 1: core_system_prompt)
      await this.fetchPersonaMetadata();

      // STEP 2: Load user-specific context from KV (Layers 2, 3, 4)
      await this.loadUserContext();

      // STEP 3: Connect to Deepgram STT
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
      console.log(`[VoicePipeline ${this.callId}] Connecting to Deepgram Flux...`);

      // Flux model with native turn-taking detection
      // - eot_threshold: Confidence level to fire EndOfTurn (0.5-0.9)
      // - eot_timeout_ms: Force EndOfTurn after this much silence
      const deepgramUrl = 'wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=mulaw&sample_rate=8000&eot_threshold=0.7&eot_timeout_ms=5000';

      this.deepgramWs = new WebSocket(deepgramUrl, {
        headers: {
          'Authorization': `Token ${env.DEEPGRAM_API_KEY}`
        }
      });

      this.deepgramWs.on('open', () => {
        console.log(`[VoicePipeline ${this.callId}] Deepgram Flux connected`);
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

          // Handle Flux TurnInfo events (native turn-taking)
          if (response.type === 'TurnInfo') {
            this.handleFluxTurnInfo(response);
            return;
          }

          // Handle Connected event
          if (response.type === 'Connected') {
            console.log(`[VoicePipeline ${this.callId}] Deepgram Flux session established, request_id: ${response.request_id}`);
            return;
          }

          // Legacy format fallback (shouldn't happen with Flux but just in case)
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            console.log(`[VoicePipeline ${this.callId}] [Legacy] User said:`, transcript);
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
   * Handle Flux TurnInfo events for native turn-taking
   * Events: StartOfTurn, Update, EagerEndOfTurn, TurnResumed, EndOfTurn
   */
  handleFluxTurnInfo(response) {
    const { event, transcript, turn_index, end_of_turn_confidence } = response;

    // Log all Flux events for debugging
    console.log(`[VoicePipeline ${this.callId}] Flux ${event}: turn=${turn_index} confidence=${end_of_turn_confidence?.toFixed(2) || 'N/A'} transcript="${transcript || ''}"`);

    switch (event) {
      case 'StartOfTurn':
        // User started speaking
        this.lastSpeechTime = Date.now();

        // If AI was speaking when user started, handle interruption
        if (this.isSpeaking) {
          console.log(`[VoicePipeline ${this.callId}] 🛑 User interrupted AI (StartOfTurn while speaking)`);
          this.handleUserInterruption();
        }
        break;

      case 'Update':
        // Interim transcript update - accumulate but don't trigger response
        if (transcript && transcript.trim()) {
          this.currentFluxTranscript = transcript;
          this.lastSpeechTime = Date.now();

          // Check for interruption during updates too
          if (this.isSpeaking) {
            console.log(`[VoicePipeline ${this.callId}] 🛑 User interrupted AI (Update while speaking)`);
            this.handleUserInterruption();
          }
        }
        break;

      case 'EagerEndOfTurn':
        // Phase 2: User might be done - start speculative LLM call
        console.log(`[VoicePipeline ${this.callId}] ⏳ EagerEndOfTurn - starting speculative response`);
        this.currentFluxTranscript = transcript;

        // Cancel any existing draft and start new one
        this.clearDraft();
        if (transcript && transcript.trim()) {
          this.draftAbortController = new AbortController();
          this.prepareDraftResponse(transcript, this.draftAbortController.signal);
        }
        break;

      case 'TurnResumed':
        // Phase 2: User kept speaking - abort speculative LLM call
        console.log(`[VoicePipeline ${this.callId}] ↩️ TurnResumed - aborting speculative response`);
        this.currentFluxTranscript = transcript;
        this.clearDraft();
        break;

      case 'EndOfTurn':
        // User definitely done - use draft if available, otherwise trigger normal response
        console.log(`[VoicePipeline ${this.callId}] ✅ EndOfTurn - user finished speaking`);

        if (transcript && transcript.trim()) {
          this.currentFluxTranscript = transcript;

          // Add to conversation history
          this.transcriptSegments = [{
            text: transcript,
            timestamp: Date.now()
          }];

          // Phase 2: Check if we have a usable draft response
          if (this.draftResponse && this.draftTranscript === transcript) {
            console.log(`[VoicePipeline ${this.callId}] 🚀 Using speculative draft response!`);

            // Add user message to history
            this.conversationHistory.push({
              role: 'user',
              content: transcript
            });

            // Add AI response to history
            this.conversationHistory.push({
              role: 'assistant',
              content: this.draftResponse
            });

            // Speak the draft response
            this.speak(this.draftResponse);

            // Clear draft state and reset for next turn
            this.clearDraft();
            this.transcriptSegments = [];
            this.evaluationCount = 0;
          } else {
            // No usable draft - trigger normal response
            if (this.draftResponse) {
              console.log(`[VoicePipeline ${this.callId}] Draft transcript mismatch, using normal flow`);
            }
            this.clearDraft();
            this.triggerResponse('flux_end_of_turn');
          }
        } else {
          console.log(`[VoicePipeline ${this.callId}] EndOfTurn with empty transcript - ignoring`);
        }
        break;

      default:
        console.log(`[VoicePipeline ${this.callId}] Unknown Flux event: ${event}`);
    }
  }

  /**
   * Handle user interruption while AI is speaking
   */
  handleUserInterruption() {
    // Stop TTS playback
    if (this.elevenLabsWs && this.elevenLabsWs.readyState === WebSocket.OPEN) {
      try {
        this.elevenLabsWs.send(JSON.stringify({
          text: '',
          flush: true
        }));
        console.log(`[VoicePipeline ${this.callId}] Sent flush to stop TTS`);
      } catch (error) {
        console.error(`[VoicePipeline ${this.callId}] Failed to flush TTS:`, error);
      }
    }

    // Clear Twilio audio by sending clear message
    if (this.twilioWs && this.twilioWs.readyState === WebSocket.OPEN && this.streamSid) {
      try {
        this.twilioWs.send(JSON.stringify({
          event: 'clear',
          streamSid: this.streamSid
        }));
        console.log(`[VoicePipeline ${this.callId}] Sent clear to Twilio to stop audio playback`);
      } catch (error) {
        console.error(`[VoicePipeline ${this.callId}] Failed to clear Twilio audio:`, error);
      }
    }

    this.isSpeaking = false;
    this.transcriptSegments = [];
    this.evaluationCount = 0;
  }

  /**
   * Handle incoming transcript segment from Deepgram (legacy/fallback)
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

    // Leading words - these often signal user is about to continue speaking
    // When standalone, we should WAIT rather than respond immediately
    const leadingWords = ['alright', 'okay', 'ok', 'so', 'well', 'yeah', 'yes', 'yep', 'no', 'hmm', 'right'];
    if (leadingWords.includes(text)) {
      console.log(`[VoicePipeline] Detected standalone leading word "${text}", waiting for continuation...`);
      return 'WAIT';
    }

    // Check if utterance ends with a leading word (e.g., "and okay" or "but yeah")
    if (leadingWords.includes(lastWord) && words.length <= 3) {
      console.log(`[VoicePipeline] Utterance ends with leading word "${lastWord}", waiting...`);
      return 'WAIT';
    }

    // Acknowledgments and affirmations - but NOT the ambiguous leading words
    // These are unambiguous completions
    const acknowledgments = ['thanks', 'thank you', 'got it', 'i see', 'no problem', 'sure thing',
                            'sounds good', 'perfect', 'great', 'awesome', 'understood'];
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
   * Build the complete system prompt with all persona layers
   * Used by generateResponse() and prepareDraftResponse()
   *
   * Layers:
   *   1. Base system prompt (admin-defined, from personas.core_system_prompt)
   *   2. Call context - user-dependent (callPretext, callScenario, customInstructions)
   *   3. Relationship context - user-defined (relationshipContext from KV)
   *   4. User facts - user-dependent (longTermMemory from KV)
   *   5. Phone call guidelines (from PHONE_CALL_GUIDELINES constant)
   */
  buildFullSystemPrompt() {
    // Layer 1: Base persona prompt (admin-defined)
    let systemPrompt = this.systemPrompt;

    // Layer 3: Relationship context (user-defined)
    if (this.relationshipContext) {
      systemPrompt += `\n\nRELATIONSHIP CONTEXT:\n${this.relationshipContext}`;
    }

    // Layer 2: Call context (user-dependent)
    if (this.callPretext) {
      systemPrompt += `\n\nCALL CONTEXT: The user requested this call for the following reason: "${this.callPretext}". Keep this context in mind and be helpful with their situation.`;
    }
    if (this.callScenario) {
      systemPrompt += `\n\nSCENARIO: ${this.callScenario}`;
    }
    if (this.customInstructions) {
      systemPrompt += `\n\nSPECIAL INSTRUCTIONS FOR THIS CALL:\n${this.customInstructions}`;
    }

    // Layer 4: User facts learned from previous calls
    if (this.longTermMemory) {
      systemPrompt += `\n\nWHAT YOU KNOW ABOUT THIS USER (from previous conversations):\n- ${this.longTermMemory}`;
    }

    // Layer 5: Phone call guidelines
    systemPrompt += PHONE_CALL_GUIDELINES;

    return systemPrompt;
  }

  /**
   * Generate AI response using Cerebras
   */
  async generateResponse() {
    try {
      console.log(`[VoicePipeline ${this.callId}] Generating response...`);

      const systemPrompt = this.buildFullSystemPrompt();

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
   * Phase 2: Prepare speculative draft response on EagerEndOfTurn
   * Runs speculatively when Flux thinks the user MIGHT be done.
   * Can be aborted if user continues speaking (TurnResumed).
   */
  async prepareDraftResponse(transcript, abortSignal) {
    try {
      console.log(`[VoicePipeline ${this.callId}] 🔮 Starting speculative draft for: "${transcript}"`);

      const systemPrompt = this.buildFullSystemPrompt();

      // Build messages with the speculative transcript (not yet in conversationHistory)
      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-10),
        { role: 'user', content: transcript }
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
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          stream: false
        }),
        signal: abortSignal  // Allows cancellation on TurnResumed
      });

      // Check if aborted before processing
      if (abortSignal.aborted) {
        console.log(`[VoicePipeline ${this.callId}] 🔮 Draft request was aborted`);
        return;
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        console.log(`[VoicePipeline ${this.callId}] 🔮 Draft ready: "${aiResponse.substring(0, 50)}..."`);

        // Store draft for use when EndOfTurn arrives
        this.draftResponse = aiResponse;
        this.draftTranscript = transcript;

        // Log Cerebras usage (speculative)
        if (data.usage) {
          console.log(`[VoicePipeline ${this.callId}] Cerebras (speculative): prompt=${data.usage.prompt_tokens} completion=${data.usage.completion_tokens}`);
        }
      }
    } catch (error) {
      // AbortError is expected when user continues speaking
      if (error.name === 'AbortError') {
        console.log(`[VoicePipeline ${this.callId}] 🔮 Draft aborted (user continued speaking)`);
      } else {
        console.error(`[VoicePipeline ${this.callId}] 🔮 Draft generation failed:`, error.message);
      }
      // Clear any partial draft state
      this.draftResponse = null;
      this.draftTranscript = null;
    }
  }

  /**
   * Clear speculative draft state (called on TurnResumed or when draft is used)
   */
  clearDraft() {
    if (this.draftAbortController) {
      this.draftAbortController.abort();
      this.draftAbortController = null;
    }
    this.draftResponse = null;
    this.draftTranscript = null;
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

    const audioBuffer = Buffer.from(audioPayload, 'base64');

    // Forward to Deepgram only when not speaking
    if (this.deepgramWs && !this.isSpeaking) {
      this.deepgramWs.send(audioBuffer);
    }

    // Feed audio to VAD (decode mulaw → PCM, upsample 8kHz → 16kHz)
    if (this.vad && this.vadEnabled && !this.isSpeaking) {
      try {
        // Twilio sends 8kHz mulaw, VAD needs 16kHz float32
        const pcm8k = decodeMulaw(audioBuffer);
        const pcm16k = upsample8kTo16k(pcm8k);
        this.vad.processAudio(pcm16k);
      } catch (err) {
        // Log once, don't spam
        if (!this.vadErrorLogged) {
          console.error(`[VoicePipeline ${this.callId}] VAD processing error:`, err.message);
          this.vadErrorLogged = true;
        }
      }
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Guard against multiple cleanup calls
    if (this.cleanedUp) {
      console.log(`[VoicePipeline ${this.callId}] Already cleaned up, skipping`);
      return;
    }
    this.cleanedUp = true;

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

    // Calculate and log session costs
    this.costTracking.sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    this.costTracking.deepgramMinutes = this.costTracking.sessionDuration; // Approximate

    const estimatedCost = this.calculateEstimatedCost();
    const durationSeconds = Math.round(this.costTracking.sessionDuration * 60);
    console.log(`[VoicePipeline ${this.callId}] Session ended - Duration: ${this.costTracking.sessionDuration.toFixed(2)} min`);
    console.log(`[VoicePipeline ${this.callId}] Cost estimate: $${estimatedCost.total.toFixed(4)} (Deepgram: $${estimatedCost.deepgram.toFixed(4)}, ElevenLabs: $${estimatedCost.elevenlabs.toFixed(4)}, Cerebras: $${estimatedCost.cerebras.toFixed(4)})`);

    // Save call completion data to database
    if (this.callId) {
      this.saveCallCompletion(durationSeconds, estimatedCost).catch(err => {
        console.error(`[VoicePipeline ${this.callId}] Failed to save call completion:`, err);
      });
    }

    console.log(`[VoicePipeline ${this.callId}] Cleaned up`);
  }

  /**
   * Calculate estimated cost of the call based on usage
   *
   * PRICING SOURCE: src/shared/pricing.ts (PRICING_CONFIG)
   * Keep these values in sync with the centralized config.
   * See also: documentation/HARDCODED_COST_VALUES.md
   * See PUNCHLIST.md item #2 for pricing inconsistency issue
   */
  calculateEstimatedCost() {
    // Pricing (as of 2025) - synced with BrowserVoicePipeline
    const DEEPGRAM_COST_PER_MIN = 0.0043; // Nova-2 pricing
    const ELEVENLABS_COST_PER_1K_CHARS = 0.18; // Turbo v2.5
    const CEREBRAS_COST_PER_1M_TOKENS = 0.10; // Llama 3.1 8B

    const deepgramCost = this.costTracking.deepgramMinutes * DEEPGRAM_COST_PER_MIN;
    const elevenlabsCost = (this.costTracking.elevenLabsCharacters / 1000) * ELEVENLABS_COST_PER_1K_CHARS;
    const cerebrasCost = (this.costTracking.cerebrasTokens / 1000000) * CEREBRAS_COST_PER_1M_TOKENS;

    return {
      deepgram: deepgramCost,
      elevenlabs: elevenlabsCost,
      cerebras: cerebrasCost,
      total: deepgramCost + elevenlabsCost + cerebrasCost
    };
  }

  /**
   * Save call completion data to database
   */
  async saveCallCompletion(durationSeconds, costEstimate) {
    try {
      console.log(`[VoicePipeline ${this.callId}] Saving call completion to database...`);

      // Update call record with completion status, duration, and cost
      // Note: this.callId is our internal UUID (stored in calls.id column)
      // The call-orchestrator creates records with UUID as 'id' and stores Twilio SID in 'twilio_call_sid'
      const updateResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `UPDATE calls
                SET status = 'completed',
                    duration_seconds = $1,
                    cost_usd = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3`,
          params: [durationSeconds, costEstimate.total, this.callId]
        })
      });

      if (!updateResult.ok) {
        console.error(`[VoicePipeline ${this.callId}] Failed to update call:`, await updateResult.text());
        return;
      }

      console.log(`[VoicePipeline ${this.callId}] ✅ Call marked as completed - Duration: ${durationSeconds}s, Cost: $${costEstimate.total.toFixed(4)}`);

      // DEDUCT CREDITS FROM USER'S BALANCE
      // Calculate minutes used (round UP - 45 seconds = 1 minute)
      const minutesUsed = Math.ceil(durationSeconds / 60);
      console.log(`[VoicePipeline ${this.callId}] Deducting ${minutesUsed} minute(s) from user balance...`);

      // Get user_id from the call record
      const userResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `SELECT user_id FROM calls WHERE id = $1`,
          params: [this.callId]
        })
      });

      if (userResult.ok) {
        const userData = await userResult.json();
        const userId = userData.rows?.[0]?.user_id;

        if (userId) {
          // Deduct credits from user_credits
          const deductResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
            },
            body: JSON.stringify({
              sql: `UPDATE user_credits
                    SET available_credits = available_credits - $1,
                        lifetime_credits_used = lifetime_credits_used + $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = $2
                    RETURNING available_credits`,
              params: [minutesUsed, userId]
            })
          });

          if (deductResult.ok) {
            const deductData = await deductResult.json();
            const newBalance = deductData.rows?.[0]?.available_credits || 0;
            console.log(`[VoicePipeline ${this.callId}] ✅ Deducted ${minutesUsed} minute(s). New balance: ${newBalance} minutes`);

            // Record the credit transaction
            const transactionId = crypto.randomUUID();
            await fetch(`${env.VULTR_DB_API_URL}/query`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
              },
              body: JSON.stringify({
                sql: `INSERT INTO credit_transactions (id, user_id, transaction_type, credits_amount, balance_after, description, reference_id)
                      VALUES ($1, $2, 'usage', $3, $4, $5, $6)`,
                params: [transactionId, userId, -minutesUsed, newBalance, `Call duration: ${durationSeconds}s (${minutesUsed} min)`, this.callId]
              })
            });
          } else {
            console.error(`[VoicePipeline ${this.callId}] Failed to deduct credits:`, await deductResult.text());
          }
        } else {
          console.warn(`[VoicePipeline ${this.callId}] No user_id found for call - cannot deduct credits`);
        }
      } else {
        console.error(`[VoicePipeline ${this.callId}] Failed to get user_id:`, await userResult.text());
      }

      // Also update the scheduled_calls table if this call originated from a schedule
      // Query the calls table to get the scheduled_call_id
      const scheduledCallResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `SELECT scheduled_call_id FROM calls WHERE id = $1`,
          params: [this.callId]
        })
      });

      if (scheduledCallResult.ok) {
        const scheduledCallData = await scheduledCallResult.json();
        const scheduledCallId = scheduledCallData.rows?.[0]?.scheduled_call_id;

        if (scheduledCallId) {
          console.log(`[VoicePipeline ${this.callId}] Updating scheduled call ${scheduledCallId} to completed...`);

          const updateScheduledResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
            },
            body: JSON.stringify({
              sql: `UPDATE scheduled_calls
                    SET status = 'completed',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1`,
              params: [scheduledCallId]
            })
          });

          if (updateScheduledResult.ok) {
            console.log(`[VoicePipeline ${this.callId}] ✅ Scheduled call ${scheduledCallId} marked as completed`);
          } else {
            console.error(`[VoicePipeline ${this.callId}] Failed to update scheduled call:`, await updateScheduledResult.text());
          }
        }
      }

      // Log individual service costs to api_call_events table
      // Pricing synced with calculateEstimatedCost() - see PUNCHLIST.md item #2
      const services = [
        { service: 'deepgram', cost: costEstimate.deepgram, operation: 'transcription', usageAmount: this.costTracking.deepgramMinutes, usageUnit: 'minutes', unitCost: 0.0043 },
        { service: 'elevenlabs', cost: costEstimate.elevenlabs, operation: 'tts', usageAmount: this.costTracking.elevenLabsCharacters, usageUnit: 'characters', unitCost: 0.00018 },
        { service: 'cerebras', cost: costEstimate.cerebras, operation: 'inference', usageAmount: this.costTracking.cerebrasTokens || 0, usageUnit: 'tokens', unitCost: 0.0000001 }
      ];

      for (const { service, cost, operation, usageAmount, usageUnit, unitCost } of services) {
        if (cost > 0) {
          await fetch(`${env.VULTR_DB_API_URL}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
            },
            body: JSON.stringify({
              sql: `INSERT INTO api_call_events (call_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
              params: [this.callId, service, operation, usageAmount, usageUnit, unitCost, cost]
            })
          });
        }
      }

      console.log(`[VoicePipeline ${this.callId}] ✅ Cost breakdown logged to api_call_events`);
    } catch (error) {
      console.error(`[VoicePipeline ${this.callId}] Error saving call completion:`, error);
    }
  }
}

// WebSocket connection handler
// TEMPORARY: Using test server pattern to debug
wss.on('connection', (twilioWs, req) => {
  console.log('[Voice Pipeline - WSS] ✅ WebSocket connection opened');
  console.log('[Voice Pipeline - WSS] User-Agent:', req.headers['user-agent']);
  console.log('[Voice Pipeline - WSS] Path:', req.url);

  let pipeline = null;

  twilioWs.on('message', (data) => {
    console.log('[Voice Pipeline] ===== MESSAGE RECEIVED =====');
    const str = data.toString();
    console.log('[Voice Pipeline] Data:', str.substring(0, 200));
    try {
      const message = JSON.parse(str);
      console.log('[Voice Pipeline] Event type:', message.event);

      if (message.event === 'start') {
        console.log('[Voice Pipeline] Received START message from Twilio');

        // Extract params from TwiML <Parameter> elements
        // NOTE: callPretext is NOT passed via TwiML (500 char limit) - it's fetched from DB via callId
        const callId = message.start.customParameters?.callId || 'unknown';
        const twilioCallSid = message.start.customParameters?.twilioCallSid || message.start.callSid || 'unknown';
        const userId = message.start.customParameters?.userId || 'unknown';
        const personaId = message.start.customParameters?.personaId || 'brad_001';

        console.log('[Voice Pipeline] Call params:', { callId, twilioCallSid, userId, personaId });

        const streamSid = message.start.streamSid;

        // Pass callId to pipeline - it will fetch call context (pretext, etc.) from database
        pipeline = new VoicePipeline(twilioWs, { callId, twilioCallSid, userId, personaId });
        pipeline.streamSid = streamSid;

        // Call start() without await - let it run in background
        pipeline.start().catch(error => {
          console.error('[Voice Pipeline] Error starting pipeline:', error);
        });
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

/**
 * Browser Voice Pipeline - for admin debugger
 * Handles 16kHz PCM audio from browser microphone
 */
class BrowserVoicePipeline {
  constructor(browserWs, params) {
    this.browserWs = browserWs;
    this.sessionId = params.sessionId;
    this.personaId = params.personaId;
    this.adminId = params.adminId;
    this.overrides = params.overrides || {};

    // Context from PersonaDesigner UI (for testing)
    // Note: params uses 'smartMemory' for API compatibility, stored as relationshipContext internally
    this.relationshipContext = params.smartMemory || params.relationshipContext || null;
    this.callPretext = params.callPretext || null;
    this.callScenario = params.callScenario || null;
    this.customInstructions = params.customInstructions || null;

    // Long-term memory (facts learned from previous calls)
    this.longTermMemory = null;

    // Persona metadata
    this.personaName = null;
    this.voiceId = null;
    this.systemPrompt = null;
    this.maxTokens = 100;
    this.temperature = 0.7;

    // Service connections
    this.deepgramWs = null;
    this.elevenLabsWs = null;
    this.deepgramReady = false;
    this.elevenLabsReady = false;

    // State
    this.conversationHistory = [];
    this.transcriptSegments = [];
    this.currentFluxTranscript = '';  // Current transcript from Flux
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
    this.silenceTimer = null;

    // VAD state
    this.vad = null;
    this.vadEnabled = true;
    this.isUserSpeaking = false;
    this.vadErrorLogged = false;

    // Phase 2: Context preservation for interruptions
    this.partialResponse = '';  // Accumulate AI response text as it's generated

    // Session Management Safeguards
    this.sessionStartTime = Date.now();
    this.lastUserActivityTime = Date.now();
    this.maxSessionDuration = 15 * 60 * 1000; // Default 15 minutes (will be updated from persona)
    this.idleTimeout = 5 * 60 * 1000; // 5 minutes
    this.sessionTimeoutTimer = null;
    this.idleCheckInterval = null;
    this.warningCheckInterval = null;
    this.warningsSent = {
      firstWarning: false,    // 66% of max duration
      secondWarning: false,   // 86% of max duration
      finalWarning: false     // 96% of max duration
    };

    // Cost Tracking
    this.costTracking = {
      deepgramMinutes: 0,
      elevenLabsCharacters: 0,
      cerebrasTokens: 0,
      sessionDuration: 0
    };

    console.log(`[BrowserPipeline ${this.sessionId}] Initialized`);
  }

  async fetchPersonaMetadata() {
    try {
      const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `SELECT name, core_system_prompt, default_voice_id, max_tokens, temperature, max_call_duration FROM personas WHERE id = $1`,
          params: [this.personaId]
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.rows?.length > 0) {
          const row = result.rows[0];
          this.personaName = this.overrides.name || row.name;
          this.voiceId = this.overrides.default_voice_id || row.default_voice_id;
          this.systemPrompt = this.overrides.core_system_prompt || row.core_system_prompt;
          this.maxTokens = this.overrides.max_tokens ?? row.max_tokens ?? 100;
          this.temperature = this.overrides.temperature ?? row.temperature ?? 0.7;

          // Update max session duration from persona settings (convert minutes to milliseconds)
          // Priority: override > persona setting > default (15)
          const maxCallMinutes = this.overrides.max_call_duration ?? row.max_call_duration ?? 15;
          this.maxSessionDuration = maxCallMinutes * 60 * 1000;
          console.log(`[BrowserPipeline ${this.sessionId}] Max call duration set to ${maxCallMinutes} minutes (66%=${(maxCallMinutes*0.66).toFixed(1)}m, 86%=${(maxCallMinutes*0.86).toFixed(1)}m, 96%=${(maxCallMinutes*0.96).toFixed(1)}m)`);
        }
      }
    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] Failed to fetch persona:`, error);
    }

    // Defaults
    if (!this.personaName) this.personaName = 'Brad';
    if (!this.voiceId) this.voiceId = 'pNInz6obpgDQGcFmaJgB';
    if (!this.systemPrompt) this.systemPrompt = 'You are Brad, a supportive friend.';
  }

  /**
   * Load user-specific context from KV storage (Layers 2, 3, 4)
   * Key pattern: user_context:{userId}:{personaId}
   * Contains: callPretext (L2), relationshipPrompt (L3), facts (L4)
   */
  async loadUserContext() {
    if (!this.adminId || !this.personaId) {
      console.log(`[BrowserPipeline ${this.sessionId}] Skipping user context - no adminId or personaId`);
      return;
    }

    const key = `user_context:${this.adminId}:${this.personaId}`;

    try {
      const response = await fetch(`${env.API_GATEWAY_URL}/api/userdata/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ADMIN_SECRET_TOKEN}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;

        if (data && !data.deleted) {
          // Layer 2: Call context (only if not already set from init message)
          if (!this.callPretext && data.callPretext) {
            this.callPretext = data.callPretext;
            console.log(`[BrowserPipeline ${this.sessionId}] ✅ Layer 2: call pretext loaded`);
          }

          // Layer 3: Relationship context (only if not already set from init message)
          if (!this.relationshipContext && data.relationshipPrompt) {
            this.relationshipContext = data.relationshipPrompt;
            console.log(`[BrowserPipeline ${this.sessionId}] ✅ Layer 3: relationship context loaded`);
          }

          // Layer 4: User facts
          const facts = data.facts || [];
          if (facts.length > 0) {
            this.longTermMemory = facts
              .map(f => typeof f === 'string' ? f : (f.fact || f.content))
              .filter(Boolean)
              .join('\n- ');
            console.log(`[BrowserPipeline ${this.sessionId}] ✅ Layer 4: ${facts.length} user facts loaded`);
          }
        }
      } else if (response.status === 404) {
        console.log(`[BrowserPipeline ${this.sessionId}] No user context yet (first call)`);
      } else {
        console.log(`[BrowserPipeline ${this.sessionId}] Failed to load user context (${response.status})`);
      }
    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] Layer 4 error loading long-term memory:`, error.message);
    }
  }

  async start() {
    console.log(`[BrowserPipeline ${this.sessionId}] Starting pipeline...`);
    await this.fetchPersonaMetadata();
    console.log(`[BrowserPipeline ${this.sessionId}] Persona metadata fetched`);

    // Load user-specific context (Layers 2, 3, 4) from KV
    await this.loadUserContext();

    // Create call record in database
    await this.createCallRecord();

    await this.connectDeepgram();
    console.log(`[BrowserPipeline ${this.sessionId}] Deepgram connected`);

    await this.connectElevenLabs();
    console.log(`[BrowserPipeline ${this.sessionId}] ElevenLabs connected`);

    // Initialize VAD for better turn-taking
    if (this.vadEnabled) {
      await this.initializeVAD();
    }

    this.send({ type: 'session_start', session_id: this.sessionId, persona: { id: this.personaId, name: this.personaName } });
    console.log(`[BrowserPipeline ${this.sessionId}] Session start message sent`);

    // Start session safeguard timers
    this.startSessionSafeguards();
  }

  async createCallRecord() {
    try {
      // Generate a call ID (use session ID for browser calls)
      this.callId = this.sessionId;

      const response = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `INSERT INTO calls (id, user_id, persona_id, phone_number, status, cost_usd, created_at)
                VALUES ($1, $2, $3, $4, 'in-progress', 0, CURRENT_TIMESTAMP)`,
          params: [this.callId, this.adminId || 'browser-admin', this.personaId, '555-555-5555']
        })
      });

      if (response.ok) {
        console.log(`[BrowserPipeline ${this.sessionId}] ✅ Call record created: ${this.callId}`);
      } else {
        console.error(`[BrowserPipeline ${this.sessionId}] Failed to create call record:`, await response.text());
      }
    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] Error creating call record:`, error);
    }
  }

  async connectDeepgram() {
    return new Promise((resolve, reject) => {
      // Browser sends 16kHz PCM (linear16) - use Flux for native turn-taking
      const url = 'wss://api.deepgram.com/v2/listen?model=flux-general-en&encoding=linear16&sample_rate=16000&eot_threshold=0.7&eot_timeout_ms=5000';
      this.deepgramWs = new WebSocket(url, { headers: { 'Authorization': `Token ${env.DEEPGRAM_API_KEY}` } });

      this.deepgramWs.on('open', () => {
        this.deepgramReady = true;
        console.log(`[BrowserPipeline ${this.sessionId}] Deepgram Flux connected`);
        resolve();
      });

      this.deepgramWs.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());

          // Handle Flux TurnInfo events
          if (response.type === 'TurnInfo') {
            this.handleFluxTurnInfo(response);
            return;
          }

          // Handle Connected event
          if (response.type === 'Connected') {
            console.log(`[BrowserPipeline ${this.sessionId}] Deepgram Flux session established`);
            return;
          }

          // Legacy format fallback
          const transcript = response.channel?.alternatives?.[0]?.transcript;
          if (transcript?.trim()) {
            this.send({ type: 'transcript', text: transcript, is_final: response.is_final });
            this.handleTranscript(transcript);
          }
        } catch (e) {}
      });

      this.deepgramWs.on('error', reject);
      setTimeout(() => reject(new Error('Deepgram timeout')), 5000);
    });
  }

  /**
   * Handle Flux TurnInfo events for BrowserPipeline
   */
  handleFluxTurnInfo(response) {
    const { event, transcript, turn_index, end_of_turn_confidence } = response;

    console.log(`[BrowserPipeline ${this.sessionId}] Flux ${event}: confidence=${end_of_turn_confidence?.toFixed(2) || 'N/A'}`);

    switch (event) {
      case 'StartOfTurn':
        this.lastSpeechTime = Date.now();
        // ALWAYS send interrupt when user starts speaking - audio may still be playing
        // even if isSpeaking=false (ElevenLabs sets isFinal before audio finishes playing)
        // TODO: Improve audio cutoff quality - consider fade-out or finding natural break point
        console.log(`[BrowserPipeline ${this.sessionId}] 🛑 User interrupted (Flux StartOfTurn)`);
        this.send({ type: 'interrupt' });
        this.handleInterruption();
        break;

      case 'Update':
        if (transcript?.trim()) {
          this.currentFluxTranscript = transcript;
          this.lastSpeechTime = Date.now();
          // Send interim transcript to frontend
          this.send({ type: 'transcript', text: transcript, is_final: false });
        }
        break;

      case 'EagerEndOfTurn':
        console.log(`[BrowserPipeline ${this.sessionId}] ⏳ EagerEndOfTurn`);
        this.currentFluxTranscript = transcript;
        break;

      case 'TurnResumed':
        console.log(`[BrowserPipeline ${this.sessionId}] ↩️ TurnResumed`);
        this.currentFluxTranscript = transcript;
        break;

      case 'EndOfTurn':
        console.log(`[BrowserPipeline ${this.sessionId}] ✅ EndOfTurn`);
        if (transcript?.trim()) {
          this.currentFluxTranscript = transcript;
          // Send final transcript to frontend
          this.send({ type: 'transcript', text: transcript, is_final: true });

          // CRITICAL FIX: Add user message to conversation history BEFORE generating response
          // Without this, generateResponse() sends old history to LLM, ignoring what user just said
          this.conversationHistory.push({ role: 'user', content: transcript });
          this.send({ type: 'user_turn_complete', text: transcript });
          this.transcriptSegments = [];  // Clear to avoid duplication with legacy path

          // Generate AI response
          this.generateResponse();
        }
        break;
    }
  }

  async connectElevenLabs() {
    return new Promise((resolve, reject) => {
      // Use mp3_44100 for browser playback (easier to decode)
      const url = `wss://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}/stream-input?model_id=eleven_flash_v2_5&output_format=mp3_44100_128`;
      this.elevenLabsWs = new WebSocket(url, { headers: { 'xi-api-key': env.ELEVENLABS_API_KEY } });

      this.elevenLabsWs.on('open', () => {
        this.elevenLabsReady = true;
        this.elevenLabsWs.send(JSON.stringify({
          text: ' ',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        }));
        resolve();
      });

      this.elevenLabsWs.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.audio) {
            this.send({ type: 'audio', audio: msg.audio, format: 'mp3' });
          }
          if (msg.isFinal) {
            this.isSpeaking = false;
            this.send({ type: 'speaking_done' });
          }
        } catch (e) {
          // Binary audio
          this.send({ type: 'audio', audio: data.toString('base64'), format: 'mp3' });
        }
      });

      this.elevenLabsWs.on('error', reject);
      setTimeout(() => reject(new Error('ElevenLabs timeout')), 5000);
    });
  }

  async initializeVAD() {
    try {
      console.log(`[BrowserPipeline ${this.sessionId}] Initializing Silero-VAD...`);

      this.vad = await RealTimeVAD.new({
        model: 'v5',
        positiveSpeechThreshold: 0.5,
        negativeSpeechThreshold: 0.35,
        preSpeechPadFrames: 1,
        redemptionFrames: 10,        // 300ms pauses allowed
        minSpeechFrames: 3,
        frameSamples: 1536,

        onSpeechStart: (audio) => {
          if (this.isSpeaking) {
            // User interrupted AI speech!
            console.log(`[BrowserPipeline ${this.sessionId}] 🔥 VAD: User interrupted AI speech`);
            // Send interrupt signal to frontend to stop audio playback
            this.send({ type: 'interrupt' });
            // Handle interruption on backend
            this.handleInterruption();
          } else {
            // Normal user speech
            console.log(`[BrowserPipeline ${this.sessionId}] 🎤 VAD: User started speaking`);
            this.isUserSpeaking = true;
            this.lastSpeechTime = Date.now();
          }
        },

        onSpeechEnd: (audio) => {
          if (!this.isSpeaking && this.isUserSpeaking) {
            console.log(`[BrowserPipeline ${this.sessionId}] 🔇 VAD: User stopped speaking`);
            this.isUserSpeaking = false;
            this.onVADSpeechEnd();
          }
        }
      });

      console.log(`[BrowserPipeline ${this.sessionId}] ✅ Silero-VAD initialized`);
    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] ❌ Failed to initialize VAD:`, error);
      this.vadEnabled = false;
    }
  }

  async onVADSpeechEnd() {
    const transcript = this.transcriptSegments.join(' ');
    const silenceDuration = Date.now() - this.lastSpeechTime;

    console.log(`[BrowserPipeline ${this.sessionId}] VAD detected speech end (${silenceDuration}ms, "${transcript}")`);

    // For short utterances, wait a bit more to ensure completeness
    if (silenceDuration < 400 || transcript.length < 8) {
      console.log(`[BrowserPipeline ${this.sessionId}] Short utterance, waiting for more...`);
      // Let timer-based fallback handle it
      return;
    }

    // Check for leading words that indicate user will continue speaking
    // These are words people say before making a longer statement
    const leadingWords = ['alright', 'okay', 'ok', 'so', 'well', 'um', 'uh', 'like', 'yeah', 'yes', 'yep', 'no', 'hmm', 'right', 'and', 'but'];
    const lowerTranscript = transcript.toLowerCase().trim();
    const words = lowerTranscript.split(/\s+/).filter(w => w.length > 0);
    const lastWord = words[words.length - 1];

    // If entire transcript is just a leading word, wait for more
    if (leadingWords.includes(lowerTranscript)) {
      console.log(`[BrowserPipeline ${this.sessionId}] Detected standalone leading word "${transcript}", waiting for continuation...`);
      // Don't trigger response - let the silence timer handle it with normal timeout
      return;
    }

    // If transcript ends with a leading word (short utterance), also wait
    if (leadingWords.includes(lastWord) && words.length <= 3) {
      console.log(`[BrowserPipeline ${this.sessionId}] Utterance ends with leading word "${lastWord}", waiting...`);
      return;
    }

    // Clear speech boundary - generate response immediately
    clearTimeout(this.silenceTimer);
    this.generateResponse();
  }

  handleAudio(pcmBuffer) {
    if (this.deepgramReady && !this.isSpeaking) {
      this.deepgramWs.send(pcmBuffer);
    }

    // Feed audio to VAD (browser sends Int16 PCM, VAD needs Float32)
    // IMPORTANT: Always process audio through VAD, even when AI is speaking,
    // so we can detect interruptions
    if (this.vad && this.vadEnabled) {
      try {
        // Convert Int16 to Float32 (-1.0 to 1.0)
        const int16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength / 2);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }
        this.vad.processAudio(float32Array);
      } catch (err) {
        if (!this.vadErrorLogged) {
          console.error(`[BrowserPipeline ${this.sessionId}] VAD processing error:`, err.message);
          this.vadErrorLogged = true;
        }
      }
    }
  }

  handleTranscript(text) {
    if (this.isSpeaking) {
      // User interrupted
      this.isSpeaking = false;
      this.transcriptSegments = [];
    }

    this.transcriptSegments.push(text);
    this.lastSpeechTime = Date.now();
    this.lastUserActivityTime = Date.now(); // Track user activity for idle detection

    clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => this.onSilence(), 1200);
  }

  async onSilence() {
    const userMessage = this.transcriptSegments.join(' ').trim();
    if (!userMessage) return;

    this.conversationHistory.push({ role: 'user', content: userMessage });
    this.transcriptSegments = [];
    this.send({ type: 'user_turn_complete', text: userMessage });

    await this.generateResponse();
  }

  async generateResponse() {
    try {
      // PROMPT INJECTION POINT #1: System prompt + brevity instruction
      // Location: BrowserVoicePipeline.generateResponse()
      // Purpose: Base system prompt + instruction to keep responses brief
      // Tunability: Can adjust brevity instruction, add context about interruptions

      // Build system prompt with all context layers
      let fullSystemPrompt = this.systemPrompt;

      // LAYER 3: Add relationshipContext (user-defined relationship description)
      if (this.relationshipContext) {
        fullSystemPrompt += `\n\nRELATIONSHIP CONTEXT:\n${this.relationshipContext}`;
      }

      // Layer 2: Call context (user-dependent)
      if (this.callPretext) {
        fullSystemPrompt += `\n\nCALL CONTEXT: The user requested this call for the following reason: "${this.callPretext}". Keep this context in mind and be helpful with their situation.`;
      }
      if (this.callScenario) {
        fullSystemPrompt += `\n\nSCENARIO: ${this.callScenario}`;
      }
      if (this.customInstructions) {
        fullSystemPrompt += `\n\nSPECIAL INSTRUCTIONS FOR THIS CALL:\n${this.customInstructions}`;
      }

      // Layer 4: User facts learned from previous calls
      // These are automatically extracted after each call and stored in SmartMemory
      if (this.longTermMemory) {
        fullSystemPrompt += `\n\nWHAT YOU KNOW ABOUT THIS USER (from previous conversations):\n- ${this.longTermMemory}`;
      }

      // Layer 5: Phone call guidelines
      fullSystemPrompt += PHONE_CALL_GUIDELINES;

      // Phase 2: Build context from interrupted messages
      const interruptedMessages = this.conversationHistory
        .filter(msg => msg.interrupted)
        .map(msg => `[You were saying: "${msg.content}" but user interrupted]`)
        .join('\n');

      // PROMPT INJECTION POINT #2: Interrupted context (Phase 2)
      // Location: BrowserVoicePipeline.generateResponse()
      // Purpose: Provide context about what AI was saying when interrupted
      // Tunability: Can adjust instruction text, formatting, how many interrupted messages to include
      const interruptionContext = interruptedMessages.length > 0
        ? `\n\nContext: ${interruptedMessages}\nAcknowledge what you were saying if relevant, then respond to the user's new question.`
        : '';

      const messages = [
        { role: 'system', content: fullSystemPrompt + interruptionContext },
        ...this.conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
          // Note: We don't include interrupted/timestamp in actual messages sent to LLM
        }))
      ];

      // DEBUG: Log system prompt being sent to Cerebras
      console.log(`[BrowserPipeline ${this.sessionId}] 📝 System prompt (first 200 chars):`, messages[0]?.content?.substring(0, 200));

      const startTime = Date.now();
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.CEREBRAS_API_KEY}` },
        body: JSON.stringify({ model: 'llama3.1-8b', messages, max_tokens: this.maxTokens, temperature: this.temperature })
      });

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content;
      const latencyMs = Date.now() - startTime;

      if (aiResponse) {
        // Phase 2: Start tracking this response in case of interruption
        this.partialResponse = aiResponse;

        // Track cost: Cerebras tokens (estimate)
        this.costTracking.cerebrasTokens += Math.ceil(aiResponse.length / 4);
        this.costTracking.elevenLabsCharacters += aiResponse.length;

        this.conversationHistory.push({ role: 'assistant', content: aiResponse });
        this.send({ type: 'response_text', text: aiResponse, latency_ms: latencyMs });
        await this.speak(aiResponse);
      }
    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] Response error:`, error);
    }
  }

  async speak(text) {
    if (!this.elevenLabsWs || this.elevenLabsWs.readyState !== WebSocket.OPEN) {
      await this.connectElevenLabs();
    }

    this.isSpeaking = true;
    this.send({ type: 'speaking_start' });
    this.elevenLabsWs.send(JSON.stringify({ text, flush: true }));
    this.elevenLabsWs.send(JSON.stringify({ text: '' }));
  }

  handleInterruption() {
    console.log(`[BrowserPipeline ${this.sessionId}] Handling interruption - user spoke during AI response`);

    // CRITICAL: Stop ElevenLabs from generating more audio!
    if (this.elevenLabsWs && this.elevenLabsWs.readyState === WebSocket.OPEN) {
      try {
        // Send flush command to clear ElevenLabs queue
        this.elevenLabsWs.send(JSON.stringify({ text: '', flush: true }));
        console.log(`[BrowserPipeline ${this.sessionId}] Flushed ElevenLabs audio queue`);
      } catch (err) {
        console.error(`[BrowserPipeline ${this.sessionId}] Error flushing ElevenLabs:`, err.message);
      }
    }

    // Phase 2: Save partial response to conversation history for context
    if (this.partialResponse && this.partialResponse.length > 0) {
      // Check if this response is already in history (to avoid duplicates)
      const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];
      const alreadyInHistory = lastMessage?.role === 'assistant' && lastMessage?.content === this.partialResponse;

      if (!alreadyInHistory) {
        this.conversationHistory.push({
          role: 'assistant',
          content: this.partialResponse,
          interrupted: true,  // Mark as interrupted for context
          timestamp: Date.now()
        });
        console.log(`[BrowserPipeline ${this.sessionId}] Saved interrupted response: "${this.partialResponse.substring(0, 50)}..."`);
      }

      // Clear partial response tracker
      this.partialResponse = '';
    }

    // Mark AI as not speaking
    this.isSpeaking = false;

    // Clear transcript buffer (user will speak new question/comment)
    this.transcriptSegments = [];

    // Note: Frontend already stopped audio playback via interrupt message
    // Note: For Phase 1, we let ElevenLabs TTS complete (safe approach)
    // Phase 4 would add: this.elevenLabsWs.send(JSON.stringify({ text: '', flush: true }));
  }

  send(msg) {
    if (this.browserWs.readyState === WebSocket.OPEN) {
      this.browserWs.send(JSON.stringify(msg));
    }
  }


  // Session Management Safeguards
  startSessionSafeguards() {
    // Max session duration (15 minutes)
    this.sessionTimeoutTimer = setTimeout(() => {
      console.log(`[BrowserPipeline ${this.sessionId}] Max session duration reached (15 min) - terminating`);
      this.forceTerminate('MAX_DURATION');
    }, this.maxSessionDuration);

    // Idle detection check (every 30 seconds)
    this.idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - this.lastUserActivityTime;
      if (idleTime >= this.idleTimeout) {
        console.log(`[BrowserPipeline ${this.sessionId}] Idle timeout (${(idleTime / 1000 / 60).toFixed(1)} min) - terminating`);
        this.forceTerminate('IDLE');
      }
    }, 30000); // Check every 30 seconds

    // Wind-down warning checker (every 30 seconds)
    this.warningCheckInterval = setInterval(() => {
      this.checkWindDownWarnings();
    }, 30000);
  }

  checkWindDownWarnings() {
    const elapsed = Date.now() - this.sessionStartTime;
    const percentComplete = (elapsed / this.maxSessionDuration) * 100;

    // First warning at 66% of max duration
    if (percentComplete >= 66 && !this.warningsSent.firstWarning) {
      this.warningsSent.firstWarning = true;
      this.sendWindDownWarning('subtle');
    }

    // Second warning at 86% of max duration
    if (percentComplete >= 86 && !this.warningsSent.secondWarning) {
      this.warningsSent.secondWarning = true;
      this.sendWindDownWarning('wrap-up');
    }

    // Final warning at 96% of max duration
    if (percentComplete >= 96 && !this.warningsSent.finalWarning) {
      this.warningsSent.finalWarning = true;
      this.sendWindDownWarning('final');
    }
  }

  async sendWindDownWarning(level) {
    const elapsed = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    const remaining = (this.maxSessionDuration / 1000 / 60) - elapsed; // minutes

    const warnings = {
      subtle: `Hey, just a heads up - we've been chatting for about ${Math.round(elapsed)} minutes.`,
      'wrap-up': remaining > 1
        ? `By the way, I should wrap up in about ${Math.round(remaining)} minutes. Was there anything else you needed?`
        : "By the way, I should wrap up soon. Was there anything else you needed?",
      final: this.getGoodbyePhrase()
    };

    const message = warnings[level];
    console.log(`[BrowserPipeline ${this.sessionId}] Wind-down warning (${level}, ${elapsed.toFixed(1)}/${(this.maxSessionDuration/1000/60).toFixed(0)} min): ${message}`);

    // Send to user as AI speech
    this.send({ type: 'response_text', text: message, warning: true });
    await this.speak(message);
  }

  getGoodbyePhrase() {
    const goodbyes = [
      "Alright, I need to let you go. It's been great talking! Take care.",
      "Well, I should wrap this up. Thanks for chatting with me!",
      "I've got to run now. Really enjoyed our conversation!",
      "Time for me to sign off. Have a wonderful day!",
      "I need to go now. Talk to you soon!"
    ];
    return goodbyes[Math.floor(Math.random() * goodbyes.length)];
  }

  async forceTerminate(reason) {
    console.log(`[BrowserPipeline ${this.sessionId}] Force terminating session - Reason: ${reason}`);
    this.send({ type: 'session_terminated', reason });

    // Call cleanup IMMEDIATELY - don't rely on setTimeout or WebSocket close event
    await this.cleanup();

    // Close WebSocket after cleanup is done
    try {
      this.browserWs.close();
    } catch (e) {
      console.log(`[BrowserPipeline ${this.sessionId}] WebSocket close error (ignored): ${e.message}`);
    }
  }

  calculateEstimatedCost() {
    // Pricing (as of 2025)
    const DEEPGRAM_COST_PER_MIN = 0.0043; // Nova-3 pricing
    const ELEVENLABS_COST_PER_1K_CHARS = 0.18; // Turbo v2.5
    const CEREBRAS_COST_PER_1M_TOKENS = 0.10; // Llama 3.1 8B

    const deepgramCost = this.costTracking.deepgramMinutes * DEEPGRAM_COST_PER_MIN;
    const elevenlabsCost = (this.costTracking.elevenLabsCharacters / 1000) * ELEVENLABS_COST_PER_1K_CHARS;
    const cerebrasCost = (this.costTracking.cerebrasTokens / 1000000) * CEREBRAS_COST_PER_1M_TOKENS;

    return {
      deepgram: deepgramCost,
      elevenlabs: elevenlabsCost,
      cerebras: cerebrasCost,
      total: deepgramCost + elevenlabsCost + cerebrasCost
    };
  }

  cleanup() {
    // Guard against multiple cleanup calls
    if (this.cleanedUp) {
      console.log(`[BrowserPipeline ${this.sessionId}] Already cleaned up, skipping`);
      return;
    }
    this.cleanedUp = true;

    clearTimeout(this.silenceTimer);
    clearTimeout(this.sessionTimeoutTimer);
    clearInterval(this.idleCheckInterval);
    clearInterval(this.warningCheckInterval);

    this.deepgramWs?.close();
    this.elevenLabsWs?.close();

    if (this.vad) {
      this.vad.destroy();
      this.vad = null;
    }

    // Calculate and log session costs
    this.costTracking.sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 60; // minutes
    this.costTracking.deepgramMinutes = this.costTracking.sessionDuration; // Approximate

    const estimatedCost = this.calculateEstimatedCost();
    const durationSeconds = Math.round(this.costTracking.sessionDuration * 60);
    console.log(`[BrowserPipeline ${this.sessionId}] Session ended - Duration: ${this.costTracking.sessionDuration.toFixed(2)} min`);
    console.log(`[BrowserPipeline ${this.sessionId}] Cost estimate: $${estimatedCost.total.toFixed(4)} (Deepgram: $${estimatedCost.deepgram.toFixed(4)}, ElevenLabs: $${estimatedCost.elevenlabs.toFixed(4)}, Cerebras: $${estimatedCost.cerebras.toFixed(4)})`);

    // Save call completion data to database
    if (this.callId) {
      this.saveCallCompletion(durationSeconds, estimatedCost).catch(err => {
        console.error(`[BrowserPipeline ${this.sessionId}] Failed to save call completion:`, err);
      });
    }

    console.log(`[BrowserPipeline ${this.sessionId}] Cleaned up`);
  }

  async saveCallCompletion(durationSeconds, costEstimate) {
    try {
      console.log(`[BrowserPipeline ${this.sessionId}] Saving call completion to database...`);

      // Update call record with completion status, duration, and cost
      const updateResult = await fetch(`${env.VULTR_DB_API_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
        },
        body: JSON.stringify({
          sql: `UPDATE calls
                SET status = 'completed',
                    duration_seconds = $1,
                    cost_usd = $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3`,
          params: [durationSeconds, costEstimate.total, this.callId]
        })
      });

      if (!updateResult.ok) {
        console.error(`[BrowserPipeline ${this.sessionId}] Failed to update call:`, await updateResult.text());
        return;
      }

      console.log(`[BrowserPipeline ${this.sessionId}] ✅ Call marked as completed - Duration: ${durationSeconds}s, Cost: $${costEstimate.total.toFixed(4)}`);

      // Log individual service costs to api_call_events table
      const services = [
        { service: 'deepgram', cost: costEstimate.deepgram, operation: 'transcription', usageAmount: this.costTracking.deepgramMinutes, usageUnit: 'minutes', unitCost: 0.0043 },
        { service: 'elevenlabs', cost: costEstimate.elevenlabs, operation: 'tts', usageAmount: this.costTracking.elevenLabsCharacters, usageUnit: 'characters', unitCost: 0.00003 },
        { service: 'cerebras', cost: costEstimate.cerebras, operation: 'inference', usageAmount: this.costTracking.cerebrasTokens || 0, usageUnit: 'tokens', unitCost: 0.0000001 }
      ];

      for (const { service, cost, operation, usageAmount, usageUnit, unitCost } of services) {
        if (cost > 0) {
          await fetch(`${env.VULTR_DB_API_URL}/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${env.VULTR_DB_API_KEY}`
            },
            body: JSON.stringify({
              sql: `INSERT INTO api_call_events (call_id, service, operation, usage_amount, usage_unit, unit_cost, total_cost, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
              params: [this.callId, service, operation, usageAmount, usageUnit, unitCost, cost]
            })
          });
        }
      }

      console.log(`[BrowserPipeline ${this.sessionId}] ✅ Cost breakdown logged to api_call_events`);

      // Run post-call evaluation to extract and store facts
      await this.runPostCallEvaluation();

    } catch (error) {
      console.error(`[BrowserPipeline ${this.sessionId}] Error saving call completion:`, error);
    }
  }

  /**
   * Post-call evaluation: Extract facts from conversation and store to SmartMemory
   * This enables the AI to learn and remember things about users across calls
   */
  async runPostCallEvaluation() {
    const userId = this.adminId || 'browser-admin';
    const personaId = this.personaId;

    // Skip if conversation is too short (nothing meaningful to extract)
    if (this.conversationHistory.length < 4) {
      console.log(`[PostCallEval ${this.sessionId}] Skipping - conversation too short (${this.conversationHistory.length} turns)`);
      return;
    }

    try {
      console.log(`[PostCallEval ${this.sessionId}] Starting fact extraction...`);

      // Fetch global extraction settings from SmartMemory
      const extractionSettings = await this.getExtractionSettings();

      // 1. Extract facts from conversation using Cerebras
      const newFacts = await this.extractFactsFromConversation(extractionSettings);

      if (newFacts.length === 0) {
        console.log(`[PostCallEval ${this.sessionId}] No new facts extracted`);
        return;
      }

      console.log(`[PostCallEval ${this.sessionId}] Extracted ${newFacts.length} facts:`, newFacts.map(f => f.content));

      // 2. Store facts to SmartMemory via API Gateway
      await this.updateLongTermMemory(userId, personaId, newFacts);

      console.log(`[PostCallEval ${this.sessionId}] ✅ Post-call evaluation complete - ${newFacts.length} facts learned`);

    } catch (err) {
      console.error(`[PostCallEval ${this.sessionId}] Evaluation failed:`, err);
      // Don't throw - evaluation failure shouldn't break call completion
    }
  }

  /**
   * Get global extraction settings from SmartMemory (configured via PersonaDesigner)
   */
  async getExtractionSettings() {
    const defaults = {
      enabled: true,
      model: 'llama-3.3-70b',
      temperature: 0.1,
      maxTokens: 500,
      extractionPrompt: null // Use default prompt if not set
    };

    try {
      const response = await fetch(`${env.API_GATEWAY_URL}/api/memory/semantic/${encodeURIComponent('global:extraction_settings')}`, {
        headers: { 'Authorization': `Bearer ${env.ADMIN_SECRET_TOKEN}` }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.document && !result.document.deleted) {
          return { ...defaults, ...result.document };
        }
      }
    } catch (err) {
      console.log(`[PostCallEval ${this.sessionId}] Using default extraction settings`);
    }

    return defaults;
  }

  /**
   * Extract facts from conversation using Cerebras LLM
   */
  async extractFactsFromConversation(settings) {
    // Check if extraction is disabled
    if (settings.enabled === false) {
      console.log(`[PostCallEval ${this.sessionId}] Fact extraction disabled in settings`);
      return [];
    }

    const transcript = this.conversationHistory
      .map(turn => `${turn.role === 'user' ? 'User' : this.personaName}: ${turn.content}`)
      .join('\n');

    const defaultPrompt = `Analyze this phone conversation and extract NEW facts about the user.
Only extract facts that are:
1. Explicitly stated or strongly implied by the user
2. Relevant to future conversations (not just this call)
3. Personal information, preferences, life events, relationships, work, or interests

Current date: ${new Date().toISOString().split('T')[0]}

Conversation:
${transcript}

For each fact, provide:
- content: The factual statement about the user
- category: One of [personal, work, relationships, interests, health, goals, preferences]
- importance: low, medium, or high

Output ONLY a valid JSON array. If no new facts, return empty array [].

Example:
[
  {"content": "User's name is Dave", "category": "personal", "importance": "high"},
  {"content": "User works as a software engineer", "category": "work", "importance": "medium"}
]`;

    const extractionPrompt = settings.extractionPrompt || defaultPrompt;

    try {
      // Call Cerebras for fact extraction
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CEREBRAS_API_KEY}`
        },
        body: JSON.stringify({
          model: settings.model || 'llama-3.3-70b',
          messages: [
            { role: 'system', content: 'You are a fact extraction system. Output only valid JSON arrays.' },
            { role: 'user', content: extractionPrompt }
          ],
          max_tokens: settings.maxTokens || 500,
          temperature: settings.temperature || 0.1
        })
      });

      if (!response.ok) {
        console.error(`[PostCallEval ${this.sessionId}] Cerebras API error:`, await response.text());
        return [];
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON - handle potential markdown code blocks
      let jsonText = text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const facts = JSON.parse(jsonText);
      return Array.isArray(facts) ? facts : [];

    } catch (e) {
      console.error(`[PostCallEval ${this.sessionId}] Failed to extract facts:`, e);
      return [];
    }
  }

  /**
   * Update user context with new facts via KV Storage
   * Key pattern: user_context:{userId}:{personaId}
   * Preserves existing Layer 2/3 data while updating Layer 4 facts
   */
  async updateLongTermMemory(userId, personaId, newFacts) {
    const key = `user_context:${userId}:${personaId}`;

    try {
      // Load existing memory from KV
      const getResponse = await fetch(`${env.API_GATEWAY_URL}/api/userdata/${encodeURIComponent(key)}`, {
        headers: { 'Authorization': `Bearer ${env.ADMIN_SECRET_TOKEN}` }
      });

      let existing = { important_memories: [], facts: [], totalCallCount: 0 };
      if (getResponse.ok) {
        const result = await getResponse.json();
        if (result.data && !result.data.deleted) {
          existing = result.data;
        }
      }

      // Add timestamps to new facts
      const timestampedFacts = newFacts.map(fact => ({
        ...fact,
        learnedAt: new Date().toISOString()
      }));

      // Merge facts (avoid duplicates) - support both old (important_memories) and new (facts) format
      const existingMemories = existing.important_memories || existing.facts || [];
      const mergedFacts = [...existingMemories];

      for (const newFact of timestampedFacts) {
        // Simple duplicate check
        const isDuplicate = existingMemories.some(f => {
          const existingContent = (f.content || f.fact || '').toLowerCase();
          const newContent = (newFact.content || '').toLowerCase();
          return existingContent.includes(newContent.slice(0, 30)) ||
                 newContent.includes(existingContent.slice(0, 30));
        });
        if (!isDuplicate) {
          mergedFacts.push(newFact);
        }
      }

      // Keep only most recent/important facts (max 50)
      const sortedFacts = mergedFacts
        .sort((a, b) => {
          const importanceOrder = { high: 3, medium: 2, low: 1 };
          const aImp = importanceOrder[a.importance] || 1;
          const bImp = importanceOrder[b.importance] || 1;
          if (aImp !== bImp) return bImp - aImp;
          return new Date(b.learnedAt || 0) - new Date(a.learnedAt || 0);
        })
        .slice(0, 50);

      // Store updated user context to KV (preserve Layer 2/3, update Layer 4)
      const putResponse = await fetch(`${env.API_GATEWAY_URL}/api/userdata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.ADMIN_SECRET_TOKEN}`
        },
        body: JSON.stringify({
          key,
          value: {
            // Preserve existing Layer 2 (call context)
            callPretext: existing.callPretext || '',
            customInstructions: existing.customInstructions || '',
            selectedScenarioId: existing.selectedScenarioId || null,
            // Preserve existing Layer 3 (relationship context)
            relationshipTypeId: existing.relationshipTypeId || null,
            relationshipDuration: existing.relationshipDuration || null,
            relationshipPrompt: existing.relationshipPrompt || '',
            // Update Layer 4 (facts)
            facts: sortedFacts,
            totalCallCount: (existing.totalCallCount || 0) + 1,
            lastUpdated: new Date().toISOString()
          }
        })
      });

      if (!putResponse.ok) {
        console.error(`[PostCallEval ${this.sessionId}] Failed to store memory:`, await putResponse.text());
      } else {
        console.log(`[PostCallEval ${this.sessionId}] Stored ${sortedFacts.length} facts to KV storage`);
      }

    } catch (err) {
      console.error(`[PostCallEval ${this.sessionId}] Memory update failed:`, err);
    }
  }
}

// Browser WebSocket handler
browserWss.on('connection', async (ws) => {
  console.log('[Browser Pipeline] New connection');
  let pipeline = null;

  ws.on('message', async (data) => {
    // Try to parse as JSON first - more reliable than checking byte values
    let isJson = false;
    let msg;

    try {
      const str = data.toString('utf8');
      // Quick check: JSON messages start with {
      if (str[0] === '{') {
        msg = JSON.parse(str);
        isJson = true;
      }
    } catch (e) {
      // Not JSON - will be treated as binary audio
    }

    if (!isJson) {
      // Binary PCM audio
      if (pipeline) {
        pipeline.handleAudio(data);
      }
      return;
    }

    // Handle JSON messages
    try {
      if (msg.type === 'init') {
        // Validate JWT (simple check - full validation would verify with log-query-service)
        if (!msg.token) {
          ws.send(JSON.stringify({ type: 'error', message: 'Token required' }));
          ws.close();
          return;
        }

        const sessionId = randomUUID();
        pipeline = new BrowserVoicePipeline(ws, {
          sessionId,
          personaId: msg.persona_id || 'brad_001',
          adminId: msg.admin_id || 'unknown',
          overrides: msg.overrides || {},
          // Accept context from PersonaDesigner UI for testing
          smartMemory: msg.smart_memory || null,
          callPretext: msg.call_pretext || null
        });

        try {
          await pipeline.start();
        } catch (startError) {
          console.error('[Browser Pipeline] Failed to start pipeline:', startError);
          ws.send(JSON.stringify({
            type: 'error',
            message: `Pipeline startup failed: ${startError.message}`,
            details: startError.stack
          }));
          pipeline = null;
          return;
        }
      } else if (msg.type === 'interrupt') {
        // User interrupted AI speech
        if (pipeline) {
          console.log(`[BrowserPipeline ${pipeline.sessionId}] User interrupted AI speech`);
          pipeline.handleInterruption();
        }
      }
    } catch (error) {
      console.error('[Browser Pipeline] Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: `Unexpected error: ${error.message}`
      }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`[Browser Pipeline] WebSocket closed. Code: ${code}, Reason: ${reason.toString()}`);
    if (pipeline) {
      console.log(`[Browser Pipeline] Cleaning up pipeline for session: ${pipeline.sessionId}`);
      pipeline.cleanup();
    }
  });

  ws.on('error', (error) => {
    console.error('[Browser Pipeline] WebSocket error:', error);
    if (pipeline) {
      console.error(`[Browser Pipeline] Error occurred for session: ${pipeline.sessionId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Voice Pipeline running on port ${PORT}`);
  console.log(`   Twilio WebSocket: ws://localhost:${PORT}/stream`);
  console.log(`   Browser WebSocket: ws://localhost:${PORT}/browser-stream`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
