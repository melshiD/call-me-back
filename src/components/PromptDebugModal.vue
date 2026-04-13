<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[#0a0a0c]/98 backdrop-blur-sm" @click="$emit('close')"></div>

        <!-- Modal Container -->
        <div class="relative w-full max-w-5xl max-h-[90vh] flex flex-col">
          <!-- Card -->
          <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            <!-- Header - Fixed -->
            <div class="px-6 py-4 border-b border-[#2a2a2e] flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <h2 class="text-xl font-semibold text-[#e8e6e3]">Prompt Debug</h2>
                    <p class="text-sm text-[#666] mt-0.5">
                      <span v-if="debugData?.persona">{{ debugData.persona.name }}</span>
                      <span v-if="debugData?.targetUserId" class="text-cyan-400"> · User: {{ debugData.targetUserId.slice(0, 8) }}...</span>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <!-- Token Count Badge -->
                  <div v-if="debugData?.estimatedTokens" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0d0d0f] border border-[#2a2a2e]">
                    <span class="font-mono text-[10px] uppercase tracking-wider text-[#555]">Est. Tokens</span>
                    <span class="font-mono text-sm text-amber-400">{{ debugData.estimatedTokens.toLocaleString() }}</span>
                  </div>
                  <!-- Close Button -->
                  <button
                    @click="$emit('close')"
                    class="p-2 rounded-lg hover:bg-[#2a2a2e] transition-colors"
                  >
                    <svg class="w-5 h-5 text-[#666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="flex-1 flex items-center justify-center py-16">
              <div class="text-center">
                <div class="inline-block w-8 h-8 border-2 border-[#444] border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                <p class="font-mono text-sm text-[#666]">Loading prompt layers...</p>
              </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="flex-1 flex items-center justify-center py-16">
              <div class="text-center">
                <div class="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <svg class="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p class="text-red-400 font-mono text-sm">{{ error }}</p>
              </div>
            </div>

            <!-- Content -->
            <div v-else-if="debugData" class="flex-1 overflow-y-auto">
              <!-- View Toggle -->
              <div class="px-6 py-3 border-b border-[#2a2a2e] bg-[#151518] flex items-center gap-4">
                <span class="font-mono text-[10px] uppercase tracking-wider text-[#555]">View</span>
                <div class="flex rounded-lg overflow-hidden border border-[#2a2a2e]">
                  <button
                    @click="viewMode = 'layers'"
                    class="px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
                    :class="viewMode === 'layers' ? 'bg-cyan-500/20 text-cyan-400 border-r border-cyan-500/30' : 'bg-[#1a1a1e] text-[#666] hover:text-[#888] border-r border-[#2a2a2e]'"
                  >
                    Layers
                  </button>
                  <button
                    @click="viewMode = 'assembled'"
                    class="px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors"
                    :class="viewMode === 'assembled' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1a1a1e] text-[#666] hover:text-[#888]'"
                  >
                    Assembled
                  </button>
                </div>
                <!-- Copy Button -->
                <button
                  @click="copyToClipboard"
                  class="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a1a1e] border border-[#2a2a2e] hover:border-cyan-500/50 transition-colors group"
                >
                  <svg class="w-4 h-4 text-[#666] group-hover:text-cyan-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span class="font-mono text-[10px] uppercase tracking-wider text-[#666] group-hover:text-cyan-400">{{ copied ? 'Copied!' : 'Copy' }}</span>
                </button>
              </div>

              <!-- Layers View -->
              <div v-if="viewMode === 'layers'" class="p-6 space-y-4">
                <!-- Layer 1: Core Identity -->
                <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                  <button
                    @click="expandedLayers.layer1 = !expandedLayers.layer1"
                    class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                  >
                    <div class="flex items-center gap-4">
                      <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="font-mono text-sm text-amber-400">1</span>
                      </div>
                      <div>
                        <span class="text-base font-medium text-[#e8e6e3]">{{ debugData.layers.layer1_coreIdentity.name }}</span>
                        <p class="text-xs text-[#555] mt-0.5">{{ debugData.layers.layer1_coreIdentity.description }}</p>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-[#666] transition-transform duration-200"
                      :class="{ 'rotate-180': expandedLayers.layer1 }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Transition name="accordion">
                    <div v-if="expandedLayers.layer1" class="border-t border-[#2a2a2e]">
                      <div class="p-4 bg-[#0d0d0f]">
                        <div class="font-mono text-[10px] uppercase tracking-wider text-[#444] mb-2">{{ debugData.layers.layer1_coreIdentity.source }}</div>
                        <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-64 overflow-y-auto">{{ debugData.layers.layer1_coreIdentity.content }}</pre>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Layer 2: Call Context -->
                <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                  <button
                    @click="expandedLayers.layer2 = !expandedLayers.layer2"
                    class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                  >
                    <div class="flex items-center gap-4">
                      <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="font-mono text-sm text-emerald-400">2</span>
                      </div>
                      <div>
                        <span class="text-base font-medium text-[#e8e6e3]">{{ debugData.layers.layer2_callContext.name }}</span>
                        <p class="text-xs text-[#555] mt-0.5">{{ debugData.layers.layer2_callContext.description }}</p>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-[#666] transition-transform duration-200"
                      :class="{ 'rotate-180': expandedLayers.layer2 }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Transition name="accordion">
                    <div v-if="expandedLayers.layer2" class="border-t border-[#2a2a2e]">
                      <div class="p-4 bg-[#0d0d0f]">
                        <div class="font-mono text-[10px] uppercase tracking-wider text-[#444] mb-2">{{ debugData.layers.layer2_callContext.source }}</div>
                        <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-64 overflow-y-auto">{{ debugData.layers.layer2_callContext.content }}</pre>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Layer 3: Relationship -->
                <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                  <button
                    @click="expandedLayers.layer3 = !expandedLayers.layer3"
                    class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                  >
                    <div class="flex items-center gap-4">
                      <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="font-mono text-sm text-cyan-400">3</span>
                      </div>
                      <div>
                        <span class="text-base font-medium text-[#e8e6e3]">{{ debugData.layers.layer3_relationship.name }}</span>
                        <p class="text-xs text-[#555] mt-0.5">{{ debugData.layers.layer3_relationship.description }}</p>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-[#666] transition-transform duration-200"
                      :class="{ 'rotate-180': expandedLayers.layer3 }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Transition name="accordion">
                    <div v-if="expandedLayers.layer3" class="border-t border-[#2a2a2e]">
                      <div class="p-4 bg-[#0d0d0f]">
                        <div class="font-mono text-[10px] uppercase tracking-wider text-[#444] mb-2">{{ debugData.layers.layer3_relationship.source }}</div>
                        <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-64 overflow-y-auto">{{ debugData.layers.layer3_relationship.content }}</pre>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Layer 4: User Knowledge -->
                <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                  <button
                    @click="expandedLayers.layer4 = !expandedLayers.layer4"
                    class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                  >
                    <div class="flex items-center gap-4">
                      <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="font-mono text-sm text-purple-400">4</span>
                      </div>
                      <div>
                        <span class="text-base font-medium text-[#e8e6e3]">{{ debugData.layers.layer4_userKnowledge.name }}</span>
                        <p class="text-xs text-[#555] mt-0.5">{{ debugData.layers.layer4_userKnowledge.description }}</p>
                      </div>
                      <span v-if="debugData.layers.layer4_userKnowledge.factCount > 0" class="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 font-mono text-[10px] text-purple-400">
                        {{ debugData.layers.layer4_userKnowledge.factCount }} facts
                      </span>
                    </div>
                    <svg
                      class="w-5 h-5 text-[#666] transition-transform duration-200"
                      :class="{ 'rotate-180': expandedLayers.layer4 }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Transition name="accordion">
                    <div v-if="expandedLayers.layer4" class="border-t border-[#2a2a2e]">
                      <div class="p-4 bg-[#0d0d0f]">
                        <div class="font-mono text-[10px] uppercase tracking-wider text-[#444] mb-2">{{ debugData.layers.layer4_userKnowledge.source }}</div>
                        <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-64 overflow-y-auto">{{ debugData.layers.layer4_userKnowledge.content }}</pre>
                      </div>
                    </div>
                  </Transition>
                </div>

                <!-- Layer 5: Behavioral -->
                <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                  <button
                    @click="expandedLayers.layer5 = !expandedLayers.layer5"
                    class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                  >
                    <div class="flex items-center gap-4">
                      <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                        <span class="font-mono text-sm text-rose-400">5</span>
                      </div>
                      <div>
                        <span class="text-base font-medium text-[#e8e6e3]">{{ debugData.layers.layer5_behavioral.name }}</span>
                        <p class="text-xs text-[#555] mt-0.5">{{ debugData.layers.layer5_behavioral.description }}</p>
                      </div>
                    </div>
                    <svg
                      class="w-5 h-5 text-[#666] transition-transform duration-200"
                      :class="{ 'rotate-180': expandedLayers.layer5 }"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <Transition name="accordion">
                    <div v-if="expandedLayers.layer5" class="border-t border-[#2a2a2e]">
                      <div class="p-4 bg-[#0d0d0f]">
                        <div class="font-mono text-[10px] uppercase tracking-wider text-[#444] mb-2">{{ debugData.layers.layer5_behavioral.source }}</div>
                        <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-64 overflow-y-auto">{{ debugData.layers.layer5_behavioral.content }}</pre>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Assembled View -->
              <div v-else class="p-6">
                <div class="bg-[#0d0d0f] border border-[#2a2a2e] rounded-xl p-4">
                  <div class="flex items-center justify-between mb-3">
                    <span class="font-mono text-[10px] uppercase tracking-wider text-[#555]">Full Assembled Prompt (as sent to Cerebras)</span>
                    <span class="font-mono text-xs text-[#444]">{{ debugData.assembledPrompt.length.toLocaleString() }} chars</span>
                  </div>
                  <pre class="text-sm text-[#ccc] whitespace-pre-wrap font-mono bg-[#151518] p-4 rounded-lg border border-[#2a2a2e] max-h-[50vh] overflow-y-auto">{{ debugData.assembledPrompt }}</pre>
                </div>

                <!-- Model Config -->
                <div class="mt-4 grid grid-cols-4 gap-3">
                  <div class="bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg p-3">
                    <div class="font-mono text-[10px] uppercase tracking-wider text-[#555] mb-1">Model</div>
                    <div class="font-mono text-sm text-amber-400">{{ debugData.persona.llmModel || 'llama3.1-8b' }}</div>
                  </div>
                  <div class="bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg p-3">
                    <div class="font-mono text-[10px] uppercase tracking-wider text-[#555] mb-1">Temperature</div>
                    <div class="font-mono text-sm text-amber-400">{{ debugData.persona.temperature || 0.7 }}</div>
                  </div>
                  <div class="bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg p-3">
                    <div class="font-mono text-[10px] uppercase tracking-wider text-[#555] mb-1">Max Tokens</div>
                    <div class="font-mono text-sm text-amber-400">{{ debugData.persona.maxTokens || 150 }}</div>
                  </div>
                  <div class="bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg p-3">
                    <div class="font-mono text-[10px] uppercase tracking-wider text-[#555] mb-1">Max Call Duration</div>
                    <div class="font-mono text-sm text-amber-400">{{ debugData.persona.maxCallDuration || 15 }} min</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-[#2a2a2e] bg-[#151518] flex-shrink-0">
              <div class="flex items-center justify-between">
                <p class="text-xs text-[#555]">
                  This shows the prompt as it would be assembled for a call. Layer 5 (Behavioral) is loaded dynamically during calls.
                </p>
                <button
                  @click="$emit('close')"
                  class="px-4 py-2 rounded-lg bg-[#2a2a2e] hover:bg-[#3a3a3e] text-[#ccc] font-mono text-xs uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  personaId: {
    type: String,
    default: null
  },
  userId: {
    type: String,
    default: null
  },
  apiUrl: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref(null)
const debugData = ref(null)
const viewMode = ref('layers')
const copied = ref(false)

const expandedLayers = reactive({
  layer1: true,
  layer2: false,
  layer3: false,
  layer4: false,
  layer5: false
})

const fetchDebugData = async () => {
  if (!props.personaId) {
    error.value = 'No persona selected'
    return
  }

  loading.value = true
  error.value = null

  try {
    const token = localStorage.getItem('adminToken')
    let url = `${props.apiUrl}/api/admin/debug/prompt?personaId=${props.personaId}`
    if (props.userId) {
      url += `&userId=${props.userId}`
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || 'Failed to fetch debug data')
    }

    debugData.value = await response.json()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const copyToClipboard = async () => {
  if (!debugData.value) return

  try {
    await navigator.clipboard.writeText(debugData.value.assembledPrompt)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy:', e)
  }
}

// Fetch data when modal opens
watch(() => props.show, (newVal) => {
  if (newVal && props.personaId) {
    fetchDebugData()
  }
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.98) translateY(8px);
}

/* Accordion transitions */
.accordion-enter-active {
  transition: all 0.2s ease-out;
}
.accordion-leave-active {
  transition: all 0.15s ease-in;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
