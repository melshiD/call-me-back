<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] pt-24 pb-16 px-6">
    <!-- Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-10 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[500px] h-[500px] bottom-[10%] -left-[150px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-black mb-4 tracking-tight">
          <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">My Contacts</span>
        </h1>
        <p class="text-lg text-cream/70">Your favorite personas for quick access</p>
      </div>

      <!-- Empty State -->
      <div v-if="personasStore.userContacts.length === 0" class="opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
        <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-16 text-center max-w-2xl mx-auto">
          <div class="text-8xl mb-6">👥</div>
          <h2 class="text-3xl font-[--font-display] font-bold mb-4">No contacts yet</h2>
          <p class="text-cream/60 mb-8 text-lg">Add personas to your contacts for quick access when scheduling calls</p>
          <router-link
            to="/personas"
            class="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-xl text-deep text-lg font-black uppercase tracking-wider hover:bg-[position:100%_0] transition-all duration-500 hover:scale-[1.05] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_16px_50px_rgba(251,191,36,0.4)]"
          >
            Browse Personas
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>
        </div>
      </div>

      <!-- Contacts Grid -->
      <div v-else class="space-y-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(contact, index) in personasStore.userContacts"
            :key="contact.id"
            class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-8 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/30 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(251,191,36,0.2)] overflow-hidden group">
              <!-- Decorative glow -->
              <div class="absolute top-0 right-0 w-32 h-32 bg-glow/10 -mr-16 -mt-16 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div class="relative z-10">
                <!-- Header with remove button -->
                <div class="flex justify-between items-start mb-4">
                  <h3 class="text-2xl font-[--font-display] font-bold">{{ contact.name }}</h3>
                  <button
                    @click="removeContact(contact.id)"
                    class="p-2 text-cream/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                    :disabled="removing[contact.id]"
                    title="Remove from contacts"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p class="text-cream/60 mb-4 leading-relaxed">{{ contact.description }}</p>

                <!-- Tags -->
                <div class="flex flex-wrap gap-2 mb-4">
                  <span
                    v-for="tag in contact.tags"
                    :key="tag"
                    class="px-3 py-1 bg-glow/10 border border-glow/20 text-glow text-xs rounded-full font-semibold uppercase tracking-wider"
                  >
                    {{ tag }}
                  </span>
                </div>

                <!-- Meta info -->
                <div class="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4 space-y-2 text-sm">
                  <div class="flex justify-between">
                    <span class="text-cream/50">Voice:</span>
                    <span class="font-semibold">{{ contact.voice }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-cream/50">Type:</span>
                    <span v-if="contact.is_public" class="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs rounded-md font-bold uppercase">
                      Public
                    </span>
                    <span v-else class="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs rounded-md font-bold uppercase">
                      Custom
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <router-link
                  :to="{ path: '/schedule', query: { personaId: contact.id } }"
                  class="block w-full text-center px-6 py-4 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold hover:scale-[1.02] transition-all duration-300 shadow-[0_4px_20px_rgba(251,191,36,0.3)]"
                >
                  Schedule Call →
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Add More Button -->
        <div class="text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s]">
          <router-link
            to="/personas"
            class="inline-flex items-center gap-3 px-10 py-5 bg-white/5 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/10 hover:border-glow/40 transition-all duration-300"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add More Contacts
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePersonasStore } from '../stores/personas'

const personasStore = usePersonasStore()
const removing = ref({})

const removeContact = async (contactId) => {
  if (!confirm('Remove this persona from your contacts?')) return

  removing.value[contactId] = true

  try {
    await personasStore.removeFromContacts(contactId)
  } catch (err) {
    alert('Failed to remove contact: ' + err.message)
  } finally {
    delete removing.value[contactId]
  }
}

onMounted(async () => {
  await personasStore.fetchContacts()
})
</script>

<style scoped>
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}
</style>
