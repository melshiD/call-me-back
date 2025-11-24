import { Service } from '@liquidmetal-ai/raindrop-framework';
import { Env } from './raindrop.gen';
import type { RegisterInput, LoginInput, AuthResponse, TokenValidationResult } from './interfaces';
import * as utils from './utils';

// WorkOS API response types
interface WorkOSUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
}

interface WorkOSAuthResponse {
  accessToken: string;
  user: WorkOSUser;
}

// WorkOS REST API client - Workers-compatible (uses fetch instead of Node.js http)
class WorkOSClient {
  private apiKey: string;
  private baseUrl = 'https://api.workos.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    emailVerified?: boolean;
  }): Promise<WorkOSUser> {
    const response = await fetch(`${this.baseUrl}/user_management/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        email_verified: data.emailVerified,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WorkOS createUser failed: ${error}`);
    }

    const result = await response.json() as any;
    return {
      id: result.id,
      email: result.email,
      firstName: result.first_name,
      lastName: result.last_name,
      emailVerified: result.email_verified || false,
    };
  }

  async authenticateWithPassword(data: {
    email: string;
    password: string;
    clientId: string;
  }): Promise<WorkOSAuthResponse> {
    const response = await fetch(`${this.baseUrl}/user_management/authenticate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        client_id: data.clientId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WorkOS authenticate failed: ${error}`);
    }

    const result = await response.json() as any;
    return {
      accessToken: result.access_token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.first_name,
        lastName: result.user.last_name,
        emailVerified: result.user.email_verified || false,
      },
    };
  }
}

export default class extends Service<Env> {
  async fetch(request: Request): Promise<Response> {
    return new Response('Not implemented', { status: 501 });
  }

  private getWorkOS(): WorkOSClient | null {
    if (!this.env.WORKOS_API_KEY) {
      return null;
    }
    return new WorkOSClient(this.env.WORKOS_API_KEY);
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    try {
      this.env.logger.info('User registration attempt', { email: input.email });

      // Validate password strength
      if (input.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const workos = this.getWorkOS();

      if (workos && this.env.WORKOS_CLIENT_ID) {
        // Use WorkOS for registration
        this.env.logger.info('Using WorkOS for registration', { email: input.email });

        try {
          // Create user in WorkOS
          const workosUser = await workos.createUser({
            email: input.email,
            password: input.password,
            firstName: input.name?.split(' ')[0] || '',
            lastName: input.name?.split(' ').slice(1).join(' ') || '',
            emailVerified: false
          });

          // Store user in our database with WorkOS ID
          const userId = workosUser.id;
          await this.env.DATABASE_PROXY.executeQuery(
            'INSERT INTO users (id, email, password_hash, name, phone) VALUES ($1, $2, $3, $4, $5)',
            [userId, input.email, 'workos', input.name, input.phone]
          );

          // Authenticate to get access token
          const authResponse = await workos.authenticateWithPassword({
            email: input.email,
            password: input.password,
            clientId: this.env.WORKOS_CLIENT_ID
          });

          this.env.logger.info('User registered with WorkOS', { userId, email: input.email });

          return {
            token: authResponse.accessToken,
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
        } catch (workosError) {
          this.env.logger.error('WorkOS registration failed, falling back to JWT', {
            error: workosError instanceof Error ? workosError.message : String(workosError)
          });
          // Fall through to JWT fallback
        }
      }

      // Fallback to JWT authentication if WorkOS not configured or failed
      this.env.logger.info('Using JWT fallback for registration', { email: input.email });

      // Check if user already exists
      const existingUser = await this.env.DATABASE_PROXY.executeQuery(
        'SELECT id FROM users WHERE email = $1',
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
      await this.env.DATABASE_PROXY.executeQuery(
        'INSERT INTO users (id, email, password_hash, name, phone) VALUES ($1, $2, $3, $4, $5)',
        [userId, input.email, passwordHash, input.name, input.phone]
      );

      // Generate JWT
      const token = await utils.generateToken(userId, input.email, this.env.JWT_SECRET);

      this.env.logger.info('User registered successfully with JWT', { userId, email: input.email });

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

      const workos = this.getWorkOS();

      if (workos && this.env.WORKOS_CLIENT_ID) {
        // Use WorkOS for login
        this.env.logger.info('Using WorkOS for login', { email: input.email });

        try {
          // Authenticate with WorkOS
          const authResponse = await workos.authenticateWithPassword({
            email: input.email,
            password: input.password,
            clientId: this.env.WORKOS_CLIENT_ID
          });

          // Get user from our database
          const result = await this.env.DATABASE_PROXY.executeQuery(
            'SELECT * FROM users WHERE id = $1',
            [authResponse.user.id]
          );

          let user: any;
          if (result.rows.length === 0) {
            // User doesn't exist in our DB, create them
            const userId = authResponse.user.id;
            await this.env.DATABASE_PROXY.executeQuery(
              'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
              [userId, authResponse.user.email, 'workos', authResponse.user.firstName || '']
            );
            user = {
              id: userId,
              email: authResponse.user.email,
              name: authResponse.user.firstName || '',
              phone: null,
              email_verified: authResponse.user.emailVerified,
              phone_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            user = result.rows[0];
          }

          this.env.logger.info('User logged in with WorkOS', { userId: user.id });

          return {
            token: authResponse.accessToken,
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
        } catch (workosError) {
          this.env.logger.error('WorkOS login failed, falling back to JWT', {
            error: workosError instanceof Error ? workosError.message : String(workosError)
          });
          // Fall through to JWT fallback
        }
      }

      // Fallback to JWT authentication
      this.env.logger.info('Using JWT fallback for login', { email: input.email });

      // Find user
      const result = await this.env.DATABASE_PROXY.executeQuery(
        'SELECT * FROM users WHERE email = $1',
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

      this.env.logger.info('User logged in successfully with JWT', { userId: user.id });

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
      // Both WorkOS access tokens and our JWT tokens are JWT format
      // So we can use the same validation logic
      const validation = await utils.validateToken(token, this.env.JWT_SECRET);

      if (!validation.valid) {
        return validation;
      }

      // Check if token is blacklisted (only for our JWT tokens, not WorkOS)
      if (validation.tokenId) {
        const isBlacklisted = await utils.isTokenBlacklisted(validation.tokenId, this.env.DATABASE_PROXY);

        if (isBlacklisted) {
          return {
            valid: false,
            error: 'Token is blacklisted',
          };
        }
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

        await utils.blacklistToken(validation.tokenId, validation.userId, expiresAt, this.env.DATABASE_PROXY);

        this.env.logger.info('User logged out', { userId: validation.userId });
      }
    } catch (error) {
      this.env.logger.error('Logout failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
