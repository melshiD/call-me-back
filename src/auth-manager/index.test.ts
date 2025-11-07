import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthManager from './index';
import type { Env } from './raindrop.gen';

describe('AuthManager Service', () => {
  let authManager: AuthManager;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      CALL_ME_BACK_DB: {
        executeQuery: vi.fn(),
      },
      JWT_SECRET: 'test-secret-key',
    } as any;

    authManager = new AuthManager({ waitUntil: vi.fn() } as any, mockEnv);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        phone: '+15551234567',
      };

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([]) }) // Check existing user
        .mockResolvedValueOnce({ results: JSON.stringify([{ id: 'user-123', ...registerData }]) }); // Insert user

      const result = await authManager.register(registerData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerData.email);
    });

    it('should reject registration with duplicate email', async () => {
      const registerData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        phone: '+15551234567',
      };

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([{ id: 'existing-user' }]) }); // User exists

      await expect(authManager.register(registerData)).rejects.toThrow();
    });

    it('should reject weak passwords', async () => {
      const registerData = {
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User',
        phone: '+15551234567',
      };

      await expect(authManager.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({
          results: JSON.stringify([{
            id: 'user-123',
            email: loginData.email,
            password_hash: 'hashed-password',
            name: 'Test User',
            phone: '+15551234567',
          }]),
        });

      const result = await authManager.login(loginData);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(loginData.email);
    });

    it('should reject login with invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([]) }); // User not found

      await expect(authManager.login(loginData)).rejects.toThrow();
    });

    it('should reject login with wrong password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({
          results: JSON.stringify([{
            id: 'user-123',
            email: loginData.email,
            password_hash: 'different-hash',
          }]),
        });

      await expect(authManager.login(loginData)).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate a valid non-blacklisted token', async () => {
      // Generate a real valid token for this test
      const testSecret = 'test-secret-key';
      const encoder = new TextEncoder();
      const secretKey = encoder.encode(testSecret);
      const jose = await import('jose');

      const validToken = await new jose.SignJWT({
        userId: 'test-user-123',
        email: 'test@example.com',
        tokenId: 'token-123'
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(secretKey);

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([]) }); // Not blacklisted

      const result = await authManager.validateToken(validToken);

      expect(result.valid).toBe(true);
      expect(result.userId).toBeDefined();
    });

    it('should reject blacklisted tokens', async () => {
      const blacklistedToken = 'blacklisted.jwt.token';

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([{ token_id: 'token-123' }]) }); // Found in blacklist

      const result = await authManager.validateToken(blacklistedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'expired.jwt.token';

      const result = await authManager.validateToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject malformed tokens', async () => {
      const malformedToken = 'not-a-valid-token';

      const result = await authManager.validateToken(malformedToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should successfully blacklist a valid token', async () => {
      const token = 'valid.jwt.token';

      mockEnv.CALL_ME_BACK_DB.executeQuery = vi.fn()
        .mockResolvedValueOnce({ results: JSON.stringify([]) }); // Insert into blacklist

      await expect(authManager.logout(token)).resolves.not.toThrow();
    });
  });
});
