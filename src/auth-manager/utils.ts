// Auth Manager Utility Functions

import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import type { JWTPayload, TokenValidationResult } from './interfaces';
import { executeSQL } from '../shared/db-helpers';

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(userId: string, email: string, secret: string): Promise<string> {
  const tokenId = crypto.randomUUID();
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);

  const jwt = await new jose.SignJWT({
    userId,
    email,
    tokenId
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey);

  return jwt;
}

export async function validateToken(token: string, secret: string): Promise<TokenValidationResult> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);

    const { payload } = await jose.jwtVerify(token, secretKey);

    return {
      valid: true,
      userId: payload.userId as string,
      tokenId: payload.tokenId as string,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

export async function blacklistToken(tokenId: string, userId: string, expiresAt: string, db: any): Promise<void> {
  await executeSQL(db, 'INSERT INTO token_blacklist (token_id, user_id, expires_at) VALUES (?, ?, ?)', [tokenId, userId, expiresAt]);
}

export async function isTokenBlacklisted(tokenId: string, db: any): Promise<boolean> {
  const result = await executeSQL(db, 'SELECT token_id FROM token_blacklist WHERE token_id = ? AND expires_at > datetime("now")', [tokenId]);
  return result.rows.length > 0;
}
