import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { Call, ScheduledCall } from './interfaces';
import { executeSQL } from '../shared/db-helpers';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async initiateCall(input: { userId: string; personaId: string; phoneNumber: string }): Promise<Call> {
    try {
      this.env.logger.info('Initiating call', { userId: input.userId });

      const callId = crypto.randomUUID();

      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO calls (id, user_id, persona_id, phone_number, status) VALUES (?, ?, ?, ?, ?)',
        [callId, input.userId, input.personaId, input.phoneNumber, 'pending']
      );

      this.env.logger.info('Call initiated', { callId });

      return {
        id: callId,
        userId: input.userId,
        personaId: input.personaId,
        phoneNumber: input.phoneNumber,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.env.logger.error('Failed to initiate call', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async scheduleCall(input: { userId: string; personaId: string; phoneNumber: string; scheduledTime: string }): Promise<ScheduledCall> {
    try {
      this.env.logger.info('Scheduling call', { userId: input.userId });

      const callId = crypto.randomUUID();

      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO scheduled_calls (id, user_id, persona_id, phone_number, scheduled_time, status) VALUES (?, ?, ?, ?, ?, ?)',
        [callId, input.userId, input.personaId, input.phoneNumber, input.scheduledTime, 'scheduled']
      );

      this.env.logger.info('Call scheduled', { callId });

      return {
        id: callId,
        userId: input.userId,
        personaId: input.personaId,
        phoneNumber: input.phoneNumber,
        scheduledTime: input.scheduledTime,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.env.logger.error('Failed to schedule call', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
