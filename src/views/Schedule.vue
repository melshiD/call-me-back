<template>
  <div class="min-h-screen bg-[#0d0d0f] text-[#e8e6e3] font-['Inter',sans-serif] overflow-hidden">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#131318] to-[#0d0d0f]"></div>
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <div class="absolute w-[600px] h-[500px] -top-[200px] -right-[150px] opacity-[0.04] pointer-events-none blur-[150px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <div class="absolute w-[500px] h-[400px] bottom-[-150px] -left-[150px] opacity-[0.03] pointer-events-none blur-[150px] bg-gradient-radial from-orange-500 to-transparent"></div>
    </div>

    <div class="max-w-2xl mx-auto px-6 pt-24 pb-16">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666] mb-3">Request a Call</h1>
        <p class="text-[#999] text-sm">Instant or scheduled conversations with your AI companions</p>
      </div>

      <!-- Unified Call Form -->
      <div class="mb-10">
        <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-6 space-y-5">
          <form @submit.prevent="handleSubmit" class="space-y-5">
            <!-- Phone & Persona Row -->
            <div class="grid md:grid-cols-2 gap-4">
              <!-- Phone Number -->
              <div class="space-y-1.5">
                <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Phone Number</label>
                <input
                  v-model="callForm.phoneNumber"
                  type="tel"
                  class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  placeholder="+1234567890"
                  required
                />
              </div>

              <!-- Persona Selection -->
              <div class="space-y-1.5">
                <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Persona</label>
                <div class="relative">
                  <select
                    v-model="callForm.personaId"
                    class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors appearance-none cursor-pointer"
                    required
                  >
                    <option value="" class="bg-[#1a1a1e]">Select persona...</option>
                    <option
                      v-for="contact in personasStore.userContacts"
                      :key="contact.id"
                      :value="contact.id"
                      class="bg-[#1a1a1e]"
                    >
                      {{ contact.name }}
                    </option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg class="w-4 h-4 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Duration -->
            <div class="space-y-1.5">
              <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Estimated Duration</label>
              <div class="relative max-w-[200px]">
                <input
                  v-model.number="callForm.duration"
                  type="number"
                  min="1"
                  max="60"
                  class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  required
                />
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] text-xs">min</span>
              </div>
            </div>

            <!-- Call Context Section (Layer 2) -->
            <div class="space-y-4 pt-2 border-t border-[#2a2a2e]">
              <div class="flex items-center gap-2 pt-3">
                <div class="w-1 h-1 rounded-full bg-amber-500/50"></div>
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Call Context <span class="text-[#444]">(Optional)</span></label>
              </div>

              <!-- Quick Context Prefabs -->
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="prefab in allPrefabs"
                  :key="prefab.id"
                  type="button"
                  class="px-2.5 py-1.5 bg-[#0d0d0f] border rounded text-[11px] font-medium transition-all duration-200 flex items-center gap-1.5"
                  :class="callForm.selectedPrefab === prefab.id
                    ? 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                    : 'border-[#2a2a2e] text-[#888] hover:border-[#3a3a3e] hover:text-[#aaa]'"
                  @click="usePrefab(prefab)"
                >
                  <span class="text-xs">{{ prefab.icon }}</span>
                  <span>{{ prefab.name }}</span>
                  <button
                    v-if="prefab.isCustom"
                    type="button"
                    @click.stop="deletePrefab(prefab.id)"
                    class="ml-0.5 text-red-400/60 hover:text-red-400 text-[10px]"
                    title="Delete"
                  >×</button>
                </button>
              </div>

              <!-- Call Pretext -->
              <div class="space-y-1.5">
                <label class="block text-[11px] text-[#555]">What should your persona know about this call?</label>
                <textarea
                  v-model="callForm.callPretext"
                  class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                  placeholder="e.g., I just got back from a tough day at work..."
                  rows="2"
                />
              </div>

              <!-- Custom Instructions -->
              <div class="space-y-1.5">
                <label class="block text-[11px] text-[#555]">Any special instructions for the persona?</label>
                <textarea
                  v-model="callForm.customInstructions"
                  class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                  placeholder="e.g., Keep it light and funny, avoid work topics..."
                  rows="2"
                />
              </div>

              <!-- Save as prefab option -->
              <div v-if="callForm.callPretext && callForm.callPretext.length > 10" class="flex justify-end">
                <button
                  type="button"
                  @click="saveNewPrefab"
                  class="text-[10px] text-[#666] hover:text-amber-400 transition-colors font-['JetBrains_Mono',monospace] uppercase tracking-wider"
                >
                  + Save as preset
                </button>
              </div>
            </div>

            <!-- Error/Success Messages -->
            <div v-if="formError" class="py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-sm text-red-400">{{ formError }}</p>
            </div>

            <div v-if="formSuccess" class="py-3 px-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p class="text-sm text-emerald-400">{{ formSuccess }}</p>
            </div>

            <!-- Action Buttons Section -->
            <div class="pt-3 space-y-4">
              <!-- Call Now / or / Schedule Row -->
              <div v-if="!showSchedule" class="flex items-center gap-4">
                <!-- Call Now Button -->
                <button
                  type="button"
                  @click="handleCallNow"
                  class="flex-1 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-sm font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
                  :disabled="formLoading || !isFormValid"
                >
                  <span v-if="formLoading && !showSchedule">Calling...</span>
                  <span v-else>Call Now</span>
                </button>

                <!-- Stylized "or" divider -->
                <div class="flex items-center">
                  <div class="w-px h-8 bg-[#2a2a2e]"></div>
                  <span class="px-3 font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#444]">or</span>
                  <div class="w-px h-8 bg-[#2a2a2e]"></div>
                </div>

                <!-- Schedule Button (toggle) -->
                <button
                  type="button"
                  @click="showSchedule = true"
                  class="flex-1 px-6 py-3.5 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#999] text-sm font-bold uppercase tracking-wider hover:border-amber-500/30 hover:text-amber-400 transition-all duration-300 disabled:opacity-50"
                  :disabled="!isFormValid"
                >
                  Schedule
                </button>
              </div>

              <!-- Schedule Section (Expanded) -->
              <div v-if="showSchedule" class="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                <!-- Back button -->
                <button
                  type="button"
                  @click="showSchedule = false"
                  class="flex items-center gap-2 text-[#666] hover:text-[#999] transition-colors text-sm"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em]">Back to instant call</span>
                </button>

                <!-- Schedule Date/Time -->
                <div class="p-4 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg space-y-4">
                  <div class="flex items-center gap-2 mb-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                    <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Schedule Call</span>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                      <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Date</label>
                      <input
                        v-model="callForm.date"
                        type="date"
                        class="w-full px-4 py-3 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                        :min="minDate"
                      />
                    </div>

                    <div class="space-y-1.5">
                      <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Time</label>
                      <input
                        v-model="callForm.time"
                        type="time"
                        class="w-full px-4 py-3 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <!-- Submit Scheduled Call Button -->
                <button
                  type="button"
                  @click="handleScheduleSubmit"
                  class="w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-sm font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
                  :disabled="formLoading || !isFormValid || !callForm.date || !callForm.time"
                >
                  <span v-if="formLoading">Scheduling...</span>
                  <span v-else>Submit Scheduled Call</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <!-- Scheduled Calls List -->
      <div v-if="callsStore.scheduledCalls.length > 0" class="mb-10">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
          <h2 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666]">Upcoming Scheduled Calls</h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="call in callsStore.scheduledCalls"
            :key="call.id"
            class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl overflow-hidden hover:border-amber-500/20 transition-all duration-300"
          >
            <!-- Main Call Info Row -->
            <div class="p-4 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1.5">
                  <h3 class="text-sm font-semibold text-[#e8e6e3]">{{ getPersonaName(call.persona_id, call.persona_name) }}</h3>
                  <span v-if="call.call_scenario" class="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[10px] font-medium text-amber-400">
                    {{ formatScenario(call.call_scenario) }}
                  </span>
                  <span v-if="call.max_duration_minutes" class="px-2 py-0.5 bg-[#0d0d0f] border border-[#2a2a2e] rounded text-[10px] text-[#666]">
                    {{ call.max_duration_minutes }} min
                  </span>
                </div>
                <p
                  class="text-[#999] text-xs mb-0.5 cursor-pointer hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                  @click="openEditModal(call)"
                  title="Click to reschedule"
                >
                  {{ formatScheduledTime(call.scheduled_time) }}
                  <svg class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </p>
                <p class="text-[10px] text-[#666]">To: {{ call.phone_number }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- Expand/Collapse Button -->
                <button
                  v-if="call.call_pretext || call.custom_instructions"
                  @click="toggleCallDetails(call.id)"
                  class="px-3 py-1.5 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#666] hover:border-[#3a3a3e] hover:text-[#999] transition-all duration-300 flex items-center gap-1.5 text-xs"
                >
                  <span>{{ expandedCalls[call.id] ? 'Hide' : 'Details' }}</span>
                  <span class="transition-transform duration-300 text-[10px]" :class="{ 'rotate-180': expandedCalls[call.id] }">▼</span>
                </button>
                <button
                  @click="cancelCall(call.id)"
                  class="px-4 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all duration-300"
                  :disabled="cancelLoading[call.id]"
                >
                  {{ cancelLoading[call.id] ? 'Cancelling...' : 'Cancel' }}
                </button>
              </div>
            </div>

            <!-- Expandable Details Section -->
            <div
              v-if="expandedCalls[call.id] && (call.call_pretext || call.custom_instructions)"
              class="px-4 pb-4 pt-2 border-t border-[#2a2a2e] bg-[#0d0d0f]/50 space-y-3 animate-[fadeIn_0.2s_ease-out]"
            >
              <div v-if="call.call_pretext" class="space-y-1.5">
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Call Context</label>
                <p class="text-xs text-[#999] bg-[#1a1a1e] rounded-lg p-3 border border-[#2a2a2e]">
                  {{ call.call_pretext }}
                </p>
              </div>
              <div v-if="call.custom_instructions" class="space-y-1.5">
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Custom Instructions</label>
                <p class="text-xs text-[#999] bg-[#1a1a1e] rounded-lg p-3 border border-[#2a2a2e]">
                  {{ call.custom_instructions }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Completed Calls -->
      <div v-if="callsStore.calls && callsStore.calls.length > 0">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <h2 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666]">Recent Calls</h2>
        </div>

        <div class="space-y-3">
          <div
            v-for="call in callsStore.calls.slice(0, 5)"
            :key="call.id"
            class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl overflow-hidden hover:border-[#3a3a3e] transition-all duration-300"
          >
            <!-- Main Call Info Row -->
            <div class="p-4 flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1.5">
                  <h3 class="text-sm font-semibold text-[#e8e6e3]">{{ getPersonaName(call.persona_id, call.persona_name) }}</h3>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-medium"
                    :class="getStatusClass(call.status)"
                  >
                    {{ call.status }}
                  </span>
                  <span v-if="call.duration || call.duration_seconds" class="text-[10px] text-[#666]">
                    {{ formatDuration(call.duration || call.duration_seconds) }}
                  </span>
                </div>
                <p class="text-xs text-[#666]">{{ formatScheduledTime(call.start_time || call.created_at) }}</p>
              </div>
              <div class="flex items-center gap-2">
                <!-- Expand/Collapse Button -->
                <button
                  v-if="call.call_pretext || call.custom_instructions"
                  @click="toggleCallDetails(call.id)"
                  class="px-3 py-1.5 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#666] hover:border-[#3a3a3e] hover:text-[#999] transition-all duration-300 flex items-center gap-1.5 text-xs"
                >
                  <span>{{ expandedCalls[call.id] ? 'Hide' : 'Details' }}</span>
                  <span class="transition-transform duration-300 text-[10px]" :class="{ 'rotate-180': expandedCalls[call.id] }">▼</span>
                </button>
              </div>
            </div>

            <!-- Expandable Details Section -->
            <div
              v-if="expandedCalls[call.id] && (call.call_pretext || call.custom_instructions)"
              class="px-4 pb-4 pt-2 border-t border-[#2a2a2e] bg-[#0d0d0f]/50 space-y-3 animate-[fadeIn_0.2s_ease-out]"
            >
              <div v-if="call.call_pretext" class="space-y-1.5">
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Call Context</label>
                <p class="text-xs text-[#999] bg-[#1a1a1e] rounded-lg p-3 border border-[#2a2a2e]">
                  {{ call.call_pretext }}
                </p>
              </div>
              <div v-if="call.custom_instructions" class="space-y-1.5">
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Custom Instructions</label>
                <p class="text-xs text-[#999] bg-[#1a1a1e] rounded-lg p-3 border border-[#2a2a2e]">
                  {{ call.custom_instructions }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Scheduled Call Modal -->
    <div
      v-if="editingCall"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeEditModal"
    >
      <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-6 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-semibold text-[#e8e6e3]">Reschedule Call</h3>
          <button
            @click="closeEditModal"
            class="text-[#666] hover:text-[#999] transition-colors"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Current time display -->
          <div class="p-3 bg-[#0d0d0f] rounded-lg border border-[#2a2a2e]">
            <p class="text-[10px] font-['JetBrains_Mono',monospace] uppercase tracking-[0.2em] text-[#666] mb-1">Currently Scheduled</p>
            <p class="text-sm text-[#999]">{{ editingCall ? formatScheduledTime(editingCall.scheduled_time) : '' }}</p>
          </div>

          <!-- New date/time inputs -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">New Date</label>
              <input
                v-model="editForm.date"
                type="date"
                class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                :min="minDate"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">New Time</label>
              <input
                v-model="editForm.time"
                type="time"
                class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          <!-- Error display -->
          <div v-if="editError" class="py-2 px-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p class="text-sm text-red-400">{{ editError }}</p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-3 pt-2">
            <button
              @click="closeEditModal"
              class="flex-1 px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#999] text-sm font-medium hover:border-[#3a3a3e] hover:text-[#e8e6e3] transition-all duration-300"
            >
              Cancel
            </button>
            <button
              @click="saveEditedTime"
              class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="editLoading || !editForm.date || !editForm.time"
            >
              {{ editLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCallsStore } from '../stores/calls'
import { usePersonasStore } from '../stores/personas'
import { useUserStore } from '../stores/user'

const callsStore = useCallsStore()
const personasStore = usePersonasStore()
const userStore = useUserStore()

// Unified call form state
const callForm = ref({
  phoneNumber: '',
  personaId: '',
  duration: 5,
  callPretext: '',
  customInstructions: '',
  selectedPrefab: null,
  date: '',
  time: ''
})

const showSchedule = ref(false)
const formLoading = ref(false)
const formError = ref('')
const formSuccess = ref('')

// Default prefabs (unified)
const defaultPrefabs = [
  { id: 'prefab-1', name: 'Motivation', icon: '💪', text: 'Give me a motivational pep talk to start my day strong. Remind me of my goals and help me feel energized and focused.', isCustom: false },
  { id: 'prefab-2', name: 'Escape Call', icon: '🆘', text: 'Call to rescue me from a situation. Pretend there\'s an urgent matter that needs my attention. Be convincing but natural.', isCustom: false },
  { id: 'prefab-3', name: 'Check-In', icon: '💬', text: 'Just calling to check in and see how I\'m doing. Be a supportive friend and listen to what\'s on my mind.', isCustom: false },
  { id: 'prefab-4', name: 'Accountability', icon: '📋', text: 'Help me stay accountable to my goals. Ask about my progress and encourage me to stay on track. Be supportive but firm.', isCustom: false },
  { id: 'prefab-5', name: 'Interview Prep', icon: '🎯', text: 'Help me prepare for an upcoming interview. Ask me practice questions and give me feedback on my answers.', isCustom: false },
  { id: 'prefab-6', name: 'Wind Down', icon: '🌙', text: 'Help me wind down and relax. Have a calm, soothing conversation to help me de-stress after a long day.', isCustom: false }
]

// Custom prefabs from localStorage
const customPrefabs = ref([])

const loadCustomPrefabs = () => {
  try {
    const saved = localStorage.getItem('cmb_call_prefabs')
    if (saved) customPrefabs.value = JSON.parse(saved)
  } catch (e) {
    console.warn('Failed to load custom prefabs:', e)
  }
}

const saveCustomPrefabs = () => {
  try {
    localStorage.setItem('cmb_call_prefabs', JSON.stringify(customPrefabs.value))
  } catch (e) {
    console.warn('Failed to save custom prefabs:', e)
  }
}

// All prefabs combined
const allPrefabs = computed(() => [...defaultPrefabs, ...customPrefabs.value])

const usePrefab = (prefab) => {
  callForm.value.callPretext = prefab.text
  callForm.value.selectedPrefab = prefab.id
}

const saveNewPrefab = () => {
  const name = prompt('Enter a name for this quick context:')
  if (!name || !name.trim()) return
  const icon = prompt('Choose an emoji icon (or press Enter for default):', '⭐') || '⭐'
  const newPrefab = {
    id: 'custom-' + Date.now(),
    name: name.trim(),
    icon,
    text: callForm.value.callPretext,
    isCustom: true
  }
  customPrefabs.value.push(newPrefab)
  saveCustomPrefabs()
  callForm.value.selectedPrefab = newPrefab.id
}

const deletePrefab = (prefabId) => {
  if (!confirm('Delete this quick context?')) return
  customPrefabs.value = customPrefabs.value.filter(p => p.id !== prefabId)
  saveCustomPrefabs()
  if (callForm.value.selectedPrefab === prefabId) {
    callForm.value.selectedPrefab = null
  }
}

// Form validation
const isFormValid = computed(() => {
  return callForm.value.phoneNumber && callForm.value.personaId && callForm.value.duration > 0
})

const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// Handle Call Now
const handleCallNow = async () => {
  formLoading.value = true
  formError.value = ''
  formSuccess.value = ''

  try {
    // Use credits-based calling (no payment intent needed)
    await callsStore.triggerCall(
      callForm.value.phoneNumber,
      callForm.value.personaId,
      null, // No payment intent - use credits
      callForm.value.callPretext || null
    )

    formSuccess.value = 'Call initiated! You should receive a call shortly.'
    resetForm()
  } catch (err) {
    // Check for insufficient credits error
    if (err.message?.includes('Insufficient') || err.message?.includes('402')) {
      formError.value = 'Insufficient minutes balance. Please purchase more minutes to make calls.'
    } else {
      formError.value = err.message || 'Failed to initiate call'
    }
  } finally {
    formLoading.value = false
  }
}

// Handle Schedule Submit (from expanded schedule section)
const handleScheduleSubmit = async () => {
  // Validate date/time
  if (!callForm.value.date || !callForm.value.time) {
    formError.value = 'Please select a date and time'
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

    const minTime = new Date(Date.now() + 1 * 60 * 1000)
    if (scheduledTime < minTime) {
      formError.value = 'Must schedule at least 1 minute in advance'
      formLoading.value = false
      return
    }

    await callsStore.scheduleCall(
      callForm.value.phoneNumber,
      callForm.value.personaId,
      scheduledTime.toISOString(),
      {
        callPretext: callForm.value.callPretext || undefined,
        customInstructions: callForm.value.customInstructions || undefined,
        maxDurationMinutes: callForm.value.duration || 5
      }
    )

    formSuccess.value = 'Call scheduled successfully!'
    resetForm()
  } catch (err) {
    formError.value = err.message || 'Failed to schedule call'
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
      callPretext: '',
      customInstructions: '',
      selectedPrefab: null,
      date: '',
      time: ''
    }
    showSchedule.value = false
    formSuccess.value = ''
  }, 3000)
}

// Legacy compatibility for existing handlers
const handleSubmit = () => {} // Form uses button handlers instead

const cancelLoading = ref({})
const expandedCalls = ref({})

// Edit scheduled call state
const editingCall = ref(null)
const editForm = ref({
  date: '',
  time: ''
})
const editLoading = ref(false)
const editError = ref('')

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

// Open edit modal for a scheduled call
const openEditModal = (call) => {
  editingCall.value = call
  editError.value = ''
  // Parse existing scheduled_time into date and time parts
  const scheduledDate = new Date(call.scheduled_time)
  editForm.value.date = scheduledDate.toISOString().split('T')[0]
  // Format time as HH:MM
  const hours = scheduledDate.getHours().toString().padStart(2, '0')
  const minutes = scheduledDate.getMinutes().toString().padStart(2, '0')
  editForm.value.time = `${hours}:${minutes}`
}

// Close edit modal
const closeEditModal = () => {
  editingCall.value = null
  editForm.value = { date: '', time: '' }
  editError.value = ''
}

// Save edited scheduled time
const saveEditedTime = async () => {
  if (!editForm.value.date || !editForm.value.time) {
    editError.value = 'Please select both date and time'
    return
  }

  const newScheduledTime = new Date(`${editForm.value.date}T${editForm.value.time}`)

  if (newScheduledTime <= new Date()) {
    editError.value = 'Scheduled time must be in the future'
    return
  }

  const minTime = new Date(Date.now() + 1 * 60 * 1000)
  if (newScheduledTime < minTime) {
    editError.value = 'Must schedule at least 1 minute in advance'
    return
  }

  editLoading.value = true
  editError.value = ''

  try {
    await callsStore.updateScheduledCall(editingCall.value.id, newScheduledTime.toISOString())
    closeEditModal()
  } catch (err) {
    editError.value = err.message || 'Failed to update scheduled time'
  } finally {
    editLoading.value = false
  }
}

const getPersonaName = (personaId, personaName = null) => {
  // Use persona_name if provided (from API response)
  if (personaName) {
    return personaName
  }
  // Fallback to lookup in contacts
  const contact = personasStore.userContacts.find(c => c.persona_id === personaId || c.id === personaId)
  if (contact) {
    return contact.persona_name || contact.name
  }
  // Fallback to personas store
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
    'completed': 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400',
    'in-progress': 'bg-amber-500/10 border border-amber-500/30 text-amber-400',
    'ringing': 'bg-blue-500/10 border border-blue-500/30 text-blue-400',
    'failed': 'bg-red-500/10 border border-red-500/30 text-red-400',
    'no-answer': 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
    'busy': 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
    'cancelled': 'bg-[#0d0d0f] border border-[#2a2a2e] text-[#666]',
    'initiating': 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
  }
  return classes[status] || 'bg-[#0d0d0f] border border-[#2a2a2e] text-[#666]'
}

// Track if component is still mounted to prevent state updates after unmount
let isMounted = true

onMounted(async () => {
  loadCustomPrefabs()
  try {
    await personasStore.fetchContacts()
    if (!isMounted) return
    await callsStore.fetchScheduledCalls()
    if (!isMounted) return
    await callsStore.fetchCalls()
  } catch (error) {
    console.error('Error loading schedule data:', error)
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
