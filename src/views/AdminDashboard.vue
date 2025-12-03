<template>
  <div class="min-h-screen bg-[#0a0a0c] text-[#e8e6e3] font-['Inter',sans-serif] overflow-x-hidden">
    <!-- Ambient Background - Tactical Command Center -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0d0d10] to-[#0a0a0c]"></div>
      <!-- Scan lines overlay -->
      <div class="scan-lines absolute inset-0 pointer-events-none opacity-[0.03]"></div>
      <!-- Grid pattern -->
      <div class="grid-pattern absolute inset-0 pointer-events-none opacity-[0.02]"></div>
      <!-- Accent glows -->
      <div class="absolute w-[1000px] h-[800px] -top-[400px] -right-[300px] opacity-[0.03] pointer-events-none blur-[200px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <div class="absolute w-[800px] h-[600px] bottom-[-300px] -left-[200px] opacity-[0.02] pointer-events-none blur-[200px] bg-gradient-radial from-cyan-500 to-transparent"></div>
    </div>

    <!-- TACTICAL COMMAND NAV -->
    <nav class="sticky top-0 z-50 border-b border-[#1a1a1e] backdrop-blur-2xl bg-[#0a0a0c]/95">
      <div class="max-w-[1920px] mx-auto px-8 py-3">
        <div class="flex items-center justify-between">
          <!-- Left: System Status -->
          <div class="flex items-center gap-8">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                <div class="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-50"></div>
              </div>
              <h1 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.4em] uppercase text-[#666]">
                Command Center
              </h1>
            </div>
            <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#111113] border border-[#1a1a1e] rounded">
              <span class="font-mono text-[9px] uppercase tracking-wider text-[#555]">System</span>
              <span class="font-mono text-[10px] text-emerald-400">OPERATIONAL</span>
            </div>
          </div>

          <!-- Center: Period Selector -->
          <div class="flex items-center gap-1 bg-[#111113] px-1 py-1 rounded-lg border border-[#1a1a1e]">
            <button
              v-for="option in periodOptions"
              :key="option.value"
              @click="selectedPeriod = option.value; fetchDashboardData()"
              class="px-5 py-1.5 rounded font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] transition-all duration-300"
              :class="selectedPeriod === option.value
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                : 'text-[#555] hover:text-[#999] hover:bg-[#151517]'"
            >
              {{ option.label }}
            </button>
          </div>

          <!-- Right: Navigation -->
          <div class="flex items-center gap-2">
            <router-link
              to="/admin/personas/designer"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#555] group-hover:text-amber-400">Personas</span>
            </router-link>

            <router-link
              to="/admin/schedule"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#555] group-hover:text-cyan-400">Schedule</span>
            </router-link>

            <button
              @click="handleLogout"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-rose-500/40 hover:bg-rose-500/5 transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-rose-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <span class="font-mono text-[10px] uppercase tracking-wider text-[#555] group-hover:text-rose-400">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-[1920px] mx-auto px-8 py-6">
      <!-- Loading State -->
      <div v-if="loading" class="space-y-6">
        <div class="grid grid-cols-4 gap-4">
          <div v-for="i in 4" :key="i" class="h-32 bg-[#111113] border border-[#1a1a1e] rounded-lg animate-pulse"></div>
        </div>
        <div class="h-64 bg-[#111113] border border-[#1a1a1e] rounded-lg animate-pulse"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-rose-500/5 border border-rose-500/20 rounded-lg p-8">
        <div class="flex items-center gap-4 mb-4">
          <div class="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
            <svg class="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h2 class="font-['JetBrains_Mono',monospace] text-sm tracking-wide uppercase text-rose-400">System Error</h2>
            <p class="text-[#666] font-mono text-xs mt-1">{{ error }}</p>
          </div>
        </div>
        <button
          @click="fetchDashboardData"
          class="px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded font-mono text-xs uppercase tracking-wider text-rose-400 hover:bg-rose-500/20 transition-all"
        >
          Retry Connection
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-6">

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION 1: FINANCIAL COMMAND - Hero P&L Flow
             ═══════════════════════════════════════════════════════════════════ -->
        <section class="relative">
          <div class="absolute -left-3 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-500/50 to-transparent"></div>

          <div class="flex items-center gap-3 mb-4 pl-3">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Financial Command</h2>
            </div>
            <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
            <span class="font-mono text-[9px] uppercase tracking-wider text-[#444]">{{ getPeriodLabel() }}</span>
          </div>

          <!-- P&L Flow Visualization -->
          <div class="grid grid-cols-12 gap-4">
            <!-- Revenue Block -->
            <div class="col-span-3 bg-[#111113] border border-[#1a1a1e] rounded-lg p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all duration-500">
              <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-emerald-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <span class="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-500/70">Revenue</span>
                  <svg class="w-4 h-4 text-emerald-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                </div>
                <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-emerald-400 mb-1">
                  ${{ revenue.period.toFixed(2) }}
                </div>
                <div class="flex items-center gap-2 mt-3">
                  <span class="font-mono text-[9px] text-[#555]">All-time:</span>
                  <span class="font-mono text-xs text-[#888]">${{ revenue.total.toFixed(2) }}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-[9px] text-[#555]">Purchases:</span>
                  <span class="font-mono text-xs text-[#888]">{{ revenue.purchaseCount }}</span>
                </div>
              </div>
            </div>

            <!-- Flow Arrow -->
            <div class="col-span-1 flex items-center justify-center">
              <div class="flex flex-col items-center gap-1">
                <svg class="w-6 h-6 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span class="font-mono text-[8px] text-[#444] uppercase">minus</span>
              </div>
            </div>

            <!-- Costs Block -->
            <div class="col-span-3 bg-[#111113] border border-[#1a1a1e] rounded-lg p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all duration-500">
              <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-radial from-rose-500/10 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <span class="font-mono text-[9px] uppercase tracking-[0.2em] text-rose-500/70">API Costs</span>
                  <svg class="w-4 h-4 text-rose-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 014.306 6.43l.776 2.898m0 0l3.182-5.511m-3.182 5.51l-5.511-3.181" />
                  </svg>
                </div>
                <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-rose-400 mb-1">
                  ${{ apiCosts.period.toFixed(6) }}
                </div>
                <div class="flex items-center gap-2 mt-3">
                  <span class="font-mono text-[9px] text-[#555]">All-time:</span>
                  <span class="font-mono text-xs text-[#888]">${{ apiCosts.total.toFixed(6) }}</span>
                </div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-[9px] text-[#555]">Calls:</span>
                  <span class="font-mono text-xs text-[#888]">{{ stats.totalCalls }}</span>
                </div>
              </div>
            </div>

            <!-- Flow Arrow -->
            <div class="col-span-1 flex items-center justify-center">
              <div class="flex flex-col items-center gap-1">
                <svg class="w-6 h-6 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span class="font-mono text-[8px] text-[#444] uppercase">equals</span>
              </div>
            </div>

            <!-- Profit Block -->
            <div class="col-span-4 bg-[#111113] border rounded-lg p-5 relative overflow-hidden"
                 :class="profitability.grossProfit >= 0 ? 'border-emerald-500/30 hover:border-emerald-500/50' : 'border-rose-500/30 hover:border-rose-500/50'">
              <div class="absolute top-0 right-0 w-32 h-32 blur-3xl"
                   :class="profitability.grossProfit >= 0 ? 'bg-gradient-radial from-emerald-500/20 to-transparent' : 'bg-gradient-radial from-rose-500/20 to-transparent'"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <span class="font-mono text-[9px] uppercase tracking-[0.2em]"
                        :class="profitability.grossProfit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'">Gross Profit</span>
                  <div class="flex items-center gap-2">
                    <span class="font-['JetBrains_Mono',monospace] text-lg font-bold"
                          :class="profitability.grossMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                      {{ profitability.grossMargin.toFixed(1) }}%
                    </span>
                    <span class="font-mono text-[8px] uppercase text-[#555]">margin</span>
                  </div>
                </div>
                <div class="font-['JetBrains_Mono',monospace] text-4xl font-bold mb-3"
                     :class="profitability.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                  ${{ profitability.grossProfit.toFixed(2) }}
                </div>
                <!-- Margin Bar -->
                <div class="h-1.5 bg-[#0a0a0c] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-1000 ease-out"
                    :class="profitability.grossMargin >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'"
                    :style="{ width: Math.min(Math.abs(profitability.grossMargin), 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION 2: UNIT ECONOMICS + COST COMPOSITION (Side by Side)
             ═══════════════════════════════════════════════════════════════════ -->
        <section class="grid grid-cols-12 gap-6">

          <!-- Unit Economics Panel -->
          <div class="col-span-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Unit Economics</h2>
              <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
            </div>

            <div class="bg-[#111113] border border-[#1a1a1e] rounded-lg p-5 space-y-4">
              <!-- Per Minute Metrics -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-[#0a0a0c] border border-[#1a1a1e] rounded p-4 text-center">
                  <div class="font-mono text-[8px] uppercase tracking-wider text-[#555] mb-2">Cost/Min</div>
                  <div class="font-['JetBrains_Mono',monospace] text-xl font-bold text-rose-400">
                    ${{ profitability.avgCostPerMinute.toFixed(3) }}
                  </div>
                </div>
                <div class="bg-[#0a0a0c] border border-[#1a1a1e] rounded p-4 text-center">
                  <div class="font-mono text-[8px] uppercase tracking-wider text-[#555] mb-2">Revenue/Min</div>
                  <div class="font-['JetBrains_Mono',monospace] text-xl font-bold text-emerald-400">
                    ${{ getRevenuePerMinute().toFixed(3) }}
                  </div>
                </div>
                <div class="bg-[#0a0a0c] border border-[#1a1a1e] rounded p-4 text-center">
                  <div class="font-mono text-[8px] uppercase tracking-wider text-[#555] mb-2">Margin/Min</div>
                  <div class="font-['JetBrains_Mono',monospace] text-xl font-bold"
                       :class="getMarginPerMinute() >= 0 ? 'text-emerald-400' : 'text-rose-400'">
                    ${{ getMarginPerMinute().toFixed(3) }}
                  </div>
                </div>
              </div>

              <!-- Usage Stats -->
              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-[#1a1a1e]">
                <div class="flex items-center justify-between p-3 bg-[#0a0a0c] rounded border border-[#1a1a1e]">
                  <span class="font-mono text-[9px] uppercase text-[#555]">Total Calls</span>
                  <span class="font-['JetBrains_Mono',monospace] text-lg font-bold text-amber-400">{{ stats.totalCalls }}</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-[#0a0a0c] rounded border border-[#1a1a1e]">
                  <span class="font-mono text-[9px] uppercase text-[#555]">Total Minutes</span>
                  <span class="font-['JetBrains_Mono',monospace] text-lg font-bold text-cyan-400">{{ Math.round(stats.totalDuration / 60) }}</span>
                </div>
              </div>

              <!-- Avg Per Call -->
              <div class="flex items-center justify-between p-3 bg-[#0a0a0c] rounded border border-[#1a1a1e]">
                <span class="font-mono text-[9px] uppercase text-[#555]">Average Cost Per Call</span>
                <span class="font-['JetBrains_Mono',monospace] text-lg font-bold text-violet-400">${{ stats.avgCostPerCall.toFixed(6) }}</span>
              </div>
            </div>
          </div>

          <!-- Cost Composition Panel -->
          <div class="col-span-7">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Cost Composition</h2>
              <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
            </div>

            <div class="bg-[#111113] border border-[#1a1a1e] rounded-lg p-5">
              <div class="flex gap-6">
                <!-- Donut Chart Placeholder (CSS-only) -->
                <div class="flex-shrink-0 relative w-32 h-32">
                  <svg class="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                    <!-- Background circle -->
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1e" stroke-width="12"/>
                    <!-- Segments -->
                    <circle cx="50" cy="50" r="40" fill="none"
                            stroke="#f59e0b" stroke-width="12"
                            :stroke-dasharray="`${getCostPercentage('twilio') * 2.51} 251`"
                            stroke-dashoffset="0"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            stroke="#06b6d4" stroke-width="12"
                            :stroke-dasharray="`${getCostPercentage('deepgram') * 2.51} 251`"
                            :stroke-dashoffset="`-${getCostPercentage('twilio') * 2.51}`"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            stroke="#8b5cf6" stroke-width="12"
                            :stroke-dasharray="`${getCostPercentage('cerebras') * 2.51} 251`"
                            :stroke-dashoffset="`-${(getCostPercentage('twilio') + getCostPercentage('deepgram')) * 2.51}`"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            stroke="#10b981" stroke-width="12"
                            :stroke-dasharray="`${getCostPercentage('elevenlabs') * 2.51} 251`"
                            :stroke-dashoffset="`-${(getCostPercentage('twilio') + getCostPercentage('deepgram') + getCostPercentage('cerebras')) * 2.51}`"/>
                    <circle cx="50" cy="50" r="40" fill="none"
                            stroke="#f43f5e" stroke-width="12"
                            :stroke-dasharray="`${getCostPercentage('stripe') * 2.51} 251`"
                            :stroke-dashoffset="`-${(getCostPercentage('twilio') + getCostPercentage('deepgram') + getCostPercentage('cerebras') + getCostPercentage('elevenlabs')) * 2.51}`"/>
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center">
                      <div class="font-['JetBrains_Mono',monospace] text-sm font-bold text-[#e8e6e3]">${{ stats.totalCost.toFixed(2) }}</div>
                      <div class="font-mono text-[8px] uppercase text-[#555]">Total</div>
                    </div>
                  </div>
                </div>

                <!-- Service Breakdown List -->
                <div class="flex-1 space-y-2">
                  <div v-for="service in costServices" :key="service.key"
                       class="flex items-center gap-3 p-2 rounded hover:bg-[#0a0a0c] transition-colors">
                    <div class="w-2 h-2 rounded-full" :class="service.colorClass"></div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between">
                        <span class="font-mono text-xs uppercase text-[#888]">{{ service.name }}</span>
                        <span class="font-['JetBrains_Mono',monospace] text-sm font-medium text-[#ccc]">
                          ${{ (stats.costByService?.[service.key] || 0).toFixed(6) }}
                        </span>
                      </div>
                      <div class="mt-1 h-1 bg-[#0a0a0c] rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-700"
                             :class="service.barClass"
                             :style="{ width: getCostPercentage(service.key) + '%' }"></div>
                      </div>
                    </div>
                    <span class="font-mono text-[10px] text-[#555] w-12 text-right">{{ getCostPercentage(service.key).toFixed(1) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION 3: CREDIT EXPOSURE + PRICING MATRIX (Side by Side)
             ═══════════════════════════════════════════════════════════════════ -->
        <section class="grid grid-cols-12 gap-6">

          <!-- Credit Exposure Panel -->
          <div class="col-span-5">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Credit Exposure</h2>
              <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
            </div>

            <div class="bg-[#111113] border border-amber-500/20 rounded-lg p-5 relative overflow-hidden">
              <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-amber-500/10 to-transparent blur-3xl"></div>

              <div class="relative space-y-4">
                <!-- Outstanding Credits -->
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-mono text-[9px] uppercase tracking-wider text-amber-500/70 mb-1">Outstanding Credits</div>
                    <div class="font-['JetBrains_Mono',monospace] text-3xl font-bold text-[#e8e6e3]">
                      {{ userCredits.totalBalance.toFixed(1) }} <span class="text-lg text-[#666]">min</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-mono text-[9px] uppercase tracking-wider text-[#555] mb-1">Active Users</div>
                    <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-cyan-400">{{ userCredits.userCount }}</div>
                  </div>
                </div>

                <!-- Liability -->
                <div class="p-4 bg-[#0a0a0c] border border-amber-500/20 rounded">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <span class="font-mono text-[9px] uppercase tracking-wider text-amber-500">Fulfillment Liability</span>
                  </div>
                  <div class="font-['JetBrains_Mono',monospace] text-2xl font-bold text-amber-400">
                    ${{ profitability.outstandingLiability.toFixed(2) }}
                  </div>
                  <div class="font-mono text-[9px] text-[#555] mt-1">
                    Est. cost to fulfill all credits @ ${{ profitability.avgCostPerMinute.toFixed(3) }}/min
                  </div>
                </div>

                <!-- Avg per user -->
                <div class="flex items-center justify-between p-3 bg-[#0a0a0c] rounded border border-[#1a1a1e]">
                  <span class="font-mono text-[9px] uppercase text-[#555]">Avg Credits/User</span>
                  <span class="font-['JetBrains_Mono',monospace] text-lg font-bold text-violet-400">
                    {{ userCredits.userCount > 0 ? (userCredits.totalBalance / userCredits.userCount).toFixed(1) : '0' }} min
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing Matrix Panel -->
          <div class="col-span-7">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
              <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Live Pricing Matrix</h2>
              <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
              <span class="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded font-mono text-[8px] uppercase tracking-wider text-emerald-400">
                Live
              </span>
            </div>

            <div class="bg-[#111113] border border-[#1a1a1e] rounded-lg overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-[#1a1a1e]">
                    <th class="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-wider text-[#555]">Service</th>
                    <th class="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-wider text-[#555]">Operation</th>
                    <th class="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-wider text-[#555]">Unit Price</th>
                    <th class="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-wider text-[#555]">Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="price in servicePricing" :key="`${price.service}-${price.metadata?.operation || 'default'}`"
                      class="border-b border-[#1a1a1e]/50 hover:bg-[#0a0a0c] transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-1.5 h-1.5 rounded-full"
                             :class="{
                               'bg-amber-500': price.service === 'twilio',
                               'bg-cyan-500': price.service === 'deepgram',
                               'bg-violet-500': price.service === 'cerebras',
                               'bg-emerald-500': price.service === 'elevenlabs'
                             }"></div>
                        <span class="font-mono text-xs uppercase text-[#888]">{{ price.service }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-[#666]">
                      {{ price.metadata?.operation || 'default' }}
                    </td>
                    <td class="px-4 py-3 text-right font-['JetBrains_Mono',monospace] text-sm font-medium text-[#ccc]">
                      ${{ Number(price.unit_price).toFixed(6) }}
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-[10px] text-[#555]">
                      {{ price.pricing_type }}
                    </td>
                  </tr>
                  <tr v-if="!servicePricing || servicePricing.length === 0">
                    <td colspan="4" class="px-4 py-8 text-center font-mono text-xs text-[#555]">
                      No pricing data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════════════════════════════
             SECTION 4: RECENT ACTIVITY
             ═══════════════════════════════════════════════════════════════════ -->
        <section>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
            <h2 class="font-['JetBrains_Mono',monospace] text-[11px] tracking-[0.3em] uppercase text-[#666]">Recent Activity</h2>
            <div class="flex-1 h-px bg-gradient-to-r from-[#1a1a1e] to-transparent"></div>
            <span class="font-mono text-[9px] text-[#444]">Last 20 calls</span>
          </div>

          <div class="bg-[#111113] border border-[#1a1a1e] rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-[#1a1a1e] bg-[#0a0a0c]">
                    <th class="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-wider text-[#555]">ID</th>
                    <th class="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-wider text-[#555]">User</th>
                    <th class="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-wider text-[#555]">Persona</th>
                    <th class="px-4 py-3 text-center font-mono text-[9px] uppercase tracking-wider text-[#555]">Dir</th>
                    <th class="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-wider text-[#555]">Duration</th>
                    <th class="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-wider text-[#555]">Cost</th>
                    <th class="px-4 py-3 text-center font-mono text-[9px] uppercase tracking-wider text-[#555]">Status</th>
                    <th class="px-4 py-3 text-right font-mono text-[9px] uppercase tracking-wider text-[#555]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="call in recentCalls" :key="call.id"
                      class="border-b border-[#1a1a1e]/30 hover:bg-[#0d0d10] transition-colors">
                    <td class="px-4 py-3 font-['JetBrains_Mono',monospace] text-[11px] text-[#555]">
                      {{ call.id.substring(0, 8) }}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-[#888]" :title="call.user_email">
                      {{ call.user_name || call.user_id?.substring(0, 8) || '—' }}
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-[#ccc]">
                      {{ call.persona_name || 'Unknown' }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="font-mono text-[10px] px-2 py-0.5 rounded"
                            :class="call.direction === 'inbound'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'">
                        {{ call.direction === 'inbound' ? '↓ IN' : '↑ OUT' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-['JetBrains_Mono',monospace] text-sm text-cyan-400">
                      {{ formatSeconds(call.duration_seconds) }}
                    </td>
                    <td class="px-4 py-3 text-right font-['JetBrains_Mono',monospace] text-sm text-amber-400">
                      ${{ Number(call.cost_usd || 0).toFixed(6) }}
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[9px] uppercase"
                            :class="getStatusClass(call.status)">
                        <span class="w-1 h-1 rounded-full" :class="getStatusDotClass(call.status)"></span>
                        {{ call.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right font-mono text-[10px] text-[#555]">
                      {{ formatTime(call.created_at) }}
                    </td>
                  </tr>
                  <tr v-if="!recentCalls || recentCalls.length === 0">
                    <td colspan="8" class="px-4 py-12 text-center font-mono text-sm text-[#555]">
                      No call activity for selected period
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const loading = ref(true);
const error = ref<string | null>(null);
const selectedPeriod = ref('30d');

const periodOptions = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'All', value: 'all' }
];

// Cost services configuration
const costServices = [
  { key: 'twilio', name: 'Twilio', colorClass: 'bg-amber-500', barClass: 'bg-gradient-to-r from-amber-600 to-amber-400' },
  { key: 'deepgram', name: 'Deepgram', colorClass: 'bg-cyan-500', barClass: 'bg-gradient-to-r from-cyan-600 to-cyan-400' },
  { key: 'cerebras', name: 'Cerebras', colorClass: 'bg-violet-500', barClass: 'bg-gradient-to-r from-violet-600 to-violet-400' },
  { key: 'elevenlabs', name: 'ElevenLabs', colorClass: 'bg-emerald-500', barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400' },
  { key: 'stripe', name: 'Stripe', colorClass: 'bg-rose-500', barClass: 'bg-gradient-to-r from-rose-600 to-rose-400' }
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
    stripe: 0
  } as Record<string, number>
});

const revenue = ref({ total: 0, period: 0, purchaseCount: 0 });
const userCredits = ref({ totalBalance: 0, userCount: 0 });
const apiCosts = ref({ total: 0, period: 0 });
const profitability = ref({
  revenue: 0,
  apiCosts: 0,
  grossProfit: 0,
  grossMargin: 0,
  outstandingLiability: 0,
  projectedNetProfit: 0,
  avgCostPerMinute: 0.086
});
const servicePricing = ref<any[]>([]);
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

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://call-me-back.raindrop.run'}/api/admin/dashboard?period=${selectedPeriod.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to fetch dashboard data');

    const data = await response.json();

    if (data.stats) stats.value = data.stats;
    if (data.revenue) revenue.value = data.revenue;
    if (data.userCredits) userCredits.value = data.userCredits;
    if (data.apiCosts) apiCosts.value = data.apiCosts;
    if (data.profitability) profitability.value = data.profitability;
    if (data.servicePricing) servicePricing.value = data.servicePricing;
    if (data.recentCalls) recentCalls.value = data.recentCalls;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Dashboard error:', err);
  } finally {
    loading.value = false;
  }
}

// Utility functions
function getPeriodLabel(): string {
  const labels: Record<string, string> = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    'all': 'All Time'
  };
  return labels[selectedPeriod.value] || 'Last 30 Days';
}

function getRevenuePerMinute(): number {
  const totalMinutes = stats.value.totalDuration / 60;
  if (totalMinutes === 0) return 0;
  return revenue.value.period / totalMinutes;
}

function getMarginPerMinute(): number {
  return getRevenuePerMinute() - profitability.value.avgCostPerMinute;
}

function formatSeconds(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTime(timestamp: string): string {
  if (!timestamp) return '—';
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
  const serviceCost = stats.value.costByService?.[service] || 0;
  return (serviceCost / total) * 100;
}

function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    'completed': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'in-progress': 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    'ringing': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'initiating': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'no-answer': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    'busy': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    'failed': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'cancelled': 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
  };
  return classes[status] || 'bg-[#1a1a1e] text-[#666]';
}

function getStatusDotClass(status: string): string {
  const classes: Record<string, string> = {
    'completed': 'bg-emerald-400',
    'in-progress': 'bg-cyan-400 animate-pulse',
    'ringing': 'bg-amber-400 animate-pulse',
    'initiating': 'bg-amber-400 animate-pulse',
    'no-answer': 'bg-orange-400',
    'busy': 'bg-orange-400',
    'failed': 'bg-rose-400',
    'cancelled': 'bg-rose-400'
  };
  return classes[status] || 'bg-[#555]';
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
/* Scan lines effect */
.scan-lines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(255, 255, 255, 0.03) 2px,
    rgba(255, 255, 255, 0.03) 4px
  );
}

/* Grid pattern */
.grid-pattern {
  background-image:
    linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Radial gradient utility */
.bg-gradient-radial {
  background-image: radial-gradient(circle, var(--tw-gradient-stops));
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0a0a0c;
}

::-webkit-scrollbar-thumb {
  background: #1a1a1e;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #2a2a2e;
}

/* Table hover states */
tbody tr {
  transition: background-color 0.15s ease;
}

/* SVG donut chart transitions */
svg circle {
  transition: stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out;
}
</style>
