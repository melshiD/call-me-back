import { query } from '../db.js';
import { createTwilioCall } from '../lib/twilio.js';
import { generateId, getCurrentTimestamp } from '../lib/utils.js';

interface InitiateCallInput {
  userId: string;
  personaId: string;
  phoneNumber: string;
  callPretext?: string;
  callScenario?: string;
  customInstructions?: string;
  maxDurationMinutes?: number;
  voiceId?: string;
  scheduledCallId?: string;
  paymentMethod?: string;
}

export async function initiateCall(input: InitiateCallInput) {
  const callId = generateId();
  const now = getCurrentTimestamp();
  const baseUrl = process.env.API_BASE_URL!; // https://api.callbackapp.ai

  // Determine persona's Twilio phone number (or use default)
  const personaResult = await query(
    'SELECT twilio_phone_number, name FROM personas WHERE id = $1',
    [input.personaId]
  );
  const persona = personaResult.rows[0];
  const fromNumber = persona?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER!;

  // Create call record
  await query(
    `INSERT INTO calls (id, user_id, persona_id, phone_number, status, direction, payment_method,
     call_pretext, call_scenario, custom_instructions, max_duration_minutes, voice_id_override,
     scheduled_call_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'initiating', 'outbound', $5, $6, $7, $8, $9, $10, $11, $12, $12)`,
    [callId, input.userId, input.personaId, input.phoneNumber,
     input.paymentMethod || 'credits', input.callPretext || null,
     input.callScenario || null, input.customInstructions || null,
     input.maxDurationMinutes || 30, input.voiceId || null,
     input.scheduledCallId || null, now]
  );

  // Build Twilio callback URLs using env var (NOT hardcoded lmapp.run)
  const answerUrl = `${baseUrl}/api/voice/answer?callId=${callId}&userId=${input.userId}&personaId=${input.personaId}`;
  const statusCallbackUrl = `${baseUrl}/api/voice/status`;
  const amdCallbackUrl = `${baseUrl}/api/voice/amd?callId=${callId}`;

  try {
    const twilioResult = await createTwilioCall({
      to: input.phoneNumber,
      from: fromNumber,
      answerUrl,
      statusCallbackUrl,
      amdCallbackUrl,
    });

    // Update call with Twilio SID
    await query(
      'UPDATE calls SET twilio_call_sid = $1, status = $2, updated_at = $3 WHERE id = $4',
      [twilioResult.sid, 'queued', getCurrentTimestamp(), callId]
    );

    return { callId, status: 'queued', twilioSid: twilioResult.sid };
  } catch (error) {
    await query(
      'UPDATE calls SET status = $1, error_message = $2, updated_at = $3 WHERE id = $4',
      ['failed', error instanceof Error ? error.message : 'Unknown error', getCurrentTimestamp(), callId]
    );
    throw error;
  }
}

export async function getCallHistory(userId: string, limit: number = 50) {
  const result = await query(
    `SELECT c.*, p.name as persona_name
     FROM calls c
     LEFT JOIN personas p ON c.persona_id = p.id
     WHERE c.user_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

export async function updateCallStatus(callSid: string, status: string) {
  // Map Twilio statuses to internal statuses
  const statusMap: Record<string, string> = {
    'queued': 'queued',
    'ringing': 'ringing',
    'in-progress': 'in-progress',
    'completed': 'completed',
    'busy': 'busy',
    'failed': 'failed',
    'no-answer': 'no-answer',
    'canceled': 'canceled',
  };

  const internalStatus = statusMap[status] || status;
  const now = getCurrentTimestamp();

  await query(
    'UPDATE calls SET status = $1, updated_at = $2 WHERE twilio_call_sid = $3',
    [internalStatus, now, callSid]
  );
}

export async function scheduleCall(input: {
  userId: string;
  personaId: string;
  phoneNumber: string;
  scheduledTime: string;
  callPretext?: string;
  callScenario?: string;
  customInstructions?: string;
  maxDurationMinutes?: number;
  voiceId?: string;
}) {
  const id = generateId();
  const now = getCurrentTimestamp();

  await query(
    `INSERT INTO scheduled_calls (id, user_id, persona_id, phone_number, scheduled_time, status,
     call_pretext, call_scenario, custom_instructions, max_duration_minutes, voice_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'scheduled', $6, $7, $8, $9, $10, $11, $11)`,
    [id, input.userId, input.personaId, input.phoneNumber, input.scheduledTime,
     input.callPretext || null, input.callScenario || null,
     input.customInstructions || null, input.maxDurationMinutes || 30,
     input.voiceId || null, now]
  );

  return { id, status: 'scheduled' };
}

export async function getScheduledCalls(userId: string) {
  const result = await query(
    `SELECT sc.*, p.name as persona_name
     FROM scheduled_calls sc
     LEFT JOIN personas p ON sc.persona_id = p.id
     WHERE sc.user_id = $1 AND sc.status = 'scheduled'
     ORDER BY sc.scheduled_time ASC`,
    [userId]
  );
  return result.rows;
}

export async function cancelScheduledCall(userId: string, callId: string) {
  const result = await query(
    `UPDATE scheduled_calls SET status = 'cancelled', updated_at = $1
     WHERE id = $2 AND user_id = $3 AND status = 'scheduled'
     RETURNING id`,
    [getCurrentTimestamp(), callId, userId]
  );
  return result.rows.length > 0;
}

export async function getUserBalance(userId: string) {
  const result = await query(
    'SELECT available_credits, subscription_tier, max_call_duration_minutes FROM user_credits WHERE user_id = $1',
    [userId]
  );
  const row = result.rows[0] || { available_credits: 0, subscription_tier: 'free_trial', max_call_duration_minutes: 0 };
  return { ...row, minutes_balance: row.available_credits };
}
