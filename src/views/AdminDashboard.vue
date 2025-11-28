<template>
  <div class="min-h-screen bg-[#0d0d0f] text-[#e8e6e3] font-['Inter',sans-serif] overflow-hidden">
    <!-- Ambient Background - Matching Persona Designer -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#131318] to-[#0d0d0f]"></div>
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <!-- Subtle amber glow top right -->
      <div class="absolute w-[800px] h-[600px] -top-[300px] -right-[200px] opacity-[0.04] pointer-events-none blur-[150px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <!-- Subtle cyan glow bottom left -->
      <div class="absolute w-[600px] h-[500px] bottom-[-200px] -left-[200px] opacity-[0.03] pointer-events-none blur-[150px] bg-gradient-radial from-cyan-500 to-transparent"></div>
    </div>

    <!-- TACTICAL COMMAND NAV - Sticky Header -->
    <nav class="sticky top-0 z-50 border-b border-[#2a2a2e] backdrop-blur-xl bg-[#0d0d0f]/90">
      <div class="max-w-[1800px] mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Left: Branding -->
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
              <h1 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.3em] uppercase text-[#999]">
                Command Center
              </h1>
            </div>
          </div>

          <!-- Right: Controls -->
          <div class="flex items-center gap-3">
            <!-- Period Selector -->
            <div class="flex items-center gap-1 bg-[#1a1a1e] px-1.5 py-1.5 rounded-lg border border-[#2a2a2e]">
              <button
                v-for="option in periodOptions"
                :key="option.value"
                @click="selectedPeriod = option.value; fetchDashboardData()"
                class="px-4 py-1.5 rounded-md font-mono text-[10px] uppercase tracking-[0.2em] transition-all duration-300"
                :class="selectedPeriod === option.value
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-[#666] hover:text-amber-500 hover:bg-[#1e1e22]'"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Persona Designer Link -->
            <router-link
              to="/admin/personas/designer"
              class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e] hover:border-amber-500/50 hover:bg-[#1e1e22] transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#666] group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span class="font-mono text-xs uppercase tracking-wider text-[#666] group-hover:text-amber-500">Designer</span>
            </router-link>

            <!-- Admin Schedule Link -->
            <router-link
              to="/admin/schedule"
              class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e] hover:border-cyan-500/50 hover:bg-[#1e1e22] transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#666] group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span class="font-mono text-xs uppercase tracking-wider text-[#666] group-hover:text-cyan-400">Schedule</span>
            </router-link>

            <!-- Logout -->
            <button
              @click="handleLogout"
              class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e] hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#666] group-hover:text-red-400 transition-colors group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="font-mono text-xs uppercase tracking-wider text-[#666] group-hover:text-red-400">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-[1800px] mx-auto px-6 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="h-[140px] bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg animate-pulse"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6 backdrop-blur-xl">
        <div class="flex items-center gap-3 mb-3">
          <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="font-['JetBrains_Mono',monospace] text-lg tracking-wide uppercase text-red-400">System Error</h2>
        </div>
        <p class="text-[#999] mb-4 font-mono text-sm">{{ error }}</p>
        <button
          @click="fetchDashboardData"
          class="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg font-mono text-xs uppercase tracking-wider text-red-400 hover:bg-red-500/30 transition-all"
        >
          Retry
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-6">
        <!-- KEY METRICS - Top Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Total Calls -->
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg blur-xl"></div>
            <div class="relative bg-[#1a1a1e] border border-[#2a2a2e] group-hover:border-amber-500/30 rounded-lg p-5 transition-all duration-300">
              <div class="flex items-start justify-between mb-4">
                <div class="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[#e8e6e3] mb-1">
                {{ stats.totalCalls || 0 }}
              </div>
              <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Total Calls</div>
            </div>
          </div>

          <!-- Total Duration -->
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg blur-xl"></div>
            <div class="relative bg-[#1a1a1e] border border-[#2a2a2e] group-hover:border-cyan-500/30 rounded-lg p-5 transition-all duration-300">
              <div class="flex items-start justify-between mb-4">
                <div class="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                  <svg class="w-5 h-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[#e8e6e3] mb-1">
                {{ formatDuration(stats.totalDuration) }}
              </div>
              <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Total Duration</div>
            </div>
          </div>

          <!-- Total Cost -->
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg blur-xl"></div>
            <div class="relative bg-[#1a1a1e] border border-[#2a2a2e] group-hover:border-rose-500/30 rounded-lg p-5 transition-all duration-300">
              <div class="flex items-start justify-between mb-4">
                <div class="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <svg class="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[#e8e6e3] mb-1">
                ${{ (stats.totalCost || 0).toFixed(2) }}
              </div>
              <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">API Costs</div>
            </div>
          </div>

          <!-- Avg Cost/Call -->
          <div class="relative group">
            <div class="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg blur-xl"></div>
            <div class="relative bg-[#1a1a1e] border border-[#2a2a2e] group-hover:border-violet-500/30 rounded-lg p-5 transition-all duration-300">
              <div class="flex items-start justify-between mb-4">
                <div class="p-2 bg-violet-500/10 rounded-lg border border-violet-500/20">
                  <svg class="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div class="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[#e8e6e3] mb-1">
                ${{ (stats.avgCostPerCall || 0).toFixed(4) }}
              </div>
              <div class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Avg Per Call</div>
            </div>
          </div>
        </div>

        <!-- COST BREAKDOWN - Service Breakdown -->
        <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full"></div>
            <h2 class="font-['JetBrains_Mono',monospace] text-lg tracking-wide uppercase text-[#e8e6e3]">Cost Breakdown by Service</h2>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Twilio -->
            <div class="bg-[#131318] border border-[#2a2a2e] rounded-lg p-4 hover:border-amber-500/30 transition-all duration-300">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                <div class="font-mono text-xs uppercase tracking-wider text-[#999]">Twilio</div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#e8e6e3]">
                ${{ (stats.costByService?.twilio || 0).toFixed(4) }}
              </div>
              <div class="mt-2 font-mono text-[9px] text-[#666]">Voice Calling</div>
            </div>

            <!-- Deepgram -->
            <div class="bg-[#131318] border border-[#2a2a2e] rounded-lg p-4 hover:border-cyan-500/30 transition-all duration-300">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-cyan-500"></div>
                <div class="font-mono text-xs uppercase tracking-wider text-[#999]">Deepgram</div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#e8e6e3]">
                ${{ (stats.costByService?.deepgram || 0).toFixed(4) }}
              </div>
              <div class="mt-2 font-mono text-[9px] text-[#666]">Speech-to-Text</div>
            </div>

            <!-- Cerebras -->
            <div class="bg-[#131318] border border-[#2a2a2e] rounded-lg p-4 hover:border-violet-500/30 transition-all duration-300">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-violet-500"></div>
                <div class="font-mono text-xs uppercase tracking-wider text-[#999]">Cerebras</div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#e8e6e3]">
                ${{ (stats.costByService?.cerebras || 0).toFixed(4) }}
              </div>
              <div class="mt-2 font-mono text-[9px] text-[#666]">AI Inference</div>
            </div>

            <!-- ElevenLabs -->
            <div class="bg-[#131318] border border-[#2a2a2e] rounded-lg p-4 hover:border-emerald-500/30 transition-all duration-300">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div class="font-mono text-xs uppercase tracking-wider text-[#999]">ElevenLabs</div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#e8e6e3]">
                ${{ (stats.costByService?.elevenlabs || 0).toFixed(4) }}
              </div>
              <div class="mt-2 font-mono text-[9px] text-[#666]">Text-to-Speech</div>
            </div>

            <!-- Stripe -->
            <div class="bg-[#131318] border border-[#2a2a2e] rounded-lg p-4 hover:border-rose-500/30 transition-all duration-300">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                <div class="font-mono text-xs uppercase tracking-wider text-[#999]">Stripe</div>
              </div>
              <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-[#e8e6e3]">
                ${{ (stats.costByService?.stripe || 0).toFixed(4) }}
              </div>
              <div class="mt-2 font-mono text-[9px] text-[#666]">Payment Fees</div>
            </div>
          </div>

          <!-- Cost Distribution Bars -->
          <div class="mt-6 space-y-2">
            <div v-for="service in ['twilio', 'deepgram', 'cerebras', 'elevenlabs', 'stripe']" :key="service" class="flex items-center gap-3">
              <div class="w-24 font-mono text-xs uppercase tracking-wider text-[#666]">{{ service }}</div>
              <div class="flex-1 h-2 bg-[#0d0d0f] rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-1000 ease-out"
                  :class="{
                    'bg-gradient-to-r from-amber-500 to-orange-500': service === 'twilio',
                    'bg-gradient-to-r from-cyan-500 to-blue-500': service === 'deepgram',
                    'bg-gradient-to-r from-violet-500 to-purple-500': service === 'cerebras',
                    'bg-gradient-to-r from-emerald-500 to-green-500': service === 'elevenlabs',
                    'bg-gradient-to-r from-rose-500 to-red-500': service === 'stripe'
                  }"
                  :style="{ width: getCostPercentage(service) + '%' }"
                ></div>
              </div>
              <div class="w-16 text-right font-mono text-xs text-[#999]">{{ getCostPercentage(service).toFixed(1) }}%</div>
            </div>
          </div>
        </div>

        <!-- RECENT CALLS TABLE -->
        <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg overflow-hidden">
          <div class="p-6 border-b border-[#2a2a2e]">
            <div class="flex items-center gap-3">
              <div class="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-lg tracking-wide uppercase text-[#e8e6e3]">Recent Call Activity</h2>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[#2a2a2e]">
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Call ID</th>
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Persona</th>
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Duration</th>
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Cost</th>
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Status</th>
                  <th class="px-6 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="call in recentCalls" :key="call.id" class="border-b border-[#2a2a2e]/50 hover:bg-[#131318] transition-colors">
                  <td class="px-6 py-4 font-['JetBrains_Mono',monospace] text-xs text-[#999]">{{ call.id.substring(0, 12) }}...</td>
                  <td class="px-6 py-4 font-mono text-sm text-[#e8e6e3]">{{ call.persona_name || 'Unknown' }}</td>
                  <td class="px-6 py-4 font-['JetBrains_Mono',monospace] text-sm text-cyan-400">{{ formatSeconds(call.duration_seconds) }}</td>
                  <td class="px-6 py-4 font-['JetBrains_Mono',monospace] text-sm text-amber-400">${{ Number(call.cost_usd || 0).toFixed(4) }}</td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider"
                      :class="{
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30': call.status === 'completed',
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30': call.status === 'in_progress',
                        'bg-red-500/10 text-red-400 border border-red-500/30': call.status === 'failed'
                      }"
                    >
                      <div class="w-1.5 h-1.5 rounded-full" :class="{
                        'bg-emerald-500': call.status === 'completed',
                        'bg-amber-500 animate-pulse': call.status === 'in_progress',
                        'bg-red-500': call.status === 'failed'
                      }"></div>
                      {{ call.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-xs text-[#666]">{{ formatTime(call.created_at) }}</td>
                </tr>
                <tr v-if="!recentCalls || recentCalls.length === 0">
                  <td colspan="6" class="px-6 py-12 text-center font-mono text-sm text-[#666]">
                    No call data available for selected period
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>

    <!-- Audio Settings Modal (if needed) -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" @click.self="showSettingsModal = false">
      <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg p-6 max-w-md w-full mx-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-['JetBrains_Mono',monospace] text-lg tracking-wide uppercase text-[#e8e6e3]">Settings</h3>
          <button @click="showSettingsModal = false" class="text-[#666] hover:text-[#e8e6e3] transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="font-mono text-sm text-[#999]">Settings panel coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const showSettingsModal = ref(false);
const selectedPeriod = ref('30d');

const periodOptions = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'ALL', value: 'all' }
];

// Dashboard stats
const stats = ref({
  totalCalls: 0,
  totalDuration: 0,
  totalCost: 0,
  avgCostPerCall: 0,
  costByService: {
    twilio: 0,
    deepgram: 0,
    cerebras: 0,
    elevenlabs: 0,
    stripe: 0,
    raindrop: 0,
    vultr: 0,
    vercel: 0
  }
});

const recentCalls = ref<any[]>([]);

// Fetch dashboard data
async function fetchDashboardData() {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Fetch from database via API gateway
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://call-me-back.raindrop.run'}/api/admin/dashboard?period=${selectedPeriod.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const data = await response.json();

    if (data.stats) {
      stats.value = data.stats;
    }

    if (data.recentCalls) {
      recentCalls.value = data.recentCalls;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Dashboard error:', err);
  } finally {
    loading.value = false;
  }
}

// Utilities
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatSeconds(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp: string): string {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getCostPercentage(service: string): number {
  const total = stats.value.totalCost || 0;
  if (total === 0) return 0;
  const serviceCost = (stats.value.costByService as any)[service] || 0;
  return (serviceCost / total) * 100;
}

function handleLogout() {
  localStorage.removeItem('adminToken');
  router.push('/admin/login');
}

onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* Grain overlay texture */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  background-repeat: repeat;
}

/* Radial gradient utility */
.bg-gradient-radial {
  background-image: radial-gradient(circle, var(--tw-gradient-stops));
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0d0d0f;
}

::-webkit-scrollbar-thumb {
  background: #2a2a2e;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3a3a3e;
}
</style>
