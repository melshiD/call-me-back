/**
 * Conversation State Manager
 *
 * Manages the turn-taking flow in voice conversations with intelligent
 * LLM-based evaluation of conversational completeness
 */

import { TurnEvaluator, HeuristicTurnEvaluator } from './turn-evaluator';

export enum ConversationState {
  IDLE = 'idle',                    // No active conversation
  LISTENING = 'listening',          // Listening to user speak
  EVALUATING = 'evaluating',        // LLM evaluating if user is done
  PROCESSING = 'processing',        // AI generating response
  SPEAKING = 'speaking',            // AI speaking response
  INTERRUPTED = 'interrupted'       // User interrupted AI
}

export enum TurnDecision {
  WAIT = 'WAIT',           // User will likely continue speaking
  RESPOND = 'RESPOND',     // User is done, generate response
  UNCLEAR = 'UNCLEAR'      // Ambiguous, wait a bit longer
}

export interface ConversationConfig {
  // Silence detection thresholds (in milliseconds)
  shortSilenceMs: number;      // Quick pause - don't eval yet
  llmEvalThresholdMs: number;  // Trigger LLM evaluation
  forceResponseMs: number;     // Force response regardless

  // LLM evaluation settings
  maxEvaluations: number;      // Max LLM evals before forcing response
  evalModel: string;           // Model to use for turn evaluation
  evalProvider: 'cerebras' | 'openai';

  // Interrupt settings
  enableInterrupts: boolean;
  interruptDetectionMs: number;

  // Audio settings
  silenceThresholdDb: number;  // dB level considered silence
}

export const DEFAULT_CONFIG: ConversationConfig = {
  shortSilenceMs: 500,
  llmEvalThresholdMs: 1200,
  forceResponseMs: 3000,
  maxEvaluations: 2,
  evalModel: 'llama3.1-8b',
  evalProvider: 'cerebras',
  enableInterrupts: true,
  interruptDetectionMs: 300,
  silenceThresholdDb: -40
};

export interface TranscriptSegment {
  text: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
}

export class ConversationManager {
  private state: ConversationState = ConversationState.IDLE;
  private config: ConversationConfig;
  private transcript: TranscriptSegment[] = [];
  private lastSpeechTime: number = 0;
  private evaluationCount: number = 0;
  private silenceTimer: NodeJS.Timeout | null = null;
  private turnEvaluator: TurnEvaluator;

  constructor(config: Partial<ConversationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.turnEvaluator = new TurnEvaluator({
      provider: this.config.evalProvider,
      model: this.config.evalModel,
      maxTokens: 50,  // Reasonable buffer while stop sequences keep it short
      temperature: 0.3,
      timeoutMs: 500
    });
  }

  /**
   * Get current conversation state
   */
  getState(): ConversationState {
    return this.state;
  }

  /**
   * Update state with event logging
   */
  private setState(newState: ConversationState): void {
    const oldState = this.state;
    this.state = newState;
    console.log(`[ConversationManager] State: ${oldState} → ${newState}`);
  }

  /**
   * Handle incoming speech segment from STT
   */
  addTranscriptSegment(segment: TranscriptSegment): void {
    this.transcript.push(segment);
    this.lastSpeechTime = Date.now();

    // If AI was speaking and user interrupted
    if (this.state === ConversationState.SPEAKING && this.config.enableInterrupts) {
      this.handleInterrupt();
      return;
    }

    // Update state to listening
    if (this.state === ConversationState.IDLE) {
      this.setState(ConversationState.LISTENING);
    }

    // Reset silence timer on new speech
    this.resetSilenceTimer();
  }

  /**
   * Detect silence and trigger appropriate action
   */
  onSilenceDetected(): void {
    const silenceDuration = Date.now() - this.lastSpeechTime;

    // Short silence - just a natural pause
    if (silenceDuration < this.config.shortSilenceMs) {
      return;
    }

    // LLM evaluation threshold reached
    if (silenceDuration >= this.config.llmEvalThresholdMs &&
        this.evaluationCount < this.config.maxEvaluations) {
      this.triggerTurnEvaluation();
      return;
    }

    // Force response after maximum wait time
    if (silenceDuration >= this.config.forceResponseMs) {
      this.triggerResponse('force_timeout');
    }
  }

  /**
   * Trigger LLM evaluation of conversation completeness
   */
  private async triggerTurnEvaluation(): Promise<void> {
    this.setState(ConversationState.EVALUATING);
    this.evaluationCount++;

    const partialTranscript = this.getPartialTranscript();
    const decision = await this.evaluateConversationalCompleteness(partialTranscript);

    console.log(`[ConversationManager] LLM Decision (attempt ${this.evaluationCount}): ${decision}`);

    switch (decision) {
      case TurnDecision.RESPOND:
        this.triggerResponse('llm_eval_complete');
        break;

      case TurnDecision.UNCLEAR:
      case TurnDecision.WAIT:
        // Go back to listening, set timer for next eval
        this.setState(ConversationState.LISTENING);
        this.scheduleSilenceCheck();
        break;
    }
  }

  /**
   * LLM-based evaluation of whether user is done speaking
   */
  private async evaluateConversationalCompleteness(transcript: string): Promise<TurnDecision> {
    try {
      return await this.turnEvaluator.evaluate(transcript);
    } catch (error) {
      console.error('[ConversationManager] Turn evaluation failed:', error);
      // Fallback to heuristic
      const heuristic = new HeuristicTurnEvaluator();
      return heuristic.evaluate(transcript);
    }
  }


  /**
   * Trigger full AI response generation
   */
  private triggerResponse(reason: string): void {
    console.log(`[ConversationManager] Triggering response (reason: ${reason})`);
    this.setState(ConversationState.PROCESSING);

    // Reset for next turn
    this.evaluationCount = 0;
    this.clearSilenceTimer();

    // Emit event for response generation
    // TODO: Integrate with event system
  }

  /**
   * Handle user interrupt while AI is speaking
   */
  private handleInterrupt(): void {
    console.log('[ConversationManager] User interrupted AI');
    this.setState(ConversationState.INTERRUPTED);

    // Stop current TTS playback
    // TODO: Integrate with TTS cancellation

    // Reset and start listening
    this.transcript = [];
    this.evaluationCount = 0;
    this.setState(ConversationState.LISTENING);
  }

  /**
   * Get partial transcript for evaluation
   */
  private getPartialTranscript(): string {
    return this.transcript
      .map(seg => seg.text)
      .join(' ')
      .trim();
  }

  /**
   * Get full final transcript
   */
  getFinalTranscript(): string {
    return this.transcript
      .filter(seg => seg.isFinal)
      .map(seg => seg.text)
      .join(' ')
      .trim();
  }

  /**
   * Reset silence timer
   */
  private resetSilenceTimer(): void {
    this.clearSilenceTimer();
    this.scheduleSilenceCheck();
  }

  /**
   * Schedule next silence check
   */
  private scheduleSilenceCheck(): void {
    this.silenceTimer = setTimeout(() => {
      this.onSilenceDetected();
    }, this.config.llmEvalThresholdMs);
  }

  /**
   * Clear silence timer
   */
  private clearSilenceTimer(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Mark AI as speaking
   */
  startSpeaking(): void {
    this.setState(ConversationState.SPEAKING);
  }

  /**
   * Mark AI as done speaking, ready for next turn
   */
  finishSpeaking(): void {
    this.setState(ConversationState.LISTENING);
    this.transcript = [];
    this.evaluationCount = 0;
  }

  /**
   * Reset conversation state
   */
  reset(): void {
    this.setState(ConversationState.IDLE);
    this.transcript = [];
    this.evaluationCount = 0;
    this.clearSilenceTimer();
  }

  /**
   * Get conversation statistics
   */
  getStats() {
    return {
      state: this.state,
      transcriptSegments: this.transcript.length,
      evaluationCount: this.evaluationCount,
      lastSpeechTime: this.lastSpeechTime,
      partialTranscript: this.getPartialTranscript()
    };
  }
}
