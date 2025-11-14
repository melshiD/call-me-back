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

      // Store call in database
      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO calls (id, user_id, persona_id, phone_number, status) VALUES (?, ?, ?, ?, ?)',
        [callId, input.userId, input.personaId, input.phoneNumber, 'initiating']
      );

      // TODO: Configure these with your Twilio credentials
      // Replace the placeholder values below with your actual Twilio credentials
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID_HERE';
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN_HERE';
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER_HERE';

      if (!twilioAccountSid || twilioAccountSid === 'YOUR_TWILIO_ACCOUNT_SID_HERE') {
        throw new Error('Twilio credentials not configured - please update src/call-orchestrator/index.ts with your credentials');
      }

      // Get the base URL for webhooks
      const baseUrl = process.env.BASE_URL || 'https://svc-01k9fhfycrjp84j2sg746gwy9q.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';
      const answerUrl = `${baseUrl}/api/voice/answer`;

      // Call Twilio API
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const formBody = new URLSearchParams({
        To: input.phoneNumber,
        From: twilioPhoneNumber,
        Url: answerUrl,
        Method: 'POST'
      });

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Twilio API error: ${response.status} - ${errorText}`);
      }

      const twilioCall = await response.json() as any;

      // Update call with Twilio SID
      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'UPDATE calls SET twilio_call_sid = ?, status = ? WHERE id = ?',
        [twilioCall.sid, 'in-progress', callId]
      );

      this.env.logger.info('Call initiated via Twilio', { callId, twilioCallSid: twilioCall.sid });

      return {
        id: callId,
        userId: input.userId,
        personaId: input.personaId,
        phoneNumber: input.phoneNumber,
        status: 'in-progress',
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
