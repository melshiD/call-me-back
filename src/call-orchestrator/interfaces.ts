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
  status: 'scheduled' | 'executing' | 'executed' | 'failed' | 'cancelled';
  paymentIntentId?: string;
  createdAt: string;
  executedAt?: string;
  callId?: string;

  // Call context fields
  callPretext?: string;           // "Help me prepare for my marathon"
  callScenario?: string;          // "fitness_coaching" | "interview_prep" | "therapy_session"
  customInstructions?: string;    // "Be more challenging today"
  maxDurationMinutes?: number;    // 5, 10, 15, 30
  voiceId?: string;               // Override default persona voice
  aiParameters?: {
    temperature?: number;         // 0.0-1.0 creativity
    style?: string;               // "supportive" | "challenging" | "playful"
    memoryContext?: string;       // Context from previous calls
  };
  memorySnapshot?: {
    scheduledAt?: string;
    recentStorylines?: string[];
    userContextAtSchedule?: string;
    aiInterpretedReason?: string;
  };
}

export interface ScheduleCallInput {
  userId: string;
  personaId: string;
  phoneNumber: string;
  scheduledTime: string;

  // Optional context
  callPretext?: string;
  callScenario?: string;
  customInstructions?: string;
  maxDurationMinutes?: number;
  voiceId?: string;
  aiParameters?: Record<string, any>;
}
