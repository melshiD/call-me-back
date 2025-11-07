import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { RegisterInput, LoginInput, AuthResponse, TokenValidationResult } from './interfaces';
import * as utils from './utils';
import { executeSQL } from '../shared/db-helpers';

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    try {
      this.env.logger.info('User registration attempt', { email: input.email });

      // Validate password strength
      if (input.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Check if user already exists
      const existingUser = await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'SELECT id FROM users WHERE email = ?',
        [input.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }

      // Hash password
      const passwordHash = await utils.hashPassword(input.password);

      // Generate user ID
      const userId = crypto.randomUUID();

      // Insert user
      await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'INSERT INTO users (id, email, password_hash, name, phone) VALUES (?, ?, ?, ?, ?)',
        [userId, input.email, passwordHash, input.name, input.phone]
      );

      // Generate JWT
      const token = await utils.generateToken(userId, input.email, this.env.JWT_SECRET);

      this.env.logger.info('User registered successfully', { userId, email: input.email });

      return {
        token,
        user: {
          id: userId,
          email: input.email,
          name: input.name,
          phone: input.phone,
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.env.logger.error('Registration failed', { error: error instanceof Error ? error.message : String(error), email: input.email });
      throw error;
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    try {
      this.env.logger.info('User login attempt', { email: input.email });

      // Find user
      const result = await executeSQL(
        this.env.CALL_ME_BACK_DB,
        'SELECT * FROM users WHERE email = ?',
        [input.email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0] as any;

      // Verify password
      const isValid = await utils.verifyPassword(input.password, user.password_hash);

      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT
      const token = await utils.generateToken(user.id, user.email, this.env.JWT_SECRET);

      this.env.logger.info('User logged in successfully', { userId: user.id });

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          emailVerified: Boolean(user.email_verified),
          phoneVerified: Boolean(user.phone_verified),
          stripeCustomerId: user.stripe_customer_id,
          defaultPaymentMethod: user.default_payment_method,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      };
    } catch (error) {
      this.env.logger.error('Login failed', { error: error instanceof Error ? error.message : String(error), email: input.email });
      throw error;
    }
  }

  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      const validation = await utils.validateToken(token, this.env.JWT_SECRET);

      if (!validation.valid) {
        return validation;
      }

      // Check if token is blacklisted
      const isBlacklisted = await utils.isTokenBlacklisted(validation.tokenId!, this.env.CALL_ME_BACK_DB);

      if (isBlacklisted) {
        return {
          valid: false,
          error: 'Token is blacklisted',
        };
      }

      return validation;
    } catch (error) {
      this.env.logger.error('Token validation failed', { error: error instanceof Error ? error.message : String(error) });
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Token validation failed',
      };
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const validation = await utils.validateToken(token, this.env.JWT_SECRET);

      if (validation.valid && validation.tokenId && validation.userId) {
        // Calculate expiration (30 days from now)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await utils.blacklistToken(validation.tokenId, validation.userId, expiresAt, this.env.CALL_ME_BACK_DB);

        this.env.logger.info('User logged out', { userId: validation.userId });
      }
    } catch (error) {
      this.env.logger.error('Logout failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
