import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCallsStore = defineStore('calls', () => {
  const calls = ref([])
  const scheduledCalls = ref([])

  // Mock data for development
  const mockCalls = [
    {
      id: '1',
      persona_id: 'friend',
      persona_name: 'Best Friend',
      status: 'completed',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() - 3300000).toISOString(),
      duration: 300,
      cost: 2.25,
      sid: 'CA1234567890abcdef'
    },
    {
      id: '2',
      persona_id: 'manager',
      persona_name: 'Boss',
      status: 'completed',
      start_time: new Date(Date.now() - 86400000).toISOString(),
      end_time: new Date(Date.now() - 86100000).toISOString(),
      duration: 180,
      cost: 1.45,
      sid: 'CA0987654321fedcba'
    }
  ]

  const mockScheduledCalls = [
    {
      id: 's1',
      persona_id: 'agent',
      persona_name: 'Talent Agent',
      scheduled_time: new Date(Date.now() + 7200000).toISOString(),
      status: 'scheduled',
      phone_number: '+1234567890'
    }
  ]

  calls.value = mockCalls
  scheduledCalls.value = mockScheduledCalls

  /**
   * Fetch user's call history
   *
   * API ENDPOINT: GET /api/calls
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 60 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * QUERY PARAMETERS:
   *   page: number (default: 1, min: 1)
   *   limit: number (default: 20, min: 1, max: 100)
   *   status: string (optional: 'completed' | 'failed' | 'in-progress' | 'initiated')
   *   sort: string (optional: 'date_desc' | 'date_asc' | 'cost_desc' | 'cost_asc', default: 'date_desc')
   *   from_date: string (optional, ISO 8601 date)
   *   to_date: string (optional, ISO 8601 date)
   *
   * EXAMPLE: GET /api/calls?page=1&limit=20&status=completed&sort=date_desc
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     calls: [
   *       {
   *         id: string (UUID),
   *         user_id: string (UUID),
   *         persona_id: string,
   *         persona_name: string,
   *         status: 'completed' | 'failed' | 'in-progress' | 'initiated',
   *         start_time: string (ISO 8601),
   *         end_time: string (ISO 8601, null if not ended),
   *         duration: number (seconds, null if not ended),
   *         cost: number (dollars, null if not ended),
   *         sid: string (Twilio call SID),
   *         transcript: string (optional, null if not available),
   *         error_message: string (optional, only if failed)
   *       }
   *     ],
   *     pagination: {
   *       page: number,
   *       limit: number,
   *       total: number,
   *       pages: number
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Invalid page number" }
   *     { error: "VALIDATION_ERROR", message: "Limit must be between 1 and 100" }
   *     { error: "VALIDATION_ERROR", message: "Invalid status value" }
   *     { error: "VALIDATION_ERROR", message: "Invalid date format" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *     { error: "INVALID_TOKEN", message: "Invalid or expired token" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to fetch call history" }
   *
   * IMPLEMENTATION NOTES:
   *   - Only return calls belonging to the authenticated user
   *   - Implement cursor-based pagination for better performance with large datasets
   *   - Cache responses for 30 seconds
   *   - Index database on user_id, status, and start_time
   */
  const fetchCalls = async (page = 1, limit = 20) => {
    // Mock implementation - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          calls: mockCalls,
          pagination: { page, limit, total: mockCalls.length, pages: 1 }
        })
      }, 300)
    })
  }

  /**
   * Trigger immediate call
   *
   * API ENDPOINT: POST /api/call
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 5 requests per minute per user (to prevent abuse)
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     phone_number: string (required, E.164 format),
   *     persona_id: string (required),
   *     payment_intent_id: string (required, Stripe PaymentIntent ID)
   *   }
   *
   * INPUT VALIDATION:
   *   - phone_number: Must be E.164 format, 10-15 digits with + prefix
   *   - persona_id: Must exist in database, user must have access to persona
   *   - payment_intent_id: Must be valid Stripe PaymentIntent, must be in 'requires_capture' status
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     call: {
   *       id: string (UUID),
   *       sid: string (Twilio call SID),
   *       status: 'initiated',
   *       persona_id: string,
   *       phone_number: string (E.164 format),
   *       created_at: string (ISO 8601),
   *       estimated_cost: number (dollars)
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Invalid phone number format. Use E.164 format (e.g., +1234567890)" }
   *     { error: "VALIDATION_ERROR", message: "Missing required fields" }
   *     { error: "INVALID_PERSONA", message: "Persona not found or access denied" }
   *     { error: "INVALID_PAYMENT", message: "Invalid payment intent" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   402 Payment Required:
   *     { error: "PAYMENT_REQUIRED", message: "Valid payment method required" }
   *     { error: "PAYMENT_FAILED", message: "Payment authorization failed" }
   *     { error: "INSUFFICIENT_FUNDS", message: "Insufficient funds on payment method" }
   *
   *   403 Forbidden:
   *     { error: "PHONE_NOT_VERIFIED", message: "Phone verification required" }
   *     { error: "ACCOUNT_SUSPENDED", message: "Account suspended due to policy violation" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many call requests. Maximum 5 per minute", retry_after: 60 }
   *     { error: "CONCURRENT_CALLS", message: "You already have an active call in progress" }
   *
   *   500 Internal Server Error:
   *     { error: "TWILIO_ERROR", message: "Failed to initiate call" }
   *     { error: "SERVER_ERROR", message: "An unexpected error occurred" }
   *
   *   503 Service Unavailable:
   *     { error: "SERVICE_UNAVAILABLE", message: "Telephony service temporarily unavailable" }
   *
   * IMPLEMENTATION NOTES:
   *   - Verify payment intent is valid and has sufficient pre-authorization
   *   - Create Twilio call using Programmable Voice API
   *   - Store call record in database immediately
   *   - Send webhook URL to Twilio for status updates
   *   - Implement idempotency key to prevent duplicate calls
   *   - Validate phone number using Twilio Lookup API
   *   - Check for concurrent calls per user (max 1)
   *   - Connection fee: $0.25, Per-minute rate: $0.40
   */
  const triggerCall = async (phoneNumber, personaId, paymentIntentId, callPretext = null) => {
    try {
      const requestBody = {
        phoneNumber,
        personaId,
        paymentIntentId
      };

      // Add callPretext if provided (scenario/context for this specific call)
      if (callPretext) {
        requestBody.callPretext = callPretext;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/calls/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to trigger call')
      }

      const result = await response.json()

      // Add to local state
      const newCall = {
        id: result.callId,
        status: result.status,
        persona_id: personaId,
        phone_number: phoneNumber,
        created_at: new Date().toISOString()
      }
      calls.value.unshift(newCall)

      return { call: newCall, message: result.message }
    } catch (error) {
      console.error('Failed to trigger call:', error)
      throw error
    }
  }

  /**
   * Schedule a call
   *
   * API ENDPOINT: POST /api/calls/schedule
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 10 requests per hour per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     phone_number: string (required, E.164 format),
   *     persona_id: string (required),
   *     scheduled_time: string (required, ISO 8601 datetime),
   *     payment_intent_id: string (required, Stripe PaymentIntent ID)
   *   }
   *
   * INPUT VALIDATION:
   *   - phone_number: Must be E.164 format, 10-15 digits with + prefix
   *   - persona_id: Must exist in database
   *   - scheduled_time: Must be ISO 8601 format, at least 5 minutes in future, max 30 days in future
   *   - payment_intent_id: Must be valid Stripe PaymentIntent
   *
   * EXPECTED RESPONSE (201 Created):
   *   {
   *     scheduled_call: {
   *       id: string (UUID),
   *       user_id: string (UUID),
   *       persona_id: string,
   *       phone_number: string (E.164 format),
   *       scheduled_time: string (ISO 8601),
   *       status: 'scheduled',
   *       created_at: string (ISO 8601),
   *       estimated_cost: number (dollars)
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Invalid phone number format" }
   *     { error: "VALIDATION_ERROR", message: "Scheduled time must be at least 5 minutes in the future" }
   *     { error: "VALIDATION_ERROR", message: "Cannot schedule calls more than 30 days in advance" }
   *     { error: "VALIDATION_ERROR", message: "Invalid datetime format. Use ISO 8601" }
   *     { error: "INVALID_PERSONA", message: "Persona not found" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   402 Payment Required:
   *     { error: "PAYMENT_REQUIRED", message: "Valid payment method required" }
   *     { error: "PAYMENT_FAILED", message: "Payment authorization failed" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Maximum 10 scheduled calls per hour", retry_after: 3600 }
   *     { error: "MAX_SCHEDULED", message: "Maximum 50 active scheduled calls allowed" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to schedule call" }
   *
   * IMPLEMENTATION NOTES:
   *   - Use cron job or queue system to trigger scheduled calls
   *   - Pre-authorize payment at schedule time
   *   - Send reminder notification 5 minutes before scheduled time
   *   - Automatically cancel if payment fails
   *   - Store in UTC timezone, convert for display
   *   - Limit to 50 active scheduled calls per user
   */
  const scheduleCall = async (phoneNumber, personaId, scheduledTime, options = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      const response = await fetch(`${apiUrl}/api/calls/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber,
          personaId,
          scheduledTime,
          callPretext: options.callPretext,
          callScenario: options.callScenario,
          customInstructions: options.customInstructions,
          maxDurationMinutes: options.maxDurationMinutes || 5
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to schedule call')
      }

      const data = await response.json()

      // Add to local state
      if (data.scheduled_call) {
        scheduledCalls.value.push(data.scheduled_call)
      }

      return data
    } catch (error) {
      console.error('Schedule call error:', error)
      throw error
    }
  }

  /**
   * Cancel scheduled call
   *
   * API ENDPOINT: DELETE /api/calls/schedule/:id
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 20 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * URL PARAMETERS:
   *   id: string (required, scheduled call ID)
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     message: "Scheduled call cancelled successfully",
   *     refund: {
   *       amount: number (dollars),
   *       status: 'refunded' | 'processing',
   *       refund_id: string (Stripe refund ID)
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "CANCELLATION_DENIED", message: "Cannot cancel call less than 5 minutes before scheduled time" }
   *     { error: "INVALID_STATUS", message: "Call cannot be cancelled (already completed or in progress)" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   403 Forbidden:
   *     { error: "FORBIDDEN", message: "You don't have permission to cancel this call" }
   *
   *   404 Not Found:
   *     { error: "NOT_FOUND", message: "Scheduled call not found" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "REFUND_FAILED", message: "Call cancelled but refund processing failed. Contact support" }
   *     { error: "SERVER_ERROR", message: "Failed to cancel call" }
   *
   * IMPLEMENTATION NOTES:
   *   - Verify user owns the scheduled call
   *   - Process full refund via Stripe
   *   - Remove from scheduling queue
   *   - Send cancellation confirmation email
   *   - Cannot cancel if less than 5 minutes before scheduled time
   *   - Update call status to 'cancelled'
   */
  const cancelScheduledCall = async (callId) => {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      const response = await fetch(`${apiUrl}/api/calls/schedule/${callId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to cancel call')
      }

      const data = await response.json()

      // Remove from local state
      scheduledCalls.value = scheduledCalls.value.filter(c => c.id !== callId)

      return data
    } catch (error) {
      console.error('Cancel scheduled call error:', error)
      throw error
    }
  }

  /**
   * Fetch scheduled calls
   *
   * API ENDPOINT: GET /api/calls/scheduled
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 60 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * QUERY PARAMETERS:
   *   status: string (optional: 'scheduled' | 'cancelled', default: 'scheduled')
   *   sort: string (optional: 'time_asc' | 'time_desc', default: 'time_asc')
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     scheduled_calls: [
   *       {
   *         id: string (UUID),
   *         user_id: string (UUID),
   *         persona_id: string,
   *         persona_name: string,
   *         phone_number: string (E.164 format),
   *         scheduled_time: string (ISO 8601),
   *         status: 'scheduled' | 'cancelled',
   *         created_at: string (ISO 8601),
   *         estimated_cost: number (dollars)
   *       }
   *     ]
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Invalid status value" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to fetch scheduled calls" }
   *
   * IMPLEMENTATION NOTES:
   *   - Only return scheduled calls for authenticated user
   *   - Filter out past scheduled calls that weren't executed
   *   - Include persona details via join
   *   - Cache for 30 seconds
   */
  const fetchScheduledCalls = async () => {
    const apiUrl = import.meta.env.VITE_API_URL

    try {
      const response = await fetch(`${apiUrl}/api/calls/scheduled`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || errorData.error || 'Failed to fetch scheduled calls')
      }

      const data = await response.json()
      scheduledCalls.value = data.scheduled_calls || []
      return data
    } catch (error) {
      console.error('Fetch scheduled calls error:', error)
      // Don't throw - just return empty list for UI
      scheduledCalls.value = []
      return { scheduled_calls: [] }
    }
  }

  return {
    calls,
    scheduledCalls,
    fetchCalls,
    triggerCall,
    scheduleCall,
    cancelScheduledCall,
    fetchScheduledCalls
  }
})
