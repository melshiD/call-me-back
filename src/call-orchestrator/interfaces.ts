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

export interface ScheduledCall {
  id: string;
  userId: string;
  personaId: string;
  phoneNumber: string;
  scheduledTime: string;
  status: string;
  paymentIntentId?: string;
  createdAt: string;
}
