<template>
  <div class="schedule-page">
    <h1 class="page-title">Schedule a Call</h1>

    <div class="schedule-container">
      <!-- Quick Call Section -->
      <div class="card">
        <h2 class="card-title">Quick Call Now</h2>
        <p class="text-muted mb-1">Get an immediate call from your chosen persona</p>

        <form @submit.prevent="handleQuickCall" class="schedule-form">
          <div class="form-group">
            <label class="form-label" for="quick-phone">Phone Number</label>
            <input
              id="quick-phone"
              v-model="quickCall.phoneNumber"
              type="tel"
              class="form-control"
              placeholder="+1234567890"
              required
            />
            <small class="form-hint">E.164 format (e.g., +1234567890)</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="quick-persona">Choose Persona</label>
            <select
              id="quick-persona"
              v-model="quickCall.personaId"
              class="form-control"
              required
            >
              <option value="">Select a persona...</option>
              <option
                v-for="contact in personasStore.userContacts"
                :key="contact.id"
                :value="contact.id"
              >
                {{ contact.name }} - {{ contact.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="quick-duration">Estimated Duration (minutes)</label>
            <input
              id="quick-duration"
              v-model.number="quickCall.estimatedDuration"
              type="number"
              min="1"
              max="30"
              class="form-control"
              required
            />
          </div>

          <!-- NEW: Call Scenario Section -->
          <div class="form-group scenario-section">
            <label class="form-label">
              Call Scenario (Optional)
              <span class="scenario-badge">🎭</span>
            </label>
            <p class="form-hint">
              Set the context for this call - what should the persona know about this specific situation?
            </p>

            <!-- Template Quick-Select -->
            <div v-if="scenarioTemplates.length > 0" class="template-chips">
              <button
                v-for="template in scenarioTemplates"
                :key="template.id"
                type="button"
                class="template-chip"
                @click="useTemplate(template)"
                :class="{ 'template-chip-active': quickCall.selectedTemplate === template.id }"
              >
                {{ template.icon }} {{ template.name }}
              </button>
            </div>

            <!-- Custom Scenario Text -->
            <textarea
              id="quick-scenario"
              v-model="quickCall.scenario"
              class="form-control scenario-textarea"
              placeholder="Example: 'Call to save me from a potentially lame date. Talk about movies and your mother to give me an excuse to leave.'"
              rows="3"
            />

            <div v-if="quickCall.scenario" class="scenario-meta">
              <small class="scenario-tokens">
                ~{{ estimateTokens(quickCall.scenario) }} tokens
                {{ estimateTokens(quickCall.scenario) > 500 ? '⚠️ Long scenario may increase cost' : '' }}
              </small>
            </div>

            <!-- Save as Template -->
            <label v-if="quickCall.scenario && quickCall.scenario.length > 20" class="save-template-checkbox">
              <input
                type="checkbox"
                v-model="quickCall.saveAsTemplate"
              />
              Save this scenario as a reusable template
            </label>
          </div>

          <div v-if="quickCall.cost" class="cost-estimate">
            <strong>Estimated Cost:</strong> ${{ quickCall.cost.toFixed(2) }}
            <br />
            <small>(Connection fee: $0.25 + $0.40/min{{ quickCall.scenario ? ' + scenario context' : '' }})</small>
          </div>

          <div v-if="quickCallError" class="error-message">
            {{ quickCallError }}
          </div>

          <div v-if="quickCallSuccess" class="success-message">
            Call initiated! You should receive a call shortly.
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-block"
            :disabled="quickCallLoading"
          >
            {{ quickCallLoading ? 'Initiating Call...' : 'Call Me Now' }}
          </button>
        </form>
      </div>

      <!-- Schedule Future Call Section -->
      <div class="card">
        <h2 class="card-title">Schedule Future Call</h2>
        <p class="text-muted mb-1">Schedule a call for a specific time</p>

        <form @submit.prevent="handleScheduleCall" class="schedule-form">
          <div class="form-group">
            <label class="form-label" for="schedule-phone">Phone Number</label>
            <input
              id="schedule-phone"
              v-model="scheduledCall.phoneNumber"
              type="tel"
              class="form-control"
              placeholder="+1234567890"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="schedule-persona">Choose Persona</label>
            <select
              id="schedule-persona"
              v-model="scheduledCall.personaId"
              class="form-control"
              required
            >
              <option value="">Select a persona...</option>
              <option
                v-for="contact in personasStore.userContacts"
                :key="contact.id"
                :value="contact.id"
              >
                {{ contact.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="schedule-date">Date</label>
            <input
              id="schedule-date"
              v-model="scheduledCall.date"
              type="date"
              class="form-control"
              :min="minDate"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="schedule-time">Time</label>
            <input
              id="schedule-time"
              v-model="scheduledCall.time"
              type="time"
              class="form-control"
              required
            />
          </div>

          <div v-if="scheduleError" class="error-message">
            {{ scheduleError }}
          </div>

          <div v-if="scheduleSuccess" class="success-message">
            Call scheduled successfully!
          </div>

          <button
            type="submit"
            class="btn btn-success btn-block"
            :disabled="scheduleLoading"
          >
            {{ scheduleLoading ? 'Scheduling...' : 'Schedule Call' }}
          </button>
        </form>
      </div>

      <!-- Scheduled Calls List -->
      <div class="card">
        <h2 class="card-title">Upcoming Scheduled Calls</h2>

        <div v-if="callsStore.scheduledCalls.length === 0" class="empty-state">
          <p>No scheduled calls</p>
        </div>

        <div v-else class="scheduled-calls-list">
          <div
            v-for="call in callsStore.scheduledCalls"
            :key="call.id"
            class="scheduled-call-item"
          >
            <div class="call-info">
              <h3>{{ getPersonaName(call.persona_id) }}</h3>
              <p class="text-muted">
                {{ formatScheduledTime(call.scheduled_time) }}
              </p>
              <p class="text-muted">To: {{ call.phone_number }}</p>
            </div>
            <button
              @click="cancelCall(call.id)"
              class="btn btn-danger"
              :disabled="cancelLoading[call.id]"
            >
              {{ cancelLoading[call.id] ? 'Cancelling...' : 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useCallsStore } from '../stores/calls'
import { usePersonasStore } from '../stores/personas'
import { useUserStore } from '../stores/user'

const callsStore = useCallsStore()
const personasStore = usePersonasStore()
const userStore = useUserStore()

// Quick call form
const quickCall = ref({
  phoneNumber: '',
  personaId: '',
  estimatedDuration: 5,
  cost: 2.25,
  scenario: '',
  selectedTemplate: null,
  saveAsTemplate: false
})

const quickCallLoading = ref(false)
const quickCallError = ref('')
const quickCallSuccess = ref(false)

// Scenario templates
const scenarioTemplates = ref([
  // Default templates (can be loaded from API later)
  {
    id: 'default-1',
    name: 'Save Me From Bad Date',
    icon: '🆘',
    scenario_text: 'You\'re calling to save me from a potentially lame date. Act like there\'s an emergency or important situation that requires my immediate attention. Be convincing but not too serious - maybe talk about movies and your mother to give me an excuse to leave gracefully.'
  },
  {
    id: 'default-2',
    name: 'Boss Emergency',
    icon: '💼',
    scenario_text: 'You\'re my boss calling about an urgent work matter. There\'s a critical issue that needs my immediate attention. Be professional and direct, but understanding of the interruption.'
  },
  {
    id: 'default-3',
    name: 'Party Planning',
    icon: '🎉',
    scenario_text: 'We\'re planning a surprise party together and you\'re calling to coordinate last-minute details. Be excited and conspiratorial, making sure to act natural if someone might be listening nearby.'
  }
])

// Scheduled call form
const scheduledCall = ref({
  phoneNumber: '',
  personaId: '',
  date: '',
  time: ''
})

const scheduleLoading = ref(false)
const scheduleError = ref('')
const scheduleSuccess = ref(false)

const cancelLoading = ref({})

// Calculate cost based on estimated duration and scenario
watch(() => quickCall.value.estimatedDuration, (duration) => {
  const baseCost = 0.25 + (duration * 0.40)
  const scenarioTokens = quickCall.value.scenario ? estimateTokens(quickCall.value.scenario) : 0
  const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4) // Rough estimate
  quickCall.value.cost = baseCost + scenarioCost
})

watch(() => quickCall.value.scenario, () => {
  // Recalculate cost when scenario changes
  const duration = quickCall.value.estimatedDuration
  const baseCost = 0.25 + (duration * 0.40)
  const scenarioTokens = quickCall.value.scenario ? estimateTokens(quickCall.value.scenario) : 0
  const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4)
  quickCall.value.cost = baseCost + scenarioCost
})

// Helper function to estimate token count
const estimateTokens = (text) => {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

// Use a scenario template
const useTemplate = (template) => {
  quickCall.value.scenario = template.scenario_text
  quickCall.value.selectedTemplate = template.id
  // TODO: Increment template use count via API when integrated
}

// Minimum date for scheduling (today)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const handleQuickCall = async () => {
  quickCallLoading.value = true
  quickCallError.value = ''
  quickCallSuccess.value = false

  try {
    // Save scenario as template if requested
    if (quickCall.value.saveAsTemplate && quickCall.value.scenario) {
      const templateName = prompt('Enter a name for this scenario template:')
      if (templateName) {
        // TODO: API call to save template when backend is integrated
        // await callsStore.saveScenarioTemplate(templateName, quickCall.value.scenario)
        console.log('Would save template:', templateName, quickCall.value.scenario)
      }
    }

    // First, create payment intent
    const paymentIntent = await userStore.createPaymentIntent(quickCall.value.estimatedDuration)

    // Then trigger the call with scenario
    await callsStore.triggerCall(
      quickCall.value.phoneNumber,
      quickCall.value.personaId,
      paymentIntent.payment_intent_id,
      quickCall.value.scenario || null  // Include scenario
    )

    quickCallSuccess.value = true

    // Reset form
    setTimeout(() => {
      quickCall.value = {
        phoneNumber: '',
        personaId: '',
        estimatedDuration: 5,
        cost: 2.25,
        scenario: '',
        selectedTemplate: null,
        saveAsTemplate: false
      }
      quickCallSuccess.value = false
    }, 3000)
  } catch (err) {
    quickCallError.value = err.message || 'Failed to initiate call'
  } finally {
    quickCallLoading.value = false
  }
}

const handleScheduleCall = async () => {
  scheduleLoading.value = true
  scheduleError.value = ''
  scheduleSuccess.value = false

  try {
    // Combine date and time
    const scheduledTime = new Date(`${scheduledCall.value.date}T${scheduledCall.value.time}`)

    // Validate future time
    if (scheduledTime <= new Date()) {
      scheduleError.value = 'Scheduled time must be in the future'
      scheduleLoading.value = false
      return
    }

    // Create payment intent
    const paymentIntent = await userStore.createPaymentIntent(5)

    // Schedule the call
    await callsStore.scheduleCall(
      scheduledCall.value.phoneNumber,
      scheduledCall.value.personaId,
      scheduledTime.toISOString(),
      paymentIntent.payment_intent_id
    )

    scheduleSuccess.value = true

    // Reset form
    setTimeout(() => {
      scheduledCall.value = {
        phoneNumber: '',
        personaId: '',
        date: '',
        time: ''
      }
      scheduleSuccess.value = false
    }, 3000)
  } catch (err) {
    scheduleError.value = err.message || 'Failed to schedule call'
  } finally {
    scheduleLoading.value = false
  }
}

const cancelCall = async (callId) => {
  if (!confirm('Are you sure you want to cancel this scheduled call?')) return

  cancelLoading.value[callId] = true

  try {
    await callsStore.cancelScheduledCall(callId)
  } catch (err) {
    alert('Failed to cancel call: ' + err.message)
  } finally {
    delete cancelLoading.value[callId]
  }
}

const getPersonaName = (personaId) => {
  const persona = personasStore.personas.find(p => p.id === personaId)
  return persona ? persona.name : 'Unknown'
}

const formatScheduledTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

onMounted(async () => {
  await personasStore.fetchContacts()
  await callsStore.fetchScheduledCalls()
})
</script>

<style scoped>
.schedule-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  color: white;
  margin-bottom: 2rem;
  text-align: center;
}

.schedule-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.card-title {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.schedule-form {
  margin-top: 1.5rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.cost-estimate {
  background: #e7f3ff;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
  color: #0c5460;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.btn-block {
  width: 100%;
  margin-top: 1rem;
}

.scheduled-calls-list {
  margin-top: 1rem;
}

.scheduled-call-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.call-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.call-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

/* Scenario Section Styles */
.scenario-section {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  transition: border-color 0.3s;
}

.scenario-section:focus-within {
  border-color: #007bff;
  background: #fff;
}

.scenario-badge {
  font-size: 1.2em;
  margin-left: 0.5rem;
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
}

.template-chip {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 20px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #495057;
}

.template-chip:hover {
  border-color: #007bff;
  background: #e7f3ff;
  transform: translateY(-2px);
}

.template-chip-active {
  border-color: #007bff;
  background: #007bff;
  color: white;
}

.scenario-textarea {
  margin-top: 0.75rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.scenario-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.scenario-tokens {
  color: #6c757d;
  font-size: 0.85rem;
}

.save-template-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;
}

.save-template-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .schedule-container {
    grid-template-columns: 1fr;
  }

  .scheduled-call-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .scheduled-call-item .btn {
    width: 100%;
  }

  .template-chips {
    flex-direction: column;
  }

  .template-chip {
    width: 100%;
    text-align: left;
  }
}
</style>
