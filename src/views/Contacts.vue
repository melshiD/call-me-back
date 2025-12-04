<template>
  <div class="min-h-screen bg-[#0d0d0f] text-[#e8e6e3] font-['Inter',sans-serif] overflow-hidden">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10">
      <div class="absolute inset-0 bg-gradient-to-b from-[#0d0d0f] via-[#131318] to-[#0d0d0f]"></div>
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <div class="absolute w-[600px] h-[500px] -top-[200px] -right-[150px] opacity-[0.04] pointer-events-none blur-[150px] bg-gradient-radial from-amber-500 to-transparent"></div>
      <div class="absolute w-[500px] h-[400px] bottom-[-150px] -left-[150px] opacity-[0.03] pointer-events-none blur-[150px] bg-gradient-radial from-orange-500 to-transparent"></div>
    </div>

    <div class="max-w-6xl mx-auto px-6 pt-24 pb-16">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666] mb-2">Your Contacts</h1>
          <p class="text-[#999] text-sm">Configure your AI companions and their knowledge about you</p>
        </div>
        <button
          @click="openExplorePanel"
          class="group flex items-center gap-2 px-5 py-3 bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl text-sm font-medium text-[#999] hover:border-amber-500/50 hover:text-amber-400 transition-all duration-300"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Explore Personas</span>
          <svg class="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="personasStore.userContacts.length === 0 && !loading" class="animate-[fadeIn_0.3s_ease-out]">
        <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-12 text-center max-w-xl mx-auto">
          <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-[#e8e6e3] mb-2">No contacts yet</h2>
          <p class="text-[#666] text-sm mb-6">Add AI personas to your contacts to start scheduling calls</p>
          <button
            @click="openExplorePanel"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-sm font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explore Personas
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 3" :key="i" class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-6 animate-pulse">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 bg-[#2a2a2e] rounded-xl"></div>
            <div class="flex-1 space-y-3">
              <div class="h-5 bg-[#2a2a2e] rounded w-1/3"></div>
              <div class="h-4 bg-[#2a2a2e] rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts List -->
      <div v-if="personasStore.userContacts.length > 0 && !loading" class="space-y-4">
        <div
          v-for="contact in personasStore.userContacts"
          :key="contact.id"
          class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl overflow-hidden hover:border-[#3a3a3e] transition-all duration-300 animate-[fadeIn_0.3s_ease-out]"
        >
          <!-- Contact Header -->
          <div class="p-5 flex items-start justify-between">
            <div class="flex items-start gap-4 flex-1">
              <!-- Avatar -->
              <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-2xl font-bold text-amber-400/80 flex-shrink-0">
                {{ contact.name?.charAt(0) || '?' }}
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-semibold text-[#e8e6e3] truncate">{{ contact.name }}</h3>
                  <span v-if="contact.is_public" class="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold uppercase rounded">
                    Public
                  </span>
                  <span v-else class="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase rounded">
                    Custom
                  </span>
                </div>
                <p class="text-sm text-[#777] line-clamp-2">{{ contact.description }}</p>
                <!-- Tags -->
                <div v-if="contact.tags?.length" class="flex flex-wrap gap-1.5 mt-2">
                  <span
                    v-for="tag in contact.tags.slice(0, 3)"
                    :key="tag"
                    class="px-2 py-0.5 bg-[#0d0d0f] border border-[#2a2a2e] text-[#666] text-[10px] font-medium rounded uppercase tracking-wider"
                  >
                    {{ tag }}
                  </span>
                  <span v-if="contact.tags.length > 3" class="px-2 py-0.5 text-[#555] text-[10px]">
                    +{{ contact.tags.length - 3 }} more
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 ml-4">
              <button
                @click="toggleContactExpand(contact.id)"
                class="p-2 text-[#666] hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all duration-300"
                :title="expandedContacts[contact.id] ? 'Collapse' : 'Configure'"
              >
                <svg class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': expandedContacts[contact.id] }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <router-link
                :to="{ path: '/schedule', query: { personaId: contact.id } }"
                class="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-xs font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
              >
                Call
              </router-link>
            </div>
          </div>

          <!-- Expanded Configuration Panel -->
          <div
            v-if="expandedContacts[contact.id]"
            class="border-t border-[#2a2a2e] bg-[#0d0d0f]/50 p-5 space-y-5 animate-[fadeIn_0.2s_ease-out]"
          >
            <!-- Knowledge / User Facts Section -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                  <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Your Knowledge Profile</label>
                </div>
                <span class="text-[10px] text-[#555]">What {{ contact.name }} knows about you</span>
              </div>

              <!-- Facts List -->
              <div class="space-y-2">
                <div
                  v-for="(fact, index) in (contactFacts[contact.id] || [])"
                  :key="index"
                  class="flex items-center gap-2 group"
                >
                  <div class="flex-1 px-3 py-2 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-sm text-[#ccc]">
                    {{ fact }}
                  </div>
                  <button
                    @click="removeFact(contact.id, index)"
                    class="p-1.5 text-[#444] hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <!-- Empty facts state -->
                <div v-if="!(contactFacts[contact.id]?.length)" class="text-center py-4 text-[#555] text-sm">
                  No facts added yet. Add information about yourself that {{ contact.name }} should remember.
                </div>
              </div>

              <!-- Add Fact Input -->
              <div class="flex gap-2">
                <input
                  v-model="newFactInputs[contact.id]"
                  type="text"
                  placeholder="e.g., I'm training for a marathon in March..."
                  class="flex-1 px-4 py-2.5 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  @keyup.enter="addFact(contact.id)"
                />
                <button
                  @click="addFact(contact.id)"
                  :disabled="!newFactInputs[contact.id]?.trim()"
                  class="px-4 py-2.5 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[#999] text-sm font-medium hover:border-amber-500/50 hover:text-amber-400 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + Add
                </button>
              </div>
            </div>

            <!-- Quick Presets -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Quick Add Presets</label>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in factPresets"
                  :key="preset.label"
                  @click="addPresetFact(contact.id, preset.label, preset.prompt)"
                  class="px-3 py-1.5 bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg text-[11px] text-[#888] hover:border-[#3a3a3e] hover:text-[#ccc] transition-all duration-200 flex items-center gap-1.5"
                >
                  <span>{{ preset.icon }}</span>
                  <span>{{ preset.label }}</span>
                </button>
              </div>
            </div>

            <!-- Relationship Preferences -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <label class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#666]">Relationship Style</label>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="style in relationshipStyles"
                  :key="style.id"
                  @click="setRelationshipStyle(contact.id, style.id)"
                  class="px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 border"
                  :class="(contactStyles[contact.id] || 'balanced') === style.id
                    ? 'bg-purple-500/10 border-purple-500/50 text-purple-400'
                    : 'bg-[#1a1a1e] border-[#2a2a2e] text-[#888] hover:border-[#3a3a3e]'"
                >
                  {{ style.label }}
                </button>
              </div>
            </div>

            <!-- Voice Info -->
            <div class="flex items-center justify-between pt-3 border-t border-[#2a2a2e]">
              <div class="flex items-center gap-3">
                <span class="font-['JetBrains_Mono',monospace] text-[10px] uppercase tracking-[0.2em] text-[#555]">Voice:</span>
                <span class="text-sm text-[#888]">{{ contact.voice || 'Default' }}</span>
              </div>
              <button
                @click="removeContact(contact.id, contact.name)"
                class="text-[11px] text-[#555] hover:text-red-400 transition-colors font-['JetBrains_Mono',monospace] uppercase tracking-wider"
              >
                Remove from contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Explore Panel (Slide-out) -->
    <transition name="slide-panel">
      <div v-if="explorePanelOpen" class="fixed inset-0 z-50 flex justify-end">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeExplorePanel"></div>

        <!-- Panel -->
        <div class="relative w-full max-w-lg bg-[#0d0d0f] border-l border-[#2a2a2e] h-full overflow-hidden flex flex-col animate-[slideIn_0.3s_ease-out]">
          <!-- Panel Header -->
          <div class="flex-shrink-0 pt-6 px-5 pb-5 border-b border-[#2a2a2e] bg-[#1a1a1e]/50">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-['JetBrains_Mono',monospace] text-xs tracking-[0.3em] uppercase text-[#666]">Explore Personas</h2>
              <button
                @click="closeExplorePanel"
                class="p-2 text-[#666] hover:text-[#999] hover:bg-[#2a2a2e] rounded-lg transition-all"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Search -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search personas..."
                class="w-full px-4 py-3 pl-10 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Personas List -->
          <div class="flex-1 overflow-y-auto p-5 space-y-4">
            <!-- Loading -->
            <div v-if="loadingPersonas" class="space-y-4">
              <div v-for="i in 4" :key="i" class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg p-4 animate-pulse">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 bg-[#2a2a2e] rounded-xl"></div>
                  <div class="flex-1 space-y-2">
                    <div class="h-4 bg-[#2a2a2e] rounded w-1/2"></div>
                    <div class="h-3 bg-[#2a2a2e] rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Personas -->
            <div
              v-for="persona in filteredPersonas"
              :key="persona.id"
              class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-lg p-4 hover:border-[#3a3a3e] transition-all duration-300"
            >
              <div class="flex items-start gap-3">
                <!-- Avatar -->
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-xl font-bold text-amber-400/80 flex-shrink-0">
                  {{ persona.name?.charAt(0) || '?' }}
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-[#e8e6e3] mb-1">{{ persona.name }}</h3>
                  <p class="text-xs text-[#666] line-clamp-2 mb-2">{{ persona.description }}</p>

                  <!-- Tags -->
                  <div v-if="persona.tags?.length" class="flex flex-wrap gap-1 mb-3">
                    <span
                      v-for="tag in persona.tags.slice(0, 2)"
                      :key="tag"
                      class="px-1.5 py-0.5 bg-[#0d0d0f] border border-[#2a2a2e] text-[#555] text-[9px] font-medium rounded uppercase"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <!-- Add Button -->
                  <button
                    v-if="!isInContacts(persona.id)"
                    @click="addToContacts(persona.id)"
                    :disabled="addingContact[persona.id]"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-[10px] font-bold uppercase tracking-wider hover:from-amber-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50"
                  >
                    <svg v-if="!addingContact[persona.id]" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span v-if="addingContact[persona.id]">Adding...</span>
                    <span v-else>Add to Contacts</span>
                  </button>
                  <div v-else class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-[10px] font-bold uppercase">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    In Contacts
                  </div>
                </div>
              </div>
            </div>

            <!-- No Results -->
            <div v-if="!loadingPersonas && filteredPersonas.length === 0" class="text-center py-8">
              <p class="text-[#555] text-sm">No personas found matching "{{ searchQuery }}"</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Preset Fact Modal -->
    <div
      v-if="presetModal.open"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closePresetModal"
    >
      <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-6 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-[#e8e6e3]">{{ presetModal.label }}</h3>
          <button @click="closePresetModal" class="p-2 text-[#666] hover:text-[#999] transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-sm text-[#888] mb-4">{{ presetModal.prompt }}</p>
        <input
          v-model="presetModal.value"
          type="text"
          class="w-full px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#e8e6e3] placeholder-[#444] text-sm focus:outline-none focus:border-amber-500/50 transition-colors mb-4"
          placeholder="Type your answer..."
          @keyup.enter="submitPresetModal"
          autofocus
        />
        <div class="flex gap-3">
          <button
            @click="closePresetModal"
            class="flex-1 px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#999] text-sm font-medium hover:border-[#3a3a3e] transition-all"
          >
            Cancel
          </button>
          <button
            @click="submitPresetModal"
            :disabled="!presetModal.value?.trim()"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-[#0d0d0f] text-sm font-bold hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Fact
          </button>
        </div>
      </div>
    </div>

    <!-- Remove Confirmation Modal -->
    <div
      v-if="removeConfirm.open"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="closeRemoveConfirm"
    >
      <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-xl p-6 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
            <svg class="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-[#e8e6e3]">Remove Contact</h3>
        </div>
        <p class="text-sm text-[#888] mb-6">
          Are you sure you want to remove <span class="text-[#e8e6e3] font-medium">{{ removeConfirm.contactName }}</span> from your contacts? Any saved facts and preferences will be lost.
        </p>
        <div class="flex gap-3">
          <button
            @click="closeRemoveConfirm"
            class="flex-1 px-4 py-3 bg-[#0d0d0f] border border-[#2a2a2e] rounded-lg text-[#999] text-sm font-medium hover:border-[#3a3a3e] transition-all"
          >
            Keep Contact
          </button>
          <button
            @click="confirmRemoveContact"
            class="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 rounded-lg text-white text-sm font-bold hover:from-red-500 hover:to-red-400 transition-all"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { usePersonasStore } from '../stores/personas'
import { useToast } from '../stores/toast'

const personasStore = usePersonasStore()
const toast = useToast()

// State
const loading = ref(true)
const loadingPersonas = ref(false)
const explorePanelOpen = ref(false)
const searchQuery = ref('')
const expandedContacts = ref({})
const addingContact = ref({})
const removing = ref({})

// Contact configuration state
const contactFacts = ref({})
const contactStyles = ref({})
const newFactInputs = ref({})

// Modal state for preset prompts
const presetModal = ref({
  open: false,
  contactId: null,
  label: '',
  prompt: '',
  value: ''
})

// Confirmation state for removals
const removeConfirm = ref({
  open: false,
  contactId: null,
  contactName: ''
})

// Fact presets for quick adding
const factPresets = [
  { icon: '🎯', label: 'Goals', prompt: 'What are your current goals?' },
  { icon: '💼', label: 'Work', prompt: 'What do you do for work?' },
  { icon: '🏃', label: 'Fitness', prompt: 'What fitness activities do you do?' },
  { icon: '👨‍👩‍👧', label: 'Family', prompt: 'Tell me about your family' },
  { icon: '🎨', label: 'Hobbies', prompt: 'What are your hobbies?' },
  { icon: '📍', label: 'Location', prompt: 'Where are you located?' }
]

// Relationship styles
const relationshipStyles = [
  { id: 'supportive', label: 'Supportive' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'challenging', label: 'Challenging' }
]

// Computed
const filteredPersonas = computed(() => {
  if (!searchQuery.value.trim()) {
    return personasStore.personas
  }
  const query = searchQuery.value.toLowerCase()
  return personasStore.personas.filter(p =>
    p.name?.toLowerCase().includes(query) ||
    p.description?.toLowerCase().includes(query) ||
    p.tags?.some(t => t.toLowerCase().includes(query))
  )
})

// Methods
const toggleContactExpand = (contactId) => {
  expandedContacts.value[contactId] = !expandedContacts.value[contactId]
}

const openExplorePanel = async () => {
  explorePanelOpen.value = true
  if (personasStore.personas.length === 0) {
    loadingPersonas.value = true
    await personasStore.fetchPersonas()
    loadingPersonas.value = false
  }
}

const closeExplorePanel = () => {
  explorePanelOpen.value = false
  searchQuery.value = ''
}

const isInContacts = (personaId) => {
  return personasStore.userContacts.some(c => c.id === personaId || c.persona_id === personaId)
}

const addToContacts = async (personaId) => {
  addingContact.value[personaId] = true
  try {
    await personasStore.addToContacts(personaId)
    toast.success('Added to contacts!')
  } catch (err) {
    toast.error('Failed to add: ' + err.message)
  } finally {
    delete addingContact.value[personaId]
  }
}

const openRemoveConfirm = (contactId, contactName) => {
  removeConfirm.value = { open: true, contactId, contactName }
}

const closeRemoveConfirm = () => {
  removeConfirm.value = { open: false, contactId: null, contactName: '' }
}

const confirmRemoveContact = async () => {
  const contactId = removeConfirm.value.contactId
  if (!contactId) return

  closeRemoveConfirm()
  removing.value[contactId] = true
  try {
    await personasStore.removeFromContacts(contactId)
    toast.success('Removed from contacts')
    delete expandedContacts.value[contactId]
  } catch (err) {
    toast.error('Failed to remove: ' + err.message)
  } finally {
    delete removing.value[contactId]
  }
}

const removeContact = (contactId, contactName) => {
  openRemoveConfirm(contactId, contactName)
}

// Fact management (stored in localStorage for now)
const loadContactFacts = () => {
  try {
    const saved = localStorage.getItem('cmb_contact_facts')
    if (saved) contactFacts.value = JSON.parse(saved)
    const savedStyles = localStorage.getItem('cmb_contact_styles')
    if (savedStyles) contactStyles.value = JSON.parse(savedStyles)
  } catch (e) {
    console.warn('Failed to load contact facts:', e)
  }
}

const saveContactFacts = () => {
  try {
    localStorage.setItem('cmb_contact_facts', JSON.stringify(contactFacts.value))
    localStorage.setItem('cmb_contact_styles', JSON.stringify(contactStyles.value))
  } catch (e) {
    console.warn('Failed to save contact facts:', e)
  }
}

const addFact = (contactId) => {
  const fact = newFactInputs.value[contactId]?.trim()
  if (!fact) return

  if (!contactFacts.value[contactId]) {
    contactFacts.value[contactId] = []
  }
  contactFacts.value[contactId].push(fact)
  newFactInputs.value[contactId] = ''
  saveContactFacts()
  toast.success('Fact added')
}

const removeFact = (contactId, index) => {
  if (contactFacts.value[contactId]) {
    contactFacts.value[contactId].splice(index, 1)
    saveContactFacts()
  }
}

const openPresetModal = (contactId, label, prompt) => {
  presetModal.value = {
    open: true,
    contactId,
    label,
    prompt,
    value: ''
  }
}

const closePresetModal = () => {
  presetModal.value = { open: false, contactId: null, label: '', prompt: '', value: '' }
}

const submitPresetModal = () => {
  const { contactId, value } = presetModal.value
  if (value?.trim()) {
    if (!contactFacts.value[contactId]) {
      contactFacts.value[contactId] = []
    }
    contactFacts.value[contactId].push(value.trim())
    saveContactFacts()
    toast.success('Fact added')
  }
  closePresetModal()
}

const addPresetFact = (contactId, label, prompt) => {
  openPresetModal(contactId, label, prompt)
}

const setRelationshipStyle = (contactId, styleId) => {
  contactStyles.value[contactId] = styleId
  saveContactFacts()
}

// Lifecycle
onMounted(async () => {
  loadContactFacts()
  loading.value = true
  await personasStore.fetchContacts()
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

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  opacity: 0;
}

.slide-panel-enter-from .animate-\[slideIn_0\.3s_ease-out\],
.slide-panel-leave-to .animate-\[slideIn_0\.3s_ease-out\] {
  transform: translateX(100%);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
