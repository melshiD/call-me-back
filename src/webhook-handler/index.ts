import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async handleTwilioWebhook(request: Request): Promise<Response> {
    try {
      this.env.logger.info('Handling Twilio webhook');

      return new Response(JSON.stringify({ status: 'processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      this.env.logger.error('Failed to handle Twilio webhook', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async handleStripeWebhook(request: Request): Promise<Response> {
    try {
      this.env.logger.info('Handling Stripe webhook');

      return new Response(JSON.stringify({ status: 'processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      this.env.logger.error('Failed to handle Stripe webhook', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
