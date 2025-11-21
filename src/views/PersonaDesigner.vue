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

    <!-- COMMAND HUD - Call Control Panel -->
    <header class="relative z-50 pt-6 pb-4">
      <div class="max-w-7xl mx-auto px-6">
        <!-- Title Bar -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <router-link to="/admin/dashboard" class="text-[#666] hover:text-amber-500 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h1 class="font-['JetBrains_Mono',monospace] text-lg tracking-[0.2em] uppercase text-[#666]">
              Persona Designer
            </h1>
          </div>
          <div class="flex items-center gap-3">
            <!-- Status LED -->
            <div class="flex items-center gap-2 bg-[#1a1a1e] px-4 py-2 rounded-lg border border-[#2a2a2e]">
              <div class="w-2 h-2 rounded-full" :class="connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]' : connectionStatus === 'connecting' ? 'bg-amber-500 animate-pulse' : 'bg-[#444]'"></div>
              <span class="font-mono text-xs uppercase tracking-wider" :class="connectionStatus === 'connected' ? 'text-emerald-400' : 'text-[#666]'">
                {{ connectionStatus }}
              </span>
            </div>
          </div>
        </div>

        <!-- CONTROL HUD - The Big Buttons -->
        <div class="flex items-center justify-center gap-8 mb-8">
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
        </div>

        <!-- Phone Number Input (compact, below buttons) -->
        <div class="flex items-center justify-center gap-4">
          <div class="flex items-center gap-2 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg px-4 py-2">
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

          <!-- AI Parameters -->
          <div class="console-panel">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-cyan-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">AI Parameters</span>
              </div>
            </div>
            <div class="console-body space-y-6">
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
            </div>
          </div>

          <!-- Save Button -->
          <button
            @click="savePersona"
            :disabled="!selectedPersona || saving"
            class="w-full py-4 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 border"
            :class="saving
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 cursor-wait'
              : hasChanges
                ? 'bg-amber-500 border-amber-500 text-[#0d0d0f] hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                : 'bg-[#1a1a1e] border-[#2a2a2e] text-[#555] cursor-not-allowed'"
          >
            {{ saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes' }}
          </button>
        </div>

        <!-- RIGHT: Preview Panel -->
        <div class="space-y-6">
          <!-- Compiled Prompt Preview -->
          <div class="console-panel h-full">
            <div class="console-header">
              <div class="flex items-center gap-3">
                <div class="led-indicator bg-emerald-500"></div>
                <span class="font-mono text-xs uppercase tracking-[0.15em]">Compiled Final Prompt</span>
              </div>
              <span class="font-mono text-[10px] text-[#555]">PREVIEW</span>
            </div>
            <div class="console-body">
              <div class="prompt-preview font-mono text-xs leading-relaxed overflow-auto max-h-[600px]">
                <!-- Core Prompt Section -->
                <div class="mb-4">
                  <div class="text-amber-500/70 mb-1 uppercase tracking-wider text-[10px]">// CORE SYSTEM PROMPT</div>
                  <div class="text-[#aaa] whitespace-pre-wrap">{{ editedPrompt || '(No prompt set)' }}</div>
                </div>

                <div class="border-t border-[#2a2a2e] my-4"></div>

                <!-- Memory Context Section (Placeholder) -->
                <div class="mb-4">
                  <div class="text-cyan-500/70 mb-1 uppercase tracking-wider text-[10px]">// MEMORY CONTEXT (SmartMemory)</div>
                  <div class="text-[#666] italic">
                    <!-- Placeholder until SmartMemory integration -->
                    [Memory context will be injected here during calls]
                    <br/>• User preferences from past conversations
                    <br/>• Recent interaction summaries
                    <br/>• Relationship context
                  </div>
                </div>

                <div class="border-t border-[#2a2a2e] my-4"></div>

                <!-- Conversation History Section -->
                <div>
                  <div class="text-emerald-500/70 mb-1 uppercase tracking-wider text-[10px]">// CONVERSATION HISTORY</div>
                  <div class="text-[#666] italic">
                    [Conversation turns appended here in real-time]
                    <br/>User: "Hello!"
                    <br/>Assistant: "Hey! Great to hear from you..."
                  </div>
                </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// API URLs
const LOG_QUERY_URL = 'https://logs.ai-tools-marketplace.io';
const VOICE_WS_URL = 'wss://voice.ai-tools-marketplace.io';

// State
const personas = ref([]);
const selectedPersona = ref(null);
const loadingPersonas = ref(true);
const saving = ref(false);

// Editable fields
const editedPrompt = ref('');
const temperature = ref(0.7);
const maxTokens = ref(150);
const voiceId = ref('');
const adminPhone = ref('');

// UI State
const expandPromptEditor = ref(false);
const connectionStatus = ref('idle');

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

// Voice IDs
const availableVoices = [
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Brad (Adam)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Bella)' },
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
];

// Computed
const hasChanges = computed(() => {
  if (!selectedPersona.value) return false;
  return (
    editedPrompt.value !== selectedPersona.value.core_system_prompt ||
    temperature.value !== parseFloat(selectedPersona.value.temperature || 0.7) ||
    maxTokens.value !== parseInt(selectedPersona.value.max_tokens || 150) ||
    voiceId.value !== (selectedPersona.value.default_voice_id || '')
  );
});

// Methods
const fetchPersonas = async () => {
  loadingPersonas.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${LOG_QUERY_URL}/api/admin/personas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch personas');
    const data = await response.json();
    personas.value = data.personas || data || [];
  } catch (err) {
    console.error('Error fetching personas:', err);
  } finally {
    loadingPersonas.value = false;
  }
};

const selectPersona = (persona) => {
  selectedPersona.value = persona;
  editedPrompt.value = persona.core_system_prompt || '';
  temperature.value = parseFloat(persona.temperature || 0.7);
  maxTokens.value = parseInt(persona.max_tokens || 150);
  voiceId.value = persona.default_voice_id || '';
};

const savePersona = async () => {
  if (!selectedPersona.value || saving.value) return;
  saving.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${LOG_QUERY_URL}/api/admin/personas/${selectedPersona.value.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        core_system_prompt: editedPrompt.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        default_voice_id: voiceId.value
      })
    });
    if (!response.ok) throw new Error('Failed to save persona');

    // Update local state
    selectedPersona.value.core_system_prompt = editedPrompt.value;
    selectedPersona.value.temperature = temperature.value;
    selectedPersona.value.max_tokens = maxTokens.value;
    selectedPersona.value.default_voice_id = voiceId.value;

    // Update in personas array
    const idx = personas.value.findIndex(p => p.id === selectedPersona.value.id);
    if (idx !== -1) personas.value[idx] = { ...selectedPersona.value };

  } catch (err) {
    console.error('Error saving persona:', err);
    alert('Failed to save persona');
  } finally {
    saving.value = false;
  }
};

const saveAdminPhone = () => {
  localStorage.setItem('adminPhone', adminPhone.value);
};

const loadAdminPhone = () => {
  adminPhone.value = localStorage.getItem('adminPhone') || '';
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

    // Get microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

    // Connect WebSocket
    const token = localStorage.getItem('adminToken');
    voiceWebSocket = new WebSocket(`${VOICE_WS_URL}/browser-stream`);

    voiceWebSocket.onopen = () => {
      connectionStatus.value = 'connected';
      isBrowserVoiceActive.value = true;

      // Send config
      voiceWebSocket.send(JSON.stringify({
        type: 'config',
        persona_id: selectedPersona.value.id,
        admin_id: 'admin',
        system_prompt: editedPrompt.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        voice_id: voiceId.value
      }));

      // Start sending audio
      startAudioCapture();
    };

    voiceWebSocket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'transcript') {
          transcript.value.push({ role: msg.role, text: msg.text });
        } else if (msg.type === 'audio') {
          // Play audio response
          playAudioResponse(msg.data);
        }
      } catch (e) {
        // Binary audio data
        playAudioResponse(event.data);
      }
    };

    voiceWebSocket.onclose = () => {
      connectionStatus.value = 'idle';
      isBrowserVoiceActive.value = false;
      stopAudioCapture();
    };

    voiceWebSocket.onerror = (err) => {
      console.error('WebSocket error:', err);
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
  if (voiceWebSocket) {
    voiceWebSocket.close();
    voiceWebSocket = null;
  }
  stopAudioCapture();
  connectionStatus.value = 'idle';
  isBrowserVoiceActive.value = false;
};

const startAudioCapture = () => {
  if (!audioContext || !mediaStream || !voiceWebSocket) return;

  const source = audioContext.createMediaStreamSource(mediaStream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (e) => {
    if (voiceWebSocket?.readyState === WebSocket.OPEN) {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
      }
      voiceWebSocket.send(pcm16.buffer);
    }
  };

  source.connect(processor);
  processor.connect(audioContext.destination);
  audioWorklet = { source, processor };
};

const stopAudioCapture = () => {
  if (audioWorklet) {
    audioWorklet.source.disconnect();
    audioWorklet.processor.disconnect();
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
};

const playAudioResponse = async (data) => {
  // Placeholder - would need proper audio decoding
  console.log('Received audio response');
};

// Twilio Call
const triggerTwilioCall = async () => {
  if (!selectedPersona.value || !adminPhone.value || isTwilioCallActive.value) return;

  try {
    isTwilioCallActive.value = true;
    transcript.value = [];

    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${LOG_QUERY_URL}/api/calls/trigger`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: adminPhone.value,
        persona_id: selectedPersona.value.id,
        system_prompt_override: editedPrompt.value,
        temperature: temperature.value,
        max_tokens: maxTokens.value,
        voice_id: voiceId.value
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

// Lifecycle
onMounted(() => {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    router.push('/admin/login');
    return;
  }
  fetchPersonas();
  loadAdminPhone();
  fetchRecentCalls();
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
</style>
