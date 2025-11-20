<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] relative">
    <!-- Enhanced Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <!-- Morphing Orb 1 - Solar Orange -->
      <div class="absolute w-[700px] h-[700px] -top-[250px] -right-[250px] opacity-12 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite,morph_15s_ease-in-out_infinite] bg-gradient-radial from-solar via-ember to-transparent"></div>
      <!-- Morphing Orb 2 - Golden -->
      <div class="absolute w-[600px] h-[600px] bottom-[5%] -left-[200px] opacity-15 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse,morph_18s_ease-in-out_infinite] [animation-delay:5s] bg-gradient-radial from-glow via-glow-bright to-transparent"></div>
      <!-- Subtle accent orb for depth -->
      <div class="absolute w-[400px] h-[400px] top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 opacity-8 pointer-events-none blur-[100px] animate-[float_22s_ease-in-out_infinite,morph_16s_ease-in-out_infinite] [animation-delay:3s] bg-gradient-radial from-ember to-transparent"></div>
    </div>

    <!-- Main Container -->
    <div class="relative min-h-screen flex items-center justify-center px-6 py-16">
      <!-- Register Card -->
      <div class="w-full max-w-[580px] opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
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
        <div class="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border-2 border-ember/30 rounded-[32px] p-10 lg:p-12 shadow-[0_0_0_1px_rgba(255,140,66,0.1),0_32px_100px_rgba(255,140,66,0.15)] holographic overflow-hidden">
          <!-- Decorative corner accents -->
          <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-ember/40 rounded-tl-2xl"></div>
          <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-ember/40 rounded-br-2xl"></div>

          <!-- Header -->
          <div class="text-center mb-8 relative z-10">
            <!-- Status Badge -->
            <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-ember/40 bg-gradient-to-r from-ember/10 to-solar/10 mb-6 backdrop-blur-md shadow-[0_4px_20px_rgba(255,140,66,0.2)]">
              <span class="w-2 h-2 bg-ember rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(255,140,66,0.8)]"></span>
              <span class="text-xs font-bold tracking-[0.15em] bg-gradient-to-r from-ember to-solar bg-clip-text text-transparent uppercase">Start Your Journey</span>
            </div>

            <h1 class="text-5xl lg:text-6xl font-[--font-display] font-extrabold mb-4 tracking-tight">
              <span class="bg-gradient-to-r from-ember via-solar to-glow bg-clip-text text-transparent">Create Account</span>
            </h1>
            <p class="text-lg text-cream/70 font-medium">Join thousands using AI companions daily</p>
          </div>

          <!-- Register Form -->
          <form @submit.prevent="handleRegister" class="space-y-5 relative z-10">
            <!-- Name Field -->
            <div class="space-y-2">
              <label for="name" class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">
                Full Name
              </label>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-ember/20 to-solar/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  class="relative w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 font-medium"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <!-- Email Field -->
            <div class="space-y-2">
              <label for="email" class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">
                Email Address
              </label>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-ember/20 to-solar/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  class="relative w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 font-medium"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <!-- Phone Field -->
            <div class="space-y-2">
              <label for="phone" class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">
                Phone Number
              </label>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-ember/20 to-solar/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  class="relative w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 font-medium"
                  placeholder="+1234567890"
                  required
                />
              </div>
              <p class="text-xs text-cream/40 pl-1 font-medium">E.164 format (e.g., +1234567890)</p>
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <label for="password" class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">
                Password
              </label>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-ember/20 to-solar/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <input
                  id="password"
                  v-model="password"
                  type="password"
                  class="relative w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 font-medium"
                  placeholder="••••••••••••"
                  required
                  minlength="8"
                />
              </div>
              <p class="text-xs text-cream/40 pl-1 font-medium">Minimum 8 characters</p>
            </div>

            <!-- Confirm Password Field -->
            <div class="space-y-2">
              <label for="confirmPassword" class="block text-sm font-bold uppercase tracking-[0.1em] text-cream/80 pl-1">
                Confirm Password
              </label>
              <div class="relative group">
                <div class="absolute inset-0 bg-gradient-to-r from-ember/20 to-solar/20 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <input
                  id="confirmPassword"
                  v-model="confirmPassword"
                  type="password"
                  class="relative w-full px-6 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-ember/50 focus:bg-white/10 transition-all duration-300 font-medium"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-solar/10 border-2 border-solar/30 rounded-xl p-4 backdrop-blur-sm">
              <div class="flex items-center gap-3">
                <svg class="w-5 h-5 text-solar flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="text-sm text-cream font-medium">{{ error }}</p>
              </div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="loading"
              class="group relative w-full inline-flex items-center justify-center px-10 py-5 text-lg font-black text-deep bg-gradient-to-r from-ember via-solar to-ember bg-[length:200%_100%] rounded-xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-[position:100%_0] shadow-[0_0_0_1px_rgba(255,140,66,0.5),0_16px_50px_rgba(255,140,66,0.4)] hover:shadow-[0_0_0_1px_rgba(255,140,66,0.8),0_20px_60px_rgba(255,140,66,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span class="relative z-10 flex items-center gap-2 uppercase tracking-wider">
                <span v-if="loading">Creating Account...</span>
                <span v-else>Create Account</span>
                <svg v-if="!loading" class="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </button>

            <!-- Terms Notice -->
            <p class="text-xs text-center text-cream/40 leading-relaxed">
              By creating an account, you agree to our
              <a href="#" class="text-ember hover:text-solar transition-colors duration-300 font-semibold">Terms of Service</a>
              and
              <a href="#" class="text-ember hover:text-solar transition-colors duration-300 font-semibold">Privacy Policy</a>
            </p>
          </form>
        </div>

        <!-- Login Link -->
        <div class="mt-8 text-center opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          <p class="text-cream/60">
            Already have an account?
            <router-link
              to="/login"
              class="font-bold text-ember hover:text-glow transition-colors duration-300 ml-1"
            >
              Sign In →
            </router-link>
          </p>
        </div>

        <!-- Trust Indicators -->
        <div class="mt-10 flex items-center justify-center gap-8 text-xs text-cream/40 uppercase tracking-[0.15em] font-bold opacity-0 translate-y-4 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-ember" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>First Call Free</span>
          </div>
          <div class="text-cream/20">•</div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-ember" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span>No Credit Card</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  // Validation
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    loading.value = false
    return
  }

  if (!phone.value.startsWith('+')) {
    error.value = 'Phone number must be in E.164 format (start with +)'
    loading.value = false
    return
  }

  try {
    await authStore.register(name.value, email.value, password.value, phone.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
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
