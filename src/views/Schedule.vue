<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] pt-24 pb-16 px-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] top-[15%] right-[5%] opacity-12 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[500px] h-[500px] bottom-[10%] -left-[150px] opacity-15 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-black mb-4 tracking-tight">
          <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Schedule a Call</span>
        </h1>
        <p class="text-lg text-cream/70">Instant or scheduled - your AI companions are ready</p>
      </div>

      <div class="grid lg:grid-cols-2 gap-8 mb-12">
        <!-- Quick Call Section -->
        <div class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/30 overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-glow/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>

            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <div class="text-4xl">⚡</div>
                <h2 class="text-3xl font-[--font-display] font-bold">Quick Call Now</h2>
              </div>
              <p class="text-cream/60 mb-8">Get an immediate call from your chosen persona</p>

              <form @submit.prevent="handleQuickCall" class="space-y-6">
                <div class="space-y-2">
                  <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Phone Number</label>
                  <input
                    v-model="quickCall.phoneNumber"
                    type="tel"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                    placeholder="+1234567890"
                    required
                  />
                  <p class="text-xs text-cream/40 pl-1">E.164 format (e.g., +1234567890)</p>
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Choose Persona</label>
                  <select
                    v-model="quickCall.personaId"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
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

                <div class="space-y-2">
                  <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Duration (minutes)</label>
                  <input
                    v-model.number="quickCall.estimatedDuration"
                    type="number"
                    min="1"
                    max="30"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                </div>

                <!-- Call Scenario Section -->
                <div class="space-y-3 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <label class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-cream/80">
                    <span class="text-2xl">🎭</span>
                    Call Scenario (Optional)
                  </label>
                  <p class="text-sm text-cream/50">Set the context - what should your persona know about this call?</p>

                  <div v-if="scenarioTemplates.length > 0" class="flex flex-wrap gap-2">
                    <button
                      v-for="template in scenarioTemplates"
                      :key="template.id"
                      type="button"
                      class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold hover:bg-glow/20 hover:border-glow/40 transition-all duration-300"
                      :class="{ 'bg-glow/20 border-glow/40': quickCall.selectedTemplate === template.id }"
                      @click="useTemplate(template)"
                    >
                      {{ template.icon }} {{ template.name }}
                    </button>
                  </div>

                  <textarea
                    v-model="quickCall.scenario"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300 resize-vertical"
                    placeholder="Example: 'Call to save me from a bad date. Talk about an urgent work matter...'"
                    rows="3"
                  />

                  <div v-if="quickCall.scenario" class="flex items-center justify-between text-xs">
                    <span class="text-cream/40">~{{ estimateTokens(quickCall.scenario) }} tokens</span>
                    <label class="flex items-center gap-2 cursor-pointer text-cream/60 hover:text-cream transition-colors">
                      <input type="checkbox" v-model="quickCall.saveAsTemplate" class="rounded" />
                      <span>Save as template</span>
                    </label>
                  </div>
                </div>

                <div v-if="quickCall.cost" class="bg-glow/10 border border-glow/20 rounded-xl p-4">
                  <div class="text-lg font-bold mb-1">Estimated Cost: <span class="text-glow">${{ quickCall.cost.toFixed(2) }}</span></div>
                  <p class="text-xs text-cream/60">Connection fee: $0.25 + $0.40/min{{ quickCall.scenario ? ' + scenario context' : '' }}</p>
                </div>

                <div v-if="quickCallError" class="bg-solar/10 border border-solar/30 rounded-xl p-4">
                  <p class="text-sm text-cream font-medium">{{ quickCallError }}</p>
                </div>

                <div v-if="quickCallSuccess" class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p class="text-sm text-cream font-medium">Call initiated! You should receive a call shortly.</p>
                </div>

                <button
                  type="submit"
                  class="w-full px-8 py-5 bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-xl text-deep text-lg font-black uppercase tracking-wider hover:bg-[position:100%_0] transition-all duration-500 hover:scale-[1.02] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_16px_50px_rgba(251,191,36,0.4)] disabled:opacity-50"
                  :disabled="quickCallLoading"
                >
                  {{ quickCallLoading ? 'Initiating Call...' : 'Call Me Now ⚡' }}
                </button>
              </form>
            </div>
          </div>
        </div>

        <!-- Schedule Future Call Section -->
        <div class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-ember/30 overflow-hidden">
            <div class="absolute top-0 right-0 w-40 h-40 bg-ember/10 -mr-20 -mt-20 rounded-full blur-3xl"></div>

            <div class="relative z-10">
              <div class="flex items-center gap-3 mb-6">
                <div class="text-4xl">📅</div>
                <h2 class="text-3xl font-[--font-display] font-bold">Schedule Future Call</h2>
              </div>
              <p class="text-cream/60 mb-8">Plan ahead for a specific time</p>

              <form @submit.prevent="handleScheduleCall" class="space-y-6">
                <div class="space-y-2">
                  <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Phone Number</label>
                  <input
                    v-model="scheduledCall.phoneNumber"
                    type="tel"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
                    placeholder="+1234567890"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Choose Persona</label>
                  <select
                    v-model="scheduledCall.personaId"
                    class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
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

                <div class="grid grid-cols-2 gap-4">
                  <div class="space-y-2">
                    <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Date</label>
                    <input
                      v-model="scheduledCall.date"
                      type="date"
                      class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
                      :min="minDate"
                      required
                    />
                  </div>

                  <div class="space-y-2">
                    <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Time</label>
                    <input
                      v-model="scheduledCall.time"
                      type="time"
                      class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div v-if="scheduleError" class="bg-solar/10 border border-solar/30 rounded-xl p-4">
                  <p class="text-sm text-cream font-medium">{{ scheduleError }}</p>
                </div>

                <div v-if="scheduleSuccess" class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <p class="text-sm text-cream font-medium">Call scheduled successfully!</p>
                </div>

                <button
                  type="submit"
                  class="w-full px-8 py-5 bg-gradient-to-r from-ember to-solar rounded-xl text-deep text-lg font-black uppercase tracking-wider hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_32px_rgba(255,140,66,0.4)] disabled:opacity-50"
                  :disabled="scheduleLoading"
                >
                  {{ scheduleLoading ? 'Scheduling...' : 'Schedule Call 📅' }}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Scheduled Calls List -->
      <div v-if="callsStore.scheduledCalls.length > 0" class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
        <h2 class="text-3xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-solar rounded-full"></span>
          Upcoming Scheduled Calls
        </h2>

        <div class="space-y-4">
          <div
            v-for="call in callsStore.scheduledCalls"
            :key="call.id"
            class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6 flex items-center justify-between hover:border-solar/30 transition-all duration-300"
          >
            <div>
              <h3 class="text-xl font-bold mb-2">{{ getPersonaName(call.persona_id) }}</h3>
              <p class="text-cream/60 mb-1">{{ formatScheduledTime(call.scheduled_time) }}</p>
              <p class="text-sm text-cream/40">To: {{ call.phone_number }}</p>
            </div>
            <button
              @click="cancelCall(call.id)"
              class="px-6 py-3 bg-red-500/20 border-2 border-red-500/30 rounded-xl text-red-400 font-bold hover:bg-red-500/30 transition-all duration-300"
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
  const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4)
  quickCall.value.cost = baseCost + scenarioCost
})

watch(() => quickCall.value.scenario, () => {
  const duration = quickCall.value.estimatedDuration
  const baseCost = 0.25 + (duration * 0.40)
  const scenarioTokens = quickCall.value.scenario ? estimateTokens(quickCall.value.scenario) : 0
  const scenarioCost = (scenarioTokens / 1000000) * 0.10 * (duration * 4)
  quickCall.value.cost = baseCost + scenarioCost
})

const estimateTokens = (text) => {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

const useTemplate = (template) => {
  quickCall.value.scenario = template.scenario_text
  quickCall.value.selectedTemplate = template.id
}

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const handleQuickCall = async () => {
  quickCallLoading.value = true
  quickCallError.value = ''
  quickCallSuccess.value = false

  try {
    if (quickCall.value.saveAsTemplate && quickCall.value.scenario) {
      const templateName = prompt('Enter a name for this scenario template:')
      if (templateName) {
        console.log('Would save template:', templateName, quickCall.value.scenario)
      }
    }

    const paymentIntent = await userStore.createPaymentIntent(quickCall.value.estimatedDuration)

    await callsStore.triggerCall(
      quickCall.value.phoneNumber,
      quickCall.value.personaId,
      paymentIntent.payment_intent_id,
      quickCall.value.scenario || null
    )

    quickCallSuccess.value = true

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
    const scheduledTime = new Date(`${scheduledCall.value.date}T${scheduledCall.value.time}`)

    if (scheduledTime <= new Date()) {
      scheduleError.value = 'Scheduled time must be in the future'
      scheduleLoading.value = false
      return
    }

    const paymentIntent = await userStore.createPaymentIntent(5)

    await callsStore.scheduleCall(
      scheduledCall.value.phoneNumber,
      scheduledCall.value.personaId,
      scheduledTime.toISOString(),
      paymentIntent.payment_intent_id
    )

    scheduleSuccess.value = true

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
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}
</style>
