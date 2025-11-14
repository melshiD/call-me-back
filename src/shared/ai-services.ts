/**
 * AI Services Integration
 *
 * Unified interface for LLM services (Cerebras, OpenAI)
 */

export interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface LLMResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  latencyMs: number;
}

export interface LLMServiceConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  defaultMaxTokens: number;
  defaultTemperature: number;
  timeoutMs: number;
}

/**
 * Cerebras LLM Service
 */
export class CerebrasService {
  private config: LLMServiceConfig;

  constructor(config: Partial<LLMServiceConfig> = {}) {
    this.config = {
      apiKey: process.env.CEREBRAS_API_KEY || '',
      apiUrl: process.env.CEREBRAS_API_URL || 'https://api.cerebras.ai/v1/chat/completions',
      model: config.model || process.env.CEREBRAS_MODEL || 'llama3.1-8b',
      defaultMaxTokens: config.defaultMaxTokens || 150,
      defaultTemperature: config.defaultTemperature || 0.7,
      timeoutMs: config.timeoutMs || 5000,
      ...config
    };
  }

  /**
   * Generate completion
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await this.callAPI(request);
      const latencyMs = Date.now() - startTime;

      return {
        text: response.choices[0].message.content,
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        model: response.model,
        latencyMs
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      console.error('[CerebrasService] API call failed:', error);
      throw new Error(`Cerebras API error: ${error}`);
    }
  }

  /**
   * Call Cerebras API
   */
  private async callAPI(request: LLMRequest): Promise<any> {
    const messages = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt
    });

    const body: Record<string, any> = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.defaultMaxTokens,
      temperature: request.temperature !== undefined ? request.temperature : this.config.defaultTemperature,
      stream: false
    };

    // Add stop sequences if provided
    if (request.stopSequences && request.stopSequences.length > 0) {
      body['stop'] = request.stopSequences;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Quick single-word evaluation (optimized for turn-taking)
   */
  async quickEval(prompt: string, maxTokens: number = 10): Promise<string> {
    const response = await this.complete({
      prompt,
      maxTokens,
      temperature: 0.3, // Low temperature for consistent decisions
      stopSequences: ['\n', '.', ','] // Stop after single word
    });

    return response.text.trim();
  }
}

/**
 * OpenAI LLM Service (fallback)
 */
export class OpenAIService {
  private config: LLMServiceConfig;

  constructor(config: Partial<LLMServiceConfig> = {}) {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      apiUrl: 'https://api.openai.com/v1/chat/completions',
      model: config.model || process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      defaultMaxTokens: config.defaultMaxTokens || 150,
      defaultTemperature: config.defaultTemperature || 0.7,
      timeoutMs: config.timeoutMs || 10000,
      ...config
    };
  }

  /**
   * Generate completion
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const response = await this.callAPI(request);
      const latencyMs = Date.now() - startTime;

      return {
        text: response.choices[0].message.content,
        usage: {
          inputTokens: response.usage.prompt_tokens,
          outputTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        },
        model: response.model,
        latencyMs
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      console.error('[OpenAIService] API call failed:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }
  }

  /**
   * Call OpenAI API
   */
  private async callAPI(request: LLMRequest): Promise<any> {
    const messages = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt
    });

    const body: Record<string, any> = {
      model: this.config.model,
      messages,
      max_tokens: request.maxTokens || this.config.defaultMaxTokens,
      temperature: request.temperature !== undefined ? request.temperature : this.config.defaultTemperature
    };

    if (request.stopSequences && request.stopSequences.length > 0) {
      body['stop'] = request.stopSequences;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Quick single-word evaluation
   */
  async quickEval(prompt: string, maxTokens: number = 10): Promise<string> {
    const response = await this.complete({
      prompt,
      maxTokens,
      temperature: 0.3,
      stopSequences: ['\n', '.', ',']
    });

    return response.text.trim();
  }
}

/**
 * LLM Service Factory
 */
export class LLMServiceFactory {
  private static cerebrasInstance: CerebrasService | null = null;
  private static openaiInstance: OpenAIService | null = null;

  /**
   * Get Cerebras service instance (singleton)
   */
  static getCerebras(config?: Partial<LLMServiceConfig>): CerebrasService {
    if (!this.cerebrasInstance) {
      this.cerebrasInstance = new CerebrasService(config);
    }
    return this.cerebrasInstance;
  }

  /**
   * Get OpenAI service instance (singleton)
   */
  static getOpenAI(config?: Partial<LLMServiceConfig>): OpenAIService {
    if (!this.openaiInstance) {
      this.openaiInstance = new OpenAIService(config);
    }
    return this.openaiInstance;
  }

  /**
   * Get service by provider name
   */
  static getService(provider: 'cerebras' | 'openai', config?: Partial<LLMServiceConfig>): CerebrasService | OpenAIService {
    return provider === 'cerebras'
      ? this.getCerebras(config)
      : this.getOpenAI(config);
  }
}
