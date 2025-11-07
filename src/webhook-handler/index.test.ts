import { describe, it, expect, vi, beforeEach } from 'vitest';
import WebhookHandler from './index';

describe('WebhookHandler Service', () => {
  let webhookHandler: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      TWILIO_AUTH_TOKEN: 'test-token',
      STRIPE_WEBHOOK_SECRET: 'test-secret',
    } as any;
    webhookHandler = new WebhookHandler(mockEnv, {} as any);
  });

  it('should handle Twilio webhooks', async () => {
    const request = new Request('http://localhost/twilio', { method: 'POST' });
    await expect(webhookHandler.handleTwilioWebhook(request)).resolves.toBeDefined();
  });

  it('should handle Stripe webhooks', async () => {
    const request = new Request('http://localhost/stripe', { method: 'POST' });
    await expect(webhookHandler.handleStripeWebhook(request)).resolves.toBeDefined();
  });
});
