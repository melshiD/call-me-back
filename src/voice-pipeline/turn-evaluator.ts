/**
 * Turn Evaluation Service
 *
 * Lightweight LLM wrapper for fast turn-taking decisions
 */

import { TurnDecision } from './conversation-manager';
import { LLMServiceFactory } from '../shared/ai-services';

export interface TurnEvaluatorConfig {
  provider: 'cerebras' | 'openai';
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export const DEFAULT_EVALUATOR_CONFIG: TurnEvaluatorConfig = {
  provider: 'cerebras',
  model: 'llama3.1-8b',
  maxTokens: 50,  // Reasonable buffer, stop sequences keep actual usage low
  temperature: 0.3,  // Low temp for consistent decisions
  timeoutMs: 500  // Fast response critical
};

export class TurnEvaluator {
  private config: TurnEvaluatorConfig;
  private evaluationCache: Map<string, TurnDecision> = new Map();

  constructor(config: Partial<TurnEvaluatorConfig> = {}) {
    this.config = { ...DEFAULT_EVALUATOR_CONFIG, ...config };
  }

  /**
   * Evaluate if user is done speaking
   */
  async evaluate(transcript: string, context?: string): Promise<TurnDecision> {
    // Cache check for identical transcripts (within same turn)
    const cacheKey = this.getCacheKey(transcript);
    if (this.evaluationCache.has(cacheKey)) {
      console.log('[TurnEvaluator] Cache hit');
      return this.evaluationCache.get(cacheKey)!;
    }

    const prompt = this.buildPrompt(transcript, context);
    const response = await this.callLLM(prompt);
    const decision = this.parseDecision(response);

    // Cache the result
    this.evaluationCache.set(cacheKey, decision);

    // Clear cache after short time (avoid memory growth)
    setTimeout(() => this.evaluationCache.delete(cacheKey), 5000);

    return decision;
  }

  /**
   * Build evaluation prompt
   */
  private buildPrompt(transcript: string, context?: string): string {
    let prompt = `Analyze if the user has finished speaking:

User said: "${transcript}"`;

    if (context) {
      prompt += `\n\nContext: ${context}`;
    }

    prompt += `

Incomplete indicators:
- Trailing "um", "uh", "so", "and", "but"
- Unfinished sentences
- Open-ended phrases like "I want to..."

Complete indicators:
- Full question or statement
- Natural end punctuation
- Clear intent expressed

Answer with ONE word only:
- WAIT (user likely has more to say)
- RESPOND (user is done, respond now)
- UNCLEAR (not sure, wait longer)

Answer:`;

    return prompt;
  }

  /**
   * Call LLM service
   */
  private async callLLM(prompt: string): Promise<string> {
    const startTime = Date.now();

    try {
      const llmService = LLMServiceFactory.getService(this.config.provider, {
        model: this.config.model,
        timeoutMs: this.config.timeoutMs
      });

      const response = await llmService.quickEval(prompt, this.config.maxTokens);

      const duration = Date.now() - startTime;
      console.log(`[TurnEvaluator] LLM response time: ${duration}ms`);

      if (duration > this.config.timeoutMs) {
        console.warn(`[TurnEvaluator] Slow response: ${duration}ms > ${this.config.timeoutMs}ms`);
      }

      return response;
    } catch (error) {
      console.error('[TurnEvaluator] LLM call failed:', error);

      // Fallback to heuristic evaluation
      console.log('[TurnEvaluator] Falling back to heuristic evaluation');
      const heuristic = new HeuristicTurnEvaluator();
      const decision = heuristic.evaluate(this.extractTranscript(prompt));
      return decision;
    }
  }

  /**
   * Extract transcript from prompt for heuristic fallback
   */
  private extractTranscript(prompt: string): string {
    const match = prompt.match(/User said: "([^"]+)"/);
    return match ? match[1] : prompt;
  }

  /**
   * Mock LLM call for testing
   * TODO: Replace with actual implementation
   */
  private async mockLLMCall(prompt: string): Promise<string> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simple heuristic-based mock
    const transcript = prompt.match(/User said: "([^"]+)"/)?.[1] || '';

    // Check for incomplete indicators
    const incompleteWords = ['um', 'uh', 'so', 'and', 'but', 'because', 'like'];
    const endsIncomplete = incompleteWords.some(word =>
      transcript.toLowerCase().trim().endsWith(word)
    );

    if (endsIncomplete) return 'WAIT';

    // Check for obvious question completion
    if (transcript.trim().endsWith('?')) return 'RESPOND';

    // Check for very short utterances
    if (transcript.split(' ').length < 3) return 'WAIT';

    // Default to respond if reasonable length
    if (transcript.split(' ').length > 5) return 'RESPOND';

    return 'UNCLEAR';
  }

  /**
   * Parse LLM response into decision
   */
  private parseDecision(response: string): TurnDecision {
    const normalized = response.trim().toUpperCase();

    if (normalized.includes('RESPOND')) return TurnDecision.RESPOND;
    if (normalized.includes('WAIT')) return TurnDecision.WAIT;
    return TurnDecision.UNCLEAR;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(transcript: string): string {
    return transcript.trim().toLowerCase();
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.evaluationCache.size,
      config: this.config
    };
  }
}

/**
 * Heuristic-based fallback for when LLM is unavailable
 */
export class HeuristicTurnEvaluator {
  evaluate(transcript: string): TurnDecision {
    const text = transcript.trim().toLowerCase();
    const words = text.split(/\s+/);

    // Very short - probably incomplete
    if (words.length < 2) return TurnDecision.WAIT;

    // Ends with incomplete markers
    const incompleteEndings = ['um', 'uh', 'so', 'and', 'but', 'or', 'because', 'like', 'actually'];
    const lastWord = words[words.length - 1];
    if (incompleteEndings.includes(lastWord)) return TurnDecision.WAIT;

    // Ends with question mark or period (from STT)
    if (text.endsWith('?') || text.endsWith('.')) return TurnDecision.RESPOND;

    // Contains question words and is reasonable length
    const questionWords = ['what', 'where', 'when', 'who', 'why', 'how', 'can', 'could', 'would', 'should'];
    const hasQuestionWord = words.some(w => questionWords.includes(w));
    if (hasQuestionWord && words.length >= 3) return TurnDecision.RESPOND;

    // Reasonable length statement
    if (words.length >= 5) return TurnDecision.RESPOND;

    // Default to unclear
    return TurnDecision.UNCLEAR;
  }
}
