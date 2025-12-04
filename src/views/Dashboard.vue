<template>
  <div class="min-h-screen bg-midnight text-cream font-[--font-body] pt-24 pb-16 px-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"></div>
      <div class="absolute w-[800px] h-[800px] -top-[300px] -right-[300px] opacity-8 pointer-events-none blur-[150px] animate-[float_25s_ease-in-out_infinite] bg-gradient-radial from-glow/60 via-ember/30 to-transparent"></div>
      <div class="absolute w-[600px] h-[600px] bottom-[5%] -left-[200px] opacity-10 pointer-events-none blur-[140px] animate-[float_30s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar/50 to-transparent"></div>
      <div class="absolute w-[400px] h-[400px] top-[40%] right-[10%] opacity-5 pointer-events-none blur-[100px] animate-[float_35s_ease-in-out_infinite] bg-gradient-radial from-ember/40 to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Warm Welcome Header -->
      <div class="mb-14 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-3 h-3 bg-gradient-to-br from-glow to-ember rounded-full animate-pulse"></div>
          <span class="text-sm text-cream/50 uppercase tracking-[0.25em] font-medium">Your Space</span>
        </div>
        <h1 class="text-5xl lg:text-7xl font-[--font-display] font-black mb-4 tracking-tight leading-[0.9]">
          <span class="text-cream">Welcome</span>
          <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent"> Back</span>
        </h1>
        <p class="text-xl text-cream/60 font-light max-w-lg">Ready when you are. Your AI companions are here to listen.</p>
      </div>

      <!-- Quick Actions - Softer Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
        <router-link to="/schedule" class="group relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.1] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(251,191,36,0.15)] overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-glow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 bg-gradient-to-br from-glow/20 to-ember/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <svg class="w-7 h-7 text-glow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-cream group-hover:text-glow transition-colors duration-300">Start a Call</h3>
            <p class="text-sm text-cream/50">Schedule your next conversation</p>
          </div>
        </router-link>

        <router-link to="/contacts" class="group relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.1] hover:border-ember/40 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(255,140,66,0.15)] overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-ember/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 bg-gradient-to-br from-ember/20 to-solar/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <svg class="w-7 h-7 text-ember" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-cream group-hover:text-ember transition-colors duration-300">Your Circle</h3>
            <p class="text-sm text-cream/50">People you've connected with</p>
          </div>
        </router-link>

        <router-link to="/contacts" class="group relative bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 transition-all duration-500 hover:bg-white/[0.1] hover:border-solar/40 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(255,107,53,0.15)] overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-solar/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10">
            <div class="w-14 h-14 bg-gradient-to-br from-solar/20 to-glow/10 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
              <svg class="w-7 h-7 text-solar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold mb-2 text-cream group-hover:text-solar transition-colors duration-300">Explore Personas</h3>
            <p class="text-sm text-cream/50">Discover & add new companions</p>
          </div>
        </router-link>
      </div>

      <!-- Usage Stats - Cleaner, No $ -->
      <div v-if="userStore.usageStats" class="mb-14 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-2 h-2 bg-glow rounded-full"></div>
          <h2 class="text-2xl font-[--font-display] font-bold text-cream/90">Your Time Together</h2>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-1 bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">{{ userStore.usageStats.total_calls }}</div>
            <div class="text-xs text-cream/50 uppercase tracking-wider">Conversations</div>
          </div>
          <div class="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-1 bg-gradient-to-r from-ember to-solar bg-clip-text text-transparent">{{ userStore.usageStats.total_minutes }}</div>
            <div class="text-xs text-cream/50 uppercase tracking-wider">Minutes Shared</div>
          </div>
          <div class="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-1 bg-gradient-to-r from-solar to-glow bg-clip-text text-transparent">{{ userStore.usageStats.current_month?.calls || 0 }}</div>
            <div class="text-xs text-cream/50 uppercase tracking-wider">This Month</div>
          </div>
          <div class="bg-gradient-to-r from-glow/10 via-ember/10 to-solar/10 backdrop-blur-xl border border-glow/20 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-1 text-cream">{{ userStore.usageStats.current_month?.minutes || 0 }}</div>
            <div class="text-xs text-cream/50 uppercase tracking-wider">Minutes This Month</div>
          </div>
        </div>
      </div>

      <!-- Upcoming Scheduled Calls - Moved Higher -->
      <div v-if="callsStore.scheduledCalls.length > 0" class="mb-14 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.25s]">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-2 h-2 bg-solar rounded-full animate-pulse"></div>
          <h2 class="text-2xl font-[--font-display] font-bold text-cream/90">Coming Up</h2>
        </div>

        <div class="space-y-3">
          <div v-for="call in callsStore.scheduledCalls" :key="call.id" class="group bg-gradient-to-r from-solar/10 via-ember/5 to-glow/10 backdrop-blur-xl border border-solar/20 rounded-2xl p-5 flex items-center gap-5 hover:border-solar/40 transition-all duration-300">
            <!-- Persona Avatar -->
            <div class="w-14 h-14 rounded-full bg-gradient-to-br from-solar to-ember flex items-center justify-center text-xl font-bold text-deep shrink-0 shadow-lg shadow-solar/20">
              {{ getPersonaInitial(call.persona_id, call.persona_name) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-cream truncate">{{ getPersonaName(call.persona_id, call.persona_name) }}</h3>
              <p class="text-sm text-cream/60 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ formatScheduledTime(call.scheduled_time) }}
              </p>
            </div>
            <router-link to="/schedule" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-semibold text-cream transition-all duration-300">
              Manage
            </router-link>
          </div>
        </div>
      </div>

      <!-- Recent Conversations -->
      <div class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-2 h-2 bg-ember rounded-full"></div>
          <h2 class="text-2xl font-[--font-display] font-bold text-cream/90">Recent Conversations</h2>
        </div>

        <div v-if="callsStore.calls.length === 0" class="bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-16 text-center">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-glow/10 to-ember/10 flex items-center justify-center">
            <svg class="w-10 h-10 text-cream/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p class="text-cream/50 text-lg mb-4">No conversations yet</p>
          <router-link to="/schedule" class="inline-flex items-center gap-2 text-glow hover:text-ember transition-colors duration-300 font-semibold">
            Start your first conversation
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </router-link>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="call in callsStore.calls.slice(0, 5)"
            :key="call.id"
            class="group bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
          >
            <!-- Main Call Card -->
            <div
              class="p-5 cursor-pointer"
              @click="toggleTranscript(call.id)"
            >
              <div class="flex items-center gap-4">
                <!-- Persona Avatar -->
                <div class="relative shrink-0">
                  <div
                    class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                    :class="getAvatarClasses(call.status)"
                  >
                    {{ getCallPersonaInitial(call.persona_name) }}
                  </div>
                  <!-- Direction Indicator -->
                  <div
                    class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-midnight"
                    :class="call.direction === 'inbound' ? 'bg-blue-500' : 'bg-emerald-500'"
                    :title="call.direction === 'inbound' ? 'Incoming call' : 'Outgoing call'"
                  >
                    <svg v-if="call.direction === 'inbound'" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <svg v-else class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                </div>

                <!-- Call Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-1">
                    <h3 class="text-lg font-bold text-cream truncate">{{ call.persona_name }}</h3>
                    <span
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      :class="getStatusClasses(call.status)"
                    >
                      {{ formatStatus(call.status) }}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-cream/50">
                    <span class="flex items-center gap-1.5">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ formatDuration(call.duration) }}
                    </span>
                    <span>{{ formatRelativeTime(call.start_time) }}</span>
                  </div>
                </div>

                <!-- Expand Indicator -->
                <div v-if="call.status === 'completed' && call.transcript" class="shrink-0">
                  <div
                    class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all duration-300 group-hover:bg-white/10"
                    :class="{ 'rotate-180': expandedTranscripts.has(call.id) }"
                  >
                    <svg class="w-4 h-4 text-cream/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Scenario Preview -->
              <div v-if="call.call_scenario && !expandedTranscripts.has(call.id)" class="mt-4 pl-16">
                <p class="text-sm text-cream/40 italic line-clamp-1">"{{ truncateScenario(call.call_scenario) }}"</p>
              </div>
            </div>

            <!-- Expandable Transcript -->
            <Transition
              enter-active-class="transition-all duration-300 ease-out"
              enter-from-class="opacity-0 max-h-0"
              enter-to-class="opacity-100 max-h-[500px]"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 max-h-[500px]"
              leave-to-class="opacity-0 max-h-0"
            >
              <div v-if="expandedTranscripts.has(call.id)" class="border-t border-white/10 overflow-hidden">
                <div class="p-5 bg-white/[0.02]">
                  <div class="flex items-center gap-2 mb-4">
                    <svg class="w-4 h-4 text-cream/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span class="text-xs text-cream/50 uppercase tracking-wider font-semibold">Conversation</span>
                  </div>

                  <div v-if="call.transcript" class="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    <div
                      v-for="(turn, idx) in parseTranscript(call.transcript)"
                      :key="idx"
                      class="flex gap-3"
                      :class="turn.speaker === 'ai' ? 'justify-start' : 'justify-end'"
                    >
                      <div
                        class="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm"
                        :class="turn.speaker === 'ai'
                          ? 'bg-gradient-to-br from-glow/20 to-ember/10 border border-glow/20 text-cream rounded-tl-md'
                          : 'bg-white/10 border border-white/10 text-cream/80 rounded-tr-md'"
                      >
                        <span class="block text-[10px] uppercase tracking-wider mb-1 opacity-50">
                          {{ turn.speaker === 'ai' ? call.persona_name : 'You' }}
                        </span>
                        {{ turn.text }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center py-6 text-cream/40 text-sm">
                    Transcript not available for this conversation
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <router-link
            v-if="callsStore.calls.length > 5"
            to="/profile"
            class="block text-center py-4 bg-gradient-to-br from-white/[0.04] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl text-cream/60 hover:text-glow hover:border-glow/30 transition-all duration-300 font-medium"
          >
            View all conversations →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCallsStore } from '../stores/calls'
import { useUserStore } from '../stores/user'
import { usePersonasStore } from '../stores/personas'

const callsStore = useCallsStore()
const userStore = useUserStore()
const personasStore = usePersonasStore()

// Track expanded transcripts
const expandedTranscripts = ref(new Set())

const toggleTranscript = (callId) => {
  const newSet = new Set(expandedTranscripts.value)
  if (newSet.has(callId)) {
    newSet.delete(callId)
  } else {
    newSet.add(callId)
  }
  expandedTranscripts.value = newSet
}

const parseTranscript = (transcript) => {
  if (!transcript) return []

  // Handle different transcript formats
  // Format 1: "AI: text\nUser: text\n..."
  // Format 2: JSON array
  // Format 3: Plain text with speaker labels

  try {
    // Try JSON first
    if (transcript.startsWith('[')) {
      return JSON.parse(transcript)
    }
  } catch (e) {
    // Not JSON, continue
  }

  // Parse text format
  const lines = transcript.split('\n').filter(line => line.trim())
  const turns = []

  for (const line of lines) {
    const aiMatch = line.match(/^(AI|Assistant|Bot|Persona):\s*(.+)/i)
    const userMatch = line.match(/^(User|Human|You|Caller):\s*(.+)/i)

    if (aiMatch) {
      turns.push({ speaker: 'ai', text: aiMatch[2].trim() })
    } else if (userMatch) {
      turns.push({ speaker: 'user', text: userMatch[2].trim() })
    } else if (line.trim() && turns.length > 0) {
      // Continuation of previous turn
      turns[turns.length - 1].text += ' ' + line.trim()
    }
  }

  return turns
}

const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0m'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) return `${secs}s`
  if (secs === 0) return `${mins}m`
  return `${mins}m ${secs}s`
}

const truncateScenario = (scenario) => {
  if (!scenario) return ''
  return scenario.length > 80 ? scenario.substring(0, 80) + '...' : scenario
}

const formatScheduledTime = (isoString) => {
  const date = new Date(isoString)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  if (isToday) return `Today at ${timeStr}`
  if (isTomorrow) return `Tomorrow at ${timeStr}`

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getPersonaName = (personaId, personaName = null) => {
  if (personaName) return personaName
  const persona = personasStore.personas.find(p => p.id === personaId)
  return persona ? persona.name : 'Unknown'
}

const getPersonaInitial = (personaId, personaName = null) => {
  const name = getPersonaName(personaId, personaName)
  return name.charAt(0).toUpperCase()
}

const getCallPersonaInitial = (personaName) => {
  return personaName ? personaName.charAt(0).toUpperCase() : '?'
}

const getAvatarClasses = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30'
    case 'failed':
      return 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-red-500/30'
    case 'in-progress':
      return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-500/30 animate-pulse'
    case 'no-answer':
    case 'busy':
      return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-orange-500/30'
    default:
      return 'bg-gradient-to-br from-glow to-ember text-deep shadow-glow/30'
  }
}

const getStatusClasses = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30'
    case 'in-progress':
      return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
    case 'no-answer':
    case 'busy':
      return 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
    case 'ringing':
    case 'initiating':
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    default:
      return 'bg-white/10 text-cream/60 border border-white/20'
  }
}

const formatStatus = (status) => {
  if (!status) return 'Unknown'
  return status.replace(/-/g, ' ')
}

// Track if component is still mounted
let isMounted = true

onMounted(async () => {
  try {
    await callsStore.fetchCalls()
    if (!isMounted) return
    await callsStore.fetchScheduledCalls()
    if (!isMounted) return
    await userStore.fetchUsageStats()
    if (!isMounted) return
    await personasStore.fetchPersonas()
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
})

onUnmounted(() => {
  isMounted = false
})
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
