# Call Me Back - Implementation Plan
**Date Created:** January 2025
**Status:** Ready to Execute
**Estimated Timeline:** 2-3 weeks for Phase 1

---

## 🎯 Overview

This plan covers two major features to implement:
1. **Duration Selector UX** - Visual call duration picker with pricing
2. **SMS Scheduling** - Text-to-schedule call functionality

Both features integrate with the three-tier pricing strategy (Launch → Proven → Scale).

---

## 📋 Table of Contents

1. [Phase 1: Duration Selector UX](#phase-1-duration-selector-ux)
2. [Phase 2: SMS Scheduling Backend](#phase-2-sms-scheduling-backend)
3. [Phase 3: Integration & Testing](#phase-3-integration--testing)
4. [Pricing Logic Reference](#pricing-logic-reference)
5. [Testing Checklist](#testing-checklist)
6. [Deployment Steps](#deployment-steps)

---

## Phase 1: Duration Selector UX

### Goal
Replace basic duration input with visual selector showing tiered pricing based on user's subscription status.

### Timeline: 3-4 days

---

### Task 1.1: Create Duration Selector Component

**File:** `src/components/DurationSelector.vue`

**What to Build:**
A reusable component that shows duration options with dynamic pricing.

**Component Props:**
```javascript
props: {
  userTier: {
    type: String,
    default: 'pay-per-call', // 'pay-per-call', 'casual', 'standard', 'power', 'pro'
    validator: (value) => ['pay-per-call', 'casual', 'standard', 'power', 'pro'].includes(value)
  },
  modelValue: {
    type: Number, // Selected duration in minutes
    default: 5
  },
  scenario: {
    type: String,
    default: null
  }
}
```

**Component Structure:**
```vue
<template>
  <div class="duration-selector">
    <h3 class="selector-title">How long should this call last?</h3>
    <p class="selector-hint">{{ getPricingHint() }}</p>

    <div class="duration-options">
      <button
        v-for="option in durationOptions"
        :key="option.minutes"
        class="duration-option"
        :class="{
          'duration-option-active': modelValue === option.minutes,
          'duration-option-recommended': option.recommended
        }"
        @click="selectDuration(option.minutes)"
      >
        <div class="duration-icon">{{ option.icon }}</div>
        <div class="duration-label">{{ option.label }}</div>
        <div class="duration-time">{{ option.minutes }} min</div>
        <div class="duration-price">{{ formatPrice(option) }}</div>
        <div v-if="option.savings" class="duration-savings">
          Save {{ option.savings }}
        </div>
      </button>
    </div>

    <!-- Estimated Total -->
    <div class="duration-estimate">
      <div class="estimate-breakdown">
        <span>Base call ({{ modelValue }} min):</span>
        <span>{{ formatBasePrice() }}</span>
      </div>
      <div v-if="scenario" class="estimate-breakdown">
        <span>Scenario context (~{{ estimateTokens(scenario) }} tokens):</span>
        <span>{{ formatScenarioPrice() }}</span>
      </div>
      <div class="estimate-total">
        <strong>Total Estimated Cost:</strong>
        <strong>{{ formatTotalPrice() }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  userTier: String,
  modelValue: Number,
  scenario: String
})

const emit = defineEmits(['update:modelValue'])

// Duration options with pricing logic
const durationOptions = computed(() => {
  const tier = props.userTier

  // Base options (same for all tiers)
  const options = [
    {
      minutes: 3,
      label: 'Quick Chat',
      icon: '⚡',
      recommended: false
    },
    {
      minutes: 5,
      label: 'Standard',
      icon: '⭐',
      recommended: true
    },
    {
      minutes: 10,
      label: 'Extended',
      icon: '💬',
      recommended: false
    },
    {
      minutes: 15,
      label: 'Long Talk',
      icon: '🕐',
      recommended: false
    }
  ]

  // Add pricing based on tier
  return options.map(opt => ({
    ...opt,
    ...calculatePricing(opt.minutes, tier)
  }))
})

function calculatePricing(minutes, tier) {
  // Pricing logic based on tier and phase
  // See "Pricing Logic Reference" section below for full calculation

  if (tier === 'pay-per-call') {
    // Phase 1 (Launch): $4.99 for 5min, others scale
    const basePrice = {
      3: 3.99,
      5: 4.99,
      10: 7.99,
      15: 10.99
    }[minutes]

    return {
      price: basePrice,
      perMinute: null,
      savings: null,
      included: false
    }
  }

  if (tier === 'casual') {
    // $9.99/month = 3 calls/month up to 5min
    if (minutes <= 5) {
      return {
        price: 0, // Included in subscription
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else {
      // Overage: +$4.99 per call for longer durations
      return {
        price: 4.99,
        perMinute: null,
        savings: null,
        included: false
      }
    }
  }

  if (tier === 'standard') {
    // $29.99/month = 10 calls/month up to 5min
    if (minutes <= 5) {
      return {
        price: 0,
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else if (minutes <= 10) {
      return {
        price: 0,
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else {
      return {
        price: 2.99,
        perMinute: null,
        savings: null,
        included: false
      }
    }
  }

  if (tier === 'power') {
    // $49.99/month = 25 calls/month, 5-10min included
    if (minutes <= 10) {
      return {
        price: 0,
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else if (minutes <= 15) {
      return {
        price: 0,
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else {
      return {
        price: 0,
        perMinute: 0.50,
        savings: null,
        included: false
      }
    }
  }

  if (tier === 'pro') {
    // $99.99/month = unlimited, up to 15min per call
    if (minutes <= 15) {
      return {
        price: 0,
        perMinute: null,
        savings: 'Included',
        included: true
      }
    } else {
      return {
        price: 0,
        perMinute: 0.50,
        savings: null,
        included: false
      }
    }
  }
}

function selectDuration(minutes) {
  emit('update:modelValue', minutes)
}

function getPricingHint() {
  const tier = props.userTier

  const hints = {
    'pay-per-call': 'Pay as you go - no commitment required',
    'casual': '5-minute calls included in your plan',
    'standard': 'Up to 10-minute calls included',
    'power': 'Up to 15-minute calls included',
    'pro': 'Unlimited duration up to 15 minutes'
  }

  return hints[tier] || ''
}

function formatPrice(option) {
  if (option.included) {
    return 'Included ✓'
  }

  if (option.perMinute) {
    return `$${option.perMinute.toFixed(2)}/min`
  }

  return `$${option.price.toFixed(2)}`
}

function estimateTokens(text) {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

function formatBasePrice() {
  const option = durationOptions.value.find(opt => opt.minutes === props.modelValue)
  if (!option) return '$0.00'

  if (option.included) return 'Included'
  if (option.perMinute) return `$${(option.perMinute * props.modelValue).toFixed(2)}`
  return `$${option.price.toFixed(2)}`
}

function formatScenarioPrice() {
  // Scenario token cost: $0.10 per 1M tokens
  // Assume 4 turns per minute × scenario tokens per turn
  const tokens = estimateTokens(props.scenario)
  const minutes = props.modelValue
  const turnsPerMinute = 4
  const totalTurns = minutes * turnsPerMinute
  const totalTokens = tokens * totalTurns
  const cost = (totalTokens / 1000000) * 0.10

  return `$${cost.toFixed(2)}`
}

function formatTotalPrice() {
  // Calculate total including scenario
  const baseOption = durationOptions.value.find(opt => opt.minutes === props.modelValue)
  if (!baseOption) return '$0.00'

  let total = 0

  if (baseOption.included) {
    total = 0
  } else if (baseOption.perMinute) {
    total = baseOption.perMinute * props.modelValue
  } else {
    total = baseOption.price
  }

  // Add scenario cost
  if (props.scenario) {
    const tokens = estimateTokens(props.scenario)
    const minutes = props.modelValue
    const turnsPerMinute = 4
    const totalTurns = minutes * turnsPerMinute
    const totalTokens = tokens * totalTurns
    const scenarioCost = (totalTokens / 1000000) * 0.10
    total += scenarioCost
  }

  return total === 0 ? 'Included' : `$${total.toFixed(2)}`
}
</script>

<style scoped>
.duration-selector {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1rem 0;
}

.selector-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #212529;
}

.selector-hint {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 1.5rem;
}

.duration-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.duration-option {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 1.25rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.duration-option:hover {
  border-color: #007bff;
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.duration-option-active {
  border-color: #007bff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(0, 123, 255, 0.3);
}

.duration-option-recommended::after {
  content: '⭐ Popular';
  position: absolute;
  top: -12px;
  right: -8px;
  background: #ffc107;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

.duration-icon {
  font-size: 2rem;
}

.duration-label {
  font-weight: 600;
  font-size: 0.95rem;
}

.duration-time {
  font-size: 0.85rem;
  color: #6c757d;
}

.duration-option-active .duration-time {
  color: rgba(255, 255, 255, 0.9);
}

.duration-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #007bff;
}

.duration-option-active .duration-price {
  color: white;
}

.duration-savings {
  font-size: 0.75rem;
  color: #28a745;
  font-weight: 600;
  background: #d4edda;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.duration-option-active .duration-savings {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.duration-estimate {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.estimate-breakdown {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #495057;
}

.estimate-total {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
  border-top: 2px solid #dee2e6;
  font-size: 1.1rem;
}
</style>
```

**Acceptance Criteria:**
- [ ] Component displays 4 duration options (3, 5, 10, 15 min)
- [ ] Pricing updates based on user tier
- [ ] "Included" shows for subscription users within limits
- [ ] Selected duration highlights visually
- [ ] Scenario cost adds to total estimate
- [ ] Mobile responsive (2 columns on mobile, 4 on desktop)

---

### Task 1.2: Integrate Duration Selector into Schedule.vue

**File:** `src/views/Schedule.vue`

**Changes:**

1. **Import the component:**
```javascript
import DurationSelector from '@/components/DurationSelector.vue'
```

2. **Get user tier from store:**
```javascript
// Add to <script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// Determine user's subscription tier
const userTier = computed(() => {
  // This will come from userStore once subscription system is built
  // For now, default to pay-per-call
  return userStore.currentSubscription?.tier || 'pay-per-call'
})
```

3. **Replace duration input (lines 44-54) with:**
```vue
<!-- Replace the old input -->
<DurationSelector
  v-model="quickCall.estimatedDuration"
  :user-tier="userTier"
  :scenario="quickCall.scenario"
/>
```

4. **Update cost calculation to use selected duration:**
Already exists in watchers, just ensure it's using `quickCall.estimatedDuration`

**Acceptance Criteria:**
- [ ] Old number input replaced with DurationSelector
- [ ] Selected duration updates `quickCall.estimatedDuration`
- [ ] Cost calculation reflects selected duration
- [ ] UI looks polished and professional

---

### Task 1.3: Add User Tier to User Store

**File:** `src/stores/user.js`

**Add subscription state:**
```javascript
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    currentSubscription: null, // NEW
    // ... existing state
  }),

  getters: {
    // NEW: Get user's subscription tier
    subscriptionTier(state) {
      if (!state.currentSubscription) return 'pay-per-call'
      return state.currentSubscription.tier
    },

    // NEW: Check if user has active subscription
    hasActiveSubscription(state) {
      return state.currentSubscription && state.currentSubscription.status === 'active'
    }
  },

  actions: {
    // NEW: Fetch user's subscription
    async fetchSubscription() {
      try {
        const response = await axios.get('/api/user/subscription', {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        this.currentSubscription = response.data
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
        this.currentSubscription = null
      }
    },

    // Update existing login action
    async login(email, password) {
      // ... existing login logic

      // After successful login, fetch subscription
      await this.fetchSubscription()
    }
  }
})
```

**Acceptance Criteria:**
- [ ] User store tracks subscription tier
- [ ] Subscription fetched after login
- [ ] Getter provides tier or defaults to 'pay-per-call'

---

## Phase 2: SMS Scheduling Backend

### Goal
Allow users to text a Twilio number to schedule calls instantly or for later.

### Timeline: 5-7 days

---

### Task 2.1: Set Up Twilio SMS Number

**Platform:** Twilio Console

**Steps:**
1. Log into Twilio console
2. Buy a phone number (select one with SMS capabilities)
   - Cost: $1.15/month
   - Choose local number or toll-free (toll-free recommended for credibility)
3. Configure webhook:
   - "A MESSAGE COMES IN" → `https://[YOUR-APP-URL]/api/twilio/sms`
   - Method: POST
   - Message format: HTTP POST

**Save These Values:**
```
TWILIO_SMS_NUMBER=+15551234567
TWILIO_ACCOUNT_SID=ACxxxxx (already have)
TWILIO_AUTH_TOKEN=xxxxx (already have)
```

**Acceptance Criteria:**
- [ ] Phone number purchased
- [ ] SMS webhook configured
- [ ] Test SMS received triggers webhook

---

### Task 2.2: Create SMS Handler Service

**File:** `src/sms-handler/index.ts`

**Service Definition in `raindrop.manifest`:**
```yaml
- name: sms-handler
  type: service
  path: src/sms-handler
  private: true
  environment:
    - CALL_ME_BACK_DB
    - CONVERSATION_MEMORY
    - CALL_ORCHESTRATOR
    - PERSONA_MANAGER
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_SMS_NUMBER
```

**Implementation:**
```typescript
// src/sms-handler/index.ts
import { Actor } from '@liquidmetal-ai/raindrop-framework'

interface SMSHandlerEnv {
  CALL_ME_BACK_DB: any
  CONVERSATION_MEMORY: any
  CALL_ORCHESTRATOR: any
  PERSONA_MANAGER: any
  TWILIO_ACCOUNT_SID: string
  TWILIO_AUTH_TOKEN: string
  TWILIO_SMS_NUMBER: string
}

export default class SMSHandler extends Actor<SMSHandlerEnv> {
  /**
   * Handle incoming SMS from Twilio
   */
  async handleIncomingSMS(from: string, body: string): Promise<void> {
    try {
      // 1. Parse the SMS command
      const command = await this.parseSMSCommand(body)

      if (!command.valid) {
        await this.sendSMS(from, command.error!)
        return
      }

      // 2. Find user by phone number
      const user = await this.getUserByPhone(from)

      if (!user) {
        await this.sendSMS(
          from,
          `❌ Phone number not registered.\n\nSign up at callmeback.com to get started!`
        )
        return
      }

      // 3. Validate persona exists
      const persona = await this.env.PERSONA_MANAGER.getPersonaByName(command.personaName!)

      if (!persona) {
        const available = await this.listAvailablePersonas(user.id)
        await this.sendSMS(
          from,
          `❌ Persona "${command.personaName}" not found.\n\nAvailable: ${available.join(', ')}`
        )
        return
      }

      // 4. Check payment method
      if (!user.default_payment_method) {
        await this.sendSMS(
          from,
          `❌ No payment method on file.\n\nAdd one at callmeback.com/billing`
        )
        return
      }

      // 5. Check subscription limits (if applicable)
      const canMakeCall = await this.checkUserCallLimit(user.id)

      if (!canMakeCall.allowed) {
        await this.sendSMS(from, `❌ ${canMakeCall.reason}`)
        return
      }

      // 6. Schedule or trigger call immediately
      const scheduledTime = this.parseScheduledTime(command.when!)

      const call = await this.env.CALL_ORCHESTRATOR.scheduleCall({
        user_id: user.id,
        persona_id: persona.id,
        phone_number: from,
        scheduled_time: scheduledTime,
        call_scenario: command.scenario || null,
        duration_minutes: 5 // Default duration
      })

      // 7. Send confirmation
      const timeStr = command.when === 'now'
        ? 'in about 1 minute'
        : `at ${this.formatTime(scheduledTime)}`

      const cost = await this.calculateCallCost(user.id, 5, command.scenario)

      await this.sendSMS(
        from,
        `✅ ${persona.name} will call you ${timeStr}!\n\nEstimated cost: $${cost.toFixed(2)}\n\nReply CANCEL to stop.`
      )

      this.env.logger.info('SMS call scheduled', {
        userId: user.id,
        personaId: persona.id,
        callId: call.id
      })

    } catch (error) {
      this.env.logger.error('SMS handler error', { error, from, body })
      await this.sendSMS(
        from,
        `❌ Something went wrong. Please try again or visit callmeback.com for help.`
      )
    }
  }

  /**
   * Parse SMS command into structured data
   */
  private async parseSMSCommand(body: string): Promise<SMSCommand> {
    const trimmed = body.trim()

    // Handle special commands
    if (trimmed.toUpperCase() === 'HELP') {
      return {
        valid: false,
        error: `📖 SMS Commands:\n\nBRAD NOW\nEMMA 5PM\nSARAH TOMORROW 2PM\nBRAD NOW save me from date\n\nFor more help, visit callmeback.com/help`
      }
    }

    if (trimmed.toUpperCase() === 'CANCEL') {
      // Handle cancellation (Task 2.4)
      return { valid: false, error: 'Cancellation handled separately' }
    }

    // Parse: [PERSONA] [WHEN] [OPTIONAL SCENARIO]
    const parts = trimmed.split(' ')

    if (parts.length < 1) {
      return {
        valid: false,
        error: `❌ Invalid format.\n\nTry: BRAD NOW\nor: EMMA 5PM\n\nText HELP for examples.`
      }
    }

    const personaName = parts[0]
    const when = parts[1]?.toLowerCase() || 'now'
    const scenario = parts.slice(2).join(' ') || null

    // Validate timing
    const validTimings = ['now', 'today', 'tomorrow', /^\d{1,2}(am|pm)$/i, /^\d{1,2}:\d{2}(am|pm)?$/i]

    // For MVP, keep it simple
    if (!['now', 'today', 'tomorrow'].includes(when) && !/^\d{1,2}(am|pm)$/i.test(when)) {
      return {
        valid: false,
        error: `❌ Invalid time format.\n\nValid times:\n- NOW\n- 5PM\n- TOMORROW 2PM\n\nText HELP for examples.`
      }
    }

    return {
      valid: true,
      personaName,
      when,
      scenario
    }
  }

  /**
   * Get user by phone number
   */
  private async getUserByPhone(phoneNumber: string): Promise<any | null> {
    const { executeSQL } = await import('../shared/db-helpers')

    const result = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      'SELECT * FROM users WHERE phone = ?',
      [phoneNumber]
    )

    return result.rows[0] || null
  }

  /**
   * List available personas for user
   */
  private async listAvailablePersonas(userId: string): Promise<string[]> {
    const personas = await this.env.PERSONA_MANAGER.getUserContacts(userId)
    return personas.map((p: any) => p.name)
  }

  /**
   * Check if user can make a call (subscription limits)
   */
  private async checkUserCallLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    // Get user's subscription
    const { executeSQL } = await import('../shared/db-helpers')

    const subResult = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      'SELECT * FROM user_subscriptions WHERE user_id = ? AND status = ?',
      [userId, 'active']
    )

    const subscription = subResult.rows[0]

    // Pay-per-call users: always allowed (will charge)
    if (!subscription) {
      return { allowed: true }
    }

    // Check monthly call limit for subscription
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const callsResult = await executeSQL(
      this.env.CALL_ME_BACK_DB,
      `SELECT COUNT(*) as count FROM calls
       WHERE user_id = ?
       AND strftime('%Y-%m', created_at) = ?
       AND status IN ('completed', 'pending', 'in-progress')`,
      [userId, currentMonth]
    )

    const callsThisMonth = callsResult.rows[0].count

    // Get tier limits
    const tierLimits: Record<string, number> = {
      'casual': 3,
      'standard': 10,
      'power': 25,
      'pro': 999999 // Effectively unlimited
    }

    const limit = tierLimits[subscription.tier] || 0

    if (callsThisMonth >= limit) {
      return {
        allowed: false,
        reason: `You've reached your monthly limit (${limit} calls).\n\nUpgrade at callmeback.com/billing`
      }
    }

    return { allowed: true }
  }

  /**
   * Parse scheduled time from "when" string
   */
  private parseScheduledTime(when: string): Date {
    const now = new Date()

    if (when === 'now') {
      // Schedule for 1 minute from now (give system time to prepare)
      return new Date(now.getTime() + 60000)
    }

    if (when === 'today' || when === 'tonight') {
      // Default to 6pm today if not specified
      const today = new Date()
      today.setHours(18, 0, 0, 0)
      return today
    }

    if (when === 'tomorrow') {
      // Default to 12pm tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(12, 0, 0, 0)
      return tomorrow
    }

    // Parse specific times like "5PM" or "2:30PM"
    const timeMatch = when.match(/^(\d{1,2})(:(\d{2}))?(am|pm)?$/i)

    if (timeMatch) {
      let hours = parseInt(timeMatch[1])
      const minutes = parseInt(timeMatch[3] || '0')
      const meridiem = timeMatch[4]?.toLowerCase()

      // Convert to 24-hour format
      if (meridiem === 'pm' && hours !== 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0

      const scheduled = new Date()
      scheduled.setHours(hours, minutes, 0, 0)

      // If time has passed today, schedule for tomorrow
      if (scheduled < now) {
        scheduled.setDate(scheduled.getDate() + 1)
      }

      return scheduled
    }

    // Default: 1 minute from now
    return new Date(now.getTime() + 60000)
  }

  /**
   * Calculate call cost based on user tier and scenario
   */
  private async calculateCallCost(userId: string, minutes: number, scenario: string | null): Promise<number> {
    const { estimateCallCost } = await import('../shared/cost-tracker')

    const memoryTokens = 2000 // Average
    const scenarioTokens = scenario ? Math.ceil(scenario.length / 4) : 0

    const estimate = await estimateCallCost(minutes, memoryTokens, scenarioTokens)

    return estimate.total_cost_cents / 100 // Convert to dollars
  }

  /**
   * Send SMS to user
   */
  private async sendSMS(to: string, message: string): Promise<void> {
    const twilio = require('twilio')(
      this.env.TWILIO_ACCOUNT_SID,
      this.env.TWILIO_AUTH_TOKEN
    )

    try {
      await twilio.messages.create({
        from: this.env.TWILIO_SMS_NUMBER,
        to,
        body: message
      })

      this.env.logger.info('SMS sent', { to, preview: message.slice(0, 50) })
    } catch (error) {
      this.env.logger.error('Failed to send SMS', { error, to })
      throw error
    }
  }

  /**
   * Format time for display
   */
  private formatTime(date: Date): string {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const meridiem = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${meridiem}`
  }
}

interface SMSCommand {
  valid: boolean
  personaName?: string
  when?: string
  scenario?: string | null
  error?: string
}
```

**Acceptance Criteria:**
- [ ] Service receives SMS webhooks
- [ ] Parses persona name, timing, and scenario
- [ ] Validates user and persona
- [ ] Checks subscription limits
- [ ] Schedules call via CALL_ORCHESTRATOR
- [ ] Sends confirmation SMS
- [ ] Handles errors gracefully

---

### Task 2.3: Add SMS Webhook Endpoint

**File:** `src/api-gateway/index.ts`

**Add route:**
```typescript
// Add with other Twilio webhooks
app.post('/api/twilio/sms', async (req, res) => {
  try {
    const { From, Body } = req.body // Twilio POST format

    // Validate it's from Twilio (optional but recommended)
    const twilioSignature = req.headers['x-twilio-signature']
    if (!validateTwilioSignature(twilioSignature, req.body)) {
      return res.status(403).json({ error: 'Invalid signature' })
    }

    // Handle SMS asynchronously
    env.SMS_HANDLER.handleIncomingSMS(From, Body)
      .catch(error => {
        env.logger.error('SMS handler failed', { error })
      })

    // Respond immediately to Twilio (they expect fast response)
    res.status(200).send('OK')

  } catch (error) {
    env.logger.error('SMS webhook error', { error })
    res.status(500).json({ error: 'Internal error' })
  }
})

function validateTwilioSignature(signature: string, body: any): boolean {
  // TODO: Implement Twilio signature validation
  // See: https://www.twilio.com/docs/usage/security#validating-requests
  return true // For now, trust all requests (not recommended for production)
}
```

**Acceptance Criteria:**
- [ ] Endpoint receives Twilio webhooks
- [ ] Calls SMS_HANDLER service
- [ ] Responds quickly (200 OK)
- [ ] Logs errors properly

---

### Task 2.4: Handle SMS Cancellations

**Add to SMSHandler:**
```typescript
/**
 * Handle call cancellation via SMS
 */
async handleCancellation(from: string): Promise<void> {
  const { executeSQL } = await import('../shared/db-helpers')

  // Find user
  const user = await this.getUserByPhone(from)
  if (!user) {
    await this.sendSMS(from, '❌ Phone number not found.')
    return
  }

  // Find pending/scheduled calls
  const result = await executeSQL(
    this.env.CALL_ME_BACK_DB,
    `SELECT * FROM scheduled_calls
     WHERE user_id = ?
     AND status = 'pending'
     AND scheduled_time > datetime('now')
     ORDER BY scheduled_time ASC
     LIMIT 1`,
    [user.id]
  )

  if (result.rows.length === 0) {
    await this.sendSMS(from, '❌ No upcoming calls to cancel.')
    return
  }

  const scheduledCall = result.rows[0]

  // Cancel the call
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    'UPDATE scheduled_calls SET status = ? WHERE id = ?',
    ['cancelled', scheduledCall.id]
  )

  // Refund if payment already captured (or void authorization)
  // TODO: Implement refund logic with Stripe

  await this.sendSMS(
    from,
    `✅ Cancelled your upcoming call.\n\nYou can schedule anytime by texting a persona name!`
  )

  this.env.logger.info('Call cancelled via SMS', {
    userId: user.id,
    callId: scheduledCall.id
  })
}

// Update handleIncomingSMS to check for CANCEL
if (trimmed.toUpperCase() === 'CANCEL') {
  await this.handleCancellation(from)
  return
}
```

**Acceptance Criteria:**
- [ ] "CANCEL" text cancels upcoming call
- [ ] Sends confirmation SMS
- [ ] Updates database status
- [ ] Handles case when no calls scheduled

---

### Task 2.5: Add "HELP" Command Response

**Add to parseSMSCommand:**
```typescript
if (trimmed.toUpperCase() === 'HELP') {
  const helpMessage = `📖 SMS Commands:

BASIC:
• BRAD NOW
• EMMA 5PM
• SARAH TOMORROW

WITH SCENARIO:
• BRAD NOW save me from date
• EMMA 3PM party planning

OTHER:
• CANCEL - Cancel upcoming call
• HELP - Show this message

Visit callmeback.com for full features!`

  return {
    valid: false,
    error: helpMessage
  }
}
```

**Acceptance Criteria:**
- [ ] "HELP" text returns command guide
- [ ] Message is clear and helpful
- [ ] Includes link to website

---

## Phase 3: Integration & Testing

### Timeline: 2-3 days

---

### Task 3.1: End-to-End Testing

**Test Scenarios:**

1. **Duration Selector - Pay-Per-Call User**
   - [ ] Shows pricing: 3min/$3.99, 5min/$4.99, 10min/$7.99, 15min/$10.99
   - [ ] Selecting 5min shows as recommended
   - [ ] Cost calculation matches expected
   - [ ] With scenario adds token cost

2. **Duration Selector - Casual Subscriber**
   - [ ] 3min and 5min show "Included"
   - [ ] 10min and 15min show overage pricing
   - [ ] Hint text mentions "5-minute calls included"

3. **Duration Selector - Standard Subscriber**
   - [ ] 3min, 5min, 10min show "Included"
   - [ ] 15min shows overage pricing
   - [ ] Cost estimate shows "Included" for 5min call

4. **Duration Selector - Power/Pro Subscriber**
   - [ ] All durations show "Included"
   - [ ] No additional charges
   - [ ] Total shows "Included"

5. **SMS Scheduling - Immediate Call**
   - [ ] Text "BRAD NOW" triggers call in 1 minute
   - [ ] Confirmation SMS received
   - [ ] Call appears in scheduled_calls table
   - [ ] User receives actual call

6. **SMS Scheduling - Scheduled Call**
   - [ ] Text "EMMA 5PM" schedules for 5pm today
   - [ ] Text "SARAH TOMORROW 2PM" schedules for tomorrow
   - [ ] Confirmation includes correct time
   - [ ] Call triggers at scheduled time

7. **SMS Scheduling - With Scenario**
   - [ ] Text "BRAD NOW save me from date" includes scenario
   - [ ] Scenario stored in database
   - [ ] Confirmation mentions scenario
   - [ ] AI uses scenario during call

8. **SMS Error Handling**
   - [ ] Unregistered number gets registration message
   - [ ] Invalid persona gets list of available personas
   - [ ] No payment method gets billing link
   - [ ] Exceeds subscription limit gets upgrade message

9. **SMS Commands**
   - [ ] "HELP" returns command guide
   - [ ] "CANCEL" cancels upcoming call
   - [ ] Invalid format returns error with examples

10. **Cross-Device Consistency**
    - [ ] Duration selector works on mobile (2 columns)
    - [ ] Duration selector works on desktop (4 columns)
    - [ ] SMS works from any phone (iOS, Android, feature phones)

---

### Task 3.2: Update Backend Call Flow

**Ensure duration is passed through entire call flow:**

1. **API Gateway** - Accept `duration_minutes` parameter
2. **Call Orchestrator** - Store duration in `calls` table
3. **Voice Pipeline** - Enforce duration limit during call
4. **Cost Tracker** - Calculate cost based on actual duration

**Files to Update:**
- `src/api-gateway/index.ts` - Accept duration param
- `src/call-orchestrator/index.ts` - Store duration
- `src/voice-pipeline/index.ts` - Implement call timer
- `src/shared/cost-tracker.ts` - Duration-based pricing (already done)

**Call Timer Implementation:**
```typescript
// In voice-pipeline WebSocket handler
const maxDuration = session.duration_minutes * 60 // Convert to seconds
const callStartTime = Date.now()

// In message event listener
const callDuration = Math.floor((Date.now() - callStartTime) / 1000)

if (callDuration >= maxDuration) {
  // Send warning before ending
  await this.synthesizeSpeech(
    "Hey, we're at our time limit! Thanks for calling, talk soon!",
    session.voice_id
  )

  // Close connection
  socket.close()

  this.env.logger.info('Call ended - duration limit reached', {
    callId,
    duration: callDuration
  })
}

// Optional: 30-second warning
if (callDuration === maxDuration - 30) {
  await this.synthesizeSpeech(
    "Just a heads up, we have about 30 seconds left!",
    session.voice_id
  )
}
```

**Acceptance Criteria:**
- [ ] Duration stored in database
- [ ] Call automatically ends at duration limit
- [ ] 30-second warning given
- [ ] Cost calculation uses actual duration (not estimate)

---

### Task 3.3: Add Subscription Management (Stub)

**For MVP, create basic subscription tracking:**

**Database Migration:**
```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tier TEXT NOT NULL, -- 'casual', 'standard', 'power', 'pro'
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'paused'
  stripe_subscription_id TEXT,
  current_period_start TEXT,
  current_period_end TEXT,
  cancel_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

**API Endpoint:**
```typescript
// In api-gateway
app.get('/api/user/subscription', authenticateJWT, async (req, res) => {
  const userId = req.user.id

  const { executeSQL } = await import('./shared/db-helpers')

  const result = await executeSQL(
    env.CALL_ME_BACK_DB,
    'SELECT * FROM user_subscriptions WHERE user_id = ? AND status = ?',
    [userId, 'active']
  )

  if (result.rows.length === 0) {
    return res.json({ tier: 'pay-per-call', status: 'none' })
  }

  res.json(result.rows[0])
})
```

**For Testing:**
```sql
-- Manually insert test subscription
INSERT INTO user_subscriptions (id, user_id, tier, status)
VALUES ('sub_test_123', '[YOUR_USER_ID]', 'standard', 'active');
```

**Acceptance Criteria:**
- [ ] Subscription table created
- [ ] API endpoint returns subscription
- [ ] Frontend fetches subscription on login
- [ ] Duration selector responds to tier changes

---

## Pricing Logic Reference

### Detailed Pricing Table by Tier

#### Pay-Per-Call (Launch Phase: Month 1-3)

| Duration | Price | Per Minute | Notes |
|----------|-------|------------|-------|
| 3 min | $3.99 | $1.33/min | Quick conversations |
| **5 min** | **$4.99** | **$1.00/min** | **Recommended** |
| 10 min | $7.99 | $0.80/min | Extended conversations |
| 15 min | $10.99 | $0.73/min | Long conversations |

**Cost Structure:**
- Base call cost: $0.89 (Twilio, ElevenLabs, Cerebras, Deepgram, Stripe)
- Profit margins: 78-92%
- Use after: New user acquisition, Month 1-3

---

#### Pay-Per-Call (Proven Phase: Month 4+)

| Duration | Price | Per Minute | Savings vs Launch |
|----------|-------|------------|-------------------|
| 3 min | $4.99 | $1.66/min | +$1.00 |
| **5 min** | **$6.99** | **$1.40/min** | **+$2.00** |
| 10 min | $9.99 | $1.00/min | +$2.00 |
| 15 min | $13.99 | $0.93/min | +$3.00 |

**Grandfathered Users:**
- Early adopters keep Launch pricing ($4.99)
- Shows "Grandfathered Pricing ⭐" badge
- Builds loyalty

---

#### Casual Plan: $9.99/month

**Included:**
- 3 calls per month
- Up to 5 minutes each
- All persona features

**Overage Pricing:**
| Situation | Price |
|-----------|-------|
| 4th+ call (up to 5min) | $4.99 |
| Any call > 5 min | $4.99 |

**Display in Duration Selector:**
- 3 min: "Included ✓"
- 5 min: "Included ✓" (recommended)
- 10 min: "$4.99 overage"
- 15 min: "$4.99 overage"

**Hint Text:** "5-minute calls included in your plan"

---

#### Standard Plan: $29.99/month

**Included:**
- 10 calls per month
- Up to 10 minutes each
- Priority support

**Overage Pricing:**
| Situation | Price |
|-----------|-------|
| 11th+ call (up to 10min) | $4.99 |
| Any call > 10 min | $2.99 |

**Display in Duration Selector:**
- 3 min: "Included ✓"
- 5 min: "Included ✓" (recommended)
- 10 min: "Included ✓"
- 15 min: "$2.99 overage"

**Hint Text:** "Up to 10-minute calls included"

---

#### Power Plan: $49.99/month

**Included:**
- 25 calls per month
- Up to 15 minutes each
- Custom personas
- Memory editor access

**Overage Pricing:**
| Situation | Price |
|-----------|-------|
| 26th+ call (up to 15min) | $2.99 |
| Any call > 15 min | $0.50/min |

**Display in Duration Selector:**
- 3 min: "Included ✓"
- 5 min: "Included ✓" (recommended)
- 10 min: "Included ✓"
- 15 min: "Included ✓"

**Hint Text:** "Up to 15-minute calls included"

---

#### Pro Plan: $99.99/month

**Included:**
- Unlimited calls
- Up to 15 minutes each
- All Power features
- White-glove support
- API access

**Overage Pricing:**
| Situation | Price |
|-----------|-------|
| Calls up to 15min | $0 (included) |
| Calls > 15 min | $0.50/min |

**Display in Duration Selector:**
- 3 min: "Included ✓"
- 5 min: "Included ✓" (recommended)
- 10 min: "Included ✓"
- 15 min: "Included ✓"

**Hint Text:** "Unlimited duration up to 15 minutes"

---

### Scenario Cost Add-On

**Applies to ALL tiers** (even subscriptions):

```typescript
function calculateScenarioCost(scenarioText: string, durationMinutes: number): number {
  // Token estimation: ~4 chars per token
  const tokens = Math.ceil(scenarioText.length / 4)

  // Cost: $0.10 per 1M tokens (Cerebras)
  const costPerToken = 0.10 / 1_000_000

  // Turns per minute: 4 (avg conversation rate)
  const turnsPerMinute = 4
  const totalTurns = durationMinutes * turnsPerMinute

  // Scenario tokens sent each turn
  const totalTokens = tokens * totalTurns

  // Total cost
  const cost = totalTokens * costPerToken

  return cost
}
```

**Example:**
- Scenario: "Save me from date" (20 chars = 5 tokens)
- Duration: 5 minutes
- Turns: 5 × 4 = 20
- Total tokens: 5 × 20 = 100 tokens
- Cost: (100 / 1,000,000) × $0.10 = **$0.00001** (negligible!)

**Display:**
- If cost < $0.10: Don't show (rounds to $0.00)
- If cost >= $0.10: Show "+ scenario context"

---

## Testing Checklist

### Frontend Testing

**Duration Selector:**
- [ ] Renders correctly on desktop (4 columns)
- [ ] Renders correctly on mobile (2 columns)
- [ ] 5-minute option shows "Popular" badge
- [ ] Active selection highlights with gradient
- [ ] Hover effects work smoothly
- [ ] Price updates based on user tier
- [ ] "Included" shows for subscription users
- [ ] Scenario cost adds to total
- [ ] Long scenarios show token warning
- [ ] Estimate breakdown is accurate

**Schedule View Integration:**
- [ ] Duration selector replaces old input
- [ ] Selected duration updates form state
- [ ] Cost estimate updates in real-time
- [ ] Form submission includes duration
- [ ] Works with scenario input
- [ ] Mobile layout looks good

**User Store:**
- [ ] Fetches subscription on login
- [ ] Defaults to 'pay-per-call' if no sub
- [ ] Subscription state persists
- [ ] Tier changes update UI immediately

---

### Backend Testing

**SMS Handler:**
- [ ] Receives Twilio webhooks
- [ ] Parses "PERSONA NOW" correctly
- [ ] Parses "PERSONA 5PM" correctly
- [ ] Parses "PERSONA NOW scenario text" correctly
- [ ] Finds user by phone number
- [ ] Validates persona exists
- [ ] Checks payment method
- [ ] Respects subscription limits
- [ ] Schedules call correctly
- [ ] Sends confirmation SMS
- [ ] Handles "HELP" command
- [ ] Handles "CANCEL" command
- [ ] Error messages are clear

**API Endpoints:**
- [ ] `/api/twilio/sms` receives webhooks
- [ ] `/api/user/subscription` returns tier
- [ ] `/api/calls` accepts duration parameter
- [ ] Call orchestrator stores duration
- [ ] Voice pipeline enforces duration limit

**Database:**
- [ ] `user_subscriptions` table exists
- [ ] Subscription queries work
- [ ] Duration stored in `calls` table
- [ ] Scheduled calls include duration

---

### Integration Testing

**End-to-End Flow (Web):**
1. [ ] User logs in
2. [ ] Subscription tier loads
3. [ ] Navigate to Schedule page
4. [ ] Duration selector shows correct pricing
5. [ ] Select persona and duration
6. [ ] Add optional scenario
7. [ ] Cost estimate is accurate
8. [ ] Submit call request
9. [ ] Call triggers at scheduled time
10. [ ] Call ends at duration limit
11. [ ] Final cost matches estimate

**End-to-End Flow (SMS):**
1. [ ] Text "BRAD NOW" to Twilio number
2. [ ] Receive confirmation SMS
3. [ ] Call triggers in ~1 minute
4. [ ] Phone rings
5. [ ] Answer and talk to Brad
6. [ ] Call ends at 5-minute mark
7. [ ] Charged correct amount

**Cross-Platform:**
- [ ] Web app works (Chrome, Safari, Firefox)
- [ ] Mobile web works (iOS Safari, Android Chrome)
- [ ] SMS works from any phone
- [ ] Desktop and mobile show same pricing
- [ ] All features accessible on both platforms

---

## Deployment Steps

### Step 1: Deploy Frontend Changes

```bash
# From /call-me-back directory

# 1. Test locally
npm run dev
# Verify duration selector works at http://localhost:3007

# 2. Build for production
npm run build

# 3. Deploy frontend (method depends on your hosting)
# If using Raindrop static hosting:
raindrop deploy --frontend

# Or manual deployment to your hosting provider
```

**Verify:**
- [ ] Duration selector visible
- [ ] Pricing correct for all tiers
- [ ] No console errors
- [ ] Mobile responsive

---

### Step 2: Deploy Backend Changes

```bash
# From /call-me-back directory

# 1. Update raindrop.manifest
# Add sms-handler service (already defined in Task 2.2)

# 2. Run build validation
raindrop build validate

# 3. Deploy to Raindrop
raindrop build generate
raindrop build

# 4. Verify deployment
raindrop status
```

**Verify:**
- [ ] All 8 services deployed (7 existing + sms-handler)
- [ ] No build errors
- [ ] Environment variables set
- [ ] Services communicating

---

### Step 3: Configure Twilio

```bash
# 1. Set environment variables in Raindrop
raindrop env set TWILIO_SMS_NUMBER="+15551234567"

# Already set (verify):
# TWILIO_ACCOUNT_SID
# TWILIO_AUTH_TOKEN

# 2. Configure Twilio webhook (in Twilio Console)
# Phone Number → Messaging → Configure
# A MESSAGE COMES IN:
#   URL: https://[YOUR-APP-URL]/api/twilio/sms
#   Method: POST
```

**Verify:**
- [ ] Environment variables set
- [ ] Webhook URL configured
- [ ] Test SMS received

---

### Step 4: Test in Production

**Test Cases:**

1. **Web - Pay-Per-Call:**
   - [ ] Log in as new user
   - [ ] Schedule 5-minute call
   - [ ] Verify pricing: $4.99
   - [ ] Call works end-to-end

2. **Web - Subscriber:**
   - [ ] Create test subscription (SQL insert)
   - [ ] Log in
   - [ ] Verify "Included" shows for 5min
   - [ ] Schedule call
   - [ ] Call works, not charged

3. **SMS - Basic:**
   - [ ] Text "BRAD NOW" from registered phone
   - [ ] Receive confirmation
   - [ ] Get call in ~1 minute
   - [ ] Call ends at 5 minutes

4. **SMS - Scheduled:**
   - [ ] Text "EMMA 5PM"
   - [ ] Receive confirmation
   - [ ] Verify scheduled_calls table
   - [ ] Receive call at 5pm

5. **SMS - With Scenario:**
   - [ ] Text "BRAD NOW save me from date"
   - [ ] Receive confirmation mentioning scenario
   - [ ] Call includes scenario context

6. **SMS - Error Cases:**
   - [ ] Text from unregistered number → gets signup message
   - [ ] Text invalid persona → gets persona list
   - [ ] Text "HELP" → gets command guide
   - [ ] Text "CANCEL" → cancels call

---

### Step 5: Monitor & Debug

**Set up monitoring:**

```bash
# Watch logs in real-time
raindrop logs --follow

# Filter by service
raindrop logs sms-handler --follow
raindrop logs call-orchestrator --follow

# Check for errors
raindrop logs --level error
```

**Key Metrics to Track:**
- SMS delivery rate (should be >99%)
- SMS → Call conversion (% of SMS that result in calls)
- Call completion rate
- Average call duration
- Cost per call (actual vs estimate)

**Common Issues:**

| Issue | Cause | Fix |
|-------|-------|-----|
| SMS not received | Webhook not configured | Check Twilio console |
| "Persona not found" | Case sensitivity | Make parsing case-insensitive |
| Call doesn't trigger | Scheduler not running | Check call-orchestrator logs |
| Duration not enforced | Timer not implemented | Add timer in voice-pipeline |
| Wrong pricing displayed | Tier not loading | Check /api/user/subscription |

---

## Post-Launch: Next Features

### Priority 1 (Week 2-3)
- [ ] Subscription management UI (upgrade/downgrade)
- [ ] Stripe integration for subscriptions
- [ ] Real-time cost ticker during calls
- [ ] Memory editor UI

### Priority 2 (Month 2)
- [ ] SMS two-way conversations
- [ ] Call recording & playback
- [ ] Usage analytics dashboard
- [ ] Referral program

### Priority 3 (Month 3+)
- [ ] Per-persona dedicated numbers
- [ ] Voice cloning for Pro tier
- [ ] Custom persona creation
- [ ] API for developers

---

## Success Metrics

### Week 1 (After Launch)
- [ ] 50+ duration selections made
- [ ] 20+ SMS calls scheduled
- [ ] 0 critical bugs
- [ ] 95%+ call completion rate

### Month 1
- [ ] 500+ calls with duration selector
- [ ] 100+ SMS calls
- [ ] 30%+ of users try SMS
- [ ] <5% support requests about pricing

### Month 3
- [ ] 50%+ of calls scheduled via SMS
- [ ] 60%+ of users on subscriptions
- [ ] $10K+ MRR
- [ ] 4.5+ star user rating

---

## Resources & Documentation

### Official Documentation
- [Twilio SMS Webhooks](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply)
- [Raindrop Framework](https://docs.liquidmetal.ai)
- [Vue 3 Composition API](https://vuejs.org/guide/introduction.html)
- [Pinia State Management](https://pinia.vuejs.org)

### Internal Documentation
- `API_COSTS_AND_PROFITABILITY_2025.md` - Complete pricing strategy
- `DOCUMENTATION_INDEX.md` - Guide to all docs
- `HOW_THIS_APP_WORKS.md` - System architecture
- `API_SPECIFICATION.md` - All API endpoints

### Cost References
- Twilio SMS: $0.0079/message
- Twilio Voice: $0.014/min
- ElevenLabs: $0.15/1K chars (Turbo)
- Cerebras: $0.10/1M tokens
- Deepgram: $0.0059/min
- Stripe: 3.4% + $0.30

---

## Questions or Blockers?

### Before You Start:
- [ ] Have Twilio account with SMS capability
- [ ] Have payment method for Twilio number ($1.15/mo)
- [ ] Can deploy to Raindrop
- [ ] Have test phone number(s) for SMS testing

### During Implementation:
- Check `/documentation` folder for detailed references
- Use `raindrop logs` to debug issues
- Test each task individually before moving to next
- Commit frequently with clear messages

### After Completion:
- Update `DOCUMENTATION_INDEX.md` with new features
- Document any deviations from this plan
- Share learnings (what worked, what didn't)
- Celebrate! 🎉

---

**Good luck! This is going to be awesome! 🚀**

---

**Last Updated:** January 2025
**Next Review:** After Phase 1 completion
**Owner:** Development Team
