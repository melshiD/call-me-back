// server/src/services/scheduler.ts
import cron from 'node-cron';
import { query } from '../db.js';
import * as callService from './call-service.js';
import { getCurrentTimestamp } from '../lib/utils.js';

export function startScheduler() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      await executeScheduledCalls();
      await cleanupStaleCalls();
    } catch (error) {
      console.error('[Scheduler] Error:', error);
    }
  });

  console.log('[Scheduler] Started — checking every minute');
}

async function executeScheduledCalls() {
  const now = getCurrentTimestamp();

  // Find calls that are due (with 30 second buffer)
  const dueResult = await query(
    `SELECT * FROM scheduled_calls
     WHERE status = 'scheduled'
       AND scheduled_time <= NOW() + INTERVAL '30 seconds'
     ORDER BY scheduled_time ASC
     LIMIT 10`
  );

  for (const scheduled of dueResult.rows) {
    try {
      // Mark as executing (prevent double-execution)
      await query(
        "UPDATE scheduled_calls SET status = 'executing', updated_at = $1 WHERE id = $2 AND status = 'scheduled'",
        [now, scheduled.id]
      );

      // Initiate the call
      const result = await callService.initiateCall({
        userId: scheduled.user_id,
        personaId: scheduled.persona_id,
        phoneNumber: scheduled.phone_number,
        callPretext: scheduled.call_pretext,
        callScenario: scheduled.call_scenario,
        customInstructions: scheduled.custom_instructions,
        maxDurationMinutes: scheduled.max_duration_minutes,
        voiceId: scheduled.voice_id,
        scheduledCallId: scheduled.id,
        paymentMethod: 'scheduled',
      });

      // Mark as executed
      await query(
        "UPDATE scheduled_calls SET status = 'executed', call_id = $1, executed_at = $2, updated_at = $2 WHERE id = $3",
        [result.callId, getCurrentTimestamp(), scheduled.id]
      );

      console.log(`[Scheduler] Executed scheduled call ${scheduled.id} → call ${result.callId}`);
    } catch (error) {
      await query(
        "UPDATE scheduled_calls SET status = 'failed', updated_at = $1 WHERE id = $2",
        [getCurrentTimestamp(), scheduled.id]
      );
      console.error(`[Scheduler] Failed scheduled call ${scheduled.id}:`, error);
    }
  }
}

async function cleanupStaleCalls() {
  const now = getCurrentTimestamp();

  // Calls stuck in 'in-progress' for > 30 min
  await query(
    `UPDATE calls SET status = 'failed', error_message = 'Timeout: exceeded 30 minutes', updated_at = $1
     WHERE status = 'in-progress' AND created_at < NOW() - INTERVAL '30 minutes'`,
    [now]
  );

  // Calls stuck in 'ringing' for > 5 min
  await query(
    `UPDATE calls SET status = 'no-answer', updated_at = $1
     WHERE status = 'ringing' AND created_at < NOW() - INTERVAL '5 minutes'`,
    [now]
  );

  // Calls stuck in 'initiating' for > 2 min
  await query(
    `UPDATE calls SET status = 'failed', error_message = 'Twilio did not accept call', updated_at = $1
     WHERE status = 'initiating' AND created_at < NOW() - INTERVAL '2 minutes'`,
    [now]
  );
}
