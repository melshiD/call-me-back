export interface TwilioWebhookPayload {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
}

export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: any;
  };
}
