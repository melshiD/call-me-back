// Call Cost Tracker - Real-time cost accumulation during calls
import type { SmartSql } from '@liquidmetal-ai/raindrop-framework';
import { executeSQL } from './db-helpers';

export interface CostBreakdown {
  id: string;
  call_id: string;
  user_id: string;
  twilio_total_cents: number;
  elevenlabs_total_cents: number;
  cerebras_total_cents: number;
  openai_total_cents: number;
  deepgram_total_cents: number;
  raindrop_total_cents: number;
  subtotal_cents: number;
  stripe_fee_cents: number;
  total_cost_cents: number;
}

export interface CostEvent {
  event_type: 'tts_request' | 'ai_inference' | 'stt_chunk' | 'twilio_duration' | 'memory_operation';
  service: 'elevenlabs' | 'cerebras' | 'openai' | 'deepgram' | 'twilio' | 'raindrop';
  tokens_input?: number;
  tokens_output?: number;
  characters?: number;
  duration_seconds?: number;
  audio_bytes?: number;
  unit_cost?: number;
  calculated_cost_cents: number;
  model_used?: string;
  metadata?: Record<string, any>;
}

export class CallCostTracker {
  private callId: string;
  private userId: string;
  private breakdownId: string | null = null;
  private startTime: number;
  private db: SmartSql;

  constructor(callId: string, userId: string, db: SmartSql) {
    this.callId = callId;
    this.userId = userId;
    this.db = db;
    this.startTime = Date.now();
  }

  /**
   * Initialize cost tracking when call starts
   */
  async initialize(): Promise<void> {
    const id = this.generateId();

    await executeSQL(
      this.db,
      `INSERT INTO call_cost_breakdowns (
        id, call_id, user_id, twilio_connection_fee_cents
      ) VALUES (?, ?, ?, ?)`,
      [id, this.callId, this.userId, 25]
    );

    this.breakdownId = id;
  }

  /**
   * Track TTS (Text-to-Speech) request
   */
  async trackTTS(text: string, voiceId: string, model: string = 'eleven_turbo_v2'): Promise<number> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const characters = text.length;
    const costPerChar = 0.30 / 1000; // $0.30 per 1K characters
    const costCents = characters * costPerChar;

    // Log the event
    await this.logEvent({
      event_type: 'tts_request',
      service: 'elevenlabs',
      characters,
      unit_cost: costPerChar,
      calculated_cost_cents: costCents,
      model_used: model,
      metadata: { voice_id: voiceId, text_length: characters }
    });

    // Update breakdown
    await executeSQL(
      this.db,
      `UPDATE call_cost_breakdowns
       SET elevenlabs_total_characters = elevenlabs_total_characters + ?,
           elevenlabs_total_requests = elevenlabs_total_requests + 1,
           elevenlabs_total_cents = elevenlabs_total_cents + ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [characters, costCents, this.breakdownId]
    );

    await this.checkBudgetWarnings();

    return costCents;
  }

  /**
   * Track AI inference (Cerebras or OpenAI)
   */
  async trackAIInference(
    inputTokens: number,
    outputTokens: number,
    provider: 'cerebras' | 'openai' = 'cerebras',
    fallbackReason?: string
  ): Promise<number> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const totalTokens = inputTokens + outputTokens;
    let costCents: number;

    if (provider === 'cerebras') {
      // $0.10 per 1M tokens (input + output combined)
      costCents = (totalTokens / 1_000_000) * 10;

      await this.logEvent({
        event_type: 'ai_inference',
        service: 'cerebras',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        unit_cost: 0.10,
        calculated_cost_cents: costCents,
        model_used: 'llama3.1-8b',
        metadata: { total_tokens: totalTokens }
      });

      await executeSQL(
        this.db,
        `UPDATE call_cost_breakdowns
         SET cerebras_input_tokens = cerebras_input_tokens + ?,
             cerebras_output_tokens = cerebras_output_tokens + ?,
             cerebras_total_tokens = cerebras_total_tokens + ?,
             cerebras_total_requests = cerebras_total_requests + 1,
             cerebras_total_cents = cerebras_total_cents + ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [inputTokens, outputTokens, totalTokens, costCents, this.breakdownId]
      );
    } else {
      // OpenAI: $10/1M input, $30/1M output
      const inputCost = (inputTokens / 1_000_000) * 1000;
      const outputCost = (outputTokens / 1_000_000) * 3000;
      costCents = inputCost + outputCost;

      await this.logEvent({
        event_type: 'ai_inference',
        service: 'openai',
        tokens_input: inputTokens,
        tokens_output: outputTokens,
        calculated_cost_cents: costCents,
        model_used: 'gpt-4-turbo-preview',
        metadata: { total_tokens: totalTokens, input_cost: inputCost, output_cost: outputCost }
      });

      await executeSQL(
        this.db,
        `UPDATE call_cost_breakdowns
         SET openai_input_tokens = openai_input_tokens + ?,
             openai_output_tokens = openai_output_tokens + ?,
             openai_total_tokens = openai_total_tokens + ?,
             openai_total_requests = openai_total_requests + 1,
             openai_total_cents = openai_total_cents + ?,
             openai_fallback_triggered = 1,
             openai_fallback_reason = ?,
             updated_at = datetime('now')
         WHERE id = ?`,
        [inputTokens, outputTokens, totalTokens, costCents, fallbackReason || 'Manual fallback', this.breakdownId]
      );
    }

    await this.checkBudgetWarnings();

    return costCents;
  }

  /**
   * Track Speech-to-Text processing
   */
  async trackSTT(audioDurationSeconds: number): Promise<number> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const costPerMinute = 0.43 / 100; // $0.43 per 100 minutes = $0.0043/min
    const minutes = audioDurationSeconds / 60;
    const costCents = minutes * costPerMinute;

    await this.logEvent({
      event_type: 'stt_chunk',
      service: 'deepgram',
      duration_seconds: audioDurationSeconds,
      unit_cost: costPerMinute,
      calculated_cost_cents: costCents,
      model_used: 'nova-2',
      metadata: { audio_duration_seconds: audioDurationSeconds }
    });

    await executeSQL(
      this.db,
      `UPDATE call_cost_breakdowns
       SET deepgram_audio_duration_seconds = deepgram_audio_duration_seconds + ?,
           deepgram_total_requests = deepgram_total_requests + 1,
           deepgram_total_cents = deepgram_total_cents + ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [audioDurationSeconds, costCents, this.breakdownId]
    );

    await this.checkBudgetWarnings();

    return costCents;
  }

  /**
   * Track Twilio call duration
   */
  async trackCallDuration(): Promise<{ durationSeconds: number; costCents: number }> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = durationSeconds / 60;
    const costCents = minutes * 40; // $0.40 per minute

    await executeSQL(
      this.db,
      `UPDATE call_cost_breakdowns
       SET twilio_duration_seconds = ?,
           twilio_duration_cost_cents = ?,
           twilio_total_cents = 25 + ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [durationSeconds, costCents, costCents, this.breakdownId]
    );

    return { durationSeconds, costCents };
  }

  /**
   * Get current total cost
   */
  async getCurrentTotal(): Promise<{ subtotal_cents: number; total_cents: number; breakdown: any }> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const result = await executeSQL(
      this.db,
      'SELECT * FROM call_cost_breakdowns WHERE id = ?',
      [this.breakdownId]
    );

    if (result.rows.length === 0) {
      throw new Error('Cost breakdown not found');
    }

    const breakdown = result.rows[0];

    const subtotal =
      (breakdown.twilio_total_cents || 0) +
      (breakdown.elevenlabs_total_cents || 0) +
      (breakdown.cerebras_total_cents || 0) +
      (breakdown.openai_total_cents || 0) +
      (breakdown.deepgram_total_cents || 0) +
      (breakdown.raindrop_total_cents || 0);

    return {
      subtotal_cents: subtotal,
      total_cents: subtotal,
      breakdown
    };
  }

  /**
   * Check if user is approaching budget limits
   */
  async checkBudgetWarnings(): Promise<void> {
    const { total_cents } = await this.getCurrentTotal();

    // Get user budget settings
    const budgetResult = await executeSQL(
      this.db,
      'SELECT * FROM user_budget_settings WHERE user_id = ?',
      [this.userId]
    );

    // Use defaults if no custom settings
    const budget = budgetResult.rows.length > 0 ? budgetResult.rows[0] : {
      max_cost_per_call_cents: 1000,
      warn_at_percent_per_call: 75,
      enable_auto_cutoff: 1
    };

    const warningThreshold = (budget.max_cost_per_call_cents * budget.warn_at_percent_per_call) / 100;

    // Hard cutoff
    if (budget.enable_auto_cutoff && total_cents >= budget.max_cost_per_call_cents) {
      await this.emergencyCutoff('Per-call cost limit exceeded');
      return;
    }

    // Soft warning
    if (total_cents >= warningThreshold) {
      await this.sendCostWarning('approaching_limit', total_cents, budget.max_cost_per_call_cents);
    }
  }

  /**
   * Emergency cutoff (end call immediately)
   */
  private async emergencyCutoff(reason: string): Promise<void> {
    // TODO: Implement actual call termination via Twilio
    console.error(`Emergency cutoff triggered: ${reason}`);

    // Mark call as ended due to budget
    await executeSQL(
      this.db,
      `UPDATE calls SET
        status = 'terminated',
        error_message = ?,
        end_time = datetime('now')
       WHERE id = ?`,
      [reason, this.callId]
    );
  }

  /**
   * Send cost warning to user
   */
  private async sendCostWarning(type: string, currentCents: number, limitCents?: number): Promise<void> {
    // TODO: Implement in-call warning system (TTS announcement or frontend notification)
    console.warn(`Cost warning: ${type} - Current: $${(currentCents / 100).toFixed(2)}, Limit: $${limitCents ? (limitCents / 100).toFixed(2) : 'N/A'}`);
  }

  /**
   * Finalize costs when call ends
   */
  async finalize(callEndedAt: Date): Promise<{ subtotal_cents: number; stripe_fee_cents: number; total_cost_cents: number }> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    // Final Twilio duration calculation
    await this.trackCallDuration();

    const { subtotal_cents } = await this.getCurrentTotal();

    // Calculate Stripe fee (2.9% + $0.30)
    const stripeFee = (subtotal_cents * 0.029) + 30;
    const totalCost = subtotal_cents + stripeFee;

    await executeSQL(
      this.db,
      `UPDATE call_cost_breakdowns
       SET subtotal_cents = ?,
           stripe_fee_cents = ?,
           total_cost_cents = ?,
           finalized_at = ?,
           updated_at = datetime('now')
       WHERE id = ?`,
      [subtotal_cents, stripeFee, totalCost, callEndedAt.toISOString(), this.breakdownId]
    );

    return {
      subtotal_cents,
      stripe_fee_cents: stripeFee,
      total_cost_cents: totalCost
    };
  }

  /**
   * Log a cost event
   */
  private async logEvent(event: CostEvent): Promise<void> {
    if (!this.breakdownId) throw new Error('Cost tracker not initialized');

    const id = this.generateId();
    const metadata = event.metadata ? JSON.stringify(event.metadata) : null;

    await executeSQL(
      this.db,
      `INSERT INTO call_cost_events (
        id, call_id, call_cost_breakdown_id, event_type, service,
        tokens_input, tokens_output, characters, duration_seconds, audio_bytes,
        unit_cost, calculated_cost_cents, model_used, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        this.callId,
        this.breakdownId,
        event.event_type,
        event.service,
        event.tokens_input || null,
        event.tokens_output || null,
        event.characters || null,
        event.duration_seconds || null,
        event.audio_bytes || null,
        event.unit_cost || null,
        event.calculated_cost_cents,
        event.model_used || null,
        metadata
      ]
    );
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Estimate call cost before initiating
 */
export async function estimateCallCost(
  estimatedDurationMinutes: number,
  memoryTokens: number = 2000,
  scenarioTokens: number = 0
): Promise<{
  estimated_duration_minutes: number;
  breakdown: {
    twilio: number;
    tts: number;
    ai: number;
    stt: number;
  };
  subtotal_cents: number;
  stripe_fee_cents: number;
  total_cents: number;
  memory_tokens: number;
  scenario_tokens: number;
  total_context_tokens: number;
  warning: string | null;
}> {
  // Assumptions
  const avgTurnsPerMinute = 4; // ~15 seconds per conversational turn
  const totalTurns = estimatedDurationMinutes * avgTurnsPerMinute;
  const avgCharsPerResponse = 50;
  const avgOutputTokens = 100;

  // TTS cost
  const totalTTSChars = totalTurns * avgCharsPerResponse;
  const ttsCost = (totalTTSChars / 1000) * 0.30;

  // AI inference cost (Cerebras) - includes memory + scenario in context
  const totalContextTokens = memoryTokens + scenarioTokens;
  const avgInputTokens = 1000 + totalContextTokens;
  const totalTokens = totalTurns * (avgInputTokens + avgOutputTokens);
  const aiCost = (totalTokens / 1_000_000) * 0.10;

  // STT cost
  const sttCost = estimatedDurationMinutes * (0.43 / 100);

  // Twilio cost
  const twilioCost = 0.25 + (estimatedDurationMinutes * 0.40);

  // Totals
  const subtotal = ttsCost + aiCost + sttCost + twilioCost;
  const stripeFee = (subtotal * 0.029) + 0.30;
  const total = subtotal + stripeFee;

  // Generate warning if context is too large
  let warning: string | null = null;
  if (totalContextTokens > 3000) {
    warning = 'Large memory + scenario context will increase AI costs significantly';
  } else if (memoryTokens > 3000) {
    warning = 'Large memory context will increase AI costs significantly';
  } else if (scenarioTokens > 500) {
    warning = 'Detailed scenario will slightly increase AI costs per turn';
  }

  return {
    estimated_duration_minutes: estimatedDurationMinutes,
    breakdown: {
      twilio: Math.round(twilioCost * 100) / 100,
      tts: Math.round(ttsCost * 100) / 100,
      ai: Math.round(aiCost * 100) / 100,
      stt: Math.round(sttCost * 100) / 100
    },
    subtotal_cents: Math.round(subtotal * 100),
    stripe_fee_cents: Math.round(stripeFee * 100),
    total_cents: Math.round(total * 100),
    memory_tokens: memoryTokens,
    scenario_tokens: scenarioTokens,
    total_context_tokens: totalContextTokens,
    warning
  };
}

/**
 * Estimate token count for scenario text (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateScenarioTokens(scenarioText: string): number {
  return Math.ceil(scenarioText.length / 4);
}
