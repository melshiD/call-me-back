import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)

  /**
   * Login user
   *
   * API ENDPOINT: POST /api/auth/login
   *
   * AUTHENTICATION: None (public endpoint)
   *
   * RATE LIMITING: 5 requests per minute per IP
   *
   * HEADERS:
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     email: string (required, must be valid email format),
   *     password: string (required, min 8 characters)
   *   }
   *
   * INPUT VALIDATION:
   *   - email: Must be valid email format, max 255 characters, trimmed
   *   - password: Required, no character limit on login (only on registration)
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     user: {
   *       id: string (UUID),
   *       email: string,
   *       name: string,
   *       phone: string (E.164 format),
   *       created_at: string (ISO 8601)
   *     },
   *     token: string (JWT token, expires in 30 days)
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Missing required fields: email, password" }
   *     { error: "VALIDATION_ERROR", message: "Invalid email format" }
   *
   *   401 Unauthorized:
   *     { error: "INVALID_CREDENTIALS", message: "Invalid email or password" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many login attempts. Try again in 60 seconds", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "An unexpected error occurred. Please try again later" }
   *
   *   503 Service Unavailable:
   *     { error: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" }
   *
   * SECURITY NOTES:
   *   - Password should be hashed using bcrypt with cost factor 12+
   *   - Failed login attempts should not reveal whether email exists
   *   - Implement account lockout after 10 failed attempts (30 minute lockout)
   *   - JWT should include: user_id, issued_at, expires_at
   *   - HTTPS required in production
   */
  const login = async (email, password) => {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()

      user.value = data.user
      token.value = data.token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      return data
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Register new user
   *
   * API ENDPOINT: POST /api/auth/register
   *
   * AUTHENTICATION: None (public endpoint)
   *
   * RATE LIMITING: 3 requests per hour per IP
   *
   * HEADERS:
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     name: string (required),
   *     email: string (required, must be unique),
   *     password: string (required),
   *     phone: string (required, E.164 format)
   *   }
   *
   * INPUT VALIDATION:
   *   - name: Required, 1-100 characters, trimmed, no special characters except spaces, hyphens, apostrophes
   *   - email: Required, valid email format, max 255 characters, trimmed, lowercase, must be unique
   *   - password: Required, min 8 characters, max 128 characters, must contain at least:
   *       * 1 uppercase letter
   *       * 1 lowercase letter
   *       * 1 number
   *       * 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
   *   - phone: Required, E.164 format (starts with +, 10-15 digits), must be valid phone number
   *
   * EXPECTED RESPONSE (201 Created):
   *   {
   *     user: {
   *       id: string (UUID),
   *       email: string,
   *       name: string,
   *       phone: string (E.164 format),
   *       created_at: string (ISO 8601)
   *     },
   *     token: string (JWT token, expires in 30 days)
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Missing required fields: name, email, password, phone" }
   *     { error: "VALIDATION_ERROR", message: "Invalid email format" }
   *     { error: "VALIDATION_ERROR", message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character" }
   *     { error: "VALIDATION_ERROR", message: "Invalid phone format. Use E.164 format (e.g., +1234567890)" }
   *     { error: "VALIDATION_ERROR", message: "Name must be between 1-100 characters" }
   *
   *   409 Conflict:
   *     { error: "EMAIL_EXISTS", message: "An account with this email already exists" }
   *     { error: "PHONE_EXISTS", message: "An account with this phone number already exists" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many registration attempts. Try again in 1 hour", retry_after: 3600 }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to create account. Please try again later" }
   *
   *   503 Service Unavailable:
   *     { error: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" }
   *
   * SECURITY NOTES:
   *   - Password must be hashed using bcrypt with cost factor 12+
   *   - Email verification should be sent after registration (optional for MVP)
   *   - Phone verification may be required before making calls
   *   - Store phone numbers in normalized E.164 format
   *   - Sanitize name input to prevent XSS
   *   - Implement email verification flow for production
   */
  const register = async (name, email, password, phone) => {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Registration failed')
      }

      const data = await response.json()

      user.value = data.user
      token.value = data.token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      return data
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Logout user
   *
   * API ENDPOINT: POST /api/auth/logout
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 10 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * REQUEST BODY: None
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     message: "Logged out successfully"
   *   }
   *
   * ERROR RESPONSES:
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *     { error: "INVALID_TOKEN", message: "Invalid or expired token" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Logout failed. Please try again" }
   *
   * IMPLEMENTATION NOTES:
   *   - Token should be added to blacklist/revocation list
   *   - Client should clear token from localStorage
   *   - Optional: Invalidate all refresh tokens for this user
   *   - Optional: Log logout event for security auditing
   */
  const logout = () => {
    // Mock implementation - replace with actual API call
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /**
   * Check authentication status and restore session
   *
   * API ENDPOINT: GET /api/auth/me
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 30 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     user: {
   *       id: string (UUID),
   *       email: string,
   *       name: string,
   *       phone: string (E.164 format),
   *       created_at: string (ISO 8601),
   *       email_verified: boolean,
   *       phone_verified: boolean
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *     { error: "INVALID_TOKEN", message: "Invalid or expired token" }
   *     { error: "TOKEN_REVOKED", message: "Token has been revoked" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to fetch user data" }
   *
   * IMPLEMENTATION NOTES:
   *   - Called on app initialization to restore user session
   *   - Should verify token signature and expiration
   *   - Check if token is in revocation list
   *   - Return fresh user data from database (not from token)
   *   - Client should clear session if 401 is returned
   */
  const checkAuth = async () => {
    if (token.value) {
      // Mock implementation - replace with actual API call
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
    }
  }

  // Initialize auth state from localStorage
  checkAuth()

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth
  }
})
