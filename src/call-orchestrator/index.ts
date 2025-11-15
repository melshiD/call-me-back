import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { Call, ScheduledCall } from './interfaces';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async initiateCall(input: { 
    userId: string; 
    personaId: string; 
    phoneNumber: string;
    paymentMethod?: string;
    paymentIntentId?: string;
    paymentStatus?: string;
  }): Promise<Call> {
    try {
      this.env.logger.info('Initiating call', { 
        userId: input.userId,
        paymentMethod: input.paymentMethod || 'demo'
      });

      const callId = crypto.randomUUID();

      // Store call in database with payment information
      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO calls (
          id, user_id, persona_id, phone_number, status,
          payment_method, payment_intent_id, payment_status, estimated_cost_cents
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          callId,
          input.userId,
          input.personaId,
          input.phoneNumber,
          'initiating',
          input.paymentMethod || 'demo',
          input.paymentIntentId || null,
          input.paymentStatus || 'pending',
          500 // Estimated 5 dollars for a call
        ]
      );

      // TODO: Configure these with your Twilio credentials
      // Replace the placeholder values below with your actual Twilio credentials
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID_HERE';
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN_HERE';
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER_HERE';

      // For demo mode, allow calls even without Twilio configured
      if (input.paymentMethod === 'demo' && twilioAccountSid === 'YOUR_TWILIO_ACCOUNT_SID_HERE') {
        this.env.logger.warn('Twilio not configured - simulating call for demo mode', { callId });
        
        // Update call status to simulated
        await this.env.DATABASE_PROXY.executeQuery(
          'UPDATE calls SET status = $1, error_message = $2 WHERE id = $3',
          ['simulated', 'Twilio not configured - demo mode', callId]
        );

        return {
          id: callId,
          userId: input.userId,
          personaId: input.personaId,
          phoneNumber: input.phoneNumber,
          status: 'simulated',
          createdAt: new Date().toISOString(),
        };
      }

      if (!twilioAccountSid || twilioAccountSid === 'YOUR_TWILIO_ACCOUNT_SID_HERE') {
        throw new Error('Twilio credentials not configured - please update environment variables with your Twilio credentials');
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
      await this.env.DATABASE_PROXY.executeQuery(
        'UPDATE calls SET twilio_call_sid = $1, status = $2 WHERE id = $3',
        [twilioCall.sid, 'in-progress', callId]
      );

      this.env.logger.info('Call initiated via Twilio', { 
        callId, 
        twilioCallSid: twilioCall.sid,
        paymentMethod: input.paymentMethod 
      });

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

      await this.env.DATABASE_PROXY.executeQuery(
        'INSERT INTO scheduled_calls (id, user_id, persona_id, phone_number, scheduled_time, status) VALUES ($1, $2, $3, $4, $5, $6)',
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
