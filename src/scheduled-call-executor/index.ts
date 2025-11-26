import { Task, Event } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

/**
 * Scheduled Call Executor Task
 *
 * Runs every minute to check for scheduled calls that are due and execute them.
 * Uses the call-orchestrator service to initiate the actual calls.
 *
 * Status flow: scheduled -> executing -> executed | failed
 */
export default class extends Task<Env> {
  async handle(event: Event): Promise<void> {
    const executionTime = new Date(event.scheduledTime);
    this.env.logger.info('Scheduled call executor running', {
      executionTime: executionTime.toISOString()
    });

    try {
      // Find all scheduled calls that are due (with 30 second buffer for execution time)
      const cutoffTime = new Date(executionTime.getTime() + 30000).toISOString();

      const dueCalls = await this.env.DATABASE_PROXY.executeQuery(
        `SELECT * FROM scheduled_calls
         WHERE status = 'scheduled'
         AND scheduled_time <= $1
         ORDER BY scheduled_time ASC
         LIMIT 10`,
        [cutoffTime]
      );

      const callCount = dueCalls.rows?.length || 0;
      this.env.logger.info('Found due calls', { count: callCount });

      if (!dueCalls.rows || callCount === 0) {
        return;
      }

      for (const scheduledCall of dueCalls.rows) {
        await this.executeScheduledCall(scheduledCall);
      }
    } catch (error) {
      this.env.logger.error('Scheduled call executor error', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async executeScheduledCall(scheduledCall: any): Promise<void> {
    const {
      id,
      user_id,
      persona_id,
      phone_number,
      call_pretext,
      call_scenario,
      custom_instructions,
      max_duration_minutes,
      voice_id,
      ai_parameters
    } = scheduledCall;

    try {
      this.env.logger.info('Executing scheduled call', {
        scheduledCallId: id,
        hasPretext: !!call_pretext,
        scenario: call_scenario
      });

      // Mark as executing to prevent double-execution
      const updateResult = await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE scheduled_calls
         SET status = 'executing', updated_at = NOW()
         WHERE id = $1 AND status = 'scheduled'
         RETURNING id`,
        [id]
      );

      // Check if update succeeded (prevents race condition)
      if (!updateResult.rows || updateResult.rows.length === 0) {
        this.env.logger.warn('Scheduled call already being processed or status changed', {
          scheduledCallId: id
        });
        return;
      }

      // Build the call input with all context fields
      // Context is stored in calls table and fetched by voice pipeline via callId
      // (not passed through TwiML because <Parameter> has 500 char limit)
      const callInput: any = {
        userId: user_id,
        personaId: persona_id,
        phoneNumber: phone_number,
        paymentMethod: 'scheduled',
        paymentStatus: 'pre_authorized',
        scheduledCallId: id, // Link to scheduled_calls table
      };

      // Pass all call context fields - they'll be stored in calls table
      if (call_pretext) {
        callInput.callPretext = call_pretext;
      }
      if (call_scenario) {
        callInput.callScenario = call_scenario;
      }
      if (custom_instructions) {
        callInput.customInstructions = custom_instructions;
      }
      if (max_duration_minutes) {
        callInput.maxDurationMinutes = max_duration_minutes;
      }
      if (voice_id) {
        callInput.voiceId = voice_id;
      }

      // Trigger the actual call via call-orchestrator
      const callResult = await this.env.CALL_ORCHESTRATOR.initiateCall(callInput);

      // Mark as executed with link to call record
      await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE scheduled_calls
         SET status = 'executed',
             executed_at = NOW(),
             call_id = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [callResult.id, id]
      );

      this.env.logger.info('Scheduled call executed successfully', {
        scheduledCallId: id,
        callId: callResult.id,
        twilioStatus: callResult.status
      });

    } catch (error) {
      // Mark as failed
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.env.DATABASE_PROXY.executeQuery(
        `UPDATE scheduled_calls
         SET status = 'failed',
             updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      this.env.logger.error('Scheduled call execution failed', {
        scheduledCallId: id,
        error: errorMessage
      });
    }
  }
}
