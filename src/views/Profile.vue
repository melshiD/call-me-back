<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] pt-24 pb-16 px-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] -top-[200px] right-[10%] opacity-10 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[500px] h-[500px] bottom-[15%] -left-[150px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-black mb-4 tracking-tight">
          <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Profile & Settings</span>
        </h1>
        <p class="text-lg text-cream/70">Manage your account and view activity</p>
      </div>

      <!-- Minutes Balance Hero Card -->
      <div class="mb-10 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.05s]">
        <div class="relative overflow-hidden bg-gradient-to-br from-glow/20 via-ember/15 to-solar/20 backdrop-blur-xl border-2 border-glow/40 rounded-[32px] p-8">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-6">
              <!-- Icon with status indicator -->
              <div class="relative">
                <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-glow to-ember flex items-center justify-center shadow-[0_0_40px_rgba(255,170,51,0.4)]">
                  <svg class="w-10 h-10 text-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div v-if="minutesBalance > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-deep animate-[pulse_3s_ease-in-out_infinite]"></div>
                <div v-else class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-deep"></div>
              </div>

              <div>
                <div class="text-sm font-bold uppercase tracking-[0.15em] text-cream/60 mb-1">Available Minutes</div>
                <div class="flex items-baseline gap-2">
                  <span class="text-5xl sm:text-6xl font-[--font-display] font-black tabular-nums"
                        :class="minutesBalance > 0 ? 'text-glow' : 'text-red-400'">
                    {{ minutesBalance ?? '—' }}
                  </span>
                  <span class="text-xl text-cream/50 font-semibold">min</span>
                </div>
                <div class="text-sm text-cream/50 mt-1" v-if="balanceLastUpdated">
                  Updated {{ formatRelativeTime(balanceLastUpdated) }}
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-3 w-full sm:w-auto">
              <button
                @click="refreshBalance"
                :disabled="balanceLoading"
                class="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 hover:border-glow/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" :class="{ 'animate-spin': balanceLoading }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ balanceLoading ? 'Refreshing...' : 'Refresh' }}
              </button>
              <router-link
                to="/pricing"
                class="px-6 py-3 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold text-sm hover:scale-[1.02] transition-all duration-300 text-center shadow-[0_4px_20px_rgba(255,170,51,0.3)]"
              >
                + Buy Minutes
              </router-link>
            </div>
          </div>

          <!-- Warning banner when low/zero balance -->
          <div v-if="minutesBalance !== null && minutesBalance < 5"
               class="mt-6 p-4 rounded-xl border"
               :class="minutesBalance === 0
                 ? 'bg-red-500/10 border-red-500/30'
                 : 'bg-amber-500/10 border-amber-500/30'">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 flex-shrink-0" :class="minutesBalance === 0 ? 'text-red-400' : 'text-amber-400'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span class="text-sm font-semibold" :class="minutesBalance === 0 ? 'text-red-300' : 'text-amber-300'">
                {{ minutesBalance === 0
                   ? 'No minutes remaining. Purchase minutes to make calls.'
                   : 'Low balance! Consider purchasing more minutes.' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid Layout -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- Profile Info Card -->
        <div class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 h-full">
            <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-glow rounded-full"></span>
              Profile Information
            </h2>

            <div v-if="!editingProfile" class="space-y-4">
              <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div class="text-sm text-cream/50 mb-1">Name</div>
                <div class="font-semibold">{{ authStore.user?.name }}</div>
              </div>

              <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div class="text-sm text-cream/50 mb-1">Email</div>
                <div class="font-semibold">{{ authStore.user?.email }}</div>
              </div>

              <!-- Phone Numbers Section -->
              <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="text-sm text-cream/50">Phone Numbers</div>
                  <button
                    @click="openPhoneVerificationModal"
                    class="px-3 py-1.5 bg-gradient-to-r from-glow/20 to-ember/20 border border-glow/40 rounded-lg text-sm font-semibold hover:from-glow/30 hover:to-ember/30 transition-all duration-300"
                  >
                    + Add Number
                  </button>
                </div>

                <!-- No numbers message -->
                <div v-if="phonesStore.verifiedPhones.length === 0" class="text-cream/40 text-sm py-2">
                  No verified phone numbers. Add one to receive calls.
                </div>

                <!-- Phone numbers list -->
                <div v-else class="space-y-2">
                  <div
                    v-for="phoneEntry in phonesStore.verifiedPhones"
                    :key="phoneEntry.phone"
                    class="flex items-center justify-between py-2 px-3 rounded-lg transition-all duration-200"
                    :class="phoneEntry.isPrimary ? 'bg-glow/10 border border-glow/30' : 'bg-white/[0.02] hover:bg-white/[0.04]'"
                  >
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <!-- Primary indicator -->
                      <div v-if="phoneEntry.isPrimary" class="w-2 h-2 bg-glow rounded-full flex-shrink-0"></div>
                      <div v-else class="w-2 h-2 bg-transparent rounded-full flex-shrink-0"></div>

                      <!-- Editable nickname -->
                      <div class="flex-1 min-w-0">
                        <div v-if="editingNicknamePhone === phoneEntry.phone" class="flex items-center gap-2">
                          <input
                            v-model="editingNicknameValue"
                            type="text"
                            maxlength="30"
                            class="flex-1 px-2 py-1 bg-white/5 border border-white/20 rounded text-sm text-cream focus:outline-none focus:border-glow/50"
                            placeholder="Nickname"
                            @keydown.enter="saveNickname(phoneEntry.phone)"
                            @keydown.esc="cancelNicknameEdit"
                          />
                          <button @click="saveNickname(phoneEntry.phone)" class="text-emerald-400 hover:text-emerald-300 text-xs">Save</button>
                          <button @click="cancelNicknameEdit" class="text-cream/50 hover:text-cream/70 text-xs">Cancel</button>
                        </div>
                        <div v-else class="flex items-center gap-2">
                          <span class="font-semibold truncate">{{ phoneEntry.nickname || phonesStore.formatPhoneForDisplay(phoneEntry.phone) }}</span>
                          <button
                            @click="startNicknameEdit(phoneEntry)"
                            class="text-cream/30 hover:text-cream/60 transition-colors"
                            title="Edit nickname"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                        <div v-if="phoneEntry.nickname" class="text-xs text-cream/40">{{ phonesStore.formatPhoneForDisplay(phoneEntry.phone) }}</div>
                      </div>

                      <!-- Verified badge -->
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-full font-bold uppercase flex-shrink-0">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center gap-2 ml-3 flex-shrink-0">
                      <button
                        v-if="!phoneEntry.isPrimary"
                        @click="phonesStore.setPrimary(phoneEntry.phone)"
                        class="text-xs text-cream/50 hover:text-glow transition-colors"
                        title="Set as primary"
                      >
                        Set Primary
                      </button>
                      <span v-else class="text-xs text-glow font-semibold">Primary</span>

                      <button
                        @click="confirmDeletePhone(phoneEntry.phone)"
                        class="text-red-400/60 hover:text-red-400 transition-colors ml-2"
                        title="Remove number"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div class="text-sm text-cream/50 mb-1">Member Since</div>
                <div class="font-semibold">{{ formatDate(authStore.user?.created_at) }}</div>
              </div>

              <button
                @click="editingProfile = true"
                class="w-full px-6 py-4 bg-white/5 border-2 border-white/20 rounded-xl font-bold hover:bg-white/10 hover:border-glow/40 transition-all duration-300"
              >
                Edit Profile
              </button>
            </div>

            <form v-else @submit.prevent="handleUpdateProfile" class="space-y-4">
              <div class="space-y-2">
                <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Name</label>
                <input
                  v-model="profileForm.name"
                  type="text"
                  class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                  required
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Email</label>
                <input
                  v-model="profileForm.email"
                  type="email"
                  class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                  required
                />
              </div>

              <!-- Phone numbers are managed separately via Add/Delete, not in this form -->
              <div class="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <p class="text-sm text-cream/40">Phone numbers are managed above. Use the "Add Number" button to add and verify phone numbers.</p>
              </div>

              <div v-if="profileError" class="bg-solar/10 border border-solar/30 rounded-xl p-4">
                <p class="text-sm text-cream">{{ profileError }}</p>
              </div>

              <div v-if="profileSuccess" class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p class="text-sm text-cream">Profile updated successfully!</p>
              </div>

              <div class="flex gap-3">
                <button
                  type="button"
                  @click="cancelEdit"
                  class="flex-1 px-6 py-4 bg-white/5 border-2 border-white/20 rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex-1 px-6 py-4 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
                  :disabled="profileLoading"
                >
                  {{ profileLoading ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Payment Methods Card -->
        <div class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 h-full">
            <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
              <span class="w-2 h-2 bg-ember rounded-full"></span>
              Payment Methods
            </h2>

            <div v-if="userStore.billingInfo?.payment_methods.length === 0" class="text-center py-12 text-cream/50">
              No payment methods added
            </div>

            <div v-else class="space-y-3 mb-6">
              <div
                v-for="pm in userStore.billingInfo?.payment_methods"
                :key="pm.id"
                class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-5"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="text-3xl">💳</div>
                    <div>
                      <div class="font-bold">{{ pm.brand.toUpperCase() }} •••• {{ pm.last4 }}</div>
                      <div class="text-sm text-cream/50">Expires {{ pm.exp_month }}/{{ pm.exp_year }}</div>
                    </div>
                  </div>
                  <span v-if="pm.is_default" class="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-full font-bold uppercase">
                    Default
                  </span>
                </div>

                <div class="flex gap-2">
                  <button
                    v-if="!pm.is_default"
                    @click="setDefaultPayment(pm.id)"
                    class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/10 hover:border-glow/30 transition-all duration-300"
                  >
                    Set Default
                  </button>
                  <button
                    @click="removePayment(pm.id)"
                    class="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-all duration-300"
                    :disabled="pm.is_default"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <button
              @click="showAddPaymentModal = true"
              class="w-full px-6 py-4 bg-gradient-to-r from-ember to-solar rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300"
            >
              + Add Payment Method
            </button>
          </div>
        </div>
      </div>

      <!-- Usage Stats (Full Width) -->
      <div v-if="userStore.usageStats" class="mt-8 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
        <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10">
          <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
            <span class="w-2 h-2 bg-solar rounded-full"></span>
            Usage & Billing
          </h2>

          <!-- Stats Summary -->
          <div class="grid sm:grid-cols-3 gap-6 mb-8">
            <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div class="text-4xl font-[--font-display] font-black text-glow mb-2">{{ userStore.usageStats.total_calls }}</div>
              <div class="text-sm text-cream/60 uppercase tracking-wider font-bold">Total Calls</div>
            </div>
            <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
              <div class="text-4xl font-[--font-display] font-black text-ember mb-2">{{ userStore.usageStats.total_minutes }}</div>
              <div class="text-sm text-cream/60 uppercase tracking-wider font-bold">Total Minutes</div>
            </div>
            <div class="bg-gradient-to-br from-glow/20 to-ember/20 border-2 border-glow/40 rounded-2xl p-6 text-center">
              <div class="text-4xl font-[--font-display] font-black mb-2">${{ parseFloat(userStore.usageStats.total_spent || 0).toFixed(2) }}</div>
              <div class="text-sm uppercase tracking-wider font-bold">Total Spent</div>
            </div>
          </div>

          <!-- This Month -->
          <div class="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">This Month</h3>
            <div class="grid grid-cols-3 gap-6 text-center">
              <div>
                <div class="text-3xl font-black mb-1">{{ userStore.usageStats.current_month.calls }}</div>
                <div class="text-sm text-cream/60">calls</div>
              </div>
              <div>
                <div class="text-3xl font-black mb-1">{{ userStore.usageStats.current_month.minutes }}</div>
                <div class="text-sm text-cream/60">minutes</div>
              </div>
              <div>
                <div class="text-3xl font-black mb-1">${{ parseFloat(userStore.usageStats.current_month?.spent || 0).toFixed(2) }}</div>
                <div class="text-sm text-cream/60">spent</div>
              </div>
            </div>
          </div>

          <!-- Monthly Breakdown -->
          <div>
            <h3 class="text-xl font-bold mb-4">Monthly Breakdown</h3>
            <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
              <div class="grid grid-cols-4 gap-4 p-4 bg-white/5 font-bold text-sm uppercase tracking-wider">
                <div>Month</div>
                <div class="text-center">Calls</div>
                <div class="text-center">Minutes</div>
                <div class="text-right">Spent</div>
              </div>
              <div
                v-for="month in userStore.usageStats.monthly_breakdown"
                :key="month.month"
                class="grid grid-cols-4 gap-4 p-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors"
              >
                <div class="font-semibold">{{ month.month }}</div>
                <div class="text-center">{{ month.calls }}</div>
                <div class="text-center">{{ month.minutes }}</div>
                <div class="text-right font-semibold text-glow">${{ parseFloat(month.spent || 0).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Call History (Full Width) -->
      <div class="mt-8 opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s]">
        <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10">
          <h2 class="text-2xl font-[--font-display] font-bold mb-6 flex items-center gap-3">
            <span class="w-2 h-2 bg-glow rounded-full"></span>
            Call History
          </h2>

          <div v-if="callsStore.calls.length === 0" class="text-center py-12 text-cream/50">
            No calls yet
          </div>

          <div v-else class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div class="grid grid-cols-5 gap-4 p-4 bg-white/5 font-bold text-sm uppercase tracking-wider">
              <div>Persona</div>
              <div>Date</div>
              <div class="text-center">Duration</div>
              <div class="text-center">Cost</div>
              <div class="text-center">Status</div>
            </div>
            <div
              v-for="call in callsStore.calls"
              :key="call.id"
              class="grid grid-cols-5 gap-4 p-4 border-t border-white/5 hover:bg-white/[0.02] transition-colors items-center"
            >
              <div class="font-semibold">{{ call.persona_name }}</div>
              <div class="text-sm">{{ formatDateTime(call.start_time) }}</div>
              <div class="text-center">{{ formatDuration(call.duration) }}</div>
              <div class="text-center font-semibold text-glow">${{ parseFloat(call.cost || 0).toFixed(2) }}</div>
              <div class="text-center">
                <span
                  class="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase"
                  :class="{
                    'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400': call.status === 'completed',
                    'bg-red-500/20 border border-red-500/30 text-red-400': call.status === 'failed',
                    'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400': call.status === 'in-progress'
                  }"
                >
                  {{ call.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Payment Modal -->
    <div v-if="showAddPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center px-6 bg-midnight/80 backdrop-blur-md" @click="closePaymentModal">
      <div class="relative bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-2xl border-2 border-white/20 rounded-[32px] p-10 max-w-lg w-full shadow-[0_32px_100px_rgba(0,0,0,0.5)]" @click.stop>
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-3xl font-[--font-display] font-bold">Add Payment Method</h2>
          <button @click="closePaymentModal" class="text-cream/60 hover:text-cream transition-colors">
            <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-sm">
          <p class="mb-2"><strong>Demo Mode:</strong> This is a demo interface. In production, this would integrate with Stripe Elements for secure card processing.</p>
          <p>Enter any card details below for testing.</p>
        </div>

        <form @submit.prevent="handleAddPayment" class="space-y-4">
          <div class="space-y-2">
            <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Card Number</label>
            <input
              v-model="paymentForm.cardNumber"
              type="text"
              class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Expiry</label>
              <input
                v-model="paymentForm.expiry"
                type="text"
                class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                placeholder="MM/YY"
                required
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">CVC</label>
              <input
                v-model="paymentForm.cvc"
                type="text"
                class="w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                placeholder="123"
                required
              />
            </div>
          </div>

          <label class="flex items-center gap-3 cursor-pointer">
            <input v-model="paymentForm.setAsDefault" type="checkbox" class="w-5 h-5 rounded" />
            <span class="text-sm font-semibold">Set as default payment method</span>
          </label>

          <div v-if="paymentError" class="bg-solar/10 border border-solar/30 rounded-xl p-4">
            <p class="text-sm text-cream">{{ paymentError }}</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closePaymentModal"
              class="flex-1 px-6 py-4 bg-white/5 border-2 border-white/20 rounded-xl font-bold hover:bg-white/10 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-6 py-4 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50"
              :disabled="paymentLoading"
            >
              {{ paymentLoading ? 'Adding...' : 'Add Card' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Phone Verification Modal -->
    <div v-if="showPhoneVerificationModal" class="fixed inset-0 z-50 flex items-center justify-center px-6 bg-midnight/80 backdrop-blur-md" @click="closePhoneVerificationModal">
      <div class="relative bg-gradient-to-br from-white/[0.12] to-white/[0.04] backdrop-blur-2xl border-2 border-white/20 rounded-[32px] p-10 max-w-md w-full shadow-[0_32px_100px_rgba(0,0,0,0.5)]" @click.stop>

        <!-- Step 1: Enter Phone Number -->
        <div v-if="phoneVerificationStep === 1">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-[--font-display] font-bold">Verify Phone Number</h2>
            <button @click="closePhoneVerificationModal" class="text-cream/60 hover:text-cream transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Phone Icon Animation -->
          <div class="flex justify-center mb-6">
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-glow/30 to-ember/30 border-2 border-glow/50 flex items-center justify-center shadow-[0_0_40px_rgba(255,170,51,0.3)]">
                <svg class="w-10 h-10 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <div class="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-glow to-ember rounded-full flex items-center justify-center animate-pulse">
                <svg class="w-3.5 h-3.5 text-deep" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
          </div>

          <p class="text-center text-cream/70 mb-6">
            Enter your phone number to receive a verification code via SMS.
          </p>

          <form @submit.prevent="sendVerificationCode" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Phone Number</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-cream/50 font-semibold">+1</span>
                <input
                  ref="phoneInput"
                  v-model="phoneVerificationForm.phoneNumber"
                  type="tel"
                  class="w-full pl-12 pr-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300 text-lg tracking-wider"
                  placeholder="(555) 123-4567"
                  @input="formatPhoneNumber"
                  required
                />
              </div>
              <p class="text-xs text-cream/50 pl-1">US numbers only. Standard SMS rates may apply.</p>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">Nickname <span class="text-cream/40 font-normal normal-case">(optional)</span></label>
              <input
                v-model="phoneVerificationForm.nickname"
                type="text"
                maxlength="30"
                class="w-full px-4 py-3 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-glow/50 focus:bg-white/10 transition-all duration-300"
                placeholder="e.g., Work Phone, Home, Personal"
              />
              <p class="text-xs text-cream/50 pl-1">Give this number a name for easy identification.</p>
            </div>

            <div v-if="phoneVerificationError" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p class="text-sm text-red-300">{{ phoneVerificationError }}</p>
            </div>

            <button
              type="submit"
              class="w-full px-6 py-4 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              :disabled="phoneVerificationLoading || !isValidPhoneNumber"
            >
              <svg v-if="phoneVerificationLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ phoneVerificationLoading ? 'Sending...' : 'Send Verification Code' }}
            </button>
          </form>
        </div>

        <!-- Step 2: Enter Verification Code -->
        <div v-else-if="phoneVerificationStep === 2">
          <div class="flex items-center justify-between mb-6">
            <button @click="phoneVerificationStep = 1" class="text-cream/60 hover:text-cream transition-colors flex items-center gap-1">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <button @click="closePhoneVerificationModal" class="text-cream/60 hover:text-cream transition-colors">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- SMS Icon Animation -->
          <div class="flex justify-center mb-6">
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <svg class="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div class="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-deep" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <h2 class="text-2xl font-[--font-display] font-bold text-center mb-2">Enter Code</h2>
          <p class="text-center text-cream/70 mb-6">
            We sent a 6-digit code to<br>
            <span class="font-semibold text-glow">+1 {{ phoneVerificationForm.phoneNumber }}</span>
          </p>

          <form @submit.prevent="verifyCode" class="space-y-4">
            <!-- 6-Digit Code Input -->
            <div class="flex justify-center gap-2">
              <input
                v-for="(digit, index) in 6"
                :key="index"
                :ref="el => codeInputs[index] = el"
                v-model="verificationCodeDigits[index]"
                type="text"
                maxlength="1"
                class="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-white/20 rounded-xl text-cream focus:outline-none focus:border-glow/70 focus:bg-white/10 transition-all duration-300"
                @input="handleCodeInput(index, $event)"
                @keydown="handleCodeKeydown(index, $event)"
                @paste="handleCodePaste"
                inputmode="numeric"
                pattern="[0-9]*"
              />
            </div>

            <div v-if="phoneVerificationError" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p class="text-sm text-red-300">{{ phoneVerificationError }}</p>
            </div>

            <button
              type="submit"
              class="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              :disabled="phoneVerificationLoading || verificationCode.length !== 6"
            >
              <svg v-if="phoneVerificationLoading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ phoneVerificationLoading ? 'Verifying...' : 'Verify Phone' }}
            </button>

            <div class="text-center">
              <button
                type="button"
                @click="resendCode"
                :disabled="resendCooldown > 0"
                class="text-sm text-cream/60 hover:text-glow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't receive the code? Resend" }}
              </button>
            </div>
          </form>
        </div>

        <!-- Step 3: Success -->
        <div v-else-if="phoneVerificationStep === 3" class="text-center py-4">
          <div class="flex justify-center mb-6">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border-2 border-emerald-500/50 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-[pulse_2s_ease-in-out_infinite]">
              <svg class="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <h2 class="text-2xl font-[--font-display] font-bold mb-2 text-emerald-400">Phone Verified!</h2>
          <p class="text-cream/70 mb-6">
            Your phone number has been successfully verified.<br>
            You can now receive calls from our AI personas.
          </p>

          <button
            @click="closePhoneVerificationModal"
            class="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { useCallsStore } from '../stores/calls'
import { usePhonesStore } from '../stores/phones'

const authStore = useAuthStore()
const userStore = useUserStore()
const callsStore = useCallsStore()
const phonesStore = usePhonesStore()

// Sync phones store with user data when user changes
watch(() => authStore.user, (user) => {
  if (user) {
    phonesStore.syncWithUser(user)
  }
}, { immediate: true })

// Phone verification modal
const showPhoneVerificationModal = ref(false)
const phoneVerificationStep = ref(1) // 1: enter phone, 2: enter code, 3: success
const phoneVerificationForm = ref({
  phoneNumber: '',
  nickname: ''
})
const phoneVerificationLoading = ref(false)
const phoneVerificationError = ref('')
const verificationCodeDigits = ref(['', '', '', '', '', ''])
const codeInputs = ref([])
const resendCooldown = ref(0)
let resendTimer = null

// Nickname editing
const editingNicknamePhone = ref(null)
const editingNicknameValue = ref('')

const startNicknameEdit = (phoneEntry) => {
  editingNicknamePhone.value = phoneEntry.phone
  editingNicknameValue.value = phoneEntry.nickname || ''
}

const saveNickname = (phone) => {
  phonesStore.updateNickname(phone, editingNicknameValue.value.trim())
  editingNicknamePhone.value = null
  editingNicknameValue.value = ''
}

const cancelNicknameEdit = () => {
  editingNicknamePhone.value = null
  editingNicknameValue.value = ''
}

// Phone deletion
const confirmDeletePhone = (phone) => {
  if (confirm(`Remove this phone number? You'll need to verify it again to use it.`)) {
    phonesStore.removePhone(phone)
  }
}

const verificationCode = computed(() => verificationCodeDigits.value.join(''))

const isValidPhoneNumber = computed(() => {
  // Remove all non-digits
  const digits = phoneVerificationForm.value.phoneNumber.replace(/\D/g, '')
  return digits.length === 10
})

const formatPhoneNumber = (event) => {
  // Get only digits
  let digits = event.target.value.replace(/\D/g, '')

  // Limit to 10 digits
  if (digits.length > 10) {
    digits = digits.slice(0, 10)
  }

  // Format as (XXX) XXX-XXXX
  let formatted = ''
  if (digits.length > 0) {
    formatted = '(' + digits.slice(0, 3)
  }
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6)
  }
  if (digits.length >= 6) {
    formatted += '-' + digits.slice(6, 10)
  }

  phoneVerificationForm.value.phoneNumber = formatted
}

const openPhoneVerificationModal = () => {
  showPhoneVerificationModal.value = true
  phoneVerificationStep.value = 1
  phoneVerificationError.value = ''
  phoneVerificationForm.value.phoneNumber = ''
  phoneVerificationForm.value.nickname = ''
  verificationCodeDigits.value = ['', '', '', '', '', '']
  // Don't pre-fill - user is adding a NEW number
}

const closePhoneVerificationModal = () => {
  showPhoneVerificationModal.value = false
  phoneVerificationStep.value = 1
  phoneVerificationError.value = ''
  if (resendTimer) {
    clearInterval(resendTimer)
    resendTimer = null
  }
  resendCooldown.value = 0
}

const sendVerificationCode = async () => {
  phoneVerificationLoading.value = true
  phoneVerificationError.value = ''

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Not authenticated')

    // Format phone to E.164 (+1XXXXXXXXXX)
    const digits = phoneVerificationForm.value.phoneNumber.replace(/\D/g, '')
    const e164Phone = '+1' + digits

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/phone/send-verification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: e164Phone })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send verification code')
    }

    // Move to step 2
    phoneVerificationStep.value = 2
    startResendCooldown()

    // Focus first code input
    await nextTick()
    if (codeInputs.value[0]) {
      codeInputs.value[0].focus()
    }
  } catch (err) {
    phoneVerificationError.value = err.message || 'Failed to send verification code'
  } finally {
    phoneVerificationLoading.value = false
  }
}

const verifyCode = async () => {
  phoneVerificationLoading.value = true
  phoneVerificationError.value = ''

  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('Not authenticated')

    // Format phone to E.164 (+1XXXXXXXXXX)
    const digits = phoneVerificationForm.value.phoneNumber.replace(/\D/g, '')
    const e164Phone = '+1' + digits

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/phone/verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: e164Phone,
        code: verificationCode.value
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Invalid verification code')
    }

    // Update local user state
    authStore.user = {
      ...authStore.user,
      phone: e164Phone,
      phone_verified: true
    }

    // Add to phones store with nickname (make primary if first number)
    const isFirstNumber = phonesStore.verifiedPhones.length === 0
    phonesStore.addVerifiedPhone(e164Phone, phoneVerificationForm.value.nickname || '', isFirstNumber)

    // Move to success step
    phoneVerificationStep.value = 3
  } catch (err) {
    phoneVerificationError.value = err.message || 'Failed to verify code'
    // Clear the code inputs on error
    verificationCodeDigits.value = ['', '', '', '', '', '']
    if (codeInputs.value[0]) {
      codeInputs.value[0].focus()
    }
  } finally {
    phoneVerificationLoading.value = false
  }
}

const resendCode = async () => {
  if (resendCooldown.value > 0) return
  await sendVerificationCode()
}

const startResendCooldown = () => {
  resendCooldown.value = 60
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

const handleCodeInput = (index, event) => {
  const value = event.target.value

  // Only allow digits
  if (!/^\d*$/.test(value)) {
    verificationCodeDigits.value[index] = ''
    return
  }

  // Move to next input if digit entered
  if (value && index < 5) {
    nextTick(() => {
      if (codeInputs.value[index + 1]) {
        codeInputs.value[index + 1].focus()
      }
    })
  }
}

const handleCodeKeydown = (index, event) => {
  // Handle backspace - move to previous input
  if (event.key === 'Backspace' && !verificationCodeDigits.value[index] && index > 0) {
    nextTick(() => {
      if (codeInputs.value[index - 1]) {
        codeInputs.value[index - 1].focus()
      }
    })
  }
}

const handleCodePaste = (event) => {
  event.preventDefault()
  const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)

  for (let i = 0; i < 6; i++) {
    verificationCodeDigits.value[i] = pastedData[i] || ''
  }

  // Focus the last filled input or the next empty one
  const lastFilledIndex = Math.min(pastedData.length, 5)
  nextTick(() => {
    if (codeInputs.value[lastFilledIndex]) {
      codeInputs.value[lastFilledIndex].focus()
    }
  })
}

// Minutes balance
const minutesBalance = ref(null)
const balanceLastUpdated = ref(null)
const balanceLoading = ref(false)

const fetchBalance = async () => {
  balanceLoading.value = true
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/balance`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Balance response:', data) // Debug log
      minutesBalance.value = data.minutes ?? 0
      balanceLastUpdated.value = data.lastUpdated ? new Date(data.lastUpdated) : new Date()
    } else {
      console.error('Failed to fetch balance:', response.status, await response.text())
      minutesBalance.value = 0
    }
  } catch (err) {
    console.error('Error fetching balance:', err)
    minutesBalance.value = 0
  } finally {
    balanceLoading.value = false
  }
}

const refreshBalance = () => {
  fetchBalance()
}

const formatRelativeTime = (date) => {
  if (!date) return ''
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

// Profile editing
const editingProfile = ref(false)
const profileForm = ref({
  name: '',
  email: ''
})
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)

// Payment modal
const showAddPaymentModal = ref(false)
const paymentForm = ref({
  cardNumber: '',
  expiry: '',
  cvc: '',
  setAsDefault: false
})
const paymentLoading = ref(false)
const paymentError = ref('')

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

const cancelEdit = () => {
  editingProfile.value = false
  profileError.value = ''
  profileSuccess.value = false
}

const handleUpdateProfile = async () => {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = false

  try {
    await userStore.updateProfile(profileForm.value)

    authStore.user = {
      ...authStore.user,
      ...profileForm.value
    }

    profileSuccess.value = true
    setTimeout(() => {
      editingProfile.value = false
      profileSuccess.value = false
    }, 2000)
  } catch (err) {
    profileError.value = err.message || 'Failed to update profile'
  } finally {
    profileLoading.value = false
  }
}

const handleAddPayment = async () => {
  paymentLoading.value = true
  paymentError.value = ''

  try {
    const mockPaymentMethodId = 'pm_' + Math.random().toString(36).substr(2, 9)
    await userStore.addPaymentMethod(mockPaymentMethodId, paymentForm.value.setAsDefault)
    closePaymentModal()
  } catch (err) {
    paymentError.value = err.message || 'Failed to add payment method'
  } finally {
    paymentLoading.value = false
  }
}

const setDefaultPayment = async (paymentMethodId) => {
  try {
    await userStore.setDefaultPaymentMethod(paymentMethodId)
  } catch (err) {
    alert('Failed to set default payment method: ' + err.message)
  }
}

const removePayment = async (paymentMethodId) => {
  if (!confirm('Remove this payment method?')) return

  try {
    await userStore.removePaymentMethod(paymentMethodId)
  } catch (err) {
    alert('Failed to remove payment method: ' + err.message)
  }
}

const closePaymentModal = () => {
  showAddPaymentModal.value = false
  paymentForm.value = {
    cardNumber: '',
    expiry: '',
    cvc: '',
    setAsDefault: false
  }
  paymentError.value = ''
}

onMounted(async () => {
  if (authStore.user) {
    profileForm.value = {
      name: authStore.user.name,
      email: authStore.user.email
    }
  }

  // Fetch balance first (most important for debugging)
  await fetchBalance()

  await userStore.fetchBillingInfo()
  await userStore.fetchUsageStats()
  await callsStore.fetchCalls()
})
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}
</style>
