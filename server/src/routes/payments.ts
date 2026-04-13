import { Hono } from 'hono';
import * as paymentService from '../services/payment-service.js';
import { authMiddleware } from '../middleware/auth.js';

const payments = new Hono();

payments.post('/checkout', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.packSize) {
    return c.json({ error: 'packSize is required (25, 50, or 100)' }, 400);
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://callbackapp.ai';
  const successUrl = `${frontendUrl}/dashboard?payment=success`;
  const cancelUrl = `${frontendUrl}/pricing?payment=cancelled`;

  try {
    const result = await paymentService.createCheckoutSession(userId, body.packSize, successUrl, cancelUrl);
    return c.json(result);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : 'Checkout failed' }, 500);
  }
});

// Stripe webhook — no auth middleware (Stripe sends this)
payments.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400);
  }

  const rawBody = await c.req.text();

  try {
    const result = await paymentService.handleStripeWebhook(rawBody, signature);
    return c.json(result);
  } catch (error) {
    console.error('[Stripe] Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});

payments.get('/purchase-history', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const history = await paymentService.getPurchaseHistory(userId);
  return c.json(history);
});

export default payments;
