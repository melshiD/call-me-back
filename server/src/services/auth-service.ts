import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { signJwt, verifyJwt, decodeJwt, JwtPayload } from '../lib/jwt.js';
import { blacklistToken } from '../redis.js';
import { generateId, getCurrentTimestamp, isValidEmail } from '../lib/utils.js';

interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name: string };
  error?: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { email, password, name, phone } = input;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Invalid email format' };
  }
  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' };
  }

  // Check if user exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    return { success: false, error: 'User already exists' };
  }

  const userId = generateId();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = getCurrentTimestamp();

  await query(
    `INSERT INTO users (id, email, password_hash, name, phone, email_verified, phone_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, false, false, $6, $6)`,
    [userId, email.toLowerCase(), passwordHash, name || '', phone || '', now]
  );

  // Give new users 5 free trial minutes
  await query(
    `INSERT INTO user_credits (id, user_id, available_credits, subscription_tier, max_call_duration_minutes, created_at, updated_at)
     VALUES ($1, $2, 5, 'free_trial', 30, $3, $3)`,
    [generateId(), userId, now]
  );

  const token = await signJwt({ userId, email: email.toLowerCase() });

  return {
    success: true,
    token,
    user: { id: userId, email: email.toLowerCase(), name: name || '' },
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { email, password } = input;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' };
  }

  const result = await query(
    'SELECT id, email, password_hash, name FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid email or password' };
  }

  const user = result.rows[0];

  // Handle WorkOS migrated users (password_hash = 'workos')
  if (user.password_hash === 'workos') {
    return { success: false, error: 'Please reset your password. Your account was migrated from a previous auth provider.' };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { success: false, error: 'Invalid email or password' };
  }

  const token = await signJwt({ userId: user.id, email: user.email });

  return {
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name },
  };
}

export async function validateToken(token: string): Promise<{ valid: boolean; payload?: JwtPayload; error?: string }> {
  try {
    const payload = await verifyJwt(token);
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

export async function logout(token: string): Promise<void> {
  try {
    const payload = decodeJwt(token);
    if (payload.jti && payload.exp) {
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await blacklistToken(payload.jti, ttl);
      }
    }
  } catch {
    // Token already invalid, nothing to blacklist
  }
}

export async function getUserProfile(userId: string) {
  const result = await query(
    'SELECT id, email, name, phone, phone_verified, email_verified, stripe_customer_id, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}
