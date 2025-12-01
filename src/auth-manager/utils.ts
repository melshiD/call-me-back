// Auth Manager Utility Functions

import * as bcrypt from 'bcryptjs';
import * as jose from 'jose';
import type { JWTPayload, TokenValidationResult } from './interfaces';

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

// Cache for WorkOS JWKS to avoid fetching on every request
let workosJwksCache: jose.JWTVerifyGetKey | null = null;
let workosJwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour

async function getWorkOSJWKS(): Promise<jose.JWTVerifyGetKey> {
  const now = Date.now();
  if (workosJwksCache && (now - workosJwksCacheTime) < JWKS_CACHE_TTL) {
    return workosJwksCache;
  }

  // WorkOS JWKS endpoint
  const jwksUrl = 'https://api.workos.com/sso/jwks';
  workosJwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));
  workosJwksCacheTime = now;
  return workosJwksCache;
}

export async function validateToken(token: string, secret: string): Promise<TokenValidationResult> {
  try {
    // First, decode the token without verification to check its structure
    const decoded = jose.decodeJwt(token);

    // Check if this is a WorkOS token (has 'iss' from WorkOS)
    const isWorkOSToken = decoded.iss && (
      decoded.iss.includes('workos.com') ||
      decoded.iss.includes('authkit.app')
    );

    if (isWorkOSToken) {
      // Validate WorkOS token using their JWKS (public keys)
      const jwks = await getWorkOSJWKS();
      const { payload } = await jose.jwtVerify(token, jwks);

      // WorkOS tokens have 'sub' as the user ID
      return {
        valid: true,
        userId: payload.sub as string,
        tokenId: undefined, // WorkOS tokens don't have our tokenId
      };
    } else {
      // Validate our own JWT using the secret
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(secret);
      const { payload } = await jose.jwtVerify(token, secretKey);

      return {
        valid: true,
        userId: payload.userId as string,
        tokenId: payload.tokenId as string,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

export async function blacklistToken(tokenId: string, userId: string, expiresAt: string, db: any): Promise<void> {
  await db.executeQuery(
    'INSERT INTO token_blacklist (token_id, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenId, userId, expiresAt]
  );
}

export async function isTokenBlacklisted(tokenId: string, db: any): Promise<boolean> {
  const result = await db.executeQuery(
    'SELECT token_id FROM token_blacklist WHERE token_id = $1 AND expires_at > NOW()',
    [tokenId]
  );
  return result.rows.length > 0;
}
