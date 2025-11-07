// API Gateway Type Definitions

export interface RouteContext {
  userId?: string;
  tokenId?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface APIError {
  code: number;
  message: string;
  details?: any;
}
