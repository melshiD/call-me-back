import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { PaymentIntent } from './interfaces';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async createPaymentIntent(input: { amount: number; currency: string }): Promise<PaymentIntent> {
    try {
      this.env.logger.info('Creating payment intent', { amount: input.amount });

      const paymentIntentId = 'pi_' + crypto.randomUUID();

      return {
        id: paymentIntentId,
        amount: input.amount,
        currency: input.currency,
        status: 'requires_payment_method',
        clientSecret: paymentIntentId + '_secret_' + crypto.randomUUID(),
      };
    } catch (error) {
      this.env.logger.error('Failed to create payment intent', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  async capturePayment(paymentIntentId: string): Promise<{ success: boolean }> {
    try {
      this.env.logger.info('Capturing payment', { paymentIntentId });

      return {
        success: true,
      };
    } catch (error) {
      this.env.logger.error('Failed to capture payment', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
