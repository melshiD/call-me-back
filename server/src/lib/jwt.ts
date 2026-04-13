import * as jose from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

export interface JwtPayload {
  userId?: string;
  adminId?: string;
  email?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  const jti = crypto.randomUUID();
  return new jose.SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRATION || '30d')
    .sign(getSecret());
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jose.jwtVerify(token, getSecret());
  return payload as JwtPayload;
}

export function decodeJwt(token: string): JwtPayload {
  const payload = jose.decodeJwt(token);
  return payload as JwtPayload;
}
