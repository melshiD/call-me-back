import { describe, it, expect, vi, beforeEach } from 'vitest';
import PersonaManager from './index';

describe('PersonaManager Service', () => {
  let personaManager: any;
  let mockEnv: any;

  beforeEach(() => {
    mockEnv = {
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      CALL_ME_BACK_DB: { executeQuery: vi.fn() },
    } as any;
    personaManager = new PersonaManager(mockEnv, {} as any);
  });

  it('should get all personas', async () => {
    await expect(personaManager.getPersonas()).resolves.toBeDefined();
  });

  it('should create a persona', async () => {
    await expect(personaManager.createPersona({ name: 'Test', description: 'Test persona', voice: 'voice-1', systemPrompt: 'You are helpful' })).resolves.toBeDefined();
  });

  it('should add a contact', async () => {
    await expect(personaManager.addContact({ userId: 'user-123', personaId: 'persona-1' })).resolves.toBeDefined();
  });
});
