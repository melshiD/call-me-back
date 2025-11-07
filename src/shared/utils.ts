// Shared Utility Functions

import type { Logger } from './interfaces';

/**
 * Safe logger wrapper that handles missing logger gracefully
 */
export function safeLog(logger: Logger | undefined, level: 'debug' | 'info' | 'warn' | 'error', message: string, fields?: Record<string, any>): void {
  if (logger && typeof logger[level] === 'function') {
    logger[level](message, fields);
  }
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic E.164 format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(message: string, statusCode: number = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(data: any, statusCode: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

/**
 * Parse JSON from request body safely
 */
export async function parseRequestBody<T>(request: Request): Promise<T | null> {
  try {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await request.json() as T;
    }
    return null;
  } catch {
    return null;
  }
}
