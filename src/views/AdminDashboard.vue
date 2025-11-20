<template>
  <div class="min-h-screen bg-midnight text-cream font-[--font-body]">
    <!-- Ambient Background (matching Home.vue) -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-10 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[500px] h-[500px] bottom-[10%] -left-[150px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar to-transparent"></div>
    </div>

    <!-- Header -->
    <header class="border-b border-white/10 backdrop-blur-xl bg-deep/50 sticky top-0 z-40">
      <div class="max-w-[1800px] mx-auto px-6 lg:px-12 py-6">
        <div class="flex items-center justify-between">
          <!-- Title with live indicator -->
          <div class="flex items-center gap-4">
            <div class="w-3 h-3 bg-glow rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
            <h1 class="text-3xl lg:text-4xl font-[--font-display] font-black tracking-tight">
              <span class="bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">Admin</span> Dashboard
            </h1>
          </div>

          <div class="flex items-center gap-4">
            <!-- Period Selector -->
            <div class="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1.5">
              <button
                v-for="option in periodOptions"
                :key="option.value"
                @click="selectedPeriod = option.value; fetchDashboardData()"
                class="px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300"
                :class="selectedPeriod === option.value
                  ? 'bg-gradient-to-r from-glow to-ember text-deep shadow-lg'
                  : 'text-cream/60 hover:text-cream hover:bg-white/5'"
              >
                {{ option.label }}
              </button>
            </div>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-ember/50 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 group"
            >
              <svg class="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-[1800px] mx-auto px-6 lg:px-12 py-12">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="i in 4" :key="i" class="h-[180px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse"></div>
        </div>
        <div class="h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl animate-pulse"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-8 backdrop-blur-xl">
        <div class="flex items-center gap-4 mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-2xl font-bold text-red-400">Error Loading Dashboard</h2>
        </div>
        <p class="text-cream/70 mb-6">{{ error }}</p>
        <button
          @click="fetchDashboardData"
          class="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-semibold transition-all duration-300"
        >
          Retry
        </button>
      </div>

      <!-- Dashboard Data -->
      <div v-else class="space-y-8 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Calls -->
          <div class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-glow/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Total Calls</div>
                <svg class="w-6 h-6 text-glow/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div class="text-5xl font-[--font-display] font-black mb-2 font-mono bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">
                {{ formatNumber(dashboardData.summary?.totalCalls || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">Since launch</div>
            </div>
          </div>

          <!-- Total Revenue -->
          <div class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-emerald-500/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(16,185,129,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Revenue</div>
                <svg class="w-6 h-6 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-5xl font-[--font-display] font-black mb-2 font-mono text-emerald-400">
                ${{ formatCurrency(dashboardData.financials?.revenue || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">Total earnings</div>
            </div>
          </div>

          <!-- Total Cost -->
          <div class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-ember/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,140,66,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-ember/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Cost</div>
                <svg class="w-6 h-6 text-ember/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
              <div class="text-5xl font-[--font-display] font-black mb-2 font-mono text-ember">
                ${{ formatCurrency(dashboardData.financials?.totalCost || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">Total expenses</div>
            </div>
          </div>

          <!-- Profit -->
          <div class="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-glow/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Profit</div>
                <svg class="w-6 h-6 text-glow/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div class="text-5xl font-[--font-display] font-black mb-2 font-mono bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">
                ${{ formatCurrency((dashboardData.financials?.revenue || 0) - (dashboardData.financials?.totalCost || 0)) }}
              </div>
              <div class="text-xs font-medium" :class="profitMargin >= 70 ? 'text-emerald-400' : profitMargin >= 50 ? 'text-glow' : 'text-ember'">
                {{ profitMargin }}% margin
              </div>
            </div>
          </div>
        </div>

        <!-- Call Status & Failed Call Costs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Failed Call Costs -->
          <div class="group relative bg-gradient-to-br from-red-500/10 to-red-500/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 transition-all duration-500 hover:bg-red-500/15 hover:border-red-500/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(239,68,68,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-red-500/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Failed Costs</div>
                <svg class="w-6 h-6 text-red-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-4xl font-[--font-display] font-black mb-2 font-mono text-red-400">
                ${{ formatCurrency(dashboardData.financials?.failedCallCosts || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">{{ dashboardData.summary?.failedCalls || 0 }} failed calls</div>
            </div>
          </div>

          <!-- In-Progress Calls -->
          <div class="group relative bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 transition-all duration-500 hover:bg-blue-500/15 hover:border-blue-500/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(59,130,246,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">In Progress</div>
                <svg class="w-6 h-6 text-blue-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-4xl font-[--font-display] font-black mb-2 font-mono text-blue-400">
                {{ formatNumber(dashboardData.summary?.inProgressCalls || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">{{ dashboardData.callStatusBreakdown?.inProgressPercent || '0%' }}</div>
            </div>
          </div>

          <!-- Completed Call Costs -->
          <div class="group relative bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 transition-all duration-500 hover:bg-emerald-500/15 hover:border-emerald-500/50 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(16,185,129,0.2)] overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 -mr-16 -mt-16 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/50">Completed Costs</div>
                <svg class="w-6 h-6 text-emerald-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-4xl font-[--font-display] font-black mb-2 font-mono text-emerald-400">
                ${{ formatCurrency(dashboardData.financials?.completedCallCosts || 0) }}
              </div>
              <div class="text-xs text-cream/40 font-medium">{{ dashboardData.summary?.completedCalls || 0 }} completed</div>
            </div>
          </div>
        </div>

        <!-- Data Tables Grid -->
        <div class="grid lg:grid-cols-2 gap-6">
          <!-- Cost Breakdown by Service -->
          <div class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:border-glow/30">
            <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-glow rounded-full"></span>
              Cost Breakdown
            </h2>
            <div class="space-y-4">
              <div
                v-for="service in dashboardData.costByService"
                :key="service.service"
                class="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-glow/30 rounded-xl transition-all duration-300"
              >
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-sm font-black uppercase"
                    :class="getServiceColor(service.service)">
                    {{ service.service.slice(0, 2) }}
                  </div>
                  <div>
                    <div class="font-bold capitalize">{{ service.service }}</div>
                    <div class="text-sm text-cream/50">{{ formatNumber(service.usage_count || 0) }} uses</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-mono font-black text-ember">${{ formatCurrency(service.total_cost) }}</div>
                  <div class="text-xs text-cream/50 font-medium">{{ ((service.total_cost / (dashboardData.summary?.total_cost || 1)) * 100).toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Personas -->
          <div class="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:border-glow/30">
            <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-glow rounded-full"></span>
              Top Personas
            </h2>
            <div class="space-y-4">
              <div
                v-for="(persona, index) in dashboardData.topPersonas"
                :key="persona.persona_id"
                class="group flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-glow/30 rounded-xl transition-all duration-300"
              >
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-glow/20 to-ember/20 flex items-center justify-center text-xl font-black">
                      {{ persona.persona_name?.charAt(0) || '?' }}
                    </div>
                    <div class="absolute -top-2 -right-2 w-6 h-6 bg-glow text-deep rounded-full flex items-center justify-center text-xs font-black">
                      {{ index + 1 }}
                    </div>
                  </div>
                  <div>
                    <div class="font-bold">{{ persona.persona_name || 'Unknown' }}</div>
                    <div class="text-sm text-cream/50">{{ formatNumber(persona.call_count) }} calls</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-mono font-black text-emerald-400">${{ formatCurrency(persona.total_revenue) }}</div>
                  <div class="text-xs text-cream/50 font-medium">{{ ((persona.total_revenue / (dashboardData.summary?.total_revenue || 1)) * 100).toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Top Users -->
          <div class="lg:col-span-2 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-2xl p-8 transition-all duration-500 hover:border-glow/30">
            <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-glow rounded-full"></span>
              Top Users
            </h2>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-white/10">
                    <th class="text-left py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">Rank</th>
                    <th class="text-left py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">User</th>
                    <th class="text-right py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">Calls</th>
                    <th class="text-right py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">Duration</th>
                    <th class="text-right py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">Revenue</th>
                    <th class="text-right py-4 px-4 text-sm font-bold uppercase tracking-wider text-cream/50">Avg/Call</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(user, index) in dashboardData.top_users"
                    :key="user.user_id"
                    class="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <td class="py-4 px-4">
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
                        :class="index === 0 ? 'bg-glow text-deep' : index === 1 ? 'bg-ember text-deep' : index === 2 ? 'bg-solar text-deep' : 'bg-white/10 text-cream'">
                        {{ index + 1 }}
                      </div>
                    </td>
                    <td class="py-4 px-4">
                      <div class="font-bold">{{ user.user_name || 'Anonymous' }}</div>
                      <div class="text-sm text-cream/50">{{ user.user_email }}</div>
                    </td>
                    <td class="py-4 px-4 text-right font-mono font-bold text-lg">{{ formatNumber(user.call_count) }}</td>
                    <td class="py-4 px-4 text-right font-mono text-cream/70">{{ formatDuration(user.total_duration) }}</td>
                    <td class="py-4 px-4 text-right font-mono font-black text-xl text-emerald-400">${{ formatCurrency(user.total_revenue) }}</td>
                    <td class="py-4 px-4 text-right font-mono text-glow">${{ formatCurrency(user.total_revenue / user.call_count) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer Stats -->
        <div class="bg-gradient-to-r from-glow/10 via-ember/10 to-solar/10 backdrop-blur-xl border border-glow/20 rounded-2xl p-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div class="text-sm text-cream/50 font-bold uppercase tracking-wider mb-2">Avg Call Duration</div>
              <div class="text-3xl font-mono font-black text-glow">{{ formatDuration((dashboardData.summary?.total_duration || 0) / (dashboardData.summary?.total_calls || 1)) }}</div>
            </div>
            <div>
              <div class="text-sm text-cream/50 font-bold uppercase tracking-wider mb-2">Avg Revenue/Call</div>
              <div class="text-3xl font-mono font-black text-emerald-400">${{ formatCurrency((dashboardData.summary?.total_revenue || 0) / (dashboardData.summary?.total_calls || 1)) }}</div>
            </div>
            <div>
              <div class="text-sm text-cream/50 font-bold uppercase tracking-wider mb-2">Avg Cost/Call</div>
              <div class="text-3xl font-mono font-black text-ember">${{ formatCurrency((dashboardData.summary?.total_cost || 0) / (dashboardData.summary?.total_calls || 1)) }}</div>
            </div>
            <div>
              <div class="text-sm text-cream/50 font-bold uppercase tracking-wider mb-2">Active Users</div>
              <div class="text-3xl font-mono font-black text-glow">{{ formatNumber(dashboardData.top_users?.length || 0) }}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const loading = ref(true);
const error = ref(null);
const selectedPeriod = ref('30d');
const dashboardData = ref({
  summary: null,
  cost_breakdown: [],
  top_personas: [],
  top_users: []
});

// Period options
const periodOptions = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' }
];

// Computed
const profitMargin = computed(() => {
  const revenue = parseFloat(dashboardData.value.financials?.revenue || 0);
  const cost = parseFloat(dashboardData.value.financials?.totalCost || 0);
  if (revenue === 0) return 0;
  return Math.round(((revenue - cost) / revenue) * 100);
});

// Methods
const fetchDashboardData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Call log-query-service directly (bypasses Cloudflare Workers fetch limitation)
    const LOG_QUERY_URL = 'https://logs.ai-tools-marketplace.io';
    const response = await fetch(`${LOG_QUERY_URL}/api/admin/dashboard?period=${selectedPeriod.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    dashboardData.value = data;
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    error.value = err.message || 'Failed to load dashboard data';
  } finally {
    loading.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('adminToken');
  router.push('/admin/login');
};

const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
};

const formatCurrency = (num) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

const getServiceColor = (service) => {
  const colors = {
    twilio: 'from-red-500 to-red-600 text-white',
    deepgram: 'from-blue-500 to-blue-600 text-white',
    cerebras: 'from-purple-500 to-purple-600 text-white',
    elevenlabs: 'from-emerald-500 to-emerald-600 text-white',
    raindrop: 'from-glow to-ember text-deep'
  };
  return colors[service?.toLowerCase()] || 'from-white/20 to-white/30 text-cream';
};

// Lifecycle
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
/* Grain overlay texture (matching Home.vue) */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>
