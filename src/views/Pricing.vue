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
    <section class="relative pt-40 pb-24 px-6">
      <div class="max-w-6xl mx-auto text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-glow/40 bg-gradient-to-r from-glow/10 to-ember/10 mb-8 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.2)] holographic opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <span class="w-2.5 h-2.5 bg-glow rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
          <span class="text-sm font-semibold tracking-[0.15em] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent uppercase">Simple, Transparent Pricing</span>
        </div>

        <h1 class="text-7xl lg:text-8xl font-[--font-display] font-black leading-[0.95] mb-8 tracking-tight opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          Choose Your
          <span class="block bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent [text-shadow:0_0_60px_rgba(251,191,36,0.3)] mt-3 relative">
            Perfect Plan
            <span class="absolute -inset-2 bg-gradient-to-r from-glow/20 via-ember/20 to-solar/20 blur-3xl -z-10"></span>
          </span>
        </h1>

        <p class="text-xl lg:text-2xl text-cream/80 leading-relaxed mb-12 max-w-3xl mx-auto opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          Pay only for what you use, or subscribe for unlimited calls. No hidden fees, no contracts.
        </p>

        <div class="flex items-center justify-center gap-6 text-base text-cream/60 opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            First call free
          </span>
          <span class="text-cream/30">•</span>
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Cancel anytime
          </span>
          <span class="text-cream/30">•</span>
          <span class="flex items-center gap-2 font-medium">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            No commitment
          </span>
        </div>
      </div>
    </section>

    <!-- Pricing Tiers -->
    <section class="relative py-24 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">

          <!-- Pay As You Go -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:shadow-[0_32px_100px_rgba(251,191,36,0.2)] holographic overflow-hidden group">
            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-glow/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10">
              <h3 class="text-2xl font-[--font-display] font-bold mb-2">Casual</h3>
              <p class="text-sm text-cream/60 mb-8">Perfect for trying us out</p>

              <div class="mb-8">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$4.99</span>
                  <span class="text-cream/60 text-lg">/ call</span>
                </div>
                <p class="text-xs text-cream/50">Pay only for what you use</p>
              </div>

              <ul class="space-y-4 mb-10">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Up to 5 minutes per call</span>
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
                  <span class="text-sm text-cream/80">Call scheduling</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Basic memory</span>
                </li>
              </ul>

              <router-link to="/register" class="block w-full text-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/20 hover:border-glow/40 transition-all duration-300">
                Get Started
              </router-link>
            </div>
          </div>

          <!-- Standard Plan -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border-2 border-glow/50 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/70 hover:shadow-[0_32px_100px_rgba(251,191,36,0.3)] holographic overflow-hidden group">
            <!-- Popular Badge -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-glow via-ember to-solar rounded-full text-deep text-xs font-black uppercase tracking-wider shadow-[0_8px_32px_rgba(251,191,36,0.4)]">
              Most Popular
            </div>

            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-glow/30 to-transparent -mr-20 -mt-20 rotate-45 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10 mt-4">
              <h3 class="text-2xl font-[--font-display] font-bold mb-2">Standard</h3>
              <p class="text-sm text-cream/60 mb-8">For regular users</p>

              <div class="mb-8">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$29.99</span>
                  <span class="text-cream/60 text-lg">/ month</span>
                </div>
                <p class="text-xs text-cream/50">Up to 10 calls per month</p>
              </div>

              <ul class="space-y-4 mb-10">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80"><strong>10 calls/month</strong> (5 min each)</span>
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
                  <span class="text-sm text-cream/80">Advanced memory</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Priority support</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-glow flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Extra calls at $4.99 each</span>
                </li>
              </ul>

              <router-link to="/register" class="block w-full text-center px-8 py-4 bg-gradient-to-r from-glow via-ember to-solar rounded-xl text-deep font-black hover:scale-[1.05] transition-all duration-300 shadow-[0_8px_32px_rgba(251,191,36,0.4)]">
                Start Free Trial
              </router-link>
            </div>
          </div>

          <!-- Power User Plan -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:shadow-[0_32px_100px_rgba(255,107,53,0.2)] holographic overflow-hidden group">
            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solar/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10">
              <h3 class="text-2xl font-[--font-display] font-bold mb-2">Power User</h3>
              <p class="text-sm text-cream/60 mb-8">For heavy usage</p>

              <div class="mb-8">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-5xl font-black bg-gradient-to-r from-solar to-ember bg-clip-text text-transparent">$49.99</span>
                  <span class="text-cream/60 text-lg">/ month</span>
                </div>
                <p class="text-xs text-cream/50">Up to 25 calls per month</p>
              </div>

              <ul class="space-y-4 mb-10">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80"><strong>25 calls/month</strong> (10 min each)</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Custom persona creation</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Deep memory</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Priority support</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-solar flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Extra calls at $2.99 each</span>
                </li>
              </ul>

              <router-link to="/register" class="block w-full text-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/20 hover:border-solar/40 transition-all duration-300">
                Get Started
              </router-link>
            </div>
          </div>

          <!-- Professional Plan -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s] relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-purple-500/50 hover:shadow-[0_32px_100px_rgba(168,85,247,0.2)] holographic overflow-hidden group">
            <!-- Corner accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div class="relative z-10">
              <h3 class="text-2xl font-[--font-display] font-bold mb-2">Professional</h3>
              <p class="text-sm text-cream/60 mb-8">Unlimited everything</p>

              <div class="mb-8">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$99.99</span>
                  <span class="text-cream/60 text-lg">/ month</span>
                </div>
                <p class="text-xs text-cream/50">Truly unlimited calls</p>
              </div>

              <ul class="space-y-4 mb-10">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80"><strong>Unlimited calls</strong> (15 min each)</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Voice cloning</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">API access</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">White-glove support</span>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span class="text-sm text-cream/80">Custom integrations</span>
                </li>
              </ul>

              <router-link to="/register" class="block w-full text-center px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-cream font-bold hover:bg-white/20 hover:border-purple-500/40 transition-all duration-300">
                Contact Sales
              </router-link>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Feature Comparison -->
    <section class="relative py-24 px-6">
      <div class="max-w-6xl mx-auto">
        <h2 class="text-5xl lg:text-6xl font-[--font-display] font-bold text-center mb-16 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          Compare Plans
        </h2>

        <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] overflow-x-auto">
          <table class="w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden">
            <thead>
              <tr class="border-b border-white/10">
                <th class="text-left p-6 font-[--font-display] font-bold text-lg">Feature</th>
                <th class="p-6 font-[--font-display] font-bold text-sm">Casual</th>
                <th class="p-6 font-[--font-display] font-bold text-sm bg-glow/10">Standard</th>
                <th class="p-6 font-[--font-display] font-bold text-sm">Power User</th>
                <th class="p-6 font-[--font-display] font-bold text-sm">Professional</th>
              </tr>
            </thead>
            <tbody class="text-sm">
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">Calls per month</td>
                <td class="p-6 text-center text-cream/70">Pay per call</td>
                <td class="p-6 text-center text-cream/70 bg-glow/5">10 calls</td>
                <td class="p-6 text-center text-cream/70">25 calls</td>
                <td class="p-6 text-center text-cream/70">Unlimited</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">Call duration</td>
                <td class="p-6 text-center text-cream/70">5 minutes</td>
                <td class="p-6 text-center text-cream/70 bg-glow/5">5 minutes</td>
                <td class="p-6 text-center text-cream/70">10 minutes</td>
                <td class="p-6 text-center text-cream/70">15 minutes</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">AI personas</td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
                <td class="p-6 text-center bg-glow/5"><span class="text-glow">✓</span></td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">Custom personas</td>
                <td class="p-6 text-center text-cream/30">-</td>
                <td class="p-6 text-center text-cream/30 bg-glow/5">-</td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">Memory depth</td>
                <td class="p-6 text-center text-cream/70">Basic</td>
                <td class="p-6 text-center text-cream/70 bg-glow/5">Advanced</td>
                <td class="p-6 text-center text-cream/70">Deep</td>
                <td class="p-6 text-center text-cream/70">Unlimited</td>
              </tr>
              <tr class="border-b border-white/5">
                <td class="p-6 font-semibold">Voice cloning</td>
                <td class="p-6 text-center text-cream/30">-</td>
                <td class="p-6 text-center text-cream/30 bg-glow/5">-</td>
                <td class="p-6 text-center text-cream/30">-</td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
              </tr>
              <tr>
                <td class="p-6 font-semibold">API access</td>
                <td class="p-6 text-center text-cream/30">-</td>
                <td class="p-6 text-center text-cream/30 bg-glow/5">-</td>
                <td class="p-6 text-center text-cream/30">-</td>
                <td class="p-6 text-center"><span class="text-glow">✓</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="relative py-24 px-6">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-5xl lg:text-6xl font-[--font-display] font-bold text-center mb-16 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          Frequently Asked Questions
        </h2>

        <div class="space-y-6">
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-xl font-[--font-display] font-bold mb-3">Is there a free trial?</h3>
            <p class="text-cream/70 leading-relaxed">Yes! Your first call is completely free—no credit card required. Experience the magic before you commit.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-xl font-[--font-display] font-bold mb-3">Can I cancel anytime?</h3>
            <p class="text-cream/70 leading-relaxed">Absolutely. Cancel your subscription at any time with no penalties or fees. We believe in earning your business every month.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-xl font-[--font-display] font-bold mb-3">What happens if I exceed my plan limits?</h3>
            <p class="text-cream/70 leading-relaxed">Standard and Power User plans allow extra calls at discounted rates ($4.99 and $2.99 respectively). You'll always be notified before exceeding your plan.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.4s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-xl font-[--font-display] font-bold mb-3">How does the memory system work?</h3>
            <p class="text-cream/70 leading-relaxed">Our AI personas remember your conversations, preferences, and history. Higher plans get deeper memory, meaning more context and more personalized interactions over time.</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.5s] bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/30">
            <h3 class="text-xl font-[--font-display] font-bold mb-3">Is my data secure and private?</h3>
            <p class="text-cream/70 leading-relaxed">Yes. All calls are encrypted, and we never share your data with third parties. You can delete your data at any time.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="relative py-32 px-6 overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-glow/15 via-ember/10 to-transparent"></div>
      <div class="absolute inset-0">
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-glow/20 via-ember/10 to-transparent blur-[100px]"></div>
      </div>

      <div class="relative max-w-5xl mx-auto text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-7xl font-[--font-display] font-black mb-8 tracking-tight leading-[1.1]">
          Ready to <span class="bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Get Started</span>?
        </h2>
        <p class="text-xl lg:text-2xl text-cream/80 mb-12 max-w-3xl mx-auto">
          Join thousands using Call Me Back for emergency escapes and daily motivation
        </p>

        <router-link
          to="/register"
          class="inline-flex items-center justify-center px-16 py-7 text-2xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[24px] overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_20px_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_24px_80px_rgba(251,191,36,0.5)] group"
        >
          <span class="relative z-10 flex items-center gap-3">
            Start Your Free Trial
            <svg class="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </router-link>
      </div>
    </section>

  </div>
</template>

<script setup>
// No additional logic needed for static pricing page
</script>

<style scoped>
/* Styles inherited from main.css */
</style>
