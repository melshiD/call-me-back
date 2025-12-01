<template>
  <div class="min-h-screen bg-[#0d0d0f] text-[#e8e6e3] font-[--font-body] overflow-hidden">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#131318] to-[#0d0d0f]"></div>
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <!-- Subtle amber glow top right -->
      <div class="absolute w-[800px] h-[600px] -top-[300px] -right-[200px] opacity-[0.04] pointer-events-none blur-[150px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <!-- Subtle blue glow bottom left -->
      <div class="absolute w-[600px] h-[500px] bottom-[-200px] -left-[200px] opacity-[0.03] pointer-events-none blur-[150px] bg-gradient-radial from-cyan-500 to-transparent"></div>
    </div>

    <!-- TACTICAL COMMAND NAV - Sticky Admin Navigation -->
    <nav class="sticky top-0 z-50 border-b border-[#2a2a2e] backdrop-blur-xl bg-[#0d0d0f]/90">
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Left: Branding & Navigation -->
          <div class="flex items-center gap-6">
            <router-link to="/admin/dashboard" class="group flex items-center gap-3 hover:opacity-100 transition-all duration-300">
              <div class="relative">
                <div class="absolute inset-0 bg-amber-500/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg class="w-5 h-5 text-[#666] group-hover:text-amber-500 transition-colors relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              <span class="font-mono text-xs uppercase tracking-[0.25em] text-[#666] group-hover:text-amber-400 transition-colors">Dashboard</span>
            </router-link>

            <div class="h-6 w-[1px] bg-[#2a2a2e]"></div>

            <div class="flex items-center gap-3">
              <div class="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
              <h1 class="font-['JetBrains_Mono',monospace] text-sm tracking-[0.3em] uppercase text-[#999]">
                Persona Designer
              </h1>
            </div>
          </div>

          <!-- Right: Controls & Status -->
          <div class="flex items-center gap-3">
            <!-- User Impersonation Dropdown -->
            <div class="relative">
              <button
                @click="showUserDropdown = !showUserDropdown"
                class="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300"
                :class="impersonatedUser
                  ? 'bg-cyan-500/10 border-cyan-500/40 hover:border-cyan-500/60'
                  : 'bg-[#1a1a1e] border-[#2a2a2e] hover:border-amber-500/50'"
              >
                <svg class="w-4 h-4" :class="impersonatedUser ? 'text-cyan-400' : 'text-[#666]'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="font-mono text-[10px] uppercase tracking-wider" :class="impersonatedUser ? 'text-cyan-400' : 'text-[#888]'">
                  {{ impersonatedUser ? impersonatedUser.email.split('@')[0] : 'Admin' }}
                </span>
                <svg class="w-3 h-3 text-[#555] transition-transform" :class="{ 'rotate-180': showUserDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Dropdown Menu -->
              <div
                v-if="showUserDropdown"
                class="absolute right-0 mt-2 w-72 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg shadow-2xl overflow-hidden z-50"
              >
                <div class="p-2 border-b border-[#2a2a2e]">
                  <span class="font-mono text-[9px] uppercase tracking-widest text-[#555]">Operating As</span>
                </div>

                <div class="max-h-64 overflow-y-auto">
                  <!-- Admin Option -->
                  <button
                    @click="setImpersonatedUser(null)"
                    class="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-amber-500/10 transition-colors text-left"
                    :class="{ 'bg-amber-500/5 border-l-2 border-amber-500': !impersonatedUser }"
                  >
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-500/30">
                      <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-mono text-xs text-amber-400">Admin Mode</div>
                      <div class="font-mono text-[10px] text-[#555] truncate">Your own persona relationships</div>
                    </div>
                    <div v-if="!impersonatedUser" class="w-2 h-2 rounded-full bg-amber-500"></div>
                  </button>

                  <!-- Divider -->
                  <div class="h-px bg-[#2a2a2e] my-1"></div>

                  <!-- Loading State -->
                  <div v-if="loadingUsers" class="px-3 py-4 text-center">
                    <div class="inline-block w-4 h-4 border-2 border-[#444] border-t-amber-500 rounded-full animate-spin"></div>
                    <span class="ml-2 font-mono text-[10px] text-[#555]">Loading users...</span>
                  </div>

                  <!-- User List -->
                  <button
                    v-for="user in allUsers"
                    :key="user.id"
                    @click="setImpersonatedUser(user)"
                    class="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-cyan-500/10 transition-colors text-left"
                    :class="{ 'bg-cyan-500/5 border-l-2 border-cyan-500': impersonatedUser?.id === user.id }"
                  >
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#2a2a2e] to-[#1e1e22] flex items-center justify-center border border-[#3a3a3e]">
                      <span class="font-mono text-[10px] text-[#888] uppercase">{{ user.email?.charAt(0) || '?' }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="font-mono text-xs text-[#ccc] truncate">{{ user.email }}</div>
                      <div class="font-mono text-[10px] text-[#555] truncate flex items-center gap-1">
                        <span v-if="user.phone_verified" class="text-emerald-500">●</span>
                        <span v-else class="text-[#444]">○</span>
                        {{ user.phone || 'No phone' }}
                      </div>
                    </div>
                    <div v-if="impersonatedUser?.id === user.id" class="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </button>
                </div>
              </div>

              <!-- Click-outside overlay -->
              <div
                v-if="showUserDropdown"
                class="fixed inset-0 z-40"
                @click="showUserDropdown = false"
              ></div>
            </div>

            <!-- Connection Status -->
            <div class="flex items-center gap-2 bg-[#1a1a1e] px-3 py-2 rounded-lg border border-[#2a2a2e]">
              <div class="w-2 h-2 rounded-full" :class="connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-[#444]'"></div>
              <span class="font-mono text-[10px] uppercase tracking-wider" :class="connectionStatus === 'connected' ? 'text-emerald-400' : 'text-[#666]'">
                {{ connectionStatus }}
              </span>
            </div>

            <!-- Hang Up Button (visible when call active) -->
            <button
              v-if="isBrowserVoiceActive || isTwilioCallActive"
              @click="hangUpActiveCall"
              class="flex items-center gap-2 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 px-4 py-2 rounded-lg transition-all duration-300 group"
              title="Hang Up Call"
            >
              <svg class="w-4 h-4 text-red-400 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.72 11.06l1.38 1.38a1 1 0 010 1.41l-3.4 3.4a1 1 0 01-1.41 0l-1.38-1.38m-5.64-5.64l-1.38-1.38a1 1 0 010-1.41l3.4-3.4a1 1 0 011.41 0l1.38 1.38m0 0l5.64 5.64" />
              </svg>
              <span class="font-mono text-xs uppercase tracking-wider text-red-400 group-hover:text-red-300">Hang Up</span>
            </button>

            <!-- Audio Settings -->
            <button
              @click="showSettingsModal = true"
              class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e] hover:border-amber-500/50 hover:bg-[#1e1e22] transition-all duration-300 group"
              title="Audio Settings"
            >
              <svg class="w-4 h-4 text-[#666] group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="hidden sm:inline font-mono text-xs uppercase tracking-wider text-[#666] group-hover:text-amber-500">Settings</span>
            </button>

            <!-- Logout -->
            <button
              @click="handleLogout"
              class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e] hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-300 group"
              title="Logout"
            >
              <svg class="w-4 h-4 text-[#666] group-hover:text-red-400 transition-colors group-hover:rotate-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="hidden sm:inline font-mono text-xs uppercase tracking-wider text-[#666] group-hover:text-red-400">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- COMMAND HUD - Call Control Panel -->
    <header class="relative z-40 pt-6 pb-4">
      <div class="max-w-7xl mx-auto px-6">

        <!-- CONTROL HUD - The Big Buttons -->
        <div class="flex items-center justify-center gap-8 mb-8">
          <!-- Browser Voice Button Group -->
          <div class="relative flex items-center gap-3">
            <!-- Browser Voice Button - Large Realistic 3D Button -->
            <button
              @click="toggleBrowserVoice"
              :disabled="!selectedPersona"
              class="call-button-hud group relative"
              :class="{ 'active': isBrowserVoiceActive, 'disabled': !selectedPersona }"
            >
            <!-- Outer Ring / Bezel -->
            <div class="absolute inset-0 rounded-full bg-gradient-to-b from-[#3a3a3e] to-[#1a1a1e] p-[3px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div class="w-full h-full rounded-full bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e]"></div>
            </div>
            <!-- Inner Button Surface -->
            <div
              class="relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200"
              :class="isBrowserVoiceActive
                ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-[0_0_30px_rgba(16,185,129,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.3)]'
                : 'bg-gradient-to-b from-[#2a2a2e] to-[#1e1e22] group-hover:from-[#333] group-hover:to-[#252528] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-2px_4px_rgba(0,0,0,0.2)]'"
            >
              <!-- Microphone Icon -->
              <svg class="w-8 h-8 transition-colors" :class="isBrowserVoiceActive ? 'text-white' : 'text-[#888] group-hover:text-amber-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              <span class="font-mono text-[9px] uppercase tracking-wider" :class="isBrowserVoiceActive ? 'text-white/90' : 'text-[#666]'">
                {{ isBrowserVoiceActive ? 'LIVE' : 'BROWSER' }}
              </span>
            </div>
            <!-- LED Indicator Ring -->
            <div v-if="isBrowserVoiceActive" class="absolute inset-[-4px] rounded-full border-2 border-emerald-500/50 animate-ping"></div>
          </button>

            <!-- Small Hang Up Button (Browser) -->
            <button
              v-if="isBrowserVoiceActive"
              @click="stopBrowserVoice"
              class="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group shadow-[0_2px_12px_rgba(239,68,68,0.2)]"
              title="Hang Up Browser Call"
            >
              <svg class="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Twilio Call Button Group -->
          <div class="relative flex items-center gap-3">
          <!-- Twilio Call Button -->
          <button
            @click="triggerTwilioCall"
            :disabled="!selectedPersona || !adminPhone || isTwilioCallActive"
            class="call-button-hud group relative"
            :class="{ 'active': isTwilioCallActive, 'disabled': !selectedPersona || !adminPhone }"
          >
            <!-- Outer Ring / Bezel -->
            <div class="absolute inset-0 rounded-full bg-gradient-to-b from-[#3a3a3e] to-[#1a1a1e] p-[3px] shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div class="w-full h-full rounded-full bg-gradient-to-b from-[#2a2a2e] to-[#1a1a1e]"></div>
            </div>
            <!-- Inner Button Surface -->
            <div
              class="relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-200"
              :class="isTwilioCallActive
                ? 'bg-gradient-to-b from-amber-500 to-amber-700 shadow-[0_0_30px_rgba(245,158,11,0.5),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-2px_4px_rgba(0,0,0,0.3)]'
                : 'bg-gradient-to-b from-[#2a2a2e] to-[#1e1e22] group-hover:from-[#333] group-hover:to-[#252528] shadow-[inset_0_2px_4px_rgba(255,255,255,0.05),inset_0_-2px_4px_rgba(0,0,0,0.2)]'"
            >
              <!-- Phone Icon -->
              <svg class="w-8 h-8 transition-colors" :class="isTwilioCallActive ? 'text-white' : 'text-[#888] group-hover:text-amber-500'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span class="font-mono text-[9px] uppercase tracking-wider" :class="isTwilioCallActive ? 'text-white/90' : 'text-[#666]'">
                {{ isTwilioCallActive ? 'ACTIVE' : 'TWILIO' }}
              </span>
            </div>
            <!-- LED Indicator Ring -->
            <div v-if="isTwilioCallActive" class="absolute inset-[-4px] rounded-full border-2 border-amber-500/50 animate-ping"></div>
          </button>

            <!-- Small Hang Up Button (Twilio) -->
            <button
              v-if="isTwilioCallActive"
              @click="hangUpActiveCall"
              class="w-10 h-10 rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 hover:scale-110 transition-all duration-300 flex items-center justify-center group shadow-[0_2px_12px_rgba(239,68,68,0.2)]"
              title="Hang Up Twilio Call"
            >
              <svg class="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Phone Number Input (compact, below buttons) -->
        <div class="flex items-center justify-center gap-4">
          <!-- Dropdown if saved numbers exist -->
          <div v-if="savedPhoneNumbers.length > 0" class="flex items-center gap-2">
            <div class="flex items-center gap-2 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2">
              <svg class="w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <select
                v-model="adminPhone"
                class="bg-transparent border-none outline-none font-mono text-sm text-[#aaa] cursor-pointer appearance-none pr-6"
                @change="saveAdminPhone"
                style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 24 24%22 stroke=%22%23666%22%3E%3Cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 9l-7 7-7-7%22%3E%3C/path%3E%3C/svg%3E'); background-repeat: no-repeat; background-position: right 0px center; background-size: 16px;"
              >
                <option value="">Select phone...</option>
                <option v-for="num in savedPhoneNumbers" :key="num" :value="num">{{ num }}</option>
              </select>
            </div>
            <button
              @click="savedPhoneNumbers = []; localStorage.removeItem('savedPhoneNumbers'); adminPhone = ''"
              class="text-[#555] hover:text-red-400 transition-colors text-xs"
              title="Clear saved numbers"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Text input if no saved numbers -->
          <div v-else class="flex items-center gap-2 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2">
            <svg class="w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <input
              v-model="adminPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              class="bg-transparent border-none outline-none font-mono text-sm text-[#aaa] placeholder:text-[#444] w-40"
              @blur="saveAdminPhone"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-7xl mx-auto px-6 pb-12">
      <!-- Persona Selector Tabs -->
      <div class="flex items-center gap-2 mb-8 border-b border-[#2a2a2e] pb-4">
        <span class="font-mono text-xs uppercase tracking-wider text-[#555] mr-4">SELECT PERSONA</span>
        <button
          v-for="persona in personas"
          :key="persona.id"
          @click="selectPersona(persona)"
          class="px-5 py-2.5 rounded-lg font-mono text-sm uppercase tracking-wider transition-all duration-300 border"
          :class="selectedPersona?.id === persona.id
            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
            : 'bg-[#1a1a1e] border-[#2a2a2e] text-[#888] hover:border-[#444] hover:text-[#ccc]'"
        >
          {{ persona.name }}
        </button>
        <!-- Loading indicator -->
        <div v-if="loadingPersonas" class="ml-4 flex items-center gap-2">
          <div class="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
          <span class="text-xs text-[#555]">Loading...</span>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- LEFT: Editor Panel -->
        <div class="space-y-6">
          <!-- Core System Prompt Editor -->
          <div class="console-panel">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-amber-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Core System Prompt</span>
                <span class="text-[10px] text-[#555] font-mono">LAYER 1</span>
              </div>
              <button
                @click="expandPromptEditor = !expandPromptEditor"
                class="text-[#555] hover:text-amber-500 transition-colors"
              >
                <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': expandPromptEditor }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div class="console-body">
              <textarea
                v-model="editedPrompt"
                :rows="expandPromptEditor ? 20 : 8"
                class="prompt-textarea"
                placeholder="Select a persona to edit..."
                :disabled="!selectedPersona"
              ></textarea>
            </div>
          </div>

          <!-- CALL CONTEXT SECTION - Layer 2 -->
          <div class="console-panel">
            <div class="console-header cursor-pointer" @click="expandCallContext = !expandCallContext">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-rose-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Call Context</span>
                <span class="text-[10px] text-[#555] font-mono">LAYER 2</span>
                <span v-if="callPretext || selectedScenario" class="text-[10px] text-rose-400 font-mono ml-2">● ACTIVE</span>
              </div>
              <svg class="w-4 h-4 transition-transform text-[#555]" :class="{ 'rotate-180': expandCallContext }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div v-show="expandCallContext" class="console-body space-y-5">
              <!-- Scenario Presets -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Scenario Preset</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="scenario in scenarioPresets"
                    :key="scenario.id"
                    @click="selectScenario(scenario)"
                    class="scenario-chip"
                    :class="{ 'active': selectedScenario?.id === scenario.id }"
                  >
                    <span class="scenario-icon">{{ scenario.icon }}</span>
                    <span class="scenario-label">{{ scenario.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Call Pretext -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Call Pretext</label>
                <textarea
                  v-model="callPretext"
                  rows="3"
                  class="prompt-textarea text-sm"
                  placeholder="Why is the user calling? e.g., 'Save me from a boring meeting' or 'I need help processing a tough day'"
                  :disabled="!selectedPersona"
                ></textarea>
                <div class="mt-2 text-[10px] text-[#555] font-mono">
                  This context is provided to the AI at call start
                </div>
              </div>

              <!-- Custom Instructions -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Custom Instructions</label>
                <textarea
                  v-model="customInstructions"
                  rows="2"
                  class="prompt-textarea text-sm"
                  placeholder="Additional behavior instructions for this call..."
                  :disabled="!selectedPersona"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- RELATIONSHIP CONTEXT SECTION - Layer 3 -->
          <div class="console-panel">
            <div class="console-header cursor-pointer" @click="expandRelationship = !expandRelationship">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-violet-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Relationship Context</span>
                <span class="text-[10px] text-[#555] font-mono">LAYER 3</span>
                <span v-if="relationshipType || relationshipPrompt" class="text-[10px] text-violet-400 font-mono ml-2">● ACTIVE</span>
              </div>
              <svg class="w-4 h-4 transition-transform text-[#555]" :class="{ 'rotate-180': expandRelationship }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div v-show="expandRelationship" class="console-body space-y-5">
              <!-- Relationship Type -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Relationship Type</label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="rel in relationshipTypes"
                    :key="rel.id"
                    @click="selectRelationshipType(rel)"
                    class="relationship-chip"
                    :class="{ 'active': relationshipType?.id === rel.id }"
                  >
                    <span class="text-base">{{ rel.icon }}</span>
                    <span class="text-[10px] uppercase tracking-wider">{{ rel.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Relationship Duration -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Known Duration</label>
                  <span class="font-mono text-sm text-violet-400">{{ relationshipDuration }} {{ relationshipDuration === 1 ? 'month' : 'months' }}</span>
                </div>
                <input
                  type="range"
                  v-model.number="relationshipDuration"
                  min="1"
                  max="60"
                  step="1"
                  class="slider-track-violet w-full"
                />
                <div class="flex justify-between mt-1 text-[10px] text-[#555] font-mono">
                  <span>NEW</span>
                  <span>5 YEARS</span>
                </div>
              </div>

              <!-- Custom Relationship Prompt -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Relationship Details</label>
                <textarea
                  v-model="relationshipPrompt"
                  rows="3"
                  class="prompt-textarea text-sm"
                  placeholder="e.g., 'You've helped them through a career change. They tend to be self-critical and respond well to direct feedback.'"
                  :disabled="!selectedPersona"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- USER KNOWLEDGE SECTION - Layer 4 -->
          <div class="console-panel">
            <div class="console-header cursor-pointer" @click="expandUserKnowledge = !expandUserKnowledge">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-cyan-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">User Knowledge</span>
                <span class="text-[10px] text-[#555] font-mono">LAYER 4</span>
                <span v-if="loadingUserFacts" class="text-[10px] text-amber-400 font-mono ml-2">LOADING...</span>
                <span v-else-if="userFacts.length > 0" class="text-[10px] text-cyan-400 font-mono ml-2">{{ userFacts.length }} FACTS</span>
              </div>
              <svg class="w-4 h-4 transition-transform text-[#555]" :class="{ 'rotate-180': expandUserKnowledge }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div v-show="expandUserKnowledge" class="console-body space-y-4">
              <div class="text-[11px] text-[#666] font-mono mb-2">
                Facts about this user. Auto-extracted from calls or manually added.
              </div>

              <!-- Existing Facts -->
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div v-if="loadingUserFacts" class="text-center py-4">
                  <span class="text-[#666] font-mono text-sm">Loading facts...</span>
                </div>
                <div v-else-if="userFacts.length === 0" class="text-center py-4">
                  <span class="text-[#555] font-mono text-sm">No facts yet. Add some or have a conversation!</span>
                </div>
                <div
                  v-for="(fact, idx) in userFacts"
                  :key="idx"
                  class="fact-card group"
                >
                  <div class="flex items-start gap-3">
                    <span class="fact-category" :class="getCategoryColor(fact.category)">{{ fact.category }}</span>
                    <span class="flex-1 text-sm text-[#bbb]">{{ fact.content }}</span>
                    <button @click="removeFact(idx)" class="text-[#444] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Add New Fact -->
              <div class="border-t border-[#2a2a2e] pt-4">
                <div class="flex gap-2 mb-2">
                  <select v-model="newFactCategory" class="bg-[#1a1a1e] border border-[#2a2a2e] rounded px-3 py-1.5 font-mono text-xs text-[#888] focus:border-cyan-500/50 focus:outline-none">
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="interests">Interests</option>
                    <option value="goals">Goals</option>
                    <option value="health">Health</option>
                    <option value="relationships">Relationships</option>
                  </select>
                  <input
                    v-model="newFactContent"
                    type="text"
                    placeholder="Add a fact about the user..."
                    class="flex-1 bg-[#1a1a1e] border border-[#2a2a2e] rounded px-3 py-1.5 font-mono text-sm text-[#ccc] placeholder:text-[#444] focus:border-cyan-500/50 focus:outline-none"
                    @keyup.enter="addFact"
                  />
                  <button @click="addFact" class="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400 font-mono text-xs uppercase hover:bg-cyan-500/20 transition-colors">
                    Add
                  </button>
                </div>
                <!-- Quick Add Presets -->
                <div class="flex flex-wrap gap-1">
                  <button
                    v-for="preset in factPresets"
                    :key="preset"
                    @click="addPresetFact(preset)"
                    class="text-[10px] px-2 py-1 bg-[#1a1a1e] border border-[#2a2a2e] rounded text-[#666] hover:text-cyan-400 hover:border-cyan-500/30 transition-colors font-mono"
                  >
                    + {{ preset }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Parameters (Collapsible) -->
          <div class="console-panel">
            <div class="console-header cursor-pointer" @click="expandAIParameters = !expandAIParameters">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-cyan-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">AI Parameters</span>
                <span v-if="hasChanges" class="text-[10px] text-amber-400 font-mono ml-2">● MODIFIED</span>
              </div>
              <svg class="w-4 h-4 transition-transform text-[#555]" :class="{ 'rotate-180': expandAIParameters }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div v-show="expandAIParameters" class="console-body space-y-6">
              <!-- Temperature Slider -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Temperature</label>
                  <span class="font-mono text-sm text-amber-400">{{ temperature.toFixed(2) }}</span>
                </div>
                <div class="relative">
                  <input
                    type="range"
                    v-model.number="temperature"
                    min="0"
                    max="2"
                    step="0.01"
                    class="slider-track w-full"
                    :disabled="!selectedPersona"
                  />
                  <!-- VU Meter Style Track -->
                  <div class="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-[#1a1a1e] overflow-hidden pointer-events-none">
                    <div
                      class="h-full transition-all duration-100"
                      :class="temperature > 1.5 ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500' : temperature > 0.8 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' : 'bg-emerald-500'"
                      :style="{ width: `${(temperature / 2) * 100}%` }"
                    ></div>
                  </div>
                </div>
                <div class="flex justify-between mt-1 text-[10px] text-[#555] font-mono">
                  <span>PRECISE</span>
                  <span>CREATIVE</span>
                </div>
              </div>

              <!-- Max Tokens -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Max Tokens</label>
                  <span class="font-mono text-sm text-amber-400">{{ maxTokens }}</span>
                </div>
                <input
                  type="number"
                  v-model.number="maxTokens"
                  min="50"
                  max="1000"
                  step="10"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2 font-mono text-sm text-[#ccc] focus:border-amber-500/50 focus:outline-none transition-colors"
                  :disabled="!selectedPersona"
                />
              </div>

              <!-- Voice ID Selector -->
              <div>
                <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Voice</label>
                <select
                  v-model="voiceId"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2.5 font-mono text-sm text-[#ccc] focus:border-amber-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                  :disabled="!selectedPersona"
                >
                  <option value="">Select voice...</option>
                  <option v-for="voice in availableVoices" :key="voice.id" :value="voice.id">
                    {{ voice.name }} ({{ voice.id.slice(0, 8) }}...)
                  </option>
                </select>
              </div>

              <!-- Max Call Duration -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Max Call Duration</label>
                  <span class="font-mono text-sm text-amber-400">{{ maxCallDuration }} min</span>
                </div>
                <input
                  type="number"
                  v-model.number="maxCallDuration"
                  min="1"
                  max="60"
                  step="1"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2 font-mono text-sm text-[#ccc] focus:border-amber-500/50 focus:outline-none transition-colors"
                  :disabled="!selectedPersona"
                />
                <div class="mt-2 text-[10px] text-[#555] font-mono">
                  Warnings at 66%, 86%, and 96% of duration
                </div>
              </div>
            </div>
          </div>

          <!-- Global Memory Extraction Settings -->
          <div class="console-panel">
            <div class="console-header cursor-pointer" @click="expandExtractionSettings = !expandExtractionSettings">
              <div class="flex items-center gap-3">
                <div class="led-indicator" :class="extractionSettings.enabled ? 'bg-emerald-500' : 'bg-[#555]'"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Memory Extraction</span>
                <span class="text-[10px] text-[#555] font-mono">GLOBAL</span>
                <span v-if="extractionSettings.enabled" class="text-[10px] text-emerald-400 font-mono ml-2">● ACTIVE</span>
              </div>
              <svg class="w-4 h-4 transition-transform text-[#555]" :class="{ 'rotate-180': expandExtractionSettings }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div v-show="expandExtractionSettings" class="console-body space-y-4">
              <div class="text-[11px] text-[#666] font-mono mb-2">
                Configure how facts are extracted from calls and stored in SmartMemory. These settings apply to ALL personas.
              </div>

              <!-- Enable/Disable Toggle -->
              <div class="flex items-center justify-between">
                <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Enable Extraction</label>
                <button
                  @click="extractionSettings.enabled = !extractionSettings.enabled; saveExtractionSettings()"
                  class="relative w-12 h-6 rounded-full transition-colors"
                  :class="extractionSettings.enabled ? 'bg-emerald-500/30' : 'bg-[#2a2a2e]'"
                >
                  <div
                    class="absolute top-1 w-4 h-4 rounded-full transition-all"
                    :class="extractionSettings.enabled ? 'left-7 bg-emerald-400' : 'left-1 bg-[#555]'"
                  ></div>
                </button>
              </div>

              <!-- Model Selection -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Cerebras Model</label>
                  <button
                    @click="fetchCerebrasModels"
                    class="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono"
                    :disabled="loadingCerebrasModels"
                  >
                    {{ loadingCerebrasModels ? 'Loading...' : '↻ Refresh' }}
                  </button>
                </div>
                <select
                  v-model="extractionSettings.model"
                  @change="saveExtractionSettings"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2.5 font-mono text-sm text-[#ccc] focus:border-emerald-500/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option v-if="availableCerebrasModels.length === 0" value="llama-3.3-70b">llama-3.3-70b (default)</option>
                  <option v-for="model in availableCerebrasModels" :key="model.id" :value="model.id">
                    {{ model.id }}
                  </option>
                </select>
                <div v-if="availableCerebrasModels.length > 0" class="mt-1 text-[10px] text-[#555] font-mono">
                  {{ availableCerebrasModels.length }} models available (Llama & Qwen)
                </div>
              </div>

              <!-- Temperature -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Extraction Temperature</label>
                  <span class="font-mono text-sm text-emerald-400">{{ extractionSettings.temperature.toFixed(2) }}</span>
                </div>
                <input
                  type="range"
                  v-model.number="extractionSettings.temperature"
                  @change="saveExtractionSettings"
                  min="0"
                  max="1"
                  step="0.05"
                  class="w-full accent-emerald-500"
                />
                <div class="flex justify-between mt-1 text-[10px] text-[#555] font-mono">
                  <span>PRECISE (0.0)</span>
                  <span>CREATIVE (1.0)</span>
                </div>
              </div>

              <!-- Max Tokens -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Max Extraction Tokens</label>
                  <span class="font-mono text-sm text-emerald-400">{{ extractionSettings.maxTokens }}</span>
                </div>
                <input
                  type="number"
                  v-model.number="extractionSettings.maxTokens"
                  @change="saveExtractionSettings"
                  min="100"
                  max="2000"
                  step="50"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2 font-mono text-sm text-[#ccc] focus:border-emerald-500/50 focus:outline-none transition-colors"
                />
              </div>

              <!-- Custom Extraction Prompt (Advanced) -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <label class="font-mono text-xs uppercase tracking-wider text-[#888]">Custom Extraction Prompt</label>
                  <span class="text-[10px] text-[#555] font-mono">OPTIONAL</span>
                </div>
                <textarea
                  v-model="extractionSettings.extractionPrompt"
                  @blur="saveExtractionSettings"
                  rows="4"
                  class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2 font-mono text-xs text-[#ccc] placeholder:text-[#444] focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
                  placeholder="Leave empty to use default prompt. Custom prompt must instruct LLM to output JSON array of facts."
                ></textarea>
              </div>

              <!-- Settings Status -->
              <div class="flex items-center gap-2 text-[10px] font-mono">
                <span v-if="extractionSettingsSaved" class="text-emerald-400">✓ Settings saved</span>
                <span v-else class="text-[#555]">Settings auto-save on change</span>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <button
            @click="savePersona"
            :disabled="!selectedPersona || saving || isBrowserVoiceActive || isTwilioCallActive"
            class="w-full py-4 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 border"
            :class="saving
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 cursor-wait'
              : (isBrowserVoiceActive || isTwilioCallActive)
                ? 'bg-red-500/10 border-red-500/30 text-red-400/50 cursor-not-allowed'
              : hasChanges
                ? 'bg-amber-500 border-amber-500 text-[#0d0d0f] hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                : 'bg-[#1a1a1e] border-[#2a2a2e] text-[#555] cursor-not-allowed'"
          >
            {{ saving ? 'Saving...' : (isBrowserVoiceActive || isTwilioCallActive) ? 'Hang Up to Save' : hasChanges ? 'Save Changes' : 'No Changes' }}
          </button>
        </div>

        <!-- RIGHT: Preview Panel -->
        <div class="space-y-6">
          <!-- Preview Mode Toggle -->
          <div class="flex items-center justify-between bg-[#131318] border border-[#2a2a2e] rounded-xl px-5 py-3">
            <div class="flex items-center gap-3">
              <div class="led-indicator" :class="previewMode === 'full' ? 'bg-emerald-500' : 'bg-amber-500'"></div>
              <span class="font-mono text-xs uppercase tracking-[0.15em] text-[#888]">Preview Mode</span>
            </div>
            <div class="flex items-center gap-1 bg-[#0d0d0f] p-1 rounded-lg">
              <button
                @click="previewMode = 'raw'"
                class="preview-mode-btn"
                :class="{ 'active': previewMode === 'raw' }"
              >
                <span class="text-[10px] uppercase tracking-wider">Raw Persona</span>
              </button>
              <button
                @click="previewMode = 'full'"
                class="preview-mode-btn"
                :class="{ 'active': previewMode === 'full' }"
              >
                <span class="text-[10px] uppercase tracking-wider">Full Context</span>
              </button>
            </div>
          </div>

          <!-- Compiled Prompt Preview -->
          <div class="console-panel">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-emerald-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">{{ previewMode === 'full' ? 'Compiled Final Prompt' : 'Raw Persona Prompt' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-mono text-[10px] text-[#555]">~{{ estimatedTokens }} TOKENS</span>
                <button @click="copyPromptToClipboard" class="text-[#555] hover:text-emerald-400 transition-colors" title="Copy to clipboard">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="console-body">
              <div class="prompt-preview font-mono text-xs leading-relaxed overflow-auto max-h-[600px]">
                <!-- RAW MODE: Just core prompt -->
                <template v-if="previewMode === 'raw'">
                  <div class="mb-4">
                    <div class="text-amber-500/70 mb-1 uppercase tracking-wider text-[10px]">// CORE SYSTEM PROMPT</div>
                    <div class="text-[#aaa] whitespace-pre-wrap">{{ editedPrompt || '(No prompt set)' }}</div>
                  </div>
                </template>

                <!-- FULL MODE: All layers -->
                <template v-else>
                  <!-- Layer 1: Core Prompt -->
                  <div class="prompt-layer" :class="{ 'layer-active': editedPrompt }">
                    <div class="layer-header">
                      <span class="layer-number bg-amber-500/20 text-amber-400">1</span>
                      <span class="text-amber-500/70 uppercase tracking-wider text-[10px]">CORE SYSTEM PROMPT</span>
                    </div>
                    <div class="text-[#aaa] whitespace-pre-wrap pl-6">{{ editedPrompt || '(No prompt set)' }}</div>
                  </div>

                  <div class="layer-divider"></div>

                  <!-- Layer 2: Call Context -->
                  <div class="prompt-layer" :class="{ 'layer-active': callPretext || customInstructions, 'layer-inactive': !callPretext && !customInstructions }">
                    <div class="layer-header">
                      <span class="layer-number bg-rose-500/20 text-rose-400">2</span>
                      <span class="text-rose-500/70 uppercase tracking-wider text-[10px]">CALL CONTEXT</span>
                      <span v-if="!callPretext && !customInstructions" class="text-[10px] text-[#555] ml-2">(not set)</span>
                    </div>
                    <div v-if="callPretext || customInstructions" class="text-[#aaa] whitespace-pre-wrap pl-6">
                      <template v-if="callPretext">
                        <span class="text-rose-400/60">CALL PRETEXT: </span>{{ callPretext }}<br/>
                      </template>
                      <template v-if="customInstructions">
                        <span class="text-rose-400/60">INSTRUCTIONS: </span>{{ customInstructions }}
                      </template>
                    </div>
                    <div v-else class="text-[#444] italic pl-6">[No call context provided]</div>
                  </div>

                  <div class="layer-divider"></div>

                  <!-- Layer 3: Relationship Context -->
                  <div class="prompt-layer" :class="{ 'layer-active': relationshipType || relationshipPrompt, 'layer-inactive': !relationshipType && !relationshipPrompt }">
                    <div class="layer-header">
                      <span class="layer-number bg-violet-500/20 text-violet-400">3</span>
                      <span class="text-violet-500/70 uppercase tracking-wider text-[10px]">RELATIONSHIP CONTEXT</span>
                      <span v-if="!relationshipType && !relationshipPrompt" class="text-[10px] text-[#555] ml-2">(not set)</span>
                    </div>
                    <div v-if="relationshipType || relationshipPrompt" class="text-[#aaa] whitespace-pre-wrap pl-6">
                      <template v-if="relationshipType">
                        <span class="text-violet-400/60">RELATIONSHIP: </span>{{ relationshipType.name }} ({{ relationshipDuration }} months)<br/>
                      </template>
                      <template v-if="relationshipPrompt">
                        <span class="text-violet-400/60">DETAILS: </span>{{ relationshipPrompt }}
                      </template>
                    </div>
                    <div v-else class="text-[#444] italic pl-6">[No relationship context]</div>
                  </div>

                  <div class="layer-divider"></div>

                  <!-- Layer 4: User Knowledge -->
                  <div class="prompt-layer" :class="{ 'layer-active': userFacts.length > 0, 'layer-inactive': userFacts.length === 0 }">
                    <div class="layer-header">
                      <span class="layer-number bg-cyan-500/20 text-cyan-400">4</span>
                      <span class="text-cyan-500/70 uppercase tracking-wider text-[10px]">USER KNOWLEDGE (SmartMemory)</span>
                      <span v-if="userFacts.length === 0" class="text-[10px] text-[#555] ml-2">(no facts)</span>
                    </div>
                    <div v-if="userFacts.length > 0" class="text-[#aaa] pl-6">
                      <div class="text-cyan-400/60 mb-1">What you know about this user:</div>
                      <div v-for="(fact, idx) in userFacts" :key="idx" class="flex items-start gap-2 mb-1">
                        <span class="text-cyan-500/40">•</span>
                        <span>{{ fact.content }}</span>
                      </div>
                    </div>
                    <div v-else class="text-[#444] italic pl-6">[No user knowledge stored]</div>
                  </div>

                  <div class="layer-divider"></div>

                  <!-- Layer 5: Phone Guidelines (always present) -->
                  <div class="prompt-layer layer-active">
                    <div class="layer-header">
                      <span class="layer-number bg-emerald-500/20 text-emerald-400">5</span>
                      <span class="text-emerald-500/70 uppercase tracking-wider text-[10px]">PHONE CALL FORMAT</span>
                      <span class="text-[10px] text-emerald-500/50 ml-2">(always applied)</span>
                    </div>
                    <div class="text-[#aaa] whitespace-pre-wrap pl-6">
                      <div class="text-emerald-400/80 text-[11px] mb-2">You are on a LIVE PHONE CALL with the user right now.</div>
                      <span class="text-emerald-400/60">• </span>Keep responses brief and natural (1-2 short sentences max)<br/>
                      <span class="text-emerald-400/60">• </span>Respond to what the user actually says - stay grounded<br/>
                      <span class="text-emerald-400/60">• </span>Speak conversationally - no stage directions, asterisks, or "(laughs)"<br/>
                      <span class="text-emerald-400/60">• </span>Don't narrate actions - just speak naturally<br/>
                      <span class="text-emerald-400/60">• </span>If something's unclear, just ask!<br/>
                      <span class="text-emerald-400/60">• </span>Remember: they hear your voice, not text
                    </div>
                  </div>

                  <div class="layer-divider"></div>

                  <!-- Conversation History (placeholder) -->
                  <div class="prompt-layer layer-inactive">
                    <div class="layer-header">
                      <span class="layer-number bg-[#333] text-[#666]">∞</span>
                      <span class="text-[#555] uppercase tracking-wider text-[10px]">CONVERSATION HISTORY</span>
                      <span class="text-[10px] text-[#444] ml-2">(appended at runtime)</span>
                    </div>
                    <div class="text-[#444] italic pl-6">
                      [Last 10 conversation turns appended here]<br/>
                      User: "Hello!"<br/>
                      Assistant: "Hey! Great to hear from you..."
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <!-- Transcript Panel (shows during calls) -->
          <div v-if="isBrowserVoiceActive || isTwilioCallActive" class="console-panel">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-red-500 animate-pulse"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Live Transcript</span>
              </div>
              <span class="font-mono text-[10px] text-red-400 animate-pulse">● REC</span>
            </div>
            <div class="console-body max-h-48 overflow-y-auto">
              <div v-for="(turn, idx) in transcript" :key="idx" class="mb-2">
                <span class="font-mono text-[10px] uppercase" :class="turn.role === 'user' ? 'text-cyan-400' : 'text-amber-400'">
                  {{ turn.role }}:
                </span>
                <span class="text-sm text-[#ccc] ml-2">{{ turn.text }}</span>
              </div>
              <div v-if="transcript.length === 0" class="text-[#555] text-sm italic">
                Waiting for speech...
              </div>
            </div>
          </div>

          <!-- Recent Calls Widget -->
          <div class="console-panel">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-violet-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Recent Calls</span>
              </div>
              <button @click="fetchRecentCalls" class="text-[#555] hover:text-violet-400 transition-colors" :class="{ 'animate-spin': loadingCalls }">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div class="console-body p-0 max-h-64 overflow-y-auto">
              <!-- Loading State -->
              <div v-if="loadingCalls" class="p-4 text-center">
                <div class="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto"></div>
              </div>

              <!-- Empty State -->
              <div v-else-if="recentCalls.length === 0" class="p-4 text-center text-[#555] text-sm">
                No recent calls
              </div>

              <!-- Calls List -->
              <div v-else class="divide-y divide-[#1e1e22]">
                <div
                  v-for="call in recentCalls"
                  :key="call.id"
                  class="call-row group"
                  @click="toggleCallExpand(call.id)"
                >
                  <!-- Main Row -->
                  <div class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#1a1a1e] transition-colors">
                    <!-- Left: Status + Persona -->
                    <div class="flex items-center gap-3">
                      <!-- Status Dot -->
                      <div
                        class="w-2 h-2 rounded-full"
                        :class="{
                          'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]': call.status === 'completed',
                          'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] animate-pulse': call.status === 'in-progress',
                          'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]': call.status === 'initiating',
                          'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]': call.status === 'failed'
                        }"
                      ></div>
                      <!-- Persona Name -->
                      <span class="font-mono text-xs text-[#aaa]">{{ call.personaName }}</span>
                    </div>

                    <!-- Right: Stats -->
                    <div class="flex items-center gap-4">
                      <!-- Duration -->
                      <div class="flex items-center gap-1.5">
                        <svg class="w-3 h-3 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span class="font-mono text-[11px] text-[#888]">{{ formatDuration(call.durationSeconds) }}</span>
                      </div>
                      <!-- Cost -->
                      <div class="flex items-center gap-1.5 min-w-[60px] justify-end">
                        <span class="font-mono text-[11px]" :class="parseFloat(call.costUsd) > 0 ? 'text-amber-400' : 'text-[#555]'">
                          ${{ call.costUsd }}
                        </span>
                      </div>
                      <!-- Time -->
                      <span class="font-mono text-[10px] text-[#555] min-w-[50px] text-right">{{ formatTime(call.createdAt) }}</span>
                      <!-- Expand Arrow -->
                      <svg
                        class="w-3 h-3 text-[#444] transition-transform duration-200"
                        :class="{ 'rotate-180': expandedCallId === call.id }"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <!-- Expanded Cost Breakdown -->
                  <div
                    v-if="expandedCallId === call.id"
                    class="px-4 py-3 bg-[#0d0d0f] border-t border-[#1e1e22]"
                  >
                    <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <!-- Call SID -->
                      <div class="col-span-2 flex items-center gap-2 mb-2">
                        <span class="text-[#555] uppercase">SID:</span>
                        <span class="text-[#777] truncate">{{ call.callSid || 'N/A' }}</span>
                      </div>

                      <!-- Cost Breakdown -->
                      <template v-if="call.costBreakdown && call.costBreakdown.length > 0">
                        <div v-for="item in call.costBreakdown" :key="item.service" class="flex justify-between items-center bg-[#131318] rounded px-2 py-1.5">
                          <span class="text-[#888] uppercase">{{ item.service }}</span>
                          <span class="text-amber-400/80">${{ item.cost }}</span>
                        </div>
                      </template>
                      <div v-else class="col-span-2 text-[#555] italic text-center py-2">
                        No cost breakdown available
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Audio Settings Modal -->
    <div v-if="showSettingsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" @click.self="showSettingsModal = false">
      <div class="bg-[#131318] border border-[#2a2a2e] rounded-xl max-w-2xl w-full mx-4 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-6 py-4 bg-[#1a1a1e] border-b border-[#2a2a2e]">
          <div class="flex items-center gap-3">
            <div class="led-indicator bg-amber-500"></div>
            <h2 class="font-mono text-sm uppercase tracking-[0.15em] text-[#ccc]">Audio Settings</h2>
          </div>
          <button @click="showSettingsModal = false" class="text-[#666] hover:text-amber-500 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-6">
          <!-- Audio Input Device -->
          <div>
            <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Microphone</label>
            <select
              v-model="selectedAudioInput"
              @change="handleAudioInputChange"
              class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2.5 font-mono text-sm text-[#ccc] focus:border-amber-500/50 focus:outline-none transition-colors"
            >
              <option value="">Default Microphone</option>
              <option v-for="device in audioInputDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `Microphone ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <!-- Audio Output Device -->
          <div>
            <label class="font-mono text-xs uppercase tracking-wider text-[#888] block mb-3">Speaker</label>
            <select
              v-model="selectedAudioOutput"
              @change="handleAudioOutputChange"
              class="w-full bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2.5 font-mono text-sm text-[#ccc] focus:border-amber-500/50 focus:outline-none transition-colors"
            >
              <option value="">Default Speaker</option>
              <option v-for="device in audioOutputDevices" :key="device.deviceId" :value="device.deviceId">
                {{ device.label || `Speaker ${device.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <!-- Audio Configuration Info -->
          <div class="bg-[#0d0d0f] border border-[#1a1a1e] rounded-lg p-4">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-3">Current Configuration</div>
            <div class="space-y-2 text-xs font-mono text-[#888]">
              <div class="flex justify-between">
                <span>Sample Rate:</span>
                <span class="text-amber-400">{{ audioConfig.sampleRate }} Hz</span>
              </div>
              <div class="flex justify-between">
                <span>Channels:</span>
                <span class="text-amber-400">{{ audioConfig.channelCount }} (Mono)</span>
              </div>
              <div class="flex justify-between">
                <span>Echo Cancellation:</span>
                <span class="text-amber-400">{{ audioConfig.echoCancellation ? 'Enabled' : 'Disabled' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Noise Suppression:</span>
                <span class="text-amber-400">{{ audioConfig.noiseSuppression ? 'Enabled' : 'Disabled' }}</span>
              </div>
              <div class="flex justify-between">
                <span>Auto Gain Control:</span>
                <span class="text-amber-400">{{ audioConfig.autoGainControl ? 'Enabled' : 'Disabled' }}</span>
              </div>
            </div>
          </div>

          <!-- Permissions Status -->
          <div class="bg-[#0d0d0f] border border-[#1a1a1e] rounded-lg p-4">
            <div class="text-[10px] font-mono uppercase tracking-wider text-[#555] mb-3">Permissions</div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="micPermission === 'granted' ? 'bg-emerald-500' : micPermission === 'denied' ? 'bg-red-500' : 'bg-amber-500'"></div>
                <span class="text-xs font-mono text-[#888]">Microphone: {{ micPermission }}</span>
              </div>
              <button
                v-if="micPermission !== 'granted'"
                @click="requestMicPermission"
                class="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors"
              >
                → Request Microphone Access
              </button>
            </div>
          </div>

          <!-- Test Audio Button -->
          <button
            @click="testAudio"
            :disabled="testingAudio"
            class="w-full py-3 rounded-lg font-mono text-sm uppercase tracking-wider transition-all duration-300 border"
            :class="testingAudio
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 cursor-wait'
              : 'bg-[#1a1a1e] border-[#2a2a2e] text-[#ccc] hover:border-amber-500/50 hover:text-amber-400'"
          >
            {{ testingAudio ? 'Testing...' : 'Test Microphone' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// API URLs
const LOG_QUERY_URL = 'https://logs.ai-tools-marketplace.io';
const VOICE_WS_URL = 'wss://voice.ai-tools-marketplace.io';
const API_GATEWAY_URL = import.meta.env.VITE_API_URL || 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';

// State
const personas = ref([]);
const selectedPersona = ref(null);
const loadingPersonas = ref(true);
const saving = ref(false);

// User Impersonation State
const allUsers = ref([]);
const impersonatedUser = ref(null); // null = admin mode, object = impersonating
const showUserDropdown = ref(false);
const loadingUsers = ref(false);

// Editable fields
const editedPrompt = ref('');
const temperature = ref(0.7);
const maxTokens = ref(150);
const maxCallDuration = ref(15); // Maximum call duration in minutes
const voiceId = ref('');
const adminPhone = ref('');
const savedPhoneNumbers = ref([]);

// UI State
const expandPromptEditor = ref(false);
const expandCallContext = ref(false);
const expandRelationship = ref(false);
const expandUserKnowledge = ref(false);
const expandAIParameters = ref(true);  // Default expanded
const expandExtractionSettings = ref(false);

// Track initial context values to detect changes (set when loading context)
const initialContext = ref({
  callPretext: '',
  customInstructions: '',
  selectedScenarioId: null,
  relationshipTypeId: null,
  relationshipDuration: 6,
  relationshipPrompt: '',
  userFactsCount: 0
});
const connectionStatus = ref('idle');
const showSettingsModal = ref(false);

// Global Extraction Settings (applies to all personas)
const extractionSettings = ref({
  enabled: true,
  model: 'llama-3.3-70b',
  temperature: 0.1,
  maxTokens: 500,
  extractionPrompt: ''
});
const extractionSettingsSaved = ref(false);
const availableCerebrasModels = ref([]);
const loadingCerebrasModels = ref(false);
const previewMode = ref('full'); // 'raw' or 'full'

// Call Context State (Layer 2)
const callPretext = ref('');
const customInstructions = ref('');
const selectedScenario = ref(null);
const scenarioPresets = [
  { id: 'escape', name: 'Escape Call', icon: '🚪', pretext: 'I need a convincing excuse to leave this situation', instructions: 'Be urgent but not alarming. Give the user a believable reason to step away.' },
  { id: 'vent', name: 'Need to Vent', icon: '💨', pretext: 'I just need someone to listen while I process my thoughts', instructions: 'Be a supportive listener. Ask clarifying questions but let them lead.' },
  { id: 'advice', name: 'Need Advice', icon: '💡', pretext: 'I have a decision to make and need help thinking it through', instructions: 'Help them weigh pros and cons. Ask questions to understand the full picture.' },
  { id: 'celebrate', name: 'Good News!', icon: '🎉', pretext: 'Something great happened and I want to share it', instructions: 'Match their energy! Celebrate with them and ask for details.' },
  { id: 'anxiety', name: 'Feeling Anxious', icon: '😰', pretext: 'I\'m feeling overwhelmed and need help calming down', instructions: 'Be calm and grounding. Help them breathe and take things one step at a time.' },
  { id: 'practice', name: 'Practice Convo', icon: '🎭', pretext: 'I need to practice an important conversation before having it', instructions: 'Role-play the other person. Give constructive feedback on their approach.' },
];

// Relationship Context State (Layer 3)
const relationshipType = ref(null);
const relationshipDuration = ref(6);
const relationshipPrompt = ref('');
const relationshipTypes = [
  { id: 'friend', name: 'Friend', icon: '👋', prompt: 'You\'re a trusted friend who knows them well.' },
  { id: 'mentor', name: 'Mentor', icon: '🎓', prompt: 'You\'re a mentor who provides guidance and wisdom.' },
  { id: 'coach', name: 'Coach', icon: '💪', prompt: 'You\'re a supportive coach focused on their growth.' },
  { id: 'confidant', name: 'Confidant', icon: '🤫', prompt: 'You\'re someone they trust with their deepest thoughts.' },
  { id: 'cheerleader', name: 'Cheerleader', icon: '📣', prompt: 'You\'re their biggest supporter and hype person.' },
  { id: 'challenger', name: 'Challenger', icon: '⚔️', prompt: 'You push them to think critically and grow.' },
];

// User Knowledge State (Layer 4)
// All facts (both manually added and auto-extracted) stored in long_term:{adminId}:{personaId}
const userFacts = ref([]);
const loadingUserFacts = ref(false);
const newFactCategory = ref('personal');
const newFactContent = ref('');
const factPresets = [
  'Works in tech',
  'Has a dog',
  'Stressed about work',
  'Recently moved',
  'In a relationship',
  'Health-conscious',
];

// KV Storage persistence for user context data (per user + per persona)
// Key pattern: user_context:{adminId}:{personaId}
// This unified key stores all user-specific layers (2, 3, 4) together
const getUserContextKey = (adminId, personaId) => `user_context:${adminId}:${personaId}`;

// Helper to get adminId from token
const getAdminIdFromToken = () => {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || payload.id || payload.adminId;
  } catch (e) {
    console.error('[PersonaDesigner] Could not decode admin token');
    return null;
  }
};

// Get effective user ID - returns impersonated user's ID if set, otherwise admin ID
const getEffectiveUserId = () => {
  if (impersonatedUser.value) {
    return impersonatedUser.value.id;
  }
  return getAdminIdFromToken();
};

// Fetch all users for impersonation dropdown
const fetchAllUsers = async () => {
  loadingUsers.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_GATEWAY_URL}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      allUsers.value = data.users || [];
      console.log(`[PersonaDesigner] Loaded ${allUsers.value.length} users for impersonation`);

      // Restore impersonated user from localStorage if exists
      const savedImpersonation = localStorage.getItem('impersonatedUserId');
      if (savedImpersonation) {
        const user = allUsers.value.find(u => u.id === savedImpersonation);
        if (user) {
          impersonatedUser.value = user;
          console.log(`[PersonaDesigner] Restored impersonation: ${user.email}`);
        }
      }
    }
  } catch (err) {
    console.error('[PersonaDesigner] Failed to fetch users:', err);
  } finally {
    loadingUsers.value = false;
  }
};

// Set impersonated user and persist to localStorage
const setImpersonatedUser = (user) => {
  impersonatedUser.value = user;
  showUserDropdown.value = false;
  if (user) {
    localStorage.setItem('impersonatedUserId', user.id);
    console.log(`[PersonaDesigner] Now impersonating: ${user.email}`);
  } else {
    localStorage.removeItem('impersonatedUserId');
    console.log('[PersonaDesigner] Switched to admin mode');
  }
  // Reload persona context for the new user
  if (selectedPersona.value) {
    loadContextFromKV();
  }
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run';

// Fetch available Cerebras models (filtered to Llama and Qwen)
const fetchCerebrasModels = async () => {
  loadingCerebrasModels.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    // Proxy through API gateway to avoid CORS and hide API key
    const response = await fetch(`${API_BASE}/api/cerebras/models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      // Filter for Llama and Qwen models only
      const filtered = (data.models || data.data || [])
        .filter(m => {
          const id = (m.id || m.name || '').toLowerCase();
          return id.includes('llama') || id.includes('qwen');
        })
        .sort((a, b) => (a.id || a.name).localeCompare(b.id || b.name));
      availableCerebrasModels.value = filtered;
      console.log(`[PersonaDesigner] Loaded ${filtered.length} Cerebras models`);
    } else {
      console.error('[PersonaDesigner] Failed to fetch Cerebras models:', await response.text());
    }
  } catch (err) {
    console.error('[PersonaDesigner] Error fetching Cerebras models:', err);
  } finally {
    loadingCerebrasModels.value = false;
  }
};

// Save global extraction settings to SmartMemory
const saveExtractionSettings = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/api/memory/semantic`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        objectId: 'global:extraction_settings',
        document: {
          enabled: extractionSettings.value.enabled,
          model: extractionSettings.value.model,
          temperature: extractionSettings.value.temperature,
          maxTokens: extractionSettings.value.maxTokens,
          extractionPrompt: extractionSettings.value.extractionPrompt || null,
          updatedAt: new Date().toISOString()
        }
      }),
    });

    if (response.ok) {
      extractionSettingsSaved.value = true;
      setTimeout(() => { extractionSettingsSaved.value = false; }, 2000);
      console.log('[PersonaDesigner] Saved extraction settings');
    } else {
      console.error('[PersonaDesigner] Failed to save extraction settings:', await response.text());
    }
  } catch (err) {
    console.error('[PersonaDesigner] Error saving extraction settings:', err);
  }
};

// Load global extraction settings from SmartMemory
const loadExtractionSettings = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_BASE}/api/memory/semantic/${encodeURIComponent('global:extraction_settings')}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.document && !result.document.deleted) {
        extractionSettings.value = {
          enabled: result.document.enabled ?? true,
          model: result.document.model || 'llama-3.3-70b',
          temperature: result.document.temperature ?? 0.1,
          maxTokens: result.document.maxTokens || 500,
          extractionPrompt: result.document.extractionPrompt || ''
        };
        console.log('[PersonaDesigner] Loaded extraction settings');
      }
    }
  } catch (err) {
    console.error('[PersonaDesigner] Error loading extraction settings:', err);
  }
};

const saveContextToKV = async () => {
  console.log('[PersonaDesigner] saveContextToKV called');
  if (!selectedPersona.value?.id) {
    console.log('[PersonaDesigner] No persona selected, skipping save');
    return;
  }

  const effectiveUserId = getEffectiveUserId();
  if (!effectiveUserId) {
    console.error('[PersonaDesigner] No user ID, cannot save to KV');
    saveContextToLocalStorage();
    return;
  }

  const key = getUserContextKey(effectiveUserId, selectedPersona.value.id);
  // Unified value containing all user-specific layers (2, 3, 4)
  const value = {
    // Layer 2: Call Context
    callPretext: callPretext.value,
    customInstructions: customInstructions.value,
    selectedScenarioId: selectedScenario.value?.id || null,
    // Layer 3: Relationship
    relationshipTypeId: relationshipType.value?.id || null,
    relationshipDuration: relationshipDuration.value,
    relationshipPrompt: relationshipPrompt.value,
    // Layer 4: Facts
    facts: userFacts.value.map(f => ({
      fact: f.content,
      category: f.category,
      importance: f.importance || 'medium',
      timestamp: f.timestamp || new Date().toISOString()
    })),
    updatedAt: new Date().toISOString(),
  };
  console.log('[PersonaDesigner] Saving unified context to KV:', { key, factsCount: value.facts.length });

  try {
    const token = localStorage.getItem('adminToken');
    // Use KV storage endpoint: PUT /api/userdata
    const response = await fetch(`${API_BASE}/api/userdata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ key, value }),
    });

    if (response.ok) {
      console.log(`[PersonaDesigner] Saved unified context to KV: ${key}`);
    } else {
      console.error('[PersonaDesigner] KV save failed:', await response.text());
      // Fallback to localStorage
      saveContextToLocalStorage();
    }
  } catch (e) {
    console.error('[PersonaDesigner] KV save error:', e);
    // Fallback to localStorage
    saveContextToLocalStorage();
  }
};

const loadContextFromKV = async () => {
  if (!selectedPersona.value?.id) return;

  const effectiveUserId = getEffectiveUserId();
  if (!effectiveUserId) {
    console.error('[PersonaDesigner] No user ID, cannot load from KV');
    return;
  }

  const token = localStorage.getItem('adminToken');
  const key = getUserContextKey(effectiveUserId, selectedPersona.value.id);

  try {
    // Use KV storage endpoint: GET /api/userdata/:key
    const response = await fetch(`${API_BASE}/api/userdata/${encodeURIComponent(key)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      // KV returns { success: true, data: {...} }
      const data = result.data;

      if (data && !data.deleted) {
        // Layer 2: Call Context
        callPretext.value = data.callPretext || '';
        customInstructions.value = data.customInstructions || '';
        selectedScenario.value = data.selectedScenarioId
          ? scenarioPresets.find(s => s.id === data.selectedScenarioId) || null
          : null;
        // Layer 3: Relationship
        relationshipType.value = data.relationshipTypeId
          ? relationshipTypes.find(r => r.id === data.relationshipTypeId) || null
          : null;
        relationshipDuration.value = data.relationshipDuration || 6;
        relationshipPrompt.value = data.relationshipPrompt || '';
        // Layer 4: Facts (now unified in same key)
        const facts = data.facts || [];
        userFacts.value = facts.map(f => ({
          category: f.category || 'personal',
          content: f.fact || f.content || f,
          importance: f.importance || 'medium',
          timestamp: f.timestamp
        }));

        // Store initial values for change detection
        initialContext.value = {
          callPretext: data.callPretext || '',
          customInstructions: data.customInstructions || '',
          selectedScenarioId: data.selectedScenarioId || null,
          relationshipTypeId: data.relationshipTypeId || null,
          relationshipDuration: data.relationshipDuration || 6,
          relationshipPrompt: data.relationshipPrompt || '',
          userFactsCount: userFacts.value.length
        };

        console.log(`[PersonaDesigner] Loaded unified context from KV: ${key} (${userFacts.value.length} facts)`);
        return;
      }
    }

    // No data in new key - try migration from legacy keys
    // TODO: Remove this migration code after 2025-12-15 (gives ~3 weeks for migration)
    console.log(`[PersonaDesigner] No data in new key, attempting migration from legacy keys...`);
    await migrateFromLegacyKeys(effectiveUserId, selectedPersona.value.id, token);

  } catch (e) {
    console.error('[PersonaDesigner] KV load error:', e);
  }
};

/**
 * MIGRATION: Load from legacy keys and save to new unified key
 * Legacy keys: admin_context:{personaId} (Layer 2/3) + long_term:{adminId}:{personaId} (Layer 4)
 * New key: user_context:{adminId}:{personaId} (all layers)
 * TODO: Remove after 2025-12-15
 */
const migrateFromLegacyKeys = async (adminId, personaId, token) => {
  let legacyContext = null;
  let legacyFacts = [];

  // Try to load from legacy admin_context key (Layer 2/3)
  try {
    const legacyContextKey = `admin_context:${personaId}`;
    const response = await fetch(`${API_BASE}/api/userdata/${encodeURIComponent(legacyContextKey)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const result = await response.json();
      if (result.data && !result.data.deleted) {
        legacyContext = result.data;
        console.log(`[PersonaDesigner] Found legacy context in ${legacyContextKey}`);
      }
    }
  } catch (e) {
    console.log('[PersonaDesigner] No legacy admin_context found');
  }

  // Try to load from legacy long_term key (Layer 4 facts)
  try {
    const legacyFactsKey = `long_term:${adminId}:${personaId}`;
    const response = await fetch(`${API_BASE}/api/userdata/${encodeURIComponent(legacyFactsKey)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.ok) {
      const result = await response.json();
      if (result.data && result.data.facts) {
        legacyFacts = result.data.facts;
        console.log(`[PersonaDesigner] Found ${legacyFacts.length} legacy facts in ${legacyFactsKey}`);
      }
    }
  } catch (e) {
    console.log('[PersonaDesigner] No legacy long_term facts found');
  }

  // If we found any legacy data, populate the UI
  if (legacyContext || legacyFacts.length > 0) {
    // Layer 2: Call Context
    callPretext.value = legacyContext?.callPretext || '';
    customInstructions.value = legacyContext?.customInstructions || '';
    selectedScenario.value = legacyContext?.selectedScenarioId
      ? scenarioPresets.find(s => s.id === legacyContext.selectedScenarioId) || null
      : null;
    // Layer 3: Relationship
    relationshipType.value = legacyContext?.relationshipTypeId
      ? relationshipTypes.find(r => r.id === legacyContext.relationshipTypeId) || null
      : null;
    relationshipDuration.value = legacyContext?.relationshipDuration || 6;
    relationshipPrompt.value = legacyContext?.relationshipPrompt || '';
    // Layer 4: Facts
    userFacts.value = legacyFacts.map(f => ({
      category: f.category || 'personal',
      content: f.fact || f.content || f,
      importance: f.importance || 'medium',
      timestamp: f.timestamp
    }));

    // Store initial values
    initialContext.value = {
      callPretext: callPretext.value,
      customInstructions: customInstructions.value,
      selectedScenarioId: selectedScenario.value?.id || null,
      relationshipTypeId: relationshipType.value?.id || null,
      relationshipDuration: relationshipDuration.value,
      relationshipPrompt: relationshipPrompt.value,
      userFactsCount: userFacts.value.length
    };

    // Auto-save to new unified key to complete migration
    console.log('[PersonaDesigner] Migrating legacy data to new unified key...');
    await saveContextToKV();
    console.log('[PersonaDesigner] Migration complete!');
  } else {
    // No legacy data - truly starting fresh
    console.log('[PersonaDesigner] No legacy data found, starting fresh');
    userFacts.value = [];
    initialContext.value.userFactsCount = 0;
  }
};

// localStorage fallback functions
const getStorageKey = (personaId) => `persona_context_${personaId}`;

const saveContextToLocalStorage = () => {
  if (!selectedPersona.value?.id) return;
  const key = getStorageKey(selectedPersona.value.id);
  const data = {
    callPretext: callPretext.value,
    customInstructions: customInstructions.value,
    selectedScenarioId: selectedScenario.value?.id || null,
    relationshipTypeId: relationshipType.value?.id || null,
    relationshipDuration: relationshipDuration.value,
    relationshipPrompt: relationshipPrompt.value,
    userFacts: userFacts.value,
  };
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`[PersonaDesigner] Saved context to localStorage for ${selectedPersona.value.id}`);
};

const loadContextFromLocalStorage = () => {
  if (!selectedPersona.value?.id) return;
  const key = getStorageKey(selectedPersona.value.id);
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      const data = JSON.parse(stored);
      callPretext.value = data.callPretext || '';
      customInstructions.value = data.customInstructions || '';
      selectedScenario.value = data.selectedScenarioId
        ? scenarioPresets.find(s => s.id === data.selectedScenarioId) || null
        : null;
      relationshipType.value = data.relationshipTypeId
        ? relationshipTypes.find(r => r.id === data.relationshipTypeId) || null
        : null;
      relationshipDuration.value = data.relationshipDuration || 6;
      relationshipPrompt.value = data.relationshipPrompt || '';
      userFacts.value = data.userFacts || [];

      // Store initial values for change detection
      initialContext.value = {
        callPretext: data.callPretext || '',
        customInstructions: data.customInstructions || '',
        selectedScenarioId: data.selectedScenarioId || null,
        relationshipTypeId: data.relationshipTypeId || null,
        relationshipDuration: data.relationshipDuration || 6,
        relationshipPrompt: data.relationshipPrompt || '',
        userFactsCount: (data.userFacts || []).length
      };

      console.log(`[PersonaDesigner] Loaded context from localStorage for ${selectedPersona.value.id}`);
    } catch (e) {
      console.error('[PersonaDesigner] Failed to load context from localStorage:', e);
      resetContextToDefaults();
    }
  } else {
    resetContextToDefaults();
  }
};

const resetContextToDefaults = () => {
  callPretext.value = '';
  customInstructions.value = '';
  selectedScenario.value = null;
  relationshipType.value = null;
  relationshipDuration.value = 6;
  relationshipPrompt.value = '';
  userFacts.value = [];

  // Reset initial context for change detection
  initialContext.value = {
    callPretext: '',
    customInstructions: '',
    selectedScenarioId: null,
    relationshipTypeId: null,
    relationshipDuration: 6,
    relationshipPrompt: '',
    userFactsCount: 0
  };
};

// NOTE: Auto-save removed - save is now handled by explicit savePersona() button click
// The hasChanges computed property tracks all persona + context changes

// Load context when persona changes
watch(selectedPersona, (newPersona) => {
  if (newPersona) {
    loadContextFromKV();  // Loads all layers (2, 3, 4) from unified key
  }
});

// Audio Settings State
const audioInputDevices = ref([]);
const audioOutputDevices = ref([]);
const selectedAudioInput = ref('');
const selectedAudioOutput = ref('');
const micPermission = ref('prompt');
const testingAudio = ref(false);
const audioConfig = ref({
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
});

// Call state
const isBrowserVoiceActive = ref(false);
const isTwilioCallActive = ref(false);
const transcript = ref([]);

// Recent calls
const recentCalls = ref([]);
const loadingCalls = ref(false);
const expandedCallId = ref(null);

// WebSocket
let voiceWebSocket = null;
let audioContext = null;
let mediaStream = null;
let audioWorklet = null;
let isAISpeaking = false; // Track when AI is generating/playing audio
let currentAudio = null; // Track currently playing audio element
let sessionStartTimeout = null;

// ElevenLabs Voice IDs - Comprehensive Collection
const availableVoices = [
  // Original personas
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam - Deep, authoritative male' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella - Warm, engaging female' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel - Young, energetic female' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi - Professional female' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli - Friendly, conversational female' },
  // Additional pre-made voices
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh - Young, casual male' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold - Deep, mature male' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni - Warm, reassuring male' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam - Neutral, clear narrator' },
  { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Dorothy - Cheerful, bright female' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave - Conversational male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Fin - Elderly, wise male' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Freya - Mature, sophisticated female' },
  { id: 'jsCqWAovK2LkecY7zXl4', name: 'Jessie - Calm, measured female' },
  { id: 'ODq5zmih8GrVes37Dizd', name: 'Patrick - Professional newscaster male' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam - Confident, strong male' },
  { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill - Casual, friendly male' },
  { id: 'Zlb1dXrM653N07WRdFW3', name: 'Charlotte - Gentle, warm female' },
  { id: 'GBv7mTt0atIp3Br8iCZE', name: 'Thomas - Smooth, corporate male' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George - Deep British male' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda - Kind, motherly female' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian - Youthful, energetic male' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Emily - Clear, articulate female' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Ethan - Professional, modern male' },
  { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica - Bright, enthusiastic female' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris - Casual, relatable male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel - Authoritative, commanding male' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily - Sweet, gentle female' },
  { id: 'SOYHLrjzK2X1ezoPC6cr', name: 'Harry - British, refined male' },
  { id: 'bIHbv24MWmeRgasZH58o', name: 'Callum - Scottish accent male' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura - Australian accent female' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Charlie - British young male' },
];

// Computed
const hasChanges = computed(() => {
  if (!selectedPersona.value) return false;
  // API returns 'systemPrompt' not 'core_system_prompt', 'voice' not 'default_voice_id'
  const originalPrompt = selectedPersona.value.systemPrompt || selectedPersona.value.core_system_prompt || '';
  const originalVoice = selectedPersona.value.voice || selectedPersona.value.default_voice_id || '';

  // Check persona field changes
  const personaChanged = (
    editedPrompt.value !== originalPrompt ||
    temperature.value !== parseFloat(selectedPersona.value.temperature || 0.7) ||
    maxTokens.value !== parseInt(selectedPersona.value.max_tokens || 150) ||
    maxCallDuration.value !== parseInt(selectedPersona.value.max_call_duration || 15) ||
    voiceId.value !== originalVoice
  );

  // Check context field changes (Layer 2, 3, 4)
  const contextChanged = (
    callPretext.value !== initialContext.value.callPretext ||
    customInstructions.value !== initialContext.value.customInstructions ||
    (selectedScenario.value?.id || null) !== initialContext.value.selectedScenarioId ||
    (relationshipType.value?.id || null) !== initialContext.value.relationshipTypeId ||
    relationshipDuration.value !== initialContext.value.relationshipDuration ||
    relationshipPrompt.value !== initialContext.value.relationshipPrompt ||
    userFacts.value.length !== initialContext.value.userFactsCount
  );

  return personaChanged || contextChanged;
});

// Methods
const fetchPersonas = async () => {
  loadingPersonas.value = true;
  try {
    // Fetch from main API gateway with admin token to get full persona data (including systemPrompt)
    const token = localStorage.getItem('adminToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_GATEWAY_URL}/api/personas`, { headers });
    if (!response.ok) throw new Error('Failed to fetch personas');
    const data = await response.json();
    personas.value = data.personas || data || [];
    console.log(`Loaded ${personas.value.length} personas from API`);
  } catch (err) {
    console.error('Error fetching personas:', err);
  } finally {
    loadingPersonas.value = false;
  }
};

const selectPersona = (persona) => {
  selectedPersona.value = persona;
  // API returns 'systemPrompt' not 'core_system_prompt'
  editedPrompt.value = persona.systemPrompt || persona.core_system_prompt || '';
  temperature.value = parseFloat(persona.temperature || 0.7);
  maxTokens.value = parseInt(persona.max_tokens || 150);
  maxCallDuration.value = parseInt(persona.max_call_duration || 15);
  // API returns 'voice' not 'default_voice_id'
  voiceId.value = persona.voice || persona.default_voice_id || '';
};

const savePersona = async () => {
  if (!selectedPersona.value || saving.value) return;
  saving.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    // Use main API gateway for persona updates
    const response = await fetch(`${API_GATEWAY_URL}/api/admin/personas/${selectedPersona.value.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        core_system_prompt: editedPrompt.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        max_call_duration: maxCallDuration.value,
        default_voice_id: voiceId.value
      })
    });
    if (!response.ok) throw new Error('Failed to save persona');

    // Update local state (use API field names)
    selectedPersona.value.systemPrompt = editedPrompt.value;
    selectedPersona.value.voice = voiceId.value;
    selectedPersona.value.temperature = temperature.value;
    selectedPersona.value.max_tokens = maxTokens.value;
    selectedPersona.value.max_call_duration = maxCallDuration.value;

    // Update in personas array
    const idx = personas.value.findIndex(p => p.id === selectedPersona.value.id);
    if (idx !== -1) personas.value[idx] = { ...selectedPersona.value };

    // Save all user-specific layers (2, 3, 4) to unified KV key
    await saveContextToKV();

    // Update initialContext to reflect saved state (so hasChanges becomes false)
    initialContext.value = {
      callPretext: callPretext.value,
      customInstructions: customInstructions.value,
      selectedScenarioId: selectedScenario.value?.id || null,
      relationshipTypeId: relationshipType.value?.id || null,
      relationshipDuration: relationshipDuration.value,
      relationshipPrompt: relationshipPrompt.value,
      userFactsCount: userFacts.value.length
    };

    console.log('[PersonaDesigner] Saved persona + context + user facts');

  } catch (err) {
    console.error('Error saving persona:', err);
    alert('Failed to save persona');
  } finally {
    saving.value = false;
  }
};

const saveAdminPhone = () => {
  // Save current phone
  localStorage.setItem('adminPhone', adminPhone.value);

  // Add to saved numbers if not already there and if valid
  if (adminPhone.value && !savedPhoneNumbers.value.includes(adminPhone.value)) {
    savedPhoneNumbers.value.push(adminPhone.value);
    localStorage.setItem('savedPhoneNumbers', JSON.stringify(savedPhoneNumbers.value));
  }
};

const loadAdminPhone = () => {
  adminPhone.value = localStorage.getItem('adminPhone') || '';
  const saved = localStorage.getItem('savedPhoneNumbers');
  if (saved) {
    try {
      savedPhoneNumbers.value = JSON.parse(saved);
    } catch (e) {
      savedPhoneNumbers.value = [];
    }
  }
};

// Recent Calls
const fetchRecentCalls = async () => {
  loadingCalls.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${LOG_QUERY_URL}/api/admin/dashboard/recent-calls?limit=8`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch calls');
    const data = await response.json();
    recentCalls.value = data.calls || [];
  } catch (err) {
    console.error('Error fetching recent calls:', err);
  } finally {
    loadingCalls.value = false;
  }
};

const toggleCallExpand = (callId) => {
  expandedCallId.value = expandedCallId.value === callId ? null : callId;
};

const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const getStatusColor = (status) => {
  const colors = {
    'completed': 'emerald',
    'in-progress': 'amber',
    'initiating': 'cyan',
    'failed': 'red'
  };
  return colors[status] || 'gray';
};

// Call Context Methods
const selectScenario = (scenario) => {
  if (selectedScenario.value?.id === scenario.id) {
    // Deselect if already selected
    selectedScenario.value = null;
    callPretext.value = '';
    customInstructions.value = '';
  } else {
    selectedScenario.value = scenario;
    callPretext.value = scenario.pretext;
    customInstructions.value = scenario.instructions;
  }
};

// Relationship Context Methods
const selectRelationshipType = (rel) => {
  if (relationshipType.value?.id === rel.id) {
    // Clicking same type again clears selection
    relationshipType.value = null;
    relationshipPrompt.value = '';
  } else {
    relationshipType.value = rel;
    // Always update prompt when selecting a new relationship type
    relationshipPrompt.value = rel.prompt;
  }
};

// User Knowledge Methods (Layer 4)
// Note: Facts are saved when user clicks the main Save button (savePersona)
const addFact = () => {
  if (!newFactContent.value.trim()) return;
  userFacts.value.push({
    category: newFactCategory.value,
    content: newFactContent.value.trim(),
    importance: 'medium',
    timestamp: new Date().toISOString()
  });
  newFactContent.value = '';
  // hasChanges will now be true, user must click Save button
};

const removeFact = (idx) => {
  userFacts.value.splice(idx, 1);
  // hasChanges will now be true, user must click Save button
};

const addPresetFact = (preset) => {
  // Map preset to category
  const categoryMap = {
    'Works in tech': 'work',
    'Has a dog': 'personal',
    'Stressed about work': 'work',
    'Recently moved': 'personal',
    'In a relationship': 'relationships',
    'Health-conscious': 'health',
  };
  userFacts.value.push({
    category: categoryMap[preset] || 'personal',
    content: preset,
    importance: 'medium',
    timestamp: new Date().toISOString()
  });
  // hasChanges will now be true, user must click Save button
};

const getCategoryColor = (category) => {
  const colors = {
    'personal': 'cat-personal',
    'work': 'cat-work',
    'interests': 'cat-interests',
    'goals': 'cat-goals',
    'health': 'cat-health',
    'relationships': 'cat-relationships',
  };
  return colors[category] || 'cat-personal';
};

// Token estimation (rough approximation: ~4 chars per token)
const estimatedTokens = computed(() => {
  let total = 0;

  // Core prompt
  total += Math.ceil((editedPrompt.value?.length || 0) / 4);

  if (previewMode.value === 'full') {
    // Call context
    total += Math.ceil((callPretext.value?.length || 0) / 4);
    total += Math.ceil((customInstructions.value?.length || 0) / 4);

    // Relationship context
    total += Math.ceil((relationshipPrompt.value?.length || 0) / 4);
    if (relationshipType.value) total += 20;

    // User facts
    userFacts.value.forEach(fact => {
      total += Math.ceil(fact.content.length / 4) + 5;
    });

    // Phone guidelines (fixed ~60 tokens)
    total += 60;
  }

  return total;
});

// Copy compiled prompt to clipboard
const copyPromptToClipboard = async () => {
  let prompt = '';

  if (previewMode.value === 'raw') {
    prompt = editedPrompt.value;
  } else {
    // Build full compiled prompt
    prompt = editedPrompt.value + '\n\n';

    if (callPretext.value || customInstructions.value) {
      prompt += '=== CALL CONTEXT ===\n';
      if (callPretext.value) prompt += `Call pretext: ${callPretext.value}\n`;
      if (customInstructions.value) prompt += `Instructions: ${customInstructions.value}\n`;
      prompt += '\n';
    }

    if (relationshipType.value || relationshipPrompt.value) {
      prompt += '=== RELATIONSHIP CONTEXT ===\n';
      if (relationshipType.value) {
        prompt += `Relationship: ${relationshipType.value.name} (${relationshipDuration.value} months)\n`;
      }
      if (relationshipPrompt.value) prompt += `${relationshipPrompt.value}\n`;
      prompt += '\n';
    }

    if (userFacts.value.length > 0) {
      prompt += '=== WHAT YOU KNOW ABOUT THIS USER ===\n';
      userFacts.value.forEach(fact => {
        prompt += `• ${fact.content}\n`;
      });
      prompt += '\n';
    }

    prompt += '=== PHONE CALL FORMAT ===\n';
    prompt += 'You are on a LIVE PHONE CALL with the user right now. This is a real-time voice conversation over the phone.\n';
    prompt += '• Keep responses brief and natural (1-2 short sentences max)\n';
    prompt += '• Respond to what the user actually says - stay grounded\n';
    prompt += '• Speak conversationally - no stage directions, asterisks, or "(laughs)"\n';
    prompt += '• Don\'t narrate actions - just speak naturally\n';
    prompt += '• If something\'s unclear, just ask!\n';
    prompt += '• Remember: they hear your voice, not text\n';
  }

  try {
    await navigator.clipboard.writeText(prompt);
    // Brief visual feedback could be added here
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

// Browser Voice
const toggleBrowserVoice = async () => {
  if (isBrowserVoiceActive.value) {
    stopBrowserVoice();
  } else {
    await startBrowserVoice();
  }
};

const startBrowserVoice = async () => {
  if (!selectedPersona.value) return;

  try {
    connectionStatus.value = 'connecting';
    // Clear transcript from previous session
    transcript.value = [];

    // Get microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: selectedAudioInput.value ? { exact: selectedAudioInput.value } : undefined,
        sampleRate: audioConfig.value.sampleRate,
        channelCount: audioConfig.value.channelCount,
        echoCancellation: audioConfig.value.echoCancellation,
        noiseSuppression: audioConfig.value.noiseSuppression,
        autoGainControl: audioConfig.value.autoGainControl
      }
    });

    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

    // Connect WebSocket
    const token = localStorage.getItem('adminToken');
    voiceWebSocket = new WebSocket(`${VOICE_WS_URL}/browser-stream`);

    voiceWebSocket.onopen = async () => {
      console.log('[Browser Voice] WebSocket connected');
      connectionStatus.value = 'connecting';
      isBrowserVoiceActive.value = true;

      // Build smart memory context from UI inputs
      let smartMemoryContext = '';
      if (relationshipType.value) {
        smartMemoryContext += `RELATIONSHIP: ${relationshipType.value.name} (${relationshipDuration.value} months).\n`;
        smartMemoryContext += `${relationshipType.value.prompt}\n`;
      }
      if (relationshipPrompt.value) {
        smartMemoryContext += `${relationshipPrompt.value}\n`;
      }
      if (userFacts.value.length > 0) {
        smartMemoryContext += '\nWHAT YOU KNOW ABOUT THIS USER:\n';
        userFacts.value.forEach(fact => {
          smartMemoryContext += `• ${fact.content}\n`;
        });
      }

      // Build call pretext from UI inputs
      let callPretextContext = callPretext.value || '';
      if (customInstructions.value) {
        callPretextContext += (callPretextContext ? '\n' : '') + customInstructions.value;
      }

      // Send init message with token (required by browser-stream handler)
      // Decode admin ID from JWT token for Layer 4 memory matching
      const token = localStorage.getItem('adminToken');
      let adminId = 'admin';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          adminId = payload.sub || payload.id || payload.adminId || 'admin';
        } catch (e) {
          console.warn('[Browser Voice] Could not decode admin ID from token');
        }
      }

      const initMsg = {
        type: 'init',
        token: token,
        persona_id: selectedPersona.value.id,
        admin_id: adminId,
        overrides: {
          core_system_prompt: editedPrompt.value,
          temperature: temperature.value,
          max_tokens: maxTokens.value,
          max_call_duration: maxCallDuration.value,
          default_voice_id: voiceId.value
        },
        // New context fields for testing
        smart_memory: smartMemoryContext || null,
        call_pretext: callPretextContext || null
      };
      console.log('[Browser Voice] Sending init message:', initMsg);
      voiceWebSocket.send(JSON.stringify(initMsg));

      // Set timeout - if no session_start in 10 seconds, show error
      sessionStartTimeout = setTimeout(() => {
        if (connectionStatus.value === 'connecting') {
          console.error('[Browser Voice] Session start timeout - pipeline failed to initialize');
          connectionStatus.value = 'error';
          alert('Voice pipeline timeout. The service may be down or experiencing issues. Please check the server logs and try again.');
          stopBrowserVoice();
        }
      }, 10000);

      // DON'T start audio capture yet - wait for session_start message
      console.log('[Browser Voice] Waiting for session_start before capturing audio...');
    };

    voiceWebSocket.onmessage = (event) => {
      // Check if this is binary data or text/JSON
      if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
        // Binary audio data - ignore for now (we use JSON audio messages)
        console.log('[Browser Voice] Received binary data (unexpected)');
        return;
      }

      // Try to parse as JSON
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'session_start') {
          // Pipeline is ready! Clear timeout
          if (sessionStartTimeout) {
            clearTimeout(sessionStartTimeout);
            sessionStartTimeout = null;
          }
          connectionStatus.value = 'connected';
          console.log('[Browser Voice] Session started:', msg.session_id);
          console.log('[Browser Voice] isBrowserVoiceActive is:', isBrowserVoiceActive.value);
          console.log('[Browser Voice] Transcript panel should be visible:', isBrowserVoiceActive.value || isTwilioCallActive.value);

          // NOW start audio capture (backend is ready)
          console.log('[Browser Voice] Starting audio capture now that pipeline is ready...');
          startAudioCapture().catch(err => {
            console.error('[Browser Voice] Failed to start audio capture:', err);
            alert('Failed to start audio capture. Please refresh and try again.');
            stopBrowserVoice();
          });
        } else if (msg.type === 'transcript') {
          console.log('[Browser Voice] Transcript received:', msg.text);
          transcript.value.push({ role: 'user', text: msg.text });
        } else if (msg.type === 'response_text') {
          console.log('[Browser Voice] AI response:', msg.text);
          transcript.value.push({ role: 'assistant', text: msg.text });
        } else if (msg.type === 'audio') {
          // Play audio response - backend sends base64 MP3 in msg.audio
          playAudioResponse(msg.audio);
        } else if (msg.type === 'interrupt') {
          // Backend VAD detected user speaking - stop AI audio playback
          console.log('[Browser Voice] Backend interrupt signal - stopping AI audio');
          stopAudioPlayback();
        } else if (msg.type === 'error') {
          // Clear timeout on error
          if (sessionStartTimeout) {
            clearTimeout(sessionStartTimeout);
            sessionStartTimeout = null;
          }
          console.error('[Browser Voice] Error from server:', msg.message);
          if (msg.details) {
            console.error('[Browser Voice] Error details:', msg.details);
          }
          connectionStatus.value = 'error';
          alert(`Voice pipeline error: ${msg.message}`);
          stopBrowserVoice();
        } else {
          console.log('[Browser Voice] Unknown message type:', msg.type, msg);
        }
      } catch (e) {
        // JSON parse failed - this shouldn't happen with proper backend
        console.error('[Browser Voice] Failed to parse message:', e, 'Raw data:', event.data);
      }
    };

    voiceWebSocket.onclose = (event) => {
      console.log('[Browser Voice] WebSocket closed. Code:', event.code, 'Reason:', event.reason, 'Was clean:', event.wasClean);
      console.log('[Browser Voice] isBrowserVoiceActive before close:', isBrowserVoiceActive.value);
      connectionStatus.value = 'idle';
      isBrowserVoiceActive.value = false;
      stopAudioCapture();
      console.log('[Browser Voice] Cleanup complete after close');
    };

    voiceWebSocket.onerror = (err) => {
      console.error('[Browser Voice] WebSocket error:', err);
      connectionStatus.value = 'error';
      stopBrowserVoice();
    };

  } catch (err) {
    console.error('Error starting browser voice:', err);
    connectionStatus.value = 'error';
    alert('Failed to access microphone');
  }
};

const stopBrowserVoice = () => {
  console.log('[Browser Voice] stopBrowserVoice called');
  // Clear session start timeout if still pending
  if (sessionStartTimeout) {
    clearTimeout(sessionStartTimeout);
    sessionStartTimeout = null;
  }
  if (voiceWebSocket) {
    voiceWebSocket.close();
    voiceWebSocket = null;
  }
  stopAudioCapture();
  stopAudioPlayback(); // Clean up Web Audio API
  connectionStatus.value = 'idle';
  isBrowserVoiceActive.value = false;
  console.log('[Browser Voice] stopBrowserVoice complete');
};

const hangUpActiveCall = () => {
  if (isBrowserVoiceActive.value) {
    stopBrowserVoice();
  }
  if (isTwilioCallActive.value) {
    isTwilioCallActive.value = false;
    // Note: Twilio call hangup would happen server-side
    // The call status will update when the call ends
  }
  transcript.value = [];
};

const handleLogout = () => {
  // Clear admin token
  localStorage.removeItem('adminToken');
  // Navigate to login
  router.push('/admin/login');
};

const startAudioCapture = async () => {
  if (!audioContext || !mediaStream || !voiceWebSocket) return;

  try {
    // Load AudioWorklet module (modern replacement for ScriptProcessor)
    // Use inline Blob URL to avoid deployment path issues
    const workletCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this.silenceFrames = 0;
          this.voiceDetected = false;
        }

        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            if (channelData && channelData.length > 0) {
              // Convert to PCM16
              const pcm16 = new Int16Array(channelData.length);
              let sumSquares = 0;

              for (let i = 0; i < channelData.length; i++) {
                const sample = Math.max(-1, Math.min(1, channelData[i]));
                pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                sumSquares += sample * sample;
              }

              // Calculate RMS energy for voice detection
              const rms = Math.sqrt(sumSquares / channelData.length);
              const VOICE_THRESHOLD = 0.01; // Adjust based on testing

              // Detect voice activity
              if (rms > VOICE_THRESHOLD) {
                if (!this.voiceDetected) {
                  this.voiceDetected = true;
                  this.port.postMessage({ type: 'voice_detected' });
                }
                this.silenceFrames = 0;
              } else {
                this.silenceFrames++;
                // Reset after 500ms of silence (assuming 128 samples @ 16kHz = ~8ms per frame)
                if (this.silenceFrames > 60 && this.voiceDetected) {
                  this.voiceDetected = false;
                }
              }

              // Send PCM data
              this.port.postMessage({ type: 'audio', data: pcm16.buffer });
            }
          }
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;

    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);

    await audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl); // Clean up immediately after loading

    const source = audioContext.createMediaStreamSource(mediaStream);
    const workletNode = new AudioWorkletNode(audioContext, 'audio-processor');

    // Listen for processed audio data from the worklet
    workletNode.port.onmessage = (event) => {
      const message = event.data;

      // Handle voice detection event (for UI feedback only - backend VAD handles interruptions)
      if (message.type === 'voice_detected') {
        // Just log for debugging - don't interrupt here
        // The backend Silero VAD is much smarter and will handle interruptions
        console.log('[Browser Voice] Voice activity detected (forwarding to backend VAD)');
      }
      // Handle audio data - send to backend for VAD processing
      else if (message.type === 'audio' && message.data) {
        if (voiceWebSocket?.readyState === WebSocket.OPEN) {
          voiceWebSocket.send(message.data); // Send PCM16 ArrayBuffer to backend
        }
      }
    };

    // Connect the audio graph
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    audioWorklet = { source, workletNode };
    console.log('[Browser Voice] AudioWorklet started successfully');
  } catch (err) {
    console.error('[Browser Voice] Failed to start AudioWorklet:', err);
    // Fall back to showing error to user
    alert('Failed to initialize audio processing. Please refresh and try again.');
    stopBrowserVoice();
  }
};

const stopAudioCapture = () => {
  if (audioWorklet) {
    try {
      audioWorklet.source.disconnect();
      audioWorklet.workletNode.disconnect();
      audioWorklet.workletNode.port.close();
    } catch (err) {
      console.warn('[Browser Voice] Error disconnecting audio worklet:', err);
    }
    audioWorklet = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  console.log('[Browser Voice] Audio capture stopped');
};

// Web Audio API for seamless playback (no gaps)
let playbackAudioContext = null;
let nextStartTime = 0;
let scheduledSources = [];
let lastScheduledEndTime = 0;
let playbackCheckInterval = null;

const playAudioResponse = async (audioData) => {
  try {
    console.log('[Browser Voice] Received audio chunk, length:', audioData?.length || 0);

    if (!audioData) {
      console.error('[Browser Voice] No audio data provided');
      return;
    }

    // Initialize AudioContext on first chunk
    if (!playbackAudioContext) {
      playbackAudioContext = new AudioContext();
      nextStartTime = playbackAudioContext.currentTime;
      isAISpeaking = true;
      console.log('[Browser Voice] AudioContext initialized for playback');

      // Start monitoring playback state
      playbackCheckInterval = setInterval(() => {
        if (playbackAudioContext && playbackAudioContext.currentTime >= lastScheduledEndTime) {
          // All scheduled audio has finished
          if (scheduledSources.length === 0) {
            isAISpeaking = false;
            console.log('[Browser Voice] All audio playback complete');
          }
        }
      }, 100);
    }

    // Decode base64 MP3 to ArrayBuffer
    const binaryString = atob(audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Decode MP3 to PCM audio buffer
    const audioBuffer = await playbackAudioContext.decodeAudioData(bytes.buffer);

    // Create buffer source
    const source = playbackAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(playbackAudioContext.destination);

    // Schedule playback at precise time (seamless continuation)
    const scheduledTime = Math.max(nextStartTime, playbackAudioContext.currentTime);
    source.start(scheduledTime);

    // Track for interruption
    scheduledSources.push(source);
    source.onended = () => {
      const index = scheduledSources.indexOf(source);
      if (index > -1) scheduledSources.splice(index, 1);
    };

    // Update next start time for seamless playback
    nextStartTime = scheduledTime + audioBuffer.duration;
    lastScheduledEndTime = nextStartTime;

    console.log(`[Browser Voice] Scheduled chunk at ${scheduledTime.toFixed(3)}s, duration ${audioBuffer.duration.toFixed(3)}s, next at ${nextStartTime.toFixed(3)}s`);

  } catch (err) {
    console.error('[Browser Voice] Audio decode/playback error:', err);
  }
};

// Stop AI audio playback immediately (for interruptions)
const stopAudioPlayback = () => {
  console.log('[Browser Voice] Interrupt detected, stopping audio...');

  // Stop all scheduled sources
  scheduledSources.forEach(source => {
    try {
      source.stop();
    } catch (e) {
      // Source may have already stopped
    }
  });
  scheduledSources = [];

  // Clear playback interval
  if (playbackCheckInterval) {
    clearInterval(playbackCheckInterval);
    playbackCheckInterval = null;
  }

  // Close AudioContext
  if (playbackAudioContext) {
    playbackAudioContext.close();
    playbackAudioContext = null;
  }

  // Reset timing
  nextStartTime = 0;
  lastScheduledEndTime = 0;
  isAISpeaking = false;

  console.log('[Browser Voice] Audio playback stopped');
};

// Twilio Call
const triggerTwilioCall = async () => {
  if (!selectedPersona.value || !adminPhone.value || isTwilioCallActive.value) return;

  try {
    isTwilioCallActive.value = true;
    transcript.value = [];

    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_GATEWAY_URL}/api/calls/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: adminPhone.value,
        personaId: selectedPersona.value.id,
        userId: 'demo_user' // Use demo mode for free testing calls
      })
    });

    if (!response.ok) throw new Error('Failed to trigger call');

    const data = await response.json();
    console.log('Call triggered:', data);

    // Auto-reset after timeout (calls typically last a few minutes)
    setTimeout(() => {
      isTwilioCallActive.value = false;
    }, 300000); // 5 min timeout

  } catch (err) {
    console.error('Error triggering call:', err);
    alert('Failed to trigger call');
    isTwilioCallActive.value = false;
  }
};

// Audio Settings Methods
const enumerateAudioDevices = async () => {
  try {
    // Request mic permission first to get device labels
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    audioInputDevices.value = devices.filter(d => d.kind === 'audioinput');
    audioOutputDevices.value = devices.filter(d => d.kind === 'audiooutput');

    // Load saved preferences
    selectedAudioInput.value = localStorage.getItem('preferredAudioInput') || '';
    selectedAudioOutput.value = localStorage.getItem('preferredAudioOutput') || '';

    // Check mic permission status
    const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
    micPermission.value = permissionStatus.state;

    permissionStatus.onchange = () => {
      micPermission.value = permissionStatus.state;
    };
  } catch (err) {
    console.error('Error enumerating audio devices:', err);
    micPermission.value = 'denied';
  }
};

const handleAudioInputChange = () => {
  localStorage.setItem('preferredAudioInput', selectedAudioInput.value);
  // If currently in a call, we'd need to restart the audio stream
  if (isBrowserVoiceActive.value) {
    alert('Audio input changed. Please stop and restart the browser voice to apply changes.');
  }
};

const handleAudioOutputChange = () => {
  localStorage.setItem('preferredAudioOutput', selectedAudioOutput.value);
};

const requestMicPermission = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await enumerateAudioDevices();
  } catch (err) {
    console.error('Microphone permission denied:', err);
    alert('Microphone permission denied. Please enable it in your browser settings.');
  }
};

const testAudio = async () => {
  testingAudio.value = true;
  try {
    const constraints = {
      audio: {
        deviceId: selectedAudioInput.value ? { exact: selectedAudioInput.value } : undefined,
        sampleRate: audioConfig.value.sampleRate,
        channelCount: audioConfig.value.channelCount,
        echoCancellation: audioConfig.value.echoCancellation,
        noiseSuppression: audioConfig.value.noiseSuppression,
        autoGainControl: audioConfig.value.autoGainControl
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: audioConfig.value.sampleRate });
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Monitor audio level for 2 seconds
    let maxLevel = 0;
    const startTime = Date.now();
    const checkLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      maxLevel = Math.max(maxLevel, average);

      if (Date.now() - startTime < 2000) {
        requestAnimationFrame(checkLevel);
      } else {
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();

        if (maxLevel > 10) {
          alert(`✅ Microphone working! Detected audio level: ${Math.round(maxLevel)}/255\n\nSpeak into your mic while testing.`);
        } else {
          alert('⚠️ No audio detected. Check if your microphone is muted or speak louder.');
        }
        testingAudio.value = false;
      }
    };

    alert('🎤 Testing microphone... Please speak for 2 seconds.');
    checkLevel();

  } catch (err) {
    console.error('Error testing audio:', err);
    alert('Failed to test microphone: ' + err.message);
    testingAudio.value = false;
  }
};

// Lifecycle
onMounted(() => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    router.push('/admin/login');
    return;
  }
  fetchPersonas();
  fetchAllUsers(); // Load users for impersonation dropdown
  loadAdminPhone();
  fetchRecentCalls();
  enumerateAudioDevices();
  loadExtractionSettings();
  fetchCerebrasModels();
});

onUnmounted(() => {
  stopBrowserVoice();
});
</script>

<style scoped>
@reference "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');

/* Grain overlay texture */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Console Panel Styles */
.console-panel {
  @apply bg-[#131318] border border-[#2a2a2e] rounded-xl overflow-hidden;
  box-shadow:
    0 4px 20px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.02);
}

.console-header {
  @apply flex items-center justify-between px-5 py-4 bg-[#1a1a1e] border-b border-[#2a2a2e];
}

.console-body {
  @apply p-5;
}

/* LED Indicator */
.led-indicator {
  @apply w-2 h-2 rounded-full;
  box-shadow: 0 0 8px currentColor;
}

/* Prompt Textarea */
.prompt-textarea {
  @apply w-full bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg p-4 font-['JetBrains_Mono',monospace] text-sm text-[#ccc] leading-relaxed resize-none transition-all duration-300;
}

.prompt-textarea:focus {
  @apply border-amber-500/50 outline-none;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.prompt-textarea:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Preview Panel */
.prompt-preview {
  @apply bg-[#0d0d0f] rounded-lg p-4 border border-[#1a1a1e];
}

/* Slider Track */
.slider-track {
  @apply appearance-none bg-transparent cursor-pointer relative z-10;
  height: 8px;
}

.slider-track::-webkit-slider-thumb {
  @apply appearance-none w-5 h-5 rounded-full bg-amber-500 cursor-pointer;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4), 0 0 0 2px #0d0d0f;
}

.slider-track::-moz-range-thumb {
  @apply w-5 h-5 rounded-full bg-amber-500 cursor-pointer border-none;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4), 0 0 0 2px #0d0d0f;
}

/* Call Button HUD Styles */
.call-button-hud {
  @apply relative w-28 h-28 flex items-center justify-center cursor-pointer transition-transform duration-200;
}

.call-button-hud:hover:not(.disabled) {
  @apply scale-105;
}

.call-button-hud:active:not(.disabled) {
  @apply scale-95;
}

.call-button-hud.disabled {
  @apply opacity-40 cursor-not-allowed;
}

/* Select dropdown arrow */
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23666'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

/* Scenario Chip Styles */
.scenario-chip {
  @apply flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#888] transition-all duration-200 hover:border-rose-500/30 hover:text-rose-400;
}

.scenario-chip.active {
  @apply bg-rose-500/10 border-rose-500/50 text-rose-400;
  box-shadow: 0 0 15px rgba(244, 63, 94, 0.15);
}

.scenario-icon {
  @apply text-base;
}

.scenario-label {
  @apply font-mono text-[10px] uppercase tracking-wider;
}

/* Relationship Chip Styles */
.relationship-chip {
  @apply flex flex-col items-center gap-1 px-3 py-3 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#888] transition-all duration-200 hover:border-violet-500/30 hover:text-violet-400;
}

.relationship-chip.active {
  @apply bg-violet-500/10 border-violet-500/50 text-violet-400;
  box-shadow: 0 0 15px rgba(139, 92, 246, 0.15);
}

/* Violet Slider Track */
.slider-track-violet {
  @apply appearance-none bg-transparent cursor-pointer relative z-10;
  height: 8px;
}

.slider-track-violet::-webkit-slider-thumb {
  @apply appearance-none w-5 h-5 rounded-full bg-violet-500 cursor-pointer;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 2px #0d0d0f;
}

.slider-track-violet::-moz-range-thumb {
  @apply w-5 h-5 rounded-full bg-violet-500 cursor-pointer border-none;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4), 0 0 0 2px #0d0d0f;
}

/* Fact Card Styles */
.fact-card {
  @apply bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-3 py-2 transition-colors hover:border-cyan-500/30;
}

.fact-category {
  @apply font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded;
}

.cat-personal { @apply bg-blue-500/20 text-blue-400; }
.cat-work { @apply bg-amber-500/20 text-amber-400; }
.cat-interests { @apply bg-emerald-500/20 text-emerald-400; }
.cat-goals { @apply bg-violet-500/20 text-violet-400; }
.cat-health { @apply bg-rose-500/20 text-rose-400; }
.cat-relationships { @apply bg-pink-500/20 text-pink-400; }

/* Preview Mode Toggle */
.preview-mode-btn {
  @apply px-4 py-2 rounded-md font-mono text-[#666] transition-all duration-200;
}

.preview-mode-btn.active {
  @apply bg-[#1a1a1e] text-emerald-400;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
}

.preview-mode-btn:not(.active):hover {
  @apply text-[#888];
}

/* Prompt Layer Styles */
.prompt-layer {
  @apply mb-3 pb-3 transition-opacity duration-200;
}

.prompt-layer.layer-inactive {
  @apply opacity-50;
}

.prompt-layer.layer-active {
  @apply opacity-100;
}

.layer-header {
  @apply flex items-center gap-2 mb-2;
}

.layer-number {
  @apply w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold;
}

.layer-divider {
  @apply border-t border-[#2a2a2e]/50 my-3;
}
</style>
