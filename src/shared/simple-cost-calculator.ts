/**
 * Simple Cost Calculator - MVP for hackathon
 * Estimates costs based on call duration using standard rates
 */

interface CostEstimate {
  durationMinutes: number;
  twilioCost: number;
  deepgramCost: number;
  cerebrasCost: number;
  elevenlabsCost: number;
  totalCost: number;
}

/**
 * Calculate estimated cost for a completed call
 * Based on 2025-11-22 pricing rates
 */
export function calculateCallCost(durationSeconds: number): CostEstimate {
  const durationMinutes = durationSeconds / 60;

  // Pricing (in USD)
  const TWILIO_PER_MINUTE = 0.014;
  const DEEPGRAM_PER_MINUTE = 0.0059;
  const CEREBRAS_PER_1M_TOKENS = 0.10;
  const ELEVENLABS_PER_1K_CHARS = 0.00015; // Turbo v2.5

  // Assumptions for typical call
  const TURNS_PER_MINUTE = 4;
  const AVG_RESPONSE_CHARS = 50;
  const AVG_TOKENS_PER_TURN = 1100; // ~1000 input (context) + 100 output

  // Calculate costs
  const twilioCost = durationMinutes * TWILIO_PER_MINUTE;
  const deepgramCost = durationMinutes * DEEPGRAM_PER_MINUTE;

  const totalTurns = durationMinutes * TURNS_PER_MINUTE;
  const totalChars = totalTurns * AVG_RESPONSE_CHARS;
  const totalTokens = totalTurns * AVG_TOKENS_PER_TURN;

  const elevenlabsCost = (totalChars / 1000) * ELEVENLABS_PER_1K_CHARS;
  const cerebrasCost = (totalTokens / 1000000) * CEREBRAS_PER_1M_TOKENS;

  const totalCost = twilioCost + deepgramCost + cerebrasCost + elevenlabsCost;

  return {
    durationMinutes,
    twilioCost,
    deepgramCost,
    cerebrasCost,
    elevenlabsCost,
    totalCost
  };
}

/**
 * Format cost for display
 */
export function formatCost(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

/**
 * Get breakdown text for logging
 */
export function getCostBreakdown(durationSeconds: number): string {
  const costs = calculateCallCost(durationSeconds);
  return `Duration: ${costs.durationMinutes.toFixed(2)} min | ` +
    `Twilio: ${formatCost(costs.twilioCost)} | ` +
    `Deepgram: ${formatCost(costs.deepgramCost)} | ` +
    `Cerebras: ${formatCost(costs.cerebrasCost)} | ` +
    `ElevenLabs: ${formatCost(costs.elevenlabsCost)} | ` +
    `TOTAL: ${formatCost(costs.totalCost)}`;
}
