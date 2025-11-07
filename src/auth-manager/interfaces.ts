// Auth Manager Type Definitions

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  stripeCustomerId?: string;
  defaultPaymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  tokenId?: string;
  error?: string;
}
