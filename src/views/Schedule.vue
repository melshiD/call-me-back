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

          <div v-if="quickCall.cost" class="cost-estimate">
            <strong>Estimated Cost:</strong> ${{ quickCall.cost.toFixed(2) }}
            <br />
            <small>(Connection fee: $0.25 + $0.40/min)</small>
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
  cost: 2.25
})

const quickCallLoading = ref(false)
const quickCallError = ref('')
const quickCallSuccess = ref(false)

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

// Calculate cost based on estimated duration
watch(() => quickCall.value.estimatedDuration, (duration) => {
  quickCall.value.cost = 0.25 + (duration * 0.40)
})

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
    // First, create payment intent
    const paymentIntent = await userStore.createPaymentIntent(quickCall.value.estimatedDuration)

    // Then trigger the call
    await callsStore.triggerCall(
      quickCall.value.phoneNumber,
      quickCall.value.personaId,
      paymentIntent.payment_intent_id
    )

    quickCallSuccess.value = true

    // Reset form
    setTimeout(() => {
      quickCall.value = {
        phoneNumber: '',
        personaId: '',
        estimatedDuration: 5,
        cost: 2.25
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
}
</style>
