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

                <!-- Call Context Section for Scheduled Calls -->
                <div class="space-y-4 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <label class="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-cream/80">
                    <span class="text-2xl">🎯</span>
                    Call Context (Optional)
                  </label>
                  <p class="text-sm text-cream/50">Give your persona context about why you're scheduling this call</p>

                  <!-- Prefab Context Buttons -->
                  <div class="space-y-2">
                    <label class="block text-xs text-cream/50 uppercase tracking-wider">Quick Contexts</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="prefab in scheduledPrefabs"
                        :key="prefab.id"
                        type="button"
                        class="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-ember/20 hover:border-ember/40 transition-all duration-300 flex items-center gap-2"
                        :class="{ 'bg-ember/20 border-ember/40': scheduledCall.selectedPrefab === prefab.id }"
                        @click="useScheduledPrefab(prefab)"
                      >
                        <span>{{ prefab.icon }}</span>
                        <span>{{ prefab.name }}</span>
                        <button
                          v-if="prefab.isCustom"
                          type="button"
                          @click.stop="deletePrefab(prefab.id)"
                          class="ml-1 text-red-400 hover:text-red-300 text-xs"
                          title="Delete this prefab"
                        >✕</button>
                      </button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="block text-sm text-cream/70">What would you like to discuss?</label>
                    <textarea
                      v-model="scheduledCall.callPretext"
                      class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 resize-vertical"
                      placeholder="e.g., Help me prepare for my marathon training this week..."
                      rows="3"
                    />
                    <!-- Save as prefab option -->
                    <div v-if="scheduledCall.callPretext && scheduledCall.callPretext.length > 10" class="flex items-center justify-end">
                      <button
                        type="button"
                        @click="savePrefab"
                        class="text-xs text-ember/70 hover:text-ember transition-colors flex items-center gap-1"
                      >
                        <span>💾</span> Save as Quick Context
                      </button>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <label class="block text-sm text-cream/70">Call Type</label>
                    <select
                      v-model="scheduledCall.callScenario"
                      class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
                    >
                      <option value="">General Conversation</option>
                      <option value="fitness_coaching">Fitness Coaching</option>
                      <option value="interview_prep">Interview Prep</option>
                      <option value="language_practice">Language Practice</option>
                      <option value="therapy_session">Supportive Check-in</option>
                      <option value="emergency_escape">Emergency Escape Call</option>
                    </select>
                  </div>

                  <div class="space-y-2">
                    <label class="block text-sm text-cream/70">Call Duration (minutes)</label>
                    <input
                      v-model.number="scheduledCall.maxDurationMinutes"
                      type="number"
                      min="1"
                      max="60"
                      class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300"
                      placeholder="5"
                    />
                    <p class="text-xs text-cream/40 pl-1">1-60 minutes</p>
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
          <span class="w-2 h-2 bg-solar rounded-full animate-pulse"></span>
          Upcoming Scheduled Calls
        </h2>

        <div class="space-y-4">
          <div
            v-for="call in callsStore.scheduledCalls"
            :key="call.id"
            class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl overflow-hidden hover:border-solar/30 transition-all duration-300"
          >
            <!-- Main Call Info Row -->
            <div class="p-6 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-bold">{{ getPersonaName(call.persona_id) }}</h3>
                  <span v-if="call.call_scenario" class="px-2 py-1 bg-ember/20 border border-ember/30 rounded-lg text-xs font-medium text-ember">
                    {{ formatScenario(call.call_scenario) }}
                  </span>
                  <span v-if="call.max_duration_minutes" class="px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-cream/60">
                    {{ call.max_duration_minutes }} min
                  </span>
                </div>
                <p class="text-cream/60 mb-1">{{ formatScheduledTime(call.scheduled_time) }}</p>
                <p class="text-sm text-cream/40">To: {{ call.phone_number }}</p>
              </div>
              <div class="flex items-center gap-3">
                <!-- Expand/Collapse Button -->
                <button
                  v-if="call.call_pretext || call.custom_instructions"
                  @click="toggleCallDetails(call.id)"
                  class="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-cream/60 hover:bg-white/10 hover:text-cream transition-all duration-300 flex items-center gap-2"
                >
                  <span class="text-sm">{{ expandedCalls[call.id] ? 'Hide' : 'Details' }}</span>
                  <span class="transition-transform duration-300" :class="{ 'rotate-180': expandedCalls[call.id] }">▼</span>
                </button>
                <button
                  @click="cancelCall(call.id)"
                  class="px-6 py-3 bg-red-500/20 border-2 border-red-500/30 rounded-xl text-red-400 font-bold hover:bg-red-500/30 transition-all duration-300"
                  :disabled="cancelLoading[call.id]"
                >
                  {{ cancelLoading[call.id] ? 'Cancelling...' : 'Cancel' }}
                </button>
              </div>
            </div>

            <!-- Expandable Details Section -->
            <div
              v-if="expandedCalls[call.id] && (call.call_pretext || call.custom_instructions)"
              class="px-6 pb-6 pt-2 border-t border-white/10 bg-white/[0.02] space-y-4 animate-[fadeIn_0.2s_ease-out]"
            >
              <div v-if="call.call_pretext" class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-cream/50 flex items-center gap-2">
                  <span>🎯</span> Call Context
                </label>
                <p class="text-sm text-cream/80 bg-white/5 rounded-xl p-4 border border-white/10">
                  {{ call.call_pretext }}
                </p>
              </div>
              <div v-if="call.custom_instructions" class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-cream/50 flex items-center gap-2">
                  <span>📝</span> Custom Instructions
                </label>
                <p class="text-sm text-cream/80 bg-white/5 rounded-xl p-4 border border-white/10">
                  {{ call.custom_instructions }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Completed Calls -->
      <div v-if="callsStore.calls && callsStore.calls.length > 0" class="mt-12 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s]">
        <h2 class="text-3xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-glow rounded-full"></span>
          Recent Calls
        </h2>

        <div class="space-y-4">
          <div
            v-for="call in callsStore.calls.slice(0, 5)"
            :key="call.id"
            class="relative bg-gradient-to-br from-white/[0.05] to-white/[0.01] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-glow/20 transition-all duration-300"
          >
            <!-- Main Call Info Row -->
            <div class="p-5 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-lg font-bold">{{ getPersonaName(call.persona_id) }}</h3>
                  <span
                    class="px-2 py-1 rounded-lg text-xs font-medium"
                    :class="getStatusClass(call.status)"
                  >
                    {{ call.status }}
                  </span>
                  <span v-if="call.duration_seconds" class="text-xs text-cream/50">
                    {{ formatDuration(call.duration_seconds) }}
                  </span>
                </div>
                <p class="text-sm text-cream/50">{{ formatScheduledTime(call.created_at) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <!-- Expand/Collapse Button -->
                <button
                  v-if="call.call_pretext || call.custom_instructions"
                  @click="toggleCallDetails(call.id)"
                  class="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-cream/50 hover:bg-white/10 hover:text-cream transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <span>{{ expandedCalls[call.id] ? 'Hide' : 'Details' }}</span>
                  <span class="transition-transform duration-300 text-xs" :class="{ 'rotate-180': expandedCalls[call.id] }">▼</span>
                </button>
              </div>
            </div>

            <!-- Expandable Details Section -->
            <div
              v-if="expandedCalls[call.id] && (call.call_pretext || call.custom_instructions)"
              class="px-5 pb-5 pt-2 border-t border-white/10 bg-white/[0.02] space-y-3 animate-[fadeIn_0.2s_ease-out]"
            >
              <div v-if="call.call_pretext" class="space-y-1">
                <label class="text-xs font-bold uppercase tracking-wider text-cream/40 flex items-center gap-2">
                  <span>🎯</span> Call Context
                </label>
                <p class="text-sm text-cream/70 bg-white/5 rounded-lg p-3 border border-white/10">
                  {{ call.call_pretext }}
                </p>
              </div>
              <div v-if="call.custom_instructions" class="space-y-1">
                <label class="text-xs font-bold uppercase tracking-wider text-cream/40 flex items-center gap-2">
                  <span>📝</span> Custom Instructions
                </label>
                <p class="text-sm text-cream/70 bg-white/5 rounded-lg p-3 border border-white/10">
                  {{ call.custom_instructions }}
                </p>
              </div>
            </div>
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
  time: '',
  callPretext: '',
  callScenario: '',
  maxDurationMinutes: 5,
  selectedPrefab: null
})

// Default prefabs for scheduled calls
const defaultScheduledPrefabs = [
  {
    id: 'sched-1',
    name: 'Motivation Boost',
    icon: '💪',
    text: 'Give me a motivational pep talk to start my day strong. Remind me of my goals and help me feel energized and focused.',
    isCustom: false
  },
  {
    id: 'sched-2',
    name: 'Escape Call',
    icon: '🆘',
    text: 'Call to rescue me from a situation. Pretend there\'s an urgent matter that needs my attention. Be convincing but natural.',
    isCustom: false
  },
  {
    id: 'sched-3',
    name: 'Check-In',
    icon: '💬',
    text: 'Just calling to check in and see how I\'m doing. Be a supportive friend and listen to what\'s on my mind.',
    isCustom: false
  },
  {
    id: 'sched-4',
    name: 'Accountability',
    icon: '📋',
    text: 'Help me stay accountable to my goals. Ask about my progress and encourage me to stay on track. Be supportive but firm.',
    isCustom: false
  },
  {
    id: 'sched-5',
    name: 'Interview Prep',
    icon: '🎯',
    text: 'Help me prepare for an upcoming interview. Ask me practice questions and give me feedback on my answers.',
    isCustom: false
  },
  {
    id: 'sched-6',
    name: 'Wind Down',
    icon: '🌙',
    text: 'Help me wind down and relax. Have a calm, soothing conversation to help me de-stress after a long day.',
    isCustom: false
  }
]

// Load custom prefabs from localStorage
const customPrefabs = ref([])
const loadCustomPrefabs = () => {
  try {
    const saved = localStorage.getItem('cmb_scheduled_prefabs')
    if (saved) {
      customPrefabs.value = JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed to load custom prefabs:', e)
  }
}

const saveCustomPrefabs = () => {
  try {
    localStorage.setItem('cmb_scheduled_prefabs', JSON.stringify(customPrefabs.value))
  } catch (e) {
    console.warn('Failed to save custom prefabs:', e)
  }
}

// Combined prefabs (defaults + custom)
const scheduledPrefabs = computed(() => [
  ...defaultScheduledPrefabs,
  ...customPrefabs.value
])

const useScheduledPrefab = (prefab) => {
  scheduledCall.value.callPretext = prefab.text
  scheduledCall.value.selectedPrefab = prefab.id
}

const savePrefab = () => {
  const name = prompt('Enter a name for this quick context:')
  if (!name || !name.trim()) return

  const icon = prompt('Choose an emoji icon (or press Enter for default):', '⭐') || '⭐'

  const newPrefab = {
    id: 'custom-' + Date.now(),
    name: name.trim(),
    icon: icon,
    text: scheduledCall.value.callPretext,
    isCustom: true
  }

  customPrefabs.value.push(newPrefab)
  saveCustomPrefabs()
  scheduledCall.value.selectedPrefab = newPrefab.id
}

const deletePrefab = (prefabId) => {
  if (!confirm('Delete this quick context?')) return
  customPrefabs.value = customPrefabs.value.filter(p => p.id !== prefabId)
  saveCustomPrefabs()
  if (scheduledCall.value.selectedPrefab === prefabId) {
    scheduledCall.value.selectedPrefab = null
  }
}

const scheduleLoading = ref(false)
const scheduleError = ref('')
const scheduleSuccess = ref(false)

const cancelLoading = ref({})
const expandedCalls = ref({})

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

    // Validate minimum 1 minute in the future (cron runs every minute)
    const minTime = new Date(Date.now() + 1 * 60 * 1000)
    if (scheduledTime < minTime) {
      scheduleError.value = 'Must schedule at least 1 minute in advance'
      scheduleLoading.value = false
      return
    }

    await callsStore.scheduleCall(
      scheduledCall.value.phoneNumber,
      scheduledCall.value.personaId,
      scheduledTime.toISOString(),
      {
        callPretext: scheduledCall.value.callPretext || undefined,
        callScenario: scheduledCall.value.callScenario || undefined,
        maxDurationMinutes: scheduledCall.value.maxDurationMinutes || 5
      }
    )

    scheduleSuccess.value = true

    setTimeout(() => {
      scheduledCall.value = {
        phoneNumber: '',
        personaId: '',
        date: '',
        time: '',
        callPretext: '',
        callScenario: '',
        maxDurationMinutes: 5,
        selectedPrefab: null
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

const toggleCallDetails = (callId) => {
  expandedCalls.value[callId] = !expandedCalls.value[callId]
}

const formatScenario = (scenario) => {
  const labels = {
    'fitness_coaching': 'Fitness',
    'interview_prep': 'Interview Prep',
    'language_practice': 'Language',
    'therapy_session': 'Check-in',
    'emergency_escape': 'Escape Call'
  }
  return labels[scenario] || scenario
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
}

const getStatusClass = (status) => {
  const classes = {
    'completed': 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400',
    'in-progress': 'bg-glow/20 border border-glow/30 text-glow',
    'failed': 'bg-red-500/20 border border-red-500/30 text-red-400',
    'cancelled': 'bg-white/10 border border-white/20 text-cream/50'
  }
  return classes[status] || 'bg-white/10 border border-white/20 text-cream/60'
}

onMounted(async () => {
  loadCustomPrefabs()
  await personasStore.fetchContacts()
  await callsStore.fetchScheduledCalls()
  await callsStore.fetchCalls()
})
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
