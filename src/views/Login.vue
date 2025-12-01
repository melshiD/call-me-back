<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] relative">
    <!-- Ambient Background - Static orbs, no float animation -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <!-- Golden Orb - Top Right -->
      <div class="absolute w-[700px] h-[700px] -top-[250px] -right-[250px] opacity-12 pointer-events-none blur-[120px] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <!-- Solar Orb - Bottom Left -->
      <div class="absolute w-[600px] h-[600px] bottom-[5%] -left-[200px] opacity-15 pointer-events-none blur-[120px] bg-gradient-radial from-solar via-ember to-transparent"></div>
      <!-- Center Accent -->
      <div class="absolute w-[400px] h-[400px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-8 pointer-events-none blur-[100px] bg-gradient-radial from-glow to-transparent"></div>
    </div>

    <!-- Main Container -->
    <div class="relative min-h-screen flex items-center justify-center px-6 py-24">
      <!-- Login Card -->
      <div class="w-full max-w-[520px] opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <!-- Back to Home Link -->
        <router-link
          to="/"
          class="inline-flex items-center gap-2 mb-8 text-cream/60 hover:text-glow transition-all duration-300 group"
        >
          <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span class="text-sm font-semibold uppercase tracking-wider">Back to Home</span>
        </router-link>

        <!-- Main Card -->
        <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border-2 border-glow/30 rounded-[32px] p-10 lg:p-12 shadow-[0_0_0_1px_rgba(251,191,36,0.1),0_32px_100px_rgba(251,191,36,0.15)] holographic overflow-hidden">
          <!-- Decorative corner accents -->
          <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-glow/40 rounded-tl-2xl"></div>
          <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-glow/40 rounded-br-2xl"></div>

          <!-- Header -->
          <div class="text-center mb-10 relative z-10">
            <!-- Status Badge -->
            <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-glow/40 bg-gradient-to-r from-glow/10 to-ember/10 mb-6 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.2)]">
              <span class="w-2 h-2 bg-glow rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
              <span class="text-xs font-bold tracking-[0.15em] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent uppercase">Secure Access</span>
            </div>

            <h1 class="text-5xl lg:text-6xl font-[--font-display] font-extrabold mb-4 tracking-tight">
              <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Welcome Back</span>
            </h1>
            <p class="text-lg text-cream/70 font-medium">Your AI companions are ready to assist</p>
          </div>

          <!-- Login Content -->
          <div class="space-y-6 relative z-10">
            <!-- Error Message -->
            <div v-if="error" class="bg-solar/10 border-2 border-solar/30 rounded-xl p-4 backdrop-blur-sm">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-solar flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-cream font-medium">{{ error }}</p>
              </div>
            </div>

            <!-- Sign In Button - Redirects to AuthKit -->
            <a
              :href="oauthLoginUrl"
              class="group relative w-full inline-flex items-center justify-center px-10 py-5 text-lg font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-[position:100%_0] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_16px_50px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.8),0_20px_60px_rgba(251,191,36,0.5)]"
            >
              <span class="relative z-10 flex items-center gap-3 uppercase tracking-wider">
                <span>Sign In</span>
                <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </a>

            <!-- Auth Options Info -->
            <p class="text-center text-cream/50 text-sm">
              Continue with Google, GitHub, or email
            </p>
          </div>
        </div>

        <!-- Sign Up Info -->
        <div class="mt-8 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          <p class="text-cream/60">
            Don't have an account? You can register from the sign-in form after clicking the button above.
          </p>
        </div>

        <!-- Trust Indicators -->
        <div class="mt-10 flex items-center justify-center gap-8 text-xs text-cream/40 uppercase tracking-[0.15em] font-bold opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
            </svg>
            <span>256-bit SSL</span>
          </div>
          <div class="text-cream/20">•</div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>Privacy First</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const error = ref('')

// OAuth login URL - redirects to API gateway which redirects to WorkOS AuthKit
const API_URL = import.meta.env.VITE_API_URL || 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run'
const oauthLoginUrl = computed(() => `${API_URL}/api/auth/login/oauth`)

// Check for error in query params (from failed OAuth)
onMounted(() => {
  const errorParam = route.query.error
  if (errorParam) {
    if (errorParam === 'auth_failed') {
      error.value = 'Authentication failed. Please try again.'
    } else if (errorParam === 'no_code') {
      error.value = 'Authentication was cancelled. Please try again.'
    } else {
      error.value = `Authentication error: ${errorParam}`
    }
  }
})
</script>

<style scoped>
/* Grain Texture - SVG Data URL */
.grain-overlay {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

/* Holographic Effect */
.holographic {
  position: relative;
  overflow: hidden;
}

.holographic::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 70%
  );
  background-size: 200% 200%;
  opacity: 0;
  transition: opacity 0.3s;
}

.holographic:hover::before {
  opacity: 1;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
</style>
