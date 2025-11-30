<template>
  <div class="min-h-screen bg-[#0a0a0c] text-[#e8e6e3] font-['Inter',sans-serif] overflow-hidden">
    <!-- Ambient Background - Mission Control Theme -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-[#0f0f12] to-[#0a0a0c]"></div>
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"></div>
      <!-- Tactical amber glow -->
      <div class="absolute w-[900px] h-[700px] -top-[350px] -right-[250px] opacity-[0.05] pointer-events-none blur-[180px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <!-- Deep cyan accent -->
      <div class="absolute w-[700px] h-[600px] bottom-[-250px] -left-[250px] opacity-[0.04] pointer-events-none blur-[180px] bg-gradient-radial from-cyan-600 to-transparent"></div>
      <!-- Grid overlay for tactical feel -->
      <div class="absolute inset-0 opacity-[0.02]" style="background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size: 50px 50px;"></div>
    </div>

    <!-- MISSION CONTROL NAV -->
    <nav class="sticky top-0 z-50 border-b border-[#1a1a1e] backdrop-blur-xl bg-[#0a0a0c]/95">
      <div class="max-w-[1800px] mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Left: Branding + Breadcrumb -->
          <div class="flex items-center gap-6">
            <router-link to="/admin/dashboard" class="flex items-center gap-3 group">
              <div class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] group-hover:shadow-[0_0_20px_rgba(245,158,11,1)] transition-shadow"></div>
              <span class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666] group-hover:text-amber-500 transition-colors">
                Command Center
              </span>
            </router-link>
            <div class="flex items-center gap-2 text-[#444]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
              <span class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.2em] uppercase text-amber-500">
                Call Scheduler
              </span>
            </div>
          </div>

          <!-- Center: Quick Stats -->
          <div class="hidden lg:flex items-center gap-6">
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="font-['JetBrains_Mono',monospace] text-[10px] tracking-wider text-[#666]">
                <span class="text-emerald-400">{{ scheduledCalls.length }}</span> QUEUED
              </span>
            </div>
            <div class="w-px h-4 bg-[#2a2a2e]"></div>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
              <span class="font-['JetBrains_Mono',monospace] text-[10px] tracking-wider text-[#666]">
                <span class="text-cyan-400">{{ personas.length }}</span> PERSONAS
              </span>
            </div>
          </div>

          <!-- Right: Navigation -->
          <div class="flex items-center gap-3">
            <router-link
              to="/admin/personas/designer"
              class="flex items-center gap-2 bg-[#111114] px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-amber-500/40 hover:bg-[#16161a] transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#555] group-hover:text-amber-500">Designer</span>
            </router-link>

            <router-link
              to="/admin/dashboard"
              class="flex items-center gap-2 bg-[#111114] px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-cyan-500/40 hover:bg-[#16161a] transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#555] group-hover:text-cyan-400">Stats</span>
            </router-link>

            <button
              @click="handleLogout"
              class="flex items-center gap-2 bg-[#111114] px-4 py-2 rounded-lg border border-[#1a1a1e] hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300 group"
            >
              <svg class="w-4 h-4 text-[#555] group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-wider text-[#555] group-hover:text-red-400">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-[1800px] mx-auto px-6 py-8">
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">

        <!-- LEFT PANEL: Schedule New Call -->
        <div class="xl:col-span-1">
          <div class="sticky top-28">
            <!-- Panel Header -->
            <div class="flex items-center gap-3 mb-6">
              <div class="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <div>
                <h2 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.2em] uppercase text-[#e8e6e3]">New Mission</h2>
                <p class="text-[10px] text-[#555] font-['JetBrains_Mono',monospace]">Schedule outbound call</p>
              </div>
            </div>

            <!-- Schedule Form -->
            <div class="bg-[#111114] border border-[#1a1a1e] rounded-xl p-6 space-y-5">
              <!-- Phone Number -->
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <div class="w-1 h-1 rounded-full bg-amber-500/60"></div>
                  <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">Target Number</span>
                </label>
                <input
                  v-model="callForm.phoneNumber"
                  type="tel"
                  class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] placeholder-[#333] text-sm font-['JetBrains_Mono',monospace] focus:outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <!-- Persona Selection -->
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <div class="w-1 h-1 rounded-full bg-cyan-500/60"></div>
                  <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">Assigned Persona</span>
                </label>
                <div class="relative">
                  <select
                    v-model="callForm.personaId"
                    class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" class="bg-[#111114]">Select persona...</option>
                    <option
                      v-for="persona in personas"
                      :key="persona.id"
                      :value="persona.id"
                      class="bg-[#111114]"
                    >
                      {{ persona.name }}
                    </option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg class="w-4 h-4 text-[#444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- Date/Time Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="flex items-center gap-2">
                    <div class="w-1 h-1 rounded-full bg-emerald-500/60"></div>
                    <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">Date</span>
                  </label>
                  <input
                    v-model="callForm.date"
                    type="date"
                    :min="minDate"
                    class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div class="space-y-2">
                  <label class="flex items-center gap-2">
                    <div class="w-1 h-1 rounded-full bg-emerald-500/60"></div>
                    <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">Time</span>
                  </label>
                  <input
                    v-model="callForm.time"
                    type="time"
                    class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <!-- Duration -->
              <div class="space-y-2">
                <label class="flex items-center gap-2">
                  <div class="w-1 h-1 rounded-full bg-rose-500/60"></div>
                  <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">Max Duration</span>
                </label>
                <div class="relative">
                  <input
                    v-model.number="callForm.duration"
                    type="number"
                    min="1"
                    max="60"
                    class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-rose-500/50 transition-all"
                  />
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 font-['JetBrains_Mono',monospace] text-[10px] text-[#444] uppercase">min</span>
                </div>
              </div>

              <!-- Expandable Context Section -->
              <div class="border-t border-[#1a1a1e] pt-5">
                <button
                  @click="showContext = !showContext"
                  class="w-full flex items-center justify-between text-left group"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-1 h-1 rounded-full bg-violet-500/60"></div>
                    <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666] group-hover:text-violet-400 transition-colors">Mission Context</span>
                    <span class="text-[9px] text-[#444]">(optional)</span>
                  </div>
                  <svg
                    class="w-4 h-4 text-[#444] transition-transform duration-300"
                    :class="{ 'rotate-180': showContext }"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div v-if="showContext" class="mt-4 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                  <div class="space-y-2">
                    <label class="text-[10px] text-[#555]">Call pretext / scenario</label>
                    <textarea
                      v-model="callForm.callPretext"
                      class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] placeholder-[#333] text-sm focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                      placeholder="Context for the AI persona..."
                      rows="2"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] text-[#555]">Special instructions</label>
                    <textarea
                      v-model="callForm.customInstructions"
                      class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] placeholder-[#333] text-sm focus:outline-none focus:border-violet-500/50 transition-all resize-none"
                      placeholder="Behavioral overrides..."
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              <!-- Error/Success Messages -->
              <div v-if="formError" class="py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p class="text-sm text-red-400 font-['JetBrains_Mono',monospace]">{{ formError }}</p>
              </div>

              <div v-if="formSuccess" class="py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p class="text-sm text-emerald-400 font-['JetBrains_Mono',monospace]">{{ formSuccess }}</p>
              </div>

              <!-- Submit Buttons -->
              <div class="flex gap-3 pt-2">
                <button
                  @click="handleCallNow"
                  :disabled="formLoading || !isFormValid"
                  class="flex-1 px-4 py-3.5 bg-[#0a0a0c] border border-amber-500/30 rounded-lg text-amber-400 font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider hover:bg-amber-500/10 hover:border-amber-500/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {{ formLoading ? 'Initiating...' : 'Call Now' }}
                </button>
                <button
                  @click="handleScheduleCall"
                  :disabled="formLoading || !isFormValid || !callForm.date || !callForm.time"
                  class="flex-1 px-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0a0a0c] font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider font-bold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
                >
                  {{ formLoading ? 'Scheduling...' : 'Schedule' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Scheduled Calls Queue -->
        <div class="xl:col-span-2 space-y-6">
          <!-- Queue Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div>
                <h2 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.2em] uppercase text-[#e8e6e3]">Mission Queue</h2>
                <p class="text-[10px] text-[#555] font-['JetBrains_Mono',monospace]">Scheduled outbound calls</p>
              </div>
            </div>

            <!-- Bulk Actions -->
            <div class="flex items-center gap-2">
              <button
                @click="refreshCalls"
                class="p-2 bg-[#111114] border border-[#1a1a1e] rounded-lg text-[#555] hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
                title="Refresh"
              >
                <svg class="w-4 h-4" :class="{ 'animate-spin': refreshing }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="space-y-4">
            <div v-for="i in 3" :key="i" class="h-24 bg-[#111114] border border-[#1a1a1e] rounded-xl animate-pulse"></div>
          </div>

          <!-- Empty State -->
          <div v-else-if="scheduledCalls.length === 0" class="bg-[#111114] border border-[#1a1a1e] border-dashed rounded-xl p-12 text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0a0a0c] border border-[#1a1a1e] flex items-center justify-center">
              <svg class="w-8 h-8 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p class="font-['JetBrains_Mono',monospace] text-sm text-[#555] uppercase tracking-wider">No missions queued</p>
            <p class="text-[12px] text-[#444] mt-2">Schedule a call using the form</p>
          </div>

          <!-- Scheduled Calls List -->
          <div v-else class="space-y-3">
            <div
              v-for="(call, index) in scheduledCalls"
              :key="call.id"
              class="group bg-[#111114] border border-[#1a1a1e] rounded-xl overflow-hidden hover:border-[#2a2a2e] transition-all duration-300"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <!-- Main Row -->
              <div class="p-5 flex items-center gap-6">
                <!-- Time Badge -->
                <div
                  class="flex-shrink-0 w-20 h-20 rounded-xl bg-[#0a0a0c] border border-[#1a1a1e] flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/40 transition-all"
                  @click="openEditModal(call)"
                  title="Click to reschedule"
                >
                  <span class="font-['JetBrains_Mono',monospace] text-lg font-bold text-[#e8e6e3]">
                    {{ formatTime(call.scheduled_time) }}
                  </span>
                  <span class="font-['JetBrains_Mono',monospace] text-[10px] text-[#555] uppercase">
                    {{ formatDate(call.scheduled_time) }}
                  </span>
                  <svg class="w-3 h-3 text-[#333] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </div>

                <!-- Call Details -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-base font-semibold text-[#e8e6e3] truncate">
                      {{ call.persona_name || getPersonaName(call.persona_id) }}
                    </h3>
                    <span
                      class="px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono',monospace] uppercase tracking-wider"
                      :class="getStatusClass(call.status)"
                    >
                      {{ call.status }}
                    </span>
                    <span v-if="call.max_duration_minutes" class="px-2 py-0.5 bg-[#0a0a0c] border border-[#1a1a1e] rounded text-[9px] font-['JetBrains_Mono',monospace] text-[#555]">
                      {{ call.max_duration_minutes }}m limit
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-[11px] text-[#555]">
                    <span class="font-['JetBrains_Mono',monospace]">{{ call.phone_number }}</span>
                    <span v-if="call.user_id" class="text-[#444]">User: {{ call.user_id.slice(0, 8) }}...</span>
                  </div>
                  <p v-if="call.call_pretext" class="mt-2 text-[11px] text-[#444] truncate max-w-lg">
                    {{ call.call_pretext }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    @click="openEditModal(call)"
                    class="p-2 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#555] hover:text-amber-400 hover:border-amber-500/40 transition-all"
                    title="Reschedule"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    @click="openCancelConfirm(call)"
                    :disabled="cancelLoading[call.id]"
                    class="p-2 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#555] hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50"
                    title="Cancel"
                  >
                    <svg v-if="!cancelLoading[call.id]" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <svg v-else class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Calls Section -->
          <div v-if="recentCalls.length > 0" class="mt-8">
            <div class="flex items-center gap-3 mb-4">
              <div class="p-2 bg-[#111114] rounded-lg border border-[#1a1a1e]">
                <svg class="w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.2em] uppercase text-[#666]">Recent Activity</h3>
            </div>

            <div class="space-y-2">
              <div
                v-for="call in recentCalls.slice(0, 5)"
                :key="call.id"
                class="flex items-center justify-between p-4 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg"
              >
                <div class="flex items-center gap-4">
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-emerald-500': call.status === 'completed',
                      'bg-red-500': call.status === 'failed' || call.status === 'no-answer',
                      'bg-amber-500': call.status === 'in-progress',
                      'bg-[#333]': call.status === 'cancelled'
                    }"
                  ></span>
                  <span class="text-sm text-[#999]">{{ call.persona_name || 'Unknown' }}</span>
                  <span class="text-[11px] text-[#555] font-['JetBrains_Mono',monospace]">{{ call.phone_number }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-[10px] text-[#444] font-['JetBrains_Mono',monospace] uppercase">{{ call.status }}</span>
                  <span v-if="call.duration_seconds" class="text-[10px] text-[#555]">{{ formatDuration(call.duration_seconds) }}</span>
                  <span class="text-[10px] text-[#333]">{{ formatRelativeTime(call.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Edit Modal -->
    <div
      v-if="editingCall"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeEditModal"
    >
      <div class="bg-[#111114] border border-[#1a1a1e] rounded-xl p-6 w-full max-w-md animate-[fadeIn_0.15s_ease-out] shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <h3 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.15em] uppercase text-[#e8e6e3]">Reschedule Mission</h3>
          </div>
          <button @click="closeEditModal" class="text-[#555] hover:text-[#999] transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-5">
          <!-- Current Schedule -->
          <div class="p-4 bg-[#0a0a0c] rounded-lg border border-[#1a1a1e]">
            <p class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#555] mb-2">Current Schedule</p>
            <p class="text-sm text-[#999]">{{ editingCall ? formatScheduledTime(editingCall.scheduled_time) : '' }}</p>
          </div>

          <!-- New Date/Time -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">New Date</label>
              <input
                v-model="editForm.date"
                type="date"
                :min="minDate"
                class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
            <div class="space-y-2">
              <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#666]">New Time</label>
              <input
                v-model="editForm.time"
                type="time"
                class="w-full px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-all"
              />
            </div>
          </div>

          <!-- Error -->
          <div v-if="editError" class="py-2 px-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="text-sm text-red-400 font-['JetBrains_Mono',monospace]">{{ editError }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              @click="closeEditModal"
              class="flex-1 px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#666] font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider hover:border-[#2a2a2e] hover:text-[#999] transition-all"
            >
              Cancel
            </button>
            <button
              @click="saveEditedTime"
              :disabled="editLoading || !editForm.date || !editForm.time"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0a0a0c] font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider font-bold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {{ editLoading ? 'Saving...' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div
      v-if="cancelConfirmCall"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeCancelConfirm"
    >
      <div class="bg-[#111114] border border-[#1a1a1e] rounded-xl p-6 w-full max-w-md animate-[fadeIn_0.15s_ease-out] shadow-2xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <svg class="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.15em] uppercase text-[#e8e6e3]">Abort Mission</h3>
          </div>
          <button @click="closeCancelConfirm" class="text-[#555] hover:text-[#999] transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-5">
          <!-- Mission Details -->
          <div class="p-4 bg-[#0a0a0c] rounded-lg border border-red-500/20">
            <p class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.15em] text-[#555] mb-2">Scheduled Mission</p>
            <p class="text-sm text-[#999]">{{ cancelConfirmCall ? formatScheduledTime(cancelConfirmCall.scheduled_time) : '' }}</p>
            <p class="text-xs text-[#666] mt-1">{{ cancelConfirmCall?.persona_name || 'Unknown Persona' }}</p>
          </div>

          <!-- Warning Message -->
          <p class="text-sm text-[#888] leading-relaxed">
            This action cannot be undone. The scheduled call will be permanently removed from the queue.
          </p>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button
              @click="closeCancelConfirm"
              class="flex-1 px-4 py-3 bg-[#0a0a0c] border border-[#1a1a1e] rounded-lg text-[#666] font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider hover:border-[#2a2a2e] hover:text-[#999] transition-all"
            >
              Keep Mission
            </button>
            <button
              @click="confirmCancelCall"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-white font-['JetBrains_Mono',monospace] text-[11px] uppercase tracking-wider font-bold hover:from-red-500 hover:to-red-400 transition-all"
            >
              Abort Mission
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '../stores/toast'

const router = useRouter()
const toast = useToast()
const API_BASE = import.meta.env.VITE_API_URL || 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run'

// State
const loading = ref(true)
const refreshing = ref(false)
const personas = ref([])
const scheduledCalls = ref([])
const recentCalls = ref([])
const cancelLoading = ref({})

// Form state
const callForm = ref({
  phoneNumber: '',
  personaId: '',
  duration: 5,
  date: '',
  time: '',
  callPretext: '',
  customInstructions: ''
})
const showContext = ref(false)
const formLoading = ref(false)
const formError = ref('')
const formSuccess = ref('')

// Edit modal state
const editingCall = ref(null)
const editForm = ref({ date: '', time: '' })
const editLoading = ref(false)
const editError = ref('')

// Cancel confirmation modal state
const cancelConfirmCall = ref(null)

// Computed
const minDate = computed(() => new Date().toISOString().split('T')[0])

const isFormValid = computed(() => {
  return callForm.value.phoneNumber && callForm.value.personaId && callForm.value.duration > 0
})

// Auth helpers
const getAdminToken = () => localStorage.getItem('adminToken')

const handleLogout = () => {
  localStorage.removeItem('adminToken')
  router.push('/admin/login')
}

// API calls
const fetchPersonas = async () => {
  try {
    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/personas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      personas.value = data.personas || data || []
    }
  } catch (err) {
    console.error('Failed to fetch personas:', err)
  }
}

const fetchScheduledCalls = async () => {
  try {
    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/calls/scheduled`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      scheduledCalls.value = data.scheduled_calls || []
    }
  } catch (err) {
    console.error('Failed to fetch scheduled calls:', err)
  }
}

const fetchRecentCalls = async () => {
  try {
    const token = getAdminToken()
    // Use admin endpoint for recent calls (same as PersonaDesigner)
    const response = await fetch(`${API_BASE}/api/admin/dashboard/recent-calls?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      recentCalls.value = data.calls || []
    }
  } catch (err) {
    console.error('Failed to fetch recent calls:', err)
  }
}

const refreshCalls = async () => {
  refreshing.value = true
  await Promise.all([fetchScheduledCalls(), fetchRecentCalls()])
  refreshing.value = false
}

// Form handlers
const handleCallNow = async () => {
  formLoading.value = true
  formError.value = ''
  formSuccess.value = ''

  try {
    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/calls/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phoneNumber: callForm.value.phoneNumber,
        personaId: callForm.value.personaId,
        callPretext: callForm.value.callPretext || undefined,
        paymentIntentId: 'admin_bypass'
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || 'Failed to initiate call')
    }

    formSuccess.value = 'Call initiated successfully!'
    resetForm()
    await refreshCalls()
  } catch (err) {
    formError.value = err.message
  } finally {
    formLoading.value = false
  }
}

const handleScheduleCall = async () => {
  if (!callForm.value.date || !callForm.value.time) {
    formError.value = 'Please select date and time'
    return
  }

  formLoading.value = true
  formError.value = ''
  formSuccess.value = ''

  try {
    const scheduledTime = new Date(`${callForm.value.date}T${callForm.value.time}`)

    if (scheduledTime <= new Date()) {
      formError.value = 'Scheduled time must be in the future'
      formLoading.value = false
      return
    }

    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/calls/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        phoneNumber: callForm.value.phoneNumber,
        personaId: callForm.value.personaId,
        scheduledTime: scheduledTime.toISOString(),
        callPretext: callForm.value.callPretext || undefined,
        customInstructions: callForm.value.customInstructions || undefined,
        maxDurationMinutes: callForm.value.duration
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || err.message || 'Failed to schedule call')
    }

    formSuccess.value = 'Call scheduled successfully!'
    resetForm()
    await fetchScheduledCalls()
  } catch (err) {
    formError.value = err.message
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  setTimeout(() => {
    callForm.value = {
      phoneNumber: '',
      personaId: '',
      duration: 5,
      date: '',
      time: '',
      callPretext: '',
      customInstructions: ''
    }
    formSuccess.value = ''
  }, 2000)
}

// Opens cancel confirmation modal
const openCancelConfirm = (call) => {
  cancelConfirmCall.value = call
}

const closeCancelConfirm = () => {
  cancelConfirmCall.value = null
}

const confirmCancelCall = async () => {
  if (!cancelConfirmCall.value) return
  const callId = cancelConfirmCall.value.id

  cancelLoading.value[callId] = true
  closeCancelConfirm()

  try {
    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/calls/schedule/${callId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!response.ok) throw new Error('Failed to cancel')

    scheduledCalls.value = scheduledCalls.value.filter(c => c.id !== callId)
    toast.success('Mission cancelled successfully')
  } catch (err) {
    toast.error('Failed to cancel: ' + err.message)
  } finally {
    delete cancelLoading.value[callId]
  }
}

// Edit modal handlers
const openEditModal = (call) => {
  editingCall.value = call
  editError.value = ''
  const d = new Date(call.scheduled_time)
  editForm.value.date = d.toISOString().split('T')[0]
  editForm.value.time = d.toTimeString().slice(0, 5)
}

const closeEditModal = () => {
  editingCall.value = null
  editForm.value = { date: '', time: '' }
  editError.value = ''
}

const saveEditedTime = async () => {
  if (!editForm.value.date || !editForm.value.time) {
    editError.value = 'Please select date and time'
    return
  }

  const newTime = new Date(`${editForm.value.date}T${editForm.value.time}`)
  if (newTime <= new Date()) {
    editError.value = 'Time must be in the future'
    return
  }

  editLoading.value = true
  editError.value = ''

  try {
    const token = getAdminToken()
    const response = await fetch(`${API_BASE}/api/calls/schedule/${editingCall.value.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ scheduledTime: newTime.toISOString() })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || err.message || 'Failed to update')
    }

    const data = await response.json()
    const idx = scheduledCalls.value.findIndex(c => c.id === editingCall.value.id)
    if (idx !== -1 && data.scheduled_call) {
      scheduledCalls.value[idx] = data.scheduled_call
    }

    closeEditModal()
  } catch (err) {
    editError.value = err.message
  } finally {
    editLoading.value = false
  }
}

// Formatters
const getPersonaName = (personaId) => {
  const p = personas.value.find(p => p.id === personaId)
  return p?.name || 'Unknown'
}

const formatTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const formatDate = (iso) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatScheduledTime = (iso) => {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

const formatRelativeTime = (iso) => {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

const getStatusClass = (status) => {
  const classes = {
    'scheduled': 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400',
    'completed': 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400',
    'in-progress': 'bg-amber-500/20 border border-amber-500/30 text-amber-400',
    'failed': 'bg-red-500/20 border border-red-500/30 text-red-400',
    'no-answer': 'bg-orange-500/20 border border-orange-500/30 text-orange-400',
    'busy': 'bg-orange-500/20 border border-orange-500/30 text-orange-400',
    'cancelled': 'bg-[#1a1a1e] border border-[#2a2a2e] text-[#555]'
  }
  return classes[status] || 'bg-[#1a1a1e] border border-[#2a2a2e] text-[#555]'
}

// Init
onMounted(async () => {
  const token = getAdminToken()
  if (!token) {
    router.push('/admin/login')
    return
  }

  await Promise.all([
    fetchPersonas(),
    fetchScheduledCalls(),
    fetchRecentCalls()
  ])
  loading.value = false
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

/* Custom scrollbar for the page */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #0a0a0c;
}
::-webkit-scrollbar-thumb {
  background: #2a2a2e;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #3a3a3e;
}
</style>
