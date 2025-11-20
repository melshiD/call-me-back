<template>
  <div class="min-h-screen bg-midnight text-cream font-[--font-body] pt-24 pb-16 px-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-10 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[500px] h-[500px] bottom-[10%] -left-[150px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-black mb-4 tracking-tight">
          <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Mission Control</span>
        </h1>
        <p class="text-lg text-cream/70">Your AI companion dashboard</p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
        <router-link to="/schedule" class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-glow/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10 text-center">
            <div class="text-5xl mb-4">📞</div>
            <h3 class="text-xl font-bold mb-2">Schedule Call</h3>
            <p class="text-sm text-cream/60">Set up a new call</p>
          </div>
        </router-link>

        <router-link to="/contacts" class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-ember/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,140,66,0.2)] overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-ember/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10 text-center">
            <div class="text-5xl mb-4">👥</div>
            <h3 class="text-xl font-bold mb-2">My Contacts</h3>
            <p class="text-sm text-cream/60">Manage personas</p>
          </div>
        </router-link>

        <router-link to="/personas" class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,107,53,0.2)] overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 bg-solar/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div class="relative z-10 text-center">
            <div class="text-5xl mb-4">🎭</div>
            <h3 class="text-xl font-bold mb-2">Explore Personas</h3>
            <p class="text-sm text-cream/60">Find new personas</p>
          </div>
        </router-link>
      </div>

      <!-- Usage Stats -->
      <div v-if="userStore.usageStats" class="mb-12 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
        <h2 class="text-3xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-glow rounded-full"></span>
          Usage Overview
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-2 text-glow">{{ userStore.usageStats.total_calls }}</div>
            <div class="text-sm text-cream/60 uppercase tracking-wider font-bold">Total Calls</div>
          </div>
          <div class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-2 text-ember">{{ userStore.usageStats.total_minutes }}</div>
            <div class="text-sm text-cream/60 uppercase tracking-wider font-bold">Total Minutes</div>
          </div>
          <div class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-2 text-solar">${{ userStore.usageStats.total_spent.toFixed(2) }}</div>
            <div class="text-sm text-cream/60 uppercase tracking-wider font-bold">Total Spent</div>
          </div>
          <div class="bg-gradient-to-r from-glow/20 to-ember/20 backdrop-blur-xl border-2 border-glow/40 rounded-2xl p-6">
            <div class="text-4xl font-[--font-display] font-black mb-2">{{ userStore.usageStats.current_month.calls }}</div>
            <div class="text-sm uppercase tracking-wider font-bold mb-1">This Month</div>
            <div class="text-xs text-cream/70">${{ userStore.usageStats.current_month.spent.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Calls -->
      <div class="mb-12 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
        <h2 class="text-3xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-ember rounded-full"></span>
          Recent Calls
        </h2>

        <div v-if="callsStore.calls.length === 0" class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-12 text-center">
          <p class="text-cream/60">No calls yet. <router-link to="/schedule" class="text-glow hover:text-ember transition-colors duration-300 font-semibold">Schedule your first call</router-link></p>
        </div>

        <div v-else class="space-y-4">
          <div v-for="call in callsStore.calls.slice(0, 5)" :key="call.id" class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6 hover:border-glow/30 transition-all duration-300">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-xl font-bold mb-1">{{ call.persona_name }}</h3>
                <span class="inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                  :class="{
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30': call.status === 'completed',
                    'bg-red-500/20 text-red-400 border border-red-500/30': call.status === 'failed',
                    'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30': call.status === 'in-progress'
                  }">
                  {{ call.status }}
                </span>
              </div>
              <div class="text-2xl font-black text-glow">${{ call.cost.toFixed(2) }}</div>
            </div>

            <div v-if="call.call_scenario" class="bg-white/5 border-l-4 border-glow p-4 rounded-lg mb-4">
              <div class="flex items-start gap-3">
                <span class="text-xl">🎭</span>
                <p class="text-sm text-cream/70 italic">{{ truncateScenario(call.call_scenario) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 text-sm text-cream/60">
              <div><strong class="text-cream">Duration:</strong> {{ Math.floor(call.duration / 60) }}m {{ call.duration % 60 }}s</div>
              <div><strong class="text-cream">Started:</strong> {{ formatDate(call.start_time) }}</div>
              <div v-if="call.sid" class="truncate"><strong class="text-cream">ID:</strong> {{ call.sid }}</div>
            </div>
          </div>

          <router-link v-if="callsStore.calls.length > 5" to="/profile" class="block text-center py-4 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl text-glow hover:text-ember hover:border-glow/30 transition-all duration-300 font-semibold">
            View all calls →
          </router-link>
        </div>
      </div>

      <!-- Upcoming Scheduled Calls -->
      <div v-if="callsStore.scheduledCalls.length > 0" class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s]">
        <h2 class="text-3xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
          <span class="w-2 h-2 bg-solar rounded-full"></span>
          Upcoming Calls
        </h2>

        <div class="space-y-4">
          <div v-for="call in callsStore.scheduledCalls" :key="call.id" class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-6 flex items-center justify-between hover:border-solar/30 transition-all duration-300">
            <div>
              <h3 class="text-xl font-bold mb-2">{{ getPersonaName(call.persona_id) }}</h3>
              <p class="text-cream/60">{{ formatScheduledTime(call.scheduled_time) }}</p>
            </div>
            <router-link to="/schedule" class="px-6 py-3 bg-gradient-to-r from-solar to-ember rounded-xl text-deep font-bold hover:scale-105 transition-transform duration-300">
              Manage
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCallsStore } from '../stores/calls'
import { useUserStore } from '../stores/user'
import { usePersonasStore } from '../stores/personas'

const callsStore = useCallsStore()
const userStore = useUserStore()
const personasStore = usePersonasStore()

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const truncateScenario = (scenario) => {
  if (!scenario) return ''
  return scenario.length > 60 ? scenario.substring(0, 60) + '...' : scenario
}

const formatScheduledTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getPersonaName = (personaId) => {
  const persona = personasStore.personas.find(p => p.id === personaId)
  return persona ? persona.name : 'Unknown'
}

onMounted(async () => {
  await callsStore.fetchCalls()
  await callsStore.fetchScheduledCalls()
  await userStore.fetchUsageStats()
  await personasStore.fetchPersonas()
})
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}
</style>
