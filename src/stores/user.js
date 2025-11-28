import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const billingInfo = ref(null)
  const usageStats = ref(null)

  // Mock data
  const mockBillingInfo = {
    payment_methods: [
      {
        id: 'pm_1',
        type: 'card',
        last4: '4242',
        brand: 'visa',
        exp_month: 12,
        exp_year: 2025,
        is_default: true
      }
    ],
    balance: 0,
    currency: 'usd'
  }

  const mockUsageStats = {
    total_calls: 47,
    total_minutes: 142,
    total_spent: 67.45,
    current_month: {
      calls: 12,
      minutes: 38,
      spent: 16.75
    },
    monthly_breakdown: [
      { month: 'Nov 2024', calls: 12, minutes: 38, spent: 16.75 },
      { month: 'Oct 2024', calls: 15, minutes: 45, spent: 19.25 },
      { month: 'Sep 2024', calls: 20, minutes: 59, spent: 31.45 }
    ]
  }

  billingInfo.value = mockBillingInfo
  usageStats.value = mockUsageStats

  /**
   * Fetch billing information
   * API ENDPOINT: GET /api/user/billing
   * Headers:
   *   Authorization: Bearer <token>
   * Expected Response (200):
   *   {
   *     payment_methods: [
   *       {
   *         id: string (Stripe PaymentMethod ID),
   *         type: 'card',
   *         last4: string,
   *         brand: string (visa, mastercard, etc.),
   *         exp_month: number,
   *         exp_year: number,
   *         is_default: boolean
   *       }
   *     ],
   *     balance: number (account balance in cents),
   *     currency: string (ISO currency code)
   *   }
   * Error Response (401):
   *   {
   *     error: string,
   *     message: "Unauthorized"
   *   }
   */
  const fetchBillingInfo = async () => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ billing: mockBillingInfo })
      }, 300)
    })
  }

  /**
   * Add payment method
   * API ENDPOINT: POST /api/user/payment-method
   * Headers:
   *   Authorization: Bearer <token>
   *   Content-Type: application/json
   * Request Body:
   *   {
   *     payment_method_id: string (Stripe PaymentMethod ID from client-side),
   *     set_as_default: boolean (optional)
   *   }
   * Expected Response (201):
   *   {
   *     payment_method: {
   *       id: string,
   *       type: 'card',
   *       last4: string,
   *       brand: string,
   *       exp_month: number,
   *       exp_year: number,
   *       is_default: boolean
   *     }
   *   }
   * Error Response (400):
   *   {
   *     error: string,
   *     message: "Invalid payment method"
   *   }
   */
  const addPaymentMethod = async (paymentMethodId, setAsDefault = false) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const newMethod = {
          id: paymentMethodId,
          type: 'card',
          last4: '1234',
          brand: 'visa',
          exp_month: 12,
          exp_year: 2026,
          is_default: setAsDefault
        }
        if (setAsDefault) {
          billingInfo.value.payment_methods.forEach(pm => pm.is_default = false)
        }
        billingInfo.value.payment_methods.push(newMethod)
        resolve({ payment_method: newMethod })
      }, 500)
    })
  }

  /**
   * Remove payment method
   * API ENDPOINT: DELETE /api/user/payment-method/:id
   * Headers:
   *   Authorization: Bearer <token>
   * Expected Response (200):
   *   {
   *     message: "Payment method removed"
   *   }
   * Error Response (400):
   *   {
   *     error: string,
   *     message: "Cannot remove default payment method" | "Payment method not found"
   *   }
   */
  const removePaymentMethod = async (paymentMethodId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        billingInfo.value.payment_methods = billingInfo.value.payment_methods.filter(
          pm => pm.id !== paymentMethodId
        )
        resolve({ message: 'Payment method removed' })
      }, 300)
    })
  }

  /**
   * Set default payment method
   * API ENDPOINT: PUT /api/user/payment-method/:id/default
   * Headers:
   *   Authorization: Bearer <token>
   * Expected Response (200):
   *   {
   *     message: "Default payment method updated"
   *   }
   * Error Response (404):
   *   {
   *     error: string,
   *     message: "Payment method not found"
   *   }
   */
  const setDefaultPaymentMethod = async (paymentMethodId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        billingInfo.value.payment_methods.forEach(pm => {
          pm.is_default = pm.id === paymentMethodId
        })
        resolve({ message: 'Default payment method updated' })
      }, 300)
    })
  }

  /**
   * Fetch usage statistics
   * API ENDPOINT: GET /api/user/usage
   * Headers:
   *   Authorization: Bearer <token>
   * Query Parameters:
   *   months: number (default: 3, number of months to include in breakdown)
   * Expected Response (200):
   *   {
   *     total_calls: number,
   *     total_minutes: number,
   *     total_spent: number (dollars),
   *     current_month: {
   *       calls: number,
   *       minutes: number,
   *       spent: number (dollars)
   *     },
   *     monthly_breakdown: [
   *       {
   *         month: string (e.g., "Nov 2024"),
   *         calls: number,
   *         minutes: number,
   *         spent: number (dollars)
   *       }
   *     ]
   *   }
   * Error Response (401):
   *   {
   *     error: string,
   *     message: "Unauthorized"
   *   }
   */
  const fetchUsageStats = async (months = 3) => {
    const apiUrl = import.meta.env.VITE_API_URL
    const token = localStorage.getItem('token')

    if (!token) {
      // Return mock data if not authenticated
      return { usage: mockUsageStats }
    }

    try {
      const response = await fetch(`${apiUrl}/api/user/usage?months=${months}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch usage stats: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        usageStats.value = data.usage
        return { usage: data.usage }
      } else {
        throw new Error(data.error || 'Failed to fetch usage statistics')
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
      // Fall back to mock data on error
      return { usage: mockUsageStats }
    }
  }

  /**
   * Create Stripe PaymentIntent for pre-authorization
   *
   * API ENDPOINT: POST /api/user/create-payment-intent
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   * RATE LIMITING: 10 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     estimated_duration: number (required, estimated call duration in minutes, 1-30)
   *   }
   *
   * INPUT VALIDATION:
   *   - estimated_duration: Required, integer, min 1, max 30 minutes
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     payment_intent_id: string (Stripe PaymentIntent ID),
   *     client_secret: string (for client-side confirmation, if needed),
   *     amount: number (pre-auth amount in cents),
   *     currency: string (ISO currency code, e.g., 'usd')
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "estimated_duration must be between 1-30 minutes" }
   *     { error: "NO_PAYMENT_METHOD", message: "No payment method on file. Please add a payment method" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   402 Payment Required:
   *     { error: "PAYMENT_FAILED", message: "Failed to authorize payment" }
   *     { error: "CARD_DECLINED", message: "Your card was declined" }
   *     { error: "INSUFFICIENT_FUNDS", message: "Insufficient funds" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many payment requests", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "STRIPE_ERROR", message: "Payment service error" }
   *     { error: "SERVER_ERROR", message: "Failed to create payment intent" }
   *
   * IMPLEMENTATION NOTES:
   *   - Calculate amount: $0.25 (connection fee) + ($0.40 × estimated_duration)
   *   - Create Stripe PaymentIntent with capture_method='manual'
   *   - Use user's default payment method
   *   - Store payment_intent_id with call record
   *   - Capture actual amount after call completes based on real duration
   *   - If call is shorter, capture partial amount and release rest
   *   - If call is longer, may need to create additional charge
   *   - Set metadata: user_id, call_type, estimated_duration
   */
  const createPaymentIntent = async (estimatedDuration = 5) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Connection fee ($0.25) + per-minute rate ($0.40 * estimated minutes)
        const amount = 25 + (40 * estimatedDuration) // in cents
        resolve({
          payment_intent_id: 'pi_' + Math.random().toString(36).substr(2, 9),
          client_secret: 'pi_secret_' + Math.random().toString(36).substr(2, 9),
          amount: amount
        })
      }, 500)
    })
  }

  /**
   * Update user profile
   * API ENDPOINT: PUT /api/user/profile
   * Headers:
   *   Authorization: Bearer <token>
   *   Content-Type: application/json
   * Request Body: (all fields optional)
   *   {
   *     name: string,
   *     phone: string (E.164 format),
   *     email: string
   *   }
   * Expected Response (200):
   *   {
   *     user: {
   *       id: string,
   *       name: string,
   *       email: string,
   *       phone: string,
   *       updated_at: string (ISO 8601)
   *     }
   *   }
   * Error Response (400):
   *   {
   *     error: string,
   *     message: "Invalid email format" | "Invalid phone format" | "Email already exists"
   *   }
   */
  const updateProfile = async (updates) => {
    // Mock implementation - this would update the auth store user as well
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ user: { id: '1', ...updates, updated_at: new Date().toISOString() } })
      }, 500)
    })
  }

  return {
    billingInfo,
    usageStats,
    fetchBillingInfo,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod,
    fetchUsageStats,
    createPaymentIntent,
    updateProfile
  }
})
