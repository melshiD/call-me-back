import { Hono } from 'hono';
import { query } from '../db.js';
import { generateId, getCurrentTimestamp } from '../lib/utils.js';
import * as callService from '../services/call-service.js';

const voice = new Hono();

// Inbound call policy — test-phase caps (keep cost predictable until we trust the pipeline)
const VERIFIED_USER_MAX_MINUTES = 12;    // Hard cap for verified callers (below their tier's limit)
const ANONYMOUS_TRIAL_MINUTES = 3;       // One-time free trial for unknown callers
const UNMAPPED_NUMBER_MINUTES = 3;       // Brad-for-Dave sidecar handling

// Numbers owned by the app but not mapped to a persona — treated as "Brad answering for Dave"
const UNMAPPED_NUMBERS: Record<string, { ownerName: string; fallbackPersonaId: string }> = {
  '+14632313462': { ownerName: 'Dave', fallbackPersonaId: 'brad_001' },
};

// --- Pretext builders -------------------------------------------------------

function anonymousTrialPretext(callCount: number): string {
  const returning = callCount > 1 ? ` They have called this number ${callCount} times before from this phone number.` : '';
  return [
    '[ANONYMOUS CALLER — NEW TO SERVICE]',
    `You are answering an inbound call from someone who has NOT registered with callbackapp.ai and whose phone is not verified with us.${returning}`,
    'Greet them naturally as yourself ("Hello, this is <your name>, how can I help you?"). Don\'t assume you know them.',
    'Goals for this call, pursued naturally through conversation:',
    '  1) Find out how they got this number and whether they meant to call.',
    '  2) If they seem confused, briefly explain: "callbackapp.ai is a service that lets people have voice conversations with AI personas like me."',
    '  3) Read their openness to AI — are they curious, skeptical, dismissive?',
    '  4) If they seem interested, naturally suggest they sign up at callbackapp.ai to keep chatting.',
    '  5) You have about 3 minutes total. Don\'t rush, but don\'t stall either.',
    'Do NOT reveal that this is a trial cap unless they ask about time. Do NOT be salesy — be the persona you are, and let the service speak for itself.',
  ].join('\n');
}

function unverifiedUserReminderPretext(): string {
  return [
    '[UNVERIFIED REGISTERED USER — possible]',
    'If during the call the caller indicates they have a callbackapp.ai account already, remind them: "If you\'ve already registered with the app, verify your phone number from your user dashboard so I can recognize you next time."',
  ].join('\n');
}

function unmappedNumberPretext(ownerName: string): string {
  return [
    `[UNMAPPED NUMBER — you are covering for ${ownerName}]`,
    `You (Brad) are temporarily answering this phone for ${ownerName}, who can't come to the phone right now.`,
    'Be friendly and brief. Take a quick message if the caller wants to leave one. If they seem curious about the service, mention they can sign up at callbackapp.ai. Do not pretend to be the owner; be yourself (Brad) covering for them.',
  ].join('\n');
}

// Twilio fetches TwiML from here when call is answered.
// Handles BOTH directions:
//   - OUTBOUND: /answer?callId=...&userId=...&personaId=...   (params set by initiateCall())
//   - INBOUND:  /answer  with form body {From, To, CallSid}   (Twilio number configured webhook)
voice.post('/answer', async (c) => {
  const voiceWsUrl = process.env.VOICE_WS_URL!; // wss://voice.callbackapp.ai/stream

  let callId = c.req.query('callId') || '';
  let userId = c.req.query('userId') || '';
  let personaId = c.req.query('personaId') || '';

  // If no query params, this is an inbound call from Twilio.
  if (!callId || !userId || !personaId) {
    const body = await c.req.parseBody().catch(() => ({} as Record<string, unknown>));
    const from = String(body['From'] || '');
    const to = String(body['To'] || '');
    const twilioCallSid = String(body['CallSid'] || '');

    console.log('[voice/answer] inbound call', { from, to, twilioCallSid });

    // --- Persona resolution -------------------------------------------------
    let isUnmappedNumber = false;
    let unmappedOwner: string | null = null;

    if (to) {
      const personaResult = await query(
        'SELECT id FROM personas WHERE twilio_phone_number = $1',
        [to]
      );
      if (personaResult.rows[0]) {
        personaId = personaResult.rows[0].id;
      } else if (UNMAPPED_NUMBERS[to]) {
        // App-owned number with no persona mapping — use "X answering for Y" pattern
        personaId = UNMAPPED_NUMBERS[to].fallbackPersonaId;
        unmappedOwner = UNMAPPED_NUMBERS[to].ownerName;
        isUnmappedNumber = true;
        console.log('[voice/answer] unmapped number, using fallback persona', { to, personaId, owner: unmappedOwner });
      } else {
        console.warn('[voice/answer] no persona found for To=', to);
      }
    }
    if (!personaId) personaId = 'brad_001';

    // --- User resolution + unknown-caller tracking --------------------------
    let anonymousCallCount = 0; // populated if unknown caller
    if (from) {
      const userResult = await query(
        'SELECT id FROM users WHERE phone = $1 AND phone_verified = true LIMIT 1',
        [from]
      );
      if (userResult.rows[0]) {
        userId = userResult.rows[0].id;
      } else {
        // Unknown caller: upsert tracker. RETURNING so we know whether this is call #1 / #n.
        try {
          const upsert = await query(
            `INSERT INTO unknown_caller_attempts (phone_number, persona_id, first_call_at, last_call_at, call_count)
             VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
             ON CONFLICT (phone_number) DO UPDATE
               SET last_call_at = CURRENT_TIMESTAMP,
                   call_count  = unknown_caller_attempts.call_count + 1,
                   persona_id  = EXCLUDED.persona_id
             RETURNING call_count`,
            [from, personaId]
          );
          anonymousCallCount = Number(upsert.rows[0]?.call_count || 1);
        } catch (e) {
          console.error('[voice/answer] unknown_caller_attempts upsert failed', e);
          anonymousCallCount = 1;
        }
        userId = 'anonymous_caller';
      }
    }
    if (!userId) userId = 'anonymous_caller';

    // --- Duration cap + pretext decision -----------------------------------
    const isAnonymous = userId === 'anonymous_caller';
    let maxDurationMinutes: number;
    let pretextSegments: string[] = [];

    if (isUnmappedNumber && unmappedOwner) {
      pretextSegments.push(unmappedNumberPretext(unmappedOwner));
      maxDurationMinutes = UNMAPPED_NUMBER_MINUTES;
    } else if (isAnonymous) {
      pretextSegments.push(anonymousTrialPretext(anonymousCallCount));
      pretextSegments.push(unverifiedUserReminderPretext());
      maxDurationMinutes = ANONYMOUS_TRIAL_MINUTES;
    } else {
      // Verified user — cap at test-phase limit OR user's tier limit, whichever is smaller.
      const userCap = await query(
        'SELECT max_call_duration_minutes FROM user_credits WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      const userTierCap = Number(userCap.rows[0]?.max_call_duration_minutes || VERIFIED_USER_MAX_MINUTES);
      maxDurationMinutes = Math.min(VERIFIED_USER_MAX_MINUTES, userTierCap || VERIFIED_USER_MAX_MINUTES);
    }

    const callPretext = pretextSegments.join('\n\n') || null;

    // --- Call row insert ---------------------------------------------------
    callId = generateId();
    try {
      await query(
        `INSERT INTO calls (id, user_id, persona_id, phone_number, status, direction,
           twilio_call_sid, max_duration_minutes, call_pretext, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'in-progress', 'inbound', $5, $6, $7, $8, $8)`,
        [callId, userId, personaId, from, twilioCallSid || null, maxDurationMinutes, callPretext, getCurrentTimestamp()]
      );
    } catch (e) {
      console.error('[voice/answer] failed to insert inbound call row', e);
      // Continue anyway; voice-pipeline tolerates a missing callId row.
    }

    console.log('[voice/answer] inbound resolved', {
      callId,
      userId,
      personaId,
      maxDurationMinutes,
      isAnonymous,
      isUnmappedNumber,
      anonymousCallCount,
    });
  }

  // Build TwiML that tells Twilio to connect to our voice pipeline via WebSocket
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${voiceWsUrl}">
      <Parameter name="callId" value="${callId}" />
      <Parameter name="userId" value="${userId}" />
      <Parameter name="personaId" value="${personaId}" />
    </Stream>
  </Connect>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
});

// Twilio sends call status updates here
voice.post('/status', async (c) => {
  const body = await c.req.parseBody();
  const callSid = body['CallSid'] as string;
  const callStatus = body['CallStatus'] as string;

  if (callSid && callStatus) {
    await callService.updateCallStatus(callSid, callStatus);

    // If call completed, update duration
    if (callStatus === 'completed' && body['CallDuration']) {
      const duration = parseInt(body['CallDuration'] as string, 10);
      await query(
        'UPDATE calls SET duration_seconds = $1, updated_at = $2 WHERE twilio_call_sid = $3',
        [duration, getCurrentTimestamp(), callSid]
      );
    }
  }

  return new Response('<Response/>', {
    headers: { 'Content-Type': 'text/xml' },
  });
});

// Answering Machine Detection callback
voice.post('/amd', async (c) => {
  const body = await c.req.parseBody();
  const callId = c.req.query('callId') || '';
  const answeredBy = body['AnsweredBy'] as string;

  if (answeredBy && (answeredBy.startsWith('machine') || answeredBy === 'fax')) {
    // Hang up on voicemail/fax
    await query(
      "UPDATE calls SET status = 'voicemail-detected', updated_at = $1 WHERE id = $2",
      [getCurrentTimestamp(), callId]
    );

    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  return new Response('<Response/>', {
    headers: { 'Content-Type': 'text/xml' },
  });
});

export default voice;
