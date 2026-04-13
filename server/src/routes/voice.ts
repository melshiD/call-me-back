import { Hono } from 'hono';
import { query } from '../db.js';
import { getCurrentTimestamp } from '../lib/utils.js';
import * as callService from '../services/call-service.js';

const voice = new Hono();

// Twilio fetches TwiML from here when call is answered
voice.post('/answer', async (c) => {
  const callId = c.req.query('callId') || '';
  const userId = c.req.query('userId') || '';
  const personaId = c.req.query('personaId') || '';

  // Voice WebSocket URL from env (NOT hardcoded)
  const voiceWsUrl = process.env.VOICE_WS_URL!; // wss://voice.callbackapp.ai/stream

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
