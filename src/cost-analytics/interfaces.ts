// ============================================================================
// Cost Analytics Service Interfaces
// ============================================================================

// ----------------------------------------------------------------------------
// Service Type Definitions
// ----------------------------------------------------------------------------

export type ApiService = 'twilio' | 'deepgram' | 'cerebras' | 'elevenlabs';
export type InfraService = 'raindrop' | 'vultr' | 'vercel';
export type TransactionService = 'stripe';
export type AllServices = ApiService | InfraService | TransactionService;

export type UsageUnit = 'minutes' | 'seconds' | 'tokens' | 'characters';
export type CostType = 'api_usage' | 'infrastructure' | 'transaction';

// ----------------------------------------------------------------------------
// Per-Call Variable Costs (API Services)
// ----------------------------------------------------------------------------

export interface ApiServiceUsage {
  service: ApiService;
  operation: string; // e.g., 'outbound_call', 'streaming_stt', 'inference', 'tts'
  usage: number;
  unit: UsageUnit;
  unitCost: number; // Cost per unit (e.g., $0.014 per minute)
  totalCost: number; // usage * unitCost
  metadata?: Record<string, any>; // e.g., { model: 'llama3.1-8b', voice_id: '...' }
}

export interface ApiCostBreakdown {
  twilio: ApiServiceUsage[];
  deepgram: ApiServiceUsage[];
  cerebras: ApiServiceUsage[];
  elevenlabs: ApiServiceUsage[];
  subtotal: number; // Sum of all API costs
}

// ----------------------------------------------------------------------------
// Monthly Infrastructure Costs (Amortized)
// ----------------------------------------------------------------------------

export interface InfrastructureCost {
  service: InfraService;
  monthlyCost: number; // Fixed monthly cost
  estimatedCallsPerMonth: number; // For amortization calculation
  costPerCall: number; // monthlyCost / estimatedCallsPerMonth
  description: string; // e.g., "Raindrop Pro tier", "Vultr VPS 2GB"
  billingCycle: 'monthly' | 'annual' | 'pay_as_you_go';
}

export interface InfrastructureCostBreakdown {
  raindrop: InfrastructureCost;
  vultr: InfrastructureCost;
  vercel: InfrastructureCost;
  subtotal: number; // Sum of all per-call infrastructure costs
}

// ----------------------------------------------------------------------------
// Transaction-Based Costs (Payment Processing)
// ----------------------------------------------------------------------------

export interface TransactionCost {
  service: TransactionService;
  chargeAmount: number; // Amount charged to user (e.g., $4.99)
  feePercentage: number; // e.g., 0.029 for 2.9%
  feeFixed: number; // e.g., 0.30 for $0.30
  totalFee: number; // (chargeAmount * feePercentage) + feeFixed
  netRevenue: number; // chargeAmount - totalFee
}

export interface TransactionCostBreakdown {
  stripe: TransactionCost;
  subtotal: number; // Total transaction fees
}

// ----------------------------------------------------------------------------
// Complete Call Cost Breakdown
// ----------------------------------------------------------------------------

export interface CompleteCostBreakdown {
  callId: string;
  userId: string;
  personaId: string;
  duration_seconds: number;

  // Cost categories
  apiCosts: ApiCostBreakdown;
  infrastructureCosts: InfrastructureCostBreakdown;
  transactionCosts: TransactionCostBreakdown;

  // Totals
  totalApiCost: number; // Sum of all API costs
  totalInfrastructureCost: number; // Sum of all infrastructure costs (amortized)
  totalTransactionCost: number; // Sum of all transaction fees
  totalCost: number; // totalApiCost + totalInfrastructureCost + totalTransactionCost

  // Revenue & Profitability
  chargedToUser: number; // e.g., $4.99
  grossRevenue: number; // chargedToUser
  netRevenue: number; // chargedToUser - totalTransactionCost
  grossProfit: number; // netRevenue - (totalApiCost + totalInfrastructureCost)
  grossMargin: number; // grossProfit / grossRevenue (0-1)
  grossMarginPercent: string; // e.g., "82.47%"

  // Metadata
  createdAt: string;
  calculatedAt: string;
  estimated: boolean; // true if costs are estimated, false if reconciled with actual bills
}

// ----------------------------------------------------------------------------
// User Spending Summary (Period-based)
// ----------------------------------------------------------------------------

export interface UserSpendingSummary {
  userId: string;
  period: {
    start: string; // ISO timestamp
    end: string; // ISO timestamp
    label: string; // e.g., "Last 7 days", "November 2025"
  };

  // Call metrics
  totalCalls: number;
  totalDuration_seconds: number;
  averageDuration_seconds: number;

  // Cost metrics
  totalApiCost: number;
  totalInfrastructureCost: number;
  totalTransactionCost: number;
  totalCost: number;
  averageCostPerCall: number;

  // Revenue metrics
  totalCharged: number;
  totalNetRevenue: number;
  totalGrossProfit: number;
  averageMarginPercent: string;

  // Cost breakdown by service
  costByService: {
    twilio: number;
    deepgram: number;
    cerebras: number;
    elevenlabs: number;
    raindrop: number;
    vultr: number;
    vercel: number;
    stripe: number;
  };

  // Top persona usage
  topPersonas: Array<{
    personaId: string;
    calls: number;
    totalCost: number;
  }>;
}

// ----------------------------------------------------------------------------
// Aggregate Analytics (All Users)
// ----------------------------------------------------------------------------

export interface AggregateAnalytics {
  period: {
    start: string;
    end: string;
    label: string;
  };

  // User metrics
  totalUsers: number;
  activeUsers: number; // Users who made at least one call
  newUsers: number; // Users who made their first call in this period

  // Call metrics
  totalCalls: number;
  totalDuration_seconds: number;
  averageDuration_seconds: number;
  averageCallsPerUser: number;

  // Financial metrics
  totalRevenue: number; // Charged to users
  totalCost: number; // All costs
  totalProfit: number;
  profitMarginPercent: string;

  // Cost breakdown
  costBreakdown: {
    apiCosts: number;
    infrastructureCosts: number;
    transactionCosts: number;
  };

  // Service-specific costs
  costByService: {
    twilio: number;
    deepgram: number;
    cerebras: number;
    elevenlabs: number;
    raindrop: number;
    vultr: number;
    vercel: number;
    stripe: number;
  };

  // Cost optimization insights
  insights: {
    largestCostComponent: string; // e.g., "elevenlabs"
    largestCostComponentPercent: string;
    recommendations: string[]; // e.g., ["Optimize ElevenLabs usage", "Consider volume discounts"]
  };
}

// ----------------------------------------------------------------------------
// Budget Tracking
// ----------------------------------------------------------------------------

export interface UserBudget {
  userId: string;
  dailyLimit_usd: number | null;
  monthlyLimit_usd: number | null;
  alertThreshold_percent: number; // e.g., 80 for 80%
  currentDailySpend: number;
  currentMonthlySpend: number;
  dailyRemaining: number | null;
  monthlyRemaining: number | null;
  alertTriggered: boolean;
}

export interface BudgetAlert {
  userId: string;
  type: 'daily' | 'monthly';
  threshold_percent: number;
  limit_usd: number;
  current_spend: number;
  remaining: number;
  message: string;
  triggeredAt: string;
}

// ----------------------------------------------------------------------------
// Cost Forecasting
// ----------------------------------------------------------------------------

export interface CostForecast {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';

  // Historical data
  historicalCalls: number;
  historicalCost: number;
  historicalRevenue: number;

  // Forecast
  forecastedCalls: number;
  forecastedCost: number;
  forecastedRevenue: number;
  forecastedProfit: number;

  // Confidence
  confidence: number; // 0-1, based on data availability
  basedOnDays: number; // How many days of historical data used

  // Warnings
  warnings: string[]; // e.g., ["Insufficient historical data", "High variance in usage"]
}

// ----------------------------------------------------------------------------
// Request/Response Types
// ----------------------------------------------------------------------------

export interface GetCallCostRequest {
  callId: string;
}

export interface GetCallCostResponse {
  success: boolean;
  data?: CompleteCostBreakdown;
  error?: string;
}

export interface GetUserSpendingRequest {
  userId: string;
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string; // ISO timestamp
  endDate?: string; // ISO timestamp
}

export interface GetUserSpendingResponse {
  success: boolean;
  data?: UserSpendingSummary;
  error?: string;
}

export interface GetAggregateAnalyticsRequest {
  period?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface GetAggregateAnalyticsResponse {
  success: boolean;
  data?: AggregateAnalytics;
  error?: string;
}

export interface GetUserBudgetRequest {
  userId: string;
}

export interface GetUserBudgetResponse {
  success: boolean;
  data?: UserBudget;
  alerts?: BudgetAlert[];
  error?: string;
}

export interface GetCostForecastRequest {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface GetCostForecastResponse {
  success: boolean;
  data?: CostForecast;
  error?: string;
}

// ----------------------------------------------------------------------------
// Internal Service Interfaces
// ----------------------------------------------------------------------------

export interface LogQueryServiceClient {
  getCallUsage(callId: string): Promise<CompleteCostBreakdown>;
  calculateCosts(callId: string, userId: string): Promise<void>;
}

export interface PricingConstants {
  api: {
    twilio: { per_minute: number };
    deepgram: { per_minute: number };
    cerebras: { per_token: number };
    elevenlabs: { per_character: number };
  };
  infrastructure: {
    raindrop: { monthly: number; estimated_calls: number };
    vultr: { monthly: number; estimated_calls: number };
    vercel: { monthly: number; estimated_calls: number };
  };
  transaction: {
    stripe: { percentage: number; fixed: number };
  };
  pricing: {
    default_call_price: number; // e.g., 4.99
  };
}
