// Shared Type Definitions

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

export interface Call {
  id: string;
  userId: string;
  personaId?: string;
  phoneNumber: string;
  status: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  cost?: number;
  sid?: string;
  transcript?: string;
  errorMessage?: string;
  paymentIntentId?: string;
  createdAt: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  voice: string;
  systemPrompt: string;
  isPublic: boolean;
  createdBy: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Logger {
  debug(message: string, fields?: Record<string, any>): void;
  info(message: string, fields?: Record<string, any>): void;
  warn(message: string, fields?: Record<string, any>): void;
  error(message: string, fields?: Record<string, any>): void;
}
