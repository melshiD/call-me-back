<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body]">
    <!-- Enhanced Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <!-- Morphing Orb 1 - Golden -->
      <div class="absolute w-[600px] h-[600px] top-[10%] right-[5%] opacity-15 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite,morph_15s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <!-- Morphing Orb 2 - Solar -->
      <div class="absolute w-[700px] h-[700px] bottom-[5%] -left-[200px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse,morph_18s_ease-in-out_infinite] [animation-delay:5s] bg-gradient-radial from-solar via-ember to-transparent"></div>
    </div>

    <!-- Hero Section -->
    <section class="relative pt-40 pb-16 px-6">
      <div class="max-w-6xl mx-auto text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-glow/40 bg-gradient-to-r from-glow/10 to-ember/10 mb-8 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.2)] holographic opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <span class="w-2.5 h-2.5 bg-glow rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
          <span class="text-sm font-semibold tracking-[0.15em] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent uppercase">Pay Only For What You Use</span>
        </div>

        <h1 class="text-6xl lg:text-8xl font-[--font-display] font-black leading-[0.95] mb-8 tracking-tight opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          Premium AI Calls
          <span class="block bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent [text-shadow:0_0_60px_rgba(251,191,36,0.3)] mt-3 relative">
            On Your Schedule
            <span class="absolute -inset-2 bg-gradient-to-r from-glow/20 via-ember/20 to-solar/20 blur-3xl -z-10"></span>
          </span>
        </h1>

        <p class="text-xl lg:text-2xl text-cream/80 leading-relaxed mb-8 max-w-3xl mx-auto opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          Unlike chat apps, <strong class="text-glow">we call YOU</strong>. Schedule coaching sessions, check-ins, reminders, or escape calls—real voice conversations when you need them.
        </p>

        <!-- Key differentiator callout -->
        <div class="flex flex-wrap items-center justify-center gap-6 text-base text-cream/70 opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] mb-6">
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Minutes never expire
          </span>
          <span class="text-cream/30">•</span>
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            No subscriptions
          </span>
          <span class="text-cream/30">•</span>
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Real voice, real calls
          </span>
        </div>
      </div>
    </section>

    <!-- Pricing Tiers -->
    <section class="relative py-16 px-6">
      <div class="max-w-5xl mx-auto">
        <!-- Current Balance (for authenticated users) -->
        <div v-if="isAuthenticated && balance !== null" class="mb-8 text-center opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-sm">
            <svg class="w-5 h-5 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-cream/70">Your current balance:</span>
            <span class="text-xl font-bold bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">
              {{ balance }} minutes
            </span>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8">

          <!-- Starter - 25 Minutes -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:shadow-[0_32px_100px_rgba(251,191,36,0.2)] holographic overflow-hidden group">
            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-glow/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10">

              <div class="mb-6">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$14.99</span>
                </div>
                <p class="text-lg text-cream/80 font-semibold">25 minutes</p>
              </div>

              <ul class="space-y-3 mb-8">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">~5 calls at 5 min each</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">All AI personas</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Schedule calls anytime</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">AI remembers you</span>
                </li>
              </ul>

              <button
                @click="purchasePackage('minutes_25')"
                :disabled="purchasing"
                class="block w-full text-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/20 hover:border-glow/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg v-if="purchasingSku === 'minutes_25'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ purchasingSku === 'minutes_25' ? 'Redirecting to Stripe...' : 'Buy 25 Minutes' }}
              </button>
            </div>
          </div>

          <!-- Basic - 50 Minutes (Most Popular) -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border-2 border-glow/50 rounded-[32px] p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/70 hover:shadow-[0_32px_100px_rgba(251,191,36,0.3)] holographic overflow-hidden group md:-mt-4 md:mb-4">

            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-glow/30 to-transparent -mr-20 -mt-20 rotate-45 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10 mt-4">

              <div class="mb-6">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$24.99</span>
                </div>
                <p class="text-lg text-cream/80 font-semibold">50 minutes</p>
              </div>

              <ul class="space-y-3 mb-8">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">~10 calls at 5 min each</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">All AI personas</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Schedule calls anytime</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">AI remembers you</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Priority support</span>
                </li>
              </ul>

              <button
                @click="purchasePackage('minutes_50')"
                :disabled="purchasing"
                class="block w-full text-center px-8 py-4 bg-gradient-to-r from-glow via-ember to-solar rounded-xl text-deep font-black hover:scale-[1.02] transition-all duration-300 shadow-[0_8px_32px_rgba(251,191,36,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <svg v-if="purchasingSku === 'minutes_50'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ purchasingSku === 'minutes_50' ? 'Redirecting to Stripe...' : 'Buy 50 Minutes' }}
              </button>
            </div>
          </div>

          <!-- Plus - 100 Minutes -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-8 lg:p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:shadow-[0_32px_100px_rgba(255,107,53,0.2)] holographic overflow-hidden group">
            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solar/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10">

              <div class="mb-6">
                <div class="flex items-baseline gap-2 mb-1">
                  <span class="text-5xl font-black bg-gradient-to-r from-solar to-ember bg-clip-text text-transparent">$44.99</span>
                </div>
                <p class="text-lg text-cream/80 font-semibold">100 minutes</p>
              </div>

              <ul class="space-y-3 mb-8">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">~20 calls at 5 min each</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">All AI personas</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Schedule calls anytime</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Deep AI memory</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Priority support</span>
                </li>
              </ul>

              <button
                @click="purchasePackage('minutes_100')"
                :disabled="purchasing"
                class="block w-full text-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/20 hover:border-solar/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg v-if="purchasingSku === 'minutes_100'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ purchasingSku === 'minutes_100' ? 'Redirecting to Stripe...' : 'Buy 100 Minutes' }}
              </button>
            </div>
          </div>

        </div>

        <!-- Login prompt for non-authenticated users -->
        <p v-if="!isAuthenticated" class="text-center text-cream/60 mt-8 opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.5s]">
          <router-link to="/login" class="text-glow hover:text-ember transition-colors">Sign in or create an account</router-link> to purchase minutes.
        </p>
      </div>
    </section>

    <!-- Use Cases Section -->
    <section class="relative py-20 px-6">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-4xl lg:text-5xl font-[--font-display] font-bold text-center mb-4 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          What Will <span class="bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">You</span> Use It For?
        </h2>
        <p class="text-center text-cream/60 mb-12 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          Schedule AI calls for any situation
        </p>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Coaching -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.15s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-glow/20 to-ember/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Daily Coaching</h3>
            <p class="text-sm text-cream/60">Morning motivation, goal reviews, accountability check-ins with your AI coach.</p>
          </div>

          <!-- Check-ins -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-glow/20 to-ember/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Wellness Check-ins</h3>
            <p class="text-sm text-cream/60">Regular mental health check-ins, mood tracking, and supportive conversations.</p>
          </div>

          <!-- Reminders -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.25s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-glow/20 to-ember/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Smart Reminders</h3>
            <p class="text-sm text-cream/60">Medication reminders, appointment prep, task follow-ups that actually get done.</p>
          </div>

          <!-- Escape Calls -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30 group">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-solar/20 to-ember/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-solar" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Escape Calls</h3>
            <p class="text-sm text-cream/60">Need an out? Schedule an "important call" to gracefully exit any situation.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="relative py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl lg:text-5xl font-[--font-display] font-bold text-center mb-12 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          How It Works
        </h2>

        <div class="grid md:grid-cols-3 gap-8">
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] text-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-glow to-ember flex items-center justify-center mx-auto mb-4 text-deep text-2xl font-black">1</div>
            <h3 class="text-xl font-[--font-display] font-bold mb-2">Buy Minutes</h3>
            <p class="text-sm text-cream/60">Choose a package that fits your needs. Minutes never expire.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] text-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-glow to-ember flex items-center justify-center mx-auto mb-4 text-deep text-2xl font-black">2</div>
            <h3 class="text-xl font-[--font-display] font-bold mb-2">Schedule a Call</h3>
            <p class="text-sm text-cream/60">Pick a persona, set the time, and tell them what you want to talk about.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] text-center">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-glow to-ember flex items-center justify-center mx-auto mb-4 text-deep text-2xl font-black">3</div>
            <h3 class="text-xl font-[--font-display] font-bold mb-2">We Call You</h3>
            <p class="text-sm text-cream/60">Your AI calls your phone at the scheduled time. Real voice, real conversation.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="relative py-20 px-6">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-4xl lg:text-5xl font-[--font-display] font-bold text-center mb-12 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          Questions? Answered.
        </h2>

        <div class="space-y-4">
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Do minutes expire?</h3>
            <p class="text-cream/70">No! Your minutes never expire. Use them whenever you need them.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.15s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-lg font-[--font-display] font-bold mb-2">How long are calls?</h3>
            <p class="text-cream/70">You choose! Schedule 3, 5, 10, or 15-minute calls. Minutes are deducted based on actual call duration.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-lg font-[--font-display] font-bold mb-2">What makes this different from chat apps?</h3>
            <p class="text-cream/70">We call YOUR phone with a real voice conversation. It's proactive—schedule calls in advance so your AI reaches out to you, rather than you reaching out to an app.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.25s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Does the AI remember me?</h3>
            <p class="text-cream/70">Yes! Your AI personas remember past conversations, your preferences, and build a relationship with you over time.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[20px] p-6 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-lg font-[--font-display] font-bold mb-2">Can I get a refund?</h3>
            <p class="text-cream/70">We offer refunds for unused minutes within 30 days of purchase. Contact support if you need help.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="relative py-24 px-6 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-glow/15 via-ember/10 to-transparent"></div>
      <div class="absolute inset-0">
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-glow/20 via-ember/10 to-transparent blur-[100px]"></div>
      </div>

      <div class="relative max-w-4xl mx-auto text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-5xl lg:text-6xl font-[--font-display] font-black mb-6 tracking-tight leading-[1.1]">
          Ready for AI That <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Calls You</span>?
        </h2>
        <p class="text-xl text-cream/80 mb-10 max-w-2xl mx-auto">
          Start with 25 minutes for just $14.99. No subscription, no commitment.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            v-if="isAuthenticated"
            @click="purchasePackage('minutes_25')"
            :disabled="purchasing"
            class="inline-flex items-center justify-center px-12 py-5 text-xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_20px_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_24px_80px_rgba(251,191,36,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            <span class="relative z-10 flex items-center gap-3">
              <svg v-if="purchasingSku === 'minutes_25'" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ purchasingSku === 'minutes_25' ? 'Redirecting...' : 'Get Started Now' }}
              <svg v-if="!purchasing" class="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          <router-link
            v-else
            to="/login"
            class="inline-flex items-center justify-center px-12 py-5 text-xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[20px] overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_20px_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_24px_80px_rgba(251,191,36,0.5)] group"
          >
            <span class="relative z-10 flex items-center gap-3">
              Get 5 Free Minutes
              <svg class="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { createCheckoutSession } from '@/services/payments';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from '@/stores/toast';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const toast = useToast();

const purchasing = ref(false);
const purchasingSku = ref(null);
const balance = ref(null);
const loadingBalance = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);

// Fetch user's current balance
async function fetchBalance() {
  if (!isAuthenticated.value) return;

  loadingBalance.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('token');
    const response = await fetch(`${apiUrl}/api/user/balance`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const data = await response.json();
      balance.value = data.minutes || 0;
    }
  } catch (error) {
    console.error('Failed to fetch balance:', error);
  } finally {
    loadingBalance.value = false;
  }
}

// Handle payment result from redirect
function handlePaymentResult() {
  const payment = route.query.payment;
  if (payment === 'success') {
    toast.success('Payment successful! Your minutes have been added to your account.');
    // Refresh balance
    fetchBalance();
    // Clean up URL
    router.replace({ path: '/pricing' });
  } else if (payment === 'cancelled') {
    toast.warning('Payment was cancelled. No charges were made.');
    router.replace({ path: '/pricing' });
  }
}

async function purchasePackage(sku) {
  if (!isAuthenticated.value) {
    toast.info('Please sign in to purchase minutes.');
    router.push('/login?redirect=/pricing');
    return;
  }

  // Prevent double-clicks
  if (purchasing.value) return;

  purchasing.value = true;
  purchasingSku.value = sku;

  try {
    const { checkoutUrl } = await createCheckoutSession(sku);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      throw new Error('No checkout URL received');
    }
  } catch (error) {
    console.error('Purchase error:', error);
    toast.error(error.message || 'Failed to start checkout. Please try again.');
  } finally {
    purchasing.value = false;
    purchasingSku.value = null;
  }
}

onMounted(() => {
  handlePaymentResult();
  fetchBalance();
});
</script>

<style scoped>
/* Styles inherited from main.css */
</style>
