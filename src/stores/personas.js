import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePersonasStore = defineStore('personas', () => {
  const personas = ref([])
  const userContacts = ref([])

  // Mock personas data
  const mockPersonas = [
    {
      id: 'friend',
      name: 'Best Friend',
      description: 'Your supportive best friend who always has your back',
      voice: 'rachel',
      system_prompt: 'You are a supportive best friend calling to help your friend get out of an awkward situation. Be warm, understanding, and create a believable emergency or reason for them to leave.',
      is_public: true,
      created_by: 'system',
      tags: ['friendly', 'supportive', 'casual']
    },
    {
      id: 'manager',
      name: 'Boss',
      description: 'Your demanding boss with an urgent work matter',
      voice: 'adam',
      system_prompt: 'You are a demanding but professional boss calling with an urgent work matter. Be authoritative and make it clear that your employee needs to return to the office or handle something immediately.',
      is_public: true,
      created_by: 'system',
      tags: ['professional', 'urgent', 'authoritative']
    },
    {
      id: 'agent',
      name: 'Talent Agent',
      description: 'Your talent agent with exciting news about an opportunity',
      voice: 'bella',
      system_prompt: 'You are an enthusiastic talent agent calling with exciting news about a potential opportunity. Be professional but excited, and make it sound urgent that they need to discuss this now.',
      is_public: true,
      created_by: 'system',
      tags: ['professional', 'exciting', 'opportunity']
    },
    {
      id: 'doctor',
      name: 'Doctor',
      description: 'Your doctor calling about important test results',
      voice: 'emily',
      system_prompt: 'You are a medical professional calling about test results. Be professional and serious, suggesting the person needs to come in or discuss something important privately.',
      is_public: true,
      created_by: 'system',
      tags: ['professional', 'medical', 'serious']
    },
    {
      id: 'family',
      name: 'Family Member',
      description: 'A family member with an urgent family matter',
      voice: 'grace',
      system_prompt: 'You are a concerned family member calling about an urgent family matter. Be warm but urgent, making it clear they need to call back or leave their current situation.',
      is_public: true,
      created_by: 'system',
      tags: ['family', 'urgent', 'caring']
    }
  ]

  personas.value = mockPersonas
  userContacts.value = [mockPersonas[0], mockPersonas[1]] // Friend and Boss as default contacts

  /**
   * Fetch all public personas
   *
   * API ENDPOINT: GET /api/personas
   *
   * AUTHENTICATION: Optional (JWT Bearer token) - authenticated users also see their private personas
   *
   * RATE LIMITING: 60 requests per minute per IP (anonymous), 120 per minute (authenticated)
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token> (optional)
   *
   * QUERY PARAMETERS:
   *   page: number (default: 1, min: 1)
   *   limit: number (default: 20, min: 1, max: 100)
   *   search: string (optional, searches name and description, min 2 characters)
   *   tags: string (optional, comma-separated tags, e.g., "friendly,professional")
   *   is_public: boolean (optional, default: null means both)
   *   created_by: string (optional, filter by creator user_id or 'system')
   *   sort: string (optional: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc', default: 'name_asc')
   *
   * EXAMPLE: GET /api/personas?page=1&limit=20&search=friend&tags=friendly,supportive
   *
   * INPUT VALIDATION:
   *   - search: Min 2 characters, max 100 characters, alphanumeric + spaces only
   *   - tags: Max 10 tags, each tag max 30 characters
   *   - page: Must be positive integer
   *   - limit: Must be between 1 and 100
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     personas: [
   *       {
   *         id: string (UUID),
   *         name: string,
   *         description: string,
   *         voice: string (ElevenLabs voice ID),
   *         system_prompt: string,
   *         is_public: boolean,
   *         created_by: string (user_id or 'system'),
   *         tags: string[],
   *         created_at: string (ISO 8601),
   *         use_count: number (how many users have this in contacts)
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
   *     { error: "VALIDATION_ERROR", message: "Search query must be at least 2 characters" }
   *     { error: "VALIDATION_ERROR", message: "Invalid page or limit value" }
   *     { error: "VALIDATION_ERROR", message: "Too many tags (maximum 10)" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Too many requests", retry_after: 60 }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to fetch personas" }
   *
   * IMPLEMENTATION NOTES:
   *   - Anonymous users only see public personas
   *   - Authenticated users see public personas + their own private personas
   *   - Implement full-text search on name and description
   *   - Cache public persona list for 5 minutes
   *   - Index database on is_public, created_by, tags
   *   - System personas cannot be edited or deleted
   */
  const fetchPersonas = async (page = 1, limit = 20, search = '') => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        let filtered = mockPersonas
        if (search) {
          filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
          )
        }
        resolve({
          personas: filtered,
          pagination: { page, limit, total: filtered.length, pages: 1 }
        })
      }, 300)
    })
  }

  /**
   * Create custom persona
   *
   * API ENDPOINT: POST /api/personas
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   *
   * RATE LIMITING: 20 per hour per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     name: string (required),
   *     description: string (required),
   *     voice: string (required, ElevenLabs voice ID),
   *     system_prompt: string (required),
   *     is_public: boolean (optional, default: false),
   *     tags: string[] (optional)
   *   }
   *
   * INPUT VALIDATION:
   *   - name: Required, 3-50 characters, alphanumeric + spaces/hyphens/apostrophes only, unique per user
   *   - description: Required, 10-500 characters
   *   - voice: Required, must be valid ElevenLabs voice ID (verify via ElevenLabs API)
   *   - system_prompt: Required, 20-2000 characters, should instruct AI behavior
   *   - is_public: Optional boolean, defaults to false
   *   - tags: Optional array, max 10 tags, each tag 2-30 characters, lowercase alphanumeric + hyphens
   *
   * EXPECTED RESPONSE (201 Created):
   *   {
   *     persona: {
   *       id: string (UUID),
   *       name: string,
   *       description: string,
   *       voice: string,
   *       system_prompt: string,
   *       is_public: boolean,
   *       created_by: string (user_id),
   *       tags: string[],
   *       created_at: string (ISO 8601)
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Missing required fields: name, description, voice, system_prompt" }
   *     { error: "VALIDATION_ERROR", message: "Name must be 3-50 characters" }
   *     { error: "VALIDATION_ERROR", message: "Description must be 10-500 characters" }
   *     { error: "VALIDATION_ERROR", message: "System prompt must be 20-2000 characters" }
   *     { error: "VALIDATION_ERROR", message: "Invalid voice ID" }
   *     { error: "VALIDATION_ERROR", message: "Tags must be lowercase alphanumeric" }
   *     { error: "VALIDATION_ERROR", message: "Too many tags (maximum 10)" }
   *     { error: "DUPLICATE_NAME", message: "You already have a persona with this name" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   402 Payment Required:
   *     { error: "PAYMENT_REQUIRED", message: "Premium account required for custom personas" }
   *
   *   429 Too Many Requests:
   *     { error: "RATE_LIMIT_EXCEEDED", message: "Maximum 20 personas per hour", retry_after: 3600 }
   *     { error: "MAX_PERSONAS", message: "Maximum 50 custom personas per user" }
   *
   *   500 Internal Server Error:
   *     { error: "VOICE_API_ERROR", message: "Failed to verify voice ID with ElevenLabs" }
   *     { error: "SERVER_ERROR", message: "Failed to create persona" }
   *
   * IMPLEMENTATION NOTES:
   *   - Verify voice ID exists in ElevenLabs account
   *   - Sanitize all text inputs to prevent XSS
   *   - System prompts should be reviewed for safety (optional moderation API)
   *   - Free users limited to 10 custom personas
   *   - Premium users can create up to 50
   *   - Public personas require moderation approval
   *   - Store created_by as authenticated user_id
   */
  const createPersona = async (personaData) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPersona = {
          id: 'custom-' + Date.now(),
          ...personaData,
          created_by: 'user-1',
          is_public: personaData.is_public || false,
          created_at: new Date().toISOString()
        }
        personas.value.push(newPersona)
        resolve({ persona: newPersona })
      }, 500)
    })
  }

  /**
   * Update custom persona
   *
   * API ENDPOINT: PUT /api/personas/:id
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   * RATE LIMITING: 30 requests per hour per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * URL PARAMETERS:
   *   id: string (required, persona UUID)
   *
   * REQUEST BODY: (all fields optional)
   *   {
   *     name: string,
   *     description: string,
   *     voice: string,
   *     system_prompt: string,
   *     is_public: boolean,
   *     tags: string[]
   *   }
   *
   * INPUT VALIDATION: Same as createPersona
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     persona: { ...updated persona object }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "Invalid field values" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   403 Forbidden:
   *     { error: "FORBIDDEN", message: "Cannot edit system personas" }
   *     { error: "FORBIDDEN", message: "You don't own this persona" }
   *
   *   404 Not Found:
   *     { error: "NOT_FOUND", message: "Persona not found" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to update persona" }
   *
   * IMPLEMENTATION NOTES:
   *   - Verify user owns the persona (created_by must match user_id)
   *   - System personas (created_by='system') cannot be edited
   *   - Changing is_public to true may require moderation
   */
  const updatePersona = async (personaId, updates) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const index = personas.value.findIndex(p => p.id === personaId)
        if (index !== -1) {
          personas.value[index] = { ...personas.value[index], ...updates }
          resolve({ persona: personas.value[index] })
        }
      }, 500)
    })
  }

  /**
   * Delete custom persona
   *
   * API ENDPOINT: DELETE /api/personas/:id
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   * RATE LIMITING: 20 requests per hour per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * URL PARAMETERS:
   *   id: string (required, persona UUID)
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     message: "Persona deleted successfully"
   *   }
   *
   * ERROR RESPONSES:
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   403 Forbidden:
   *     { error: "FORBIDDEN", message: "Cannot delete system personas" }
   *     { error: "FORBIDDEN", message: "You don't own this persona" }
   *
   *   404 Not Found:
   *     { error: "NOT_FOUND", message: "Persona not found" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to delete persona" }
   *
   * IMPLEMENTATION NOTES:
   *   - Verify user owns the persona
   *   - System personas cannot be deleted
   *   - Cascade delete: remove from all users' contacts
   *   - Cannot delete if persona is in active scheduled calls
   */
  const deletePersona = async (personaId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        personas.value = personas.value.filter(p => p.id !== personaId)
        userContacts.value = userContacts.value.filter(p => p.id !== personaId)
        resolve({ message: 'Persona deleted successfully' })
      }, 300)
    })
  }

  /**
   * Fetch user's contact list (favorited personas)
   *
   * API ENDPOINT: GET /api/contacts
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   * RATE LIMITING: 60 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *
   * EXPECTED RESPONSE (200 OK):
   *   {
   *     contacts: [
   *       {
   *         id: string (UUID),
   *         persona_id: string,
   *         persona: { ...persona object },
   *         added_at: string (ISO 8601)
   *       }
   *     ]
   *   }
   *
   * ERROR RESPONSES:
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to fetch contacts" }
   *
   * IMPLEMENTATION NOTES:
   *   - Return only authenticated user's contacts
   *   - Include full persona object via join
   *   - Sort by added_at descending (most recent first)
   *   - Cache for 1 minute
   */
  const fetchContacts = async () => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ contacts: userContacts.value })
      }, 300)
    })
  }

  /**
   * Add persona to contacts
   *
   * API ENDPOINT: POST /api/contacts
   *
   * AUTHENTICATION: Required (JWT Bearer token)
   * RATE LIMITING: 30 requests per minute per user
   *
   * HEADERS:
   *   Authorization: Bearer <JWT token>
   *   Content-Type: application/json
   *
   * REQUEST BODY:
   *   {
   *     persona_id: string (required)
   *   }
   *
   * EXPECTED RESPONSE (201 Created):
   *   {
   *     contact: {
   *       id: string (UUID),
   *       persona_id: string,
   *       added_at: string (ISO 8601)
   *     }
   *   }
   *
   * ERROR RESPONSES:
   *   400 Bad Request:
   *     { error: "VALIDATION_ERROR", message: "persona_id is required" }
   *     { error: "ALREADY_EXISTS", message: "Persona already in contacts" }
   *
   *   401 Unauthorized:
   *     { error: "UNAUTHORIZED", message: "Authentication required" }
   *
   *   404 Not Found:
   *     { error: "NOT_FOUND", message: "Persona not found" }
   *
   *   429 Too Many Requests:
   *     { error: "MAX_CONTACTS", message: "Maximum 50 contacts allowed" }
   *
   *   500 Internal Server Error:
   *     { error: "SERVER_ERROR", message: "Failed to add contact" }
   *
   * IMPLEMENTATION NOTES:
   *   - Check persona exists and is accessible (public or owned by user)
   *   - Prevent duplicates (unique constraint on user_id + persona_id)
   *   - Limit to 50 contacts per user
   */
  const addToContacts = async (personaId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        const persona = personas.value.find(p => p.id === personaId)
        if (persona && !userContacts.value.find(c => c.id === personaId)) {
          userContacts.value.push(persona)
        }
        resolve({ contact: { id: 'contact-' + Date.now(), persona_id: personaId, added_at: new Date().toISOString() } })
      }, 300)
    })
  }

  /**
   * Remove persona from contacts
   * API ENDPOINT: DELETE /api/contacts/:personaId
   * Headers:
   *   Authorization: Bearer <token>
   * Expected Response (200):
   *   {
   *     message: "Removed from contacts"
   *   }
   */
  const removeFromContacts = async (personaId) => {
    // Mock implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        userContacts.value = userContacts.value.filter(c => c.id !== personaId)
        resolve({ message: 'Removed from contacts' })
      }, 300)
    })
  }

  return {
    personas,
    userContacts,
    fetchPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    fetchContacts,
    addToContacts,
    removeFromContacts
  }
})
