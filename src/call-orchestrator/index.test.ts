import { describe, it, expect, vi, beforeEach } from 'vitest';
import CallOrchestrator from './index';

describe('CallOrchestrator Service', () => {
  let callOrchestrator: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      CALL_ME_BACK_DB: { executeQuery: vi.fn() },
    } as any;
    callOrchestrator = new CallOrchestrator(mockEnv, {} as any);
  });

  it('should initiate a call successfully', async () => {
    await expect(callOrchestrator.initiateCall({ userId: 'user-123', personaId: 'persona-1', phoneNumber: '+15551234567' })).resolves.toBeDefined();
  });

  it('should schedule a call successfully', async () => {
    await expect(callOrchestrator.scheduleCall({ userId: 'user-123', personaId: 'persona-1', phoneNumber: '+15551234567', scheduledTime: '2025-01-01T12:00:00Z' })).resolves.toBeDefined();
  });
});
