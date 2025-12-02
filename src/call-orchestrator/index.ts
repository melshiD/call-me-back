import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { Call, ScheduledCall, ScheduleCallInput } from './interfaces';

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
    callPretext?: string;
    callScenario?: string;
    customInstructions?: string;
    maxDurationMinutes?: number;
    voiceId?: string;
    scheduledCallId?: string;
  }): Promise<Call> {
    try {
      this.env.logger.info('Initiating call', {
        userId: input.userId,
        paymentMethod: input.paymentMethod || 'demo',
        hasPretext: !!input.callPretext,
        scheduledCallId: input.scheduledCallId
      });

      const callId = crypto.randomUUID();

      // Store call in database with payment information AND call context
      // Context is stored here so voice pipeline can fetch it via callId
      // (TwiML <Parameter> has 500 char limit, so we don't pass context through TwiML)
      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO calls (
          id, user_id, persona_id, phone_number, status,
          payment_method, payment_intent_id, payment_status, estimated_cost_cents,
          call_pretext, call_scenario, custom_instructions, max_duration_minutes,
          voice_id_override, scheduled_call_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          callId,
          input.userId,
          input.personaId,
          input.phoneNumber,
          'initiating',
          input.paymentMethod || 'demo',
          input.paymentIntentId || null,
          input.paymentStatus || 'pending',
          500, // Estimated 5 dollars for a call
          input.callPretext || null,
          input.callScenario || null,
          input.customInstructions || null,
          input.maxDurationMinutes || null,
          input.voiceId || null,
          input.scheduledCallId || null
        ]
      );

      // Get Twilio credentials from environment
      const twilioAccountSid = this.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = this.env.TWILIO_AUTH_TOKEN;
      const defaultTwilioPhone = this.env.TWILIO_PHONE_NUMBER;

      // Fetch persona's phone number for caller ID
      let twilioPhoneNumber = defaultTwilioPhone;
      try {
        const personaResult = await this.env.DATABASE_PROXY.executeQuery(
          'SELECT twilio_phone_number FROM personas WHERE id = $1',
          [input.personaId]
        );
        if (personaResult.rows.length > 0 && personaResult.rows[0].twilio_phone_number) {
          twilioPhoneNumber = personaResult.rows[0].twilio_phone_number;
          this.env.logger.info('Using persona-specific caller ID', {
            personaId: input.personaId,
            callerIdNumber: twilioPhoneNumber
          });
        }
      } catch (err) {
        this.env.logger.warn('Failed to fetch persona phone number, using default', { error: err instanceof Error ? err.message : String(err) });
      }

      // For demo mode, allow calls even without Twilio configured
      if (input.paymentMethod === 'demo' && !twilioAccountSid) {
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

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error('Twilio credentials not configured in environment variables');
      }

      // Get the API gateway URL for webhooks
      // This should be the public API Gateway URL
      // Pass callId, userId, personaId via query params so TwiML can include them
      // NOTE: Call context (pretext, scenario, etc.) is stored in DB and fetched by voice pipeline via callId
      //       We don't pass context through TwiML because <Parameter> has 500 char limit
      const baseUrl = 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';
      const params = new URLSearchParams({
        callId: callId,
        userId: input.userId,
        personaId: input.personaId
      });
      const answerUrl = `${baseUrl}/api/voice/answer?${params.toString()}`;

      // Call Twilio API
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Calls.json`;
      const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      // Status callback URL to receive call status updates (no-answer, busy, failed, completed)
      const statusCallbackUrl = `${baseUrl}/api/voice/status?callId=${callId}`;

      const formBody = new URLSearchParams();
      formBody.append('To', input.phoneNumber);
      formBody.append('From', twilioPhoneNumber);
      formBody.append('Url', answerUrl);
      formBody.append('Method', 'POST');
      formBody.append('Timeout', '15'); // Ring for 15 seconds max before giving up (prevents voicemail from answering)
      formBody.append('StatusCallback', statusCallbackUrl);
      formBody.append('StatusCallbackMethod', 'POST');
      // StatusCallbackEvent must be passed as multiple parameters for the REST API
      const statusEvents = ['initiated', 'ringing', 'answered', 'completed', 'no-answer', 'busy', 'failed', 'canceled'];
      statusEvents.forEach(event => formBody.append('StatusCallbackEvent', event));

      // AMD (Answering Machine Detection) - detect voicemail and hang up to avoid blank messages
      // https://www.twilio.com/docs/voice/answering-machine-detection
      formBody.append('MachineDetection', 'Enable');
      formBody.append('MachineDetectionTimeout', '5'); // 5 seconds to detect (quick, since we ring for 15s max)
      formBody.append('MachineDetectionSpeechThreshold', '2000'); // 2 seconds of speech = probably voicemail greeting
      formBody.append('MachineDetectionSpeechEndThreshold', '800'); // 800ms silence after speech = greeting done
      formBody.append('MachineDetectionSilenceTimeout', '3000'); // 3 seconds of silence = probably human
      formBody.append('AsyncAmd', 'true'); // Don't block call connection, detect async
      formBody.append('AsyncAmdStatusCallback', `${baseUrl}/api/voice/amd?callId=${callId}`);
      formBody.append('AsyncAmdStatusCallbackMethod', 'POST');

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

  async scheduleCall(input: ScheduleCallInput): Promise<ScheduledCall> {
    try {
      this.env.logger.info('Scheduling call with context', {
        userId: input.userId,
        hasPretext: !!input.callPretext,
        duration: input.maxDurationMinutes
      });

      const callId = crypto.randomUUID();

      await this.env.DATABASE_PROXY.executeQuery(
        `INSERT INTO scheduled_calls (
          id, user_id, persona_id, phone_number, scheduled_time, status,
          call_pretext, call_scenario, custom_instructions,
          max_duration_minutes, voice_id, ai_parameters
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          callId,
          input.userId,
          input.personaId,
          input.phoneNumber,
          input.scheduledTime,
          'scheduled',
          input.callPretext || null,
          input.callScenario || null,
          input.customInstructions || null,
          input.maxDurationMinutes || 5,
          input.voiceId || null,
          input.aiParameters ? JSON.stringify(input.aiParameters) : null
        ]
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
        callPretext: input.callPretext,
        callScenario: input.callScenario,
        maxDurationMinutes: input.maxDurationMinutes,
      };
    } catch (error) {
      this.env.logger.error('Failed to schedule call', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
