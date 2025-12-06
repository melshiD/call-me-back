<template>
  <!-- Demo Mode Toggle - Obscures sensitive data for screen recording/demos -->
  <div class="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-white/[0.03] border border-white/10 rounded-full">
    <svg class="w-4 h-4" :class="modelValue ? 'text-cyan-400' : 'text-cream/40'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
    <span class="text-xs font-bold uppercase tracking-wider" :class="modelValue ? 'text-cyan-400' : 'text-cream/50'">Demo Mode</span>
    <button
      @click="$emit('update:modelValue', !modelValue)"
      class="relative w-11 h-6 rounded-full transition-all duration-300"
      :class="modelValue ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.5)]' : 'bg-white/10'"
    >
      <span
        class="absolute top-1 w-4 h-4 rounded-full transition-all duration-300 shadow-md"
        :class="modelValue ? 'left-6 bg-white' : 'left-1 bg-cream/60'"
      ></span>
    </button>
  </div>
</template>

<script setup>
/**
 * DemoModeToggle Component
 *
 * A toggle switch for enabling/disabling demo mode which obscures sensitive
 * user data (emails, phone numbers, payment info) for screen recordings and demos.
 *
 * Usage:
 *   import DemoModeToggle from '@/components/DemoModeToggle.vue'
 *
 *   <DemoModeToggle v-model="demoMode" />
 *
 * The parent component should provide masking functions like:
 *   - maskEmail(email) - obscures email addresses
 *   - maskPhone(phone) - obscures phone numbers
 *
 * And conditionally apply blur classes based on demoMode state:
 *   :class="{ 'blur-[3px] select-none': demoMode }"
 */
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>
