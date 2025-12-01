<template>
  <div class="min-h-screen bg-midnight text-cream flex items-center justify-center font-[--font-body]">
    <!-- Ambient Background (matching Home.vue) -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none blur-[150px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-md px-6 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
      <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border-2 border-glow/30 rounded-[32px] p-12 shadow-[0_0_0_1px_rgba(251,191,36,0.1),0_32px_100px_rgba(251,191,36,0.2)] overflow-hidden">
        <!-- Decorative corner accents -->
        <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-glow/30 rounded-tl-2xl"></div>
        <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-glow/30 rounded-br-2xl"></div>

        <!-- Lock Icon -->
        <div class="flex justify-center mb-8">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-glow to-ember flex items-center justify-center shadow-[0_12px_40px_rgba(251,191,36,0.4)]">
            <svg class="w-10 h-10 text-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <!-- Title -->
        <h1 class="text-4xl font-[--font-display] font-black text-center mb-3 bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">
          Admin Access
        </h1>
        <p class="text-center text-cream/60 mb-10 text-sm uppercase tracking-[0.2em] font-semibold">
          Mission Control
        </p>

        <!-- Error Message -->
        <div v-if="error" class="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl backdrop-blur-xl mb-6">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-400 text-sm font-semibold">{{ errorMessage }}</p>
          </div>
        </div>

        <!-- Sign in Button -->
        <a
          :href="loginUrl"
          class="group relative w-full px-8 py-5 text-lg font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-[position:100%_0] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_12px_40px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.8),0_16px_50px_rgba(251,191,36,0.5)] flex items-center justify-center gap-3"
        >
          <!-- Lock/Shield Icon -->
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Sign in as Admin
        </a>

        <!-- Divider -->
        <div class="flex items-center gap-4 my-8">
          <div class="flex-1 h-px bg-white/10"></div>
          <span class="text-cream/40 text-xs uppercase tracking-wider">Powered by WorkOS</span>
          <div class="flex-1 h-px bg-white/10"></div>
        </div>

        <!-- Back to Home Link -->
        <div class="text-center">
          <router-link
            to="/"
            class="text-sm text-cream/50 hover:text-glow transition-colors duration-300 font-medium inline-flex items-center gap-2 group"
          >
            <svg class="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </router-link>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="mt-6 text-center text-xs text-cream/40 flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Secured with WorkOS AuthKit</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Grain overlay texture (matching Home.vue) */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}
</style>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const error = ref(false);

const API_URL = import.meta.env.VITE_ADMIN_API_URL || 'https://logs.ai-tools-marketplace.io';
const loginUrl = `${API_URL}/api/admin/auth/login`;

const errorMessage = computed(() => {
  const errorCode = route.query.error;
  const messages = {
    'unauthorized': 'Your account is not authorized for admin access.',
    'auth_failed': 'Authentication failed. Please try again.',
    'no_code': 'Authentication was cancelled.',
  };
  return messages[errorCode] || 'An error occurred during sign in.';
});

onMounted(() => {
  // Check for error in URL
  if (route.query.error) {
    error.value = true;
  }

  // If already logged in, redirect
  const token = localStorage.getItem('adminToken');
  if (token) {
    window.location.href = '/admin/dashboard';
  }
});
</script>
