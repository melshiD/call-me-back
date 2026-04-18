import Stripe from 'stripe';
import { query } from '../db.js';
import { generateId, getCurrentTimestamp } from '../lib/utils.js';

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

const CREDIT_PACKS: Record<string, { priceId: string; minutes: number }> = {
  '25': { priceId: process.env.STRIPE_PRICE_TWENTY_FIVE_MIN || '', minutes: 25 },
  '50': { priceId: process.env.STRIPE_PRICE_FIFTY_MIN || '', minutes: 50 },
  '100': { priceId: process.env.STRIPE_PRICE_ONE_HUNDRED_MIN || '', minutes: 100 },
};

export async function createCheckoutSession(userId: string, packSize: string, successUrl: string, cancelUrl: string) {
  const pack = CREDIT_PACKS[packSize];
  if (!pack || !pack.priceId) {
    throw new Error(`Invalid pack size: ${packSize}`);
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  const userResult = await query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];
  if (!user) throw new Error('User not found');

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
    await query('UPDATE users SET stripe_customer_id = $1, updated_at = $2 WHERE id = $3', [customerId, getCurrentTimestamp(), userId]);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: pack.priceId, quantity: 1 }],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, packSize, minutes: pack.minutes.toString() },
  });

  return { sessionId: session.id, url: session.url };
}

export async function handleStripeWebhook(payload: string, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const minutes = parseInt(session.metadata?.minutes || '0', 10);

    if (userId && minutes > 0) {
      const now = getCurrentTimestamp();

      // Add minutes to user balance
      await query(
        `UPDATE user_credits SET available_credits = available_credits + $1, updated_at = $2 WHERE user_id = $3`,
        [minutes, now, userId]
      );

      // Record purchase
      await query(
        `INSERT INTO purchases (id, user_id, amount_cents, status, stripe_session_id, payment_method, created_at, updated_at)
         VALUES ($1, $2, $3, 'completed', $4, 'stripe', $5, $5)`,
        [generateId(), userId, session.amount_total || 0, session.id, now]
      );
    }
  }

  return { received: true };
}

export async function getPurchaseHistory(userId: string) {
  const result = await query(
    'SELECT * FROM purchases WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
}
