import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaymentProcessor from './index';

describe('PaymentProcessor Service', () => {
  let paymentProcessor: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      STRIPE_SECRET_KEY: 'test-key',
    } as any;
    paymentProcessor = new PaymentProcessor(mockEnv, {} as any);
  });

  it('should create a payment intent', async () => {
    await expect(paymentProcessor.createPaymentIntent({ amount: 500, currency: 'usd' })).resolves.toBeDefined();
  });

  it('should capture a payment', async () => {
    await expect(paymentProcessor.capturePayment('pi_123')).resolves.toBeDefined();
  });
});
