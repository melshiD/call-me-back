import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoicePipeline from './index';

describe('VoicePipeline Service', () => {
  let voicePipeline: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    } as any;
    voicePipeline = new VoicePipeline(mockEnv, {} as any);
  });

  it('should handle WebSocket connections', async () => {
    await expect(voicePipeline.handleConnection({} as any)).resolves.toBeDefined();
  });

  it('should process audio chunks', async () => {
    await expect(voicePipeline.processAudio(Buffer.from('test'))).resolves.toBeDefined();
  });
});
