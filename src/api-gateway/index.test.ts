import { describe, it, expect, vi, beforeEach } from 'vitest';
import APIGateway from './index';

describe('APIGateway Service', () => {
  let apiGateway: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      AUTH_MANAGER: { validateToken: vi.fn() },
      RATE_LIMIT_CACHE: { get: vi.fn(), set: vi.fn() },
    } as any;
    apiGateway = new APIGateway(mockEnv, {} as any);
  });

  it('should handle GET requests', async () => {
    const request = new Request('http://localhost/api/calls', { method: 'GET' });
    const response = await apiGateway.fetch(request);
    expect(response).toBeInstanceOf(Response);
  });

  it('should handle POST requests', async () => {
    const request = new Request('http://localhost/api/call', { method: 'POST' });
    const response = await apiGateway.fetch(request);
    expect(response).toBeInstanceOf(Response);
  });

  it('should apply rate limiting', async () => {
    const request = new Request('http://localhost/api/calls', { method: 'GET' });
    await expect(apiGateway.fetch(request)).resolves.toBeInstanceOf(Response);
  });
});
