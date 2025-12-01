<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body] pt-24">
    <!-- Enhanced Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <div class="absolute w-[600px] h-[600px] top-[10%] right-[5%] opacity-15 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite] bg-gradient-radial from-glow via-ember to-transparent"></div>
      <div class="absolute w-[700px] h-[700px] bottom-[5%] -left-[200px] opacity-12 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse] bg-gradient-radial from-cyan-500 via-purple-500 to-transparent"></div>
    </div>

    <!-- Hero Section -->
    <section class="relative pt-20 pb-16 px-6">
      <div class="max-w-6xl mx-auto text-center">
        <h1 class="text-7xl lg:text-8xl font-[--font-display] font-black leading-[0.95] mb-8 tracking-tight opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          Meet Your
          <span class="block bg-gradient-to-r from-glow via-ember to-cyan-400 bg-clip-text text-transparent [text-shadow:0_0_60px_rgba(251,191,36,0.3)] mt-3 relative">
            AI Companions
            <span class="absolute -inset-2 bg-gradient-to-r from-glow/20 via-ember/20 to-cyan-500/20 blur-3xl -z-10"></span>
          </span>
        </h1>

        <p class="text-xl lg:text-2xl text-cream/80 leading-relaxed max-w-3xl mx-auto opacity-0 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s]">
          Not just voices - real relationships. They remember your story, celebrate your wins, and always have your back.
        </p>
      </div>
    </section>

    <!-- Personas Grid with Expandable Cards -->
    <section class="relative py-16 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          <!-- Brad Card -->
          <div
            @click="toggleExpanded('brad')"
            class="cursor-pointer opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 overflow-hidden group"
            :class="{ 'col-span-full': expandedPersona === 'brad', 'lg:col-span-2': expandedPersona === 'brad' }"
          >
            <div class="absolute w-[200px] h-[200px] bg-glow rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-4xl font-[--font-display] font-bold mb-2 relative z-10">Brad</h3>
                <p class="text-sm text-glow font-semibold uppercase tracking-[0.15em] relative z-10">The Motivating Coach</p>
              </div>
              <div class="text-3xl transform transition-transform duration-300" :class="{ 'rotate-180': expandedPersona === 'brad' }">
                <svg class="w-8 h-8 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Wake up to Brad's 6:30am call, not an alarm. He remembers you're training for that marathon, asks about yesterday's client meeting, and keeps your 47-day morning streak alive.
            </p>

            <!-- Expanded Content -->
            <transition name="expand">
              <div v-if="expandedPersona === 'brad'" class="mt-8 space-y-6">
                <div class="border-l-[3px] border-glow pl-5">
                  <p class="text-cream/90 italic text-lg mb-4">
                    "Morning champ! That's 47 days straight. You're not the same person who started this journey."
                  </p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-glow font-bold text-lg mb-3">Perfect For</h4>
                    <ul class="space-y-2 text-cream/70">
                      <li class="flex items-center gap-2">
                        <span class="text-glow">•</span> Morning accountability calls
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-glow">•</span> Workout motivation
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-glow">•</span> Goal tracking & check-ins
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-glow">•</span> Career development coaching
                      </li>
                    </ul>
                  </div>

                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-glow font-bold text-lg mb-3">Personality Traits</h4>
                    <div class="flex flex-wrap gap-2">
                      <span class="px-3 py-1.5 bg-glow/20 border border-glow/40 text-glow text-sm rounded-full font-semibold">Energetic</span>
                      <span class="px-3 py-1.5 bg-glow/20 border border-glow/40 text-glow text-sm rounded-full font-semibold">Supportive</span>
                      <span class="px-3 py-1.5 bg-glow/20 border border-glow/40 text-glow text-sm rounded-full font-semibold">Direct</span>
                      <span class="px-3 py-1.5 bg-glow/20 border border-glow/40 text-glow text-sm rounded-full font-semibold">Persistent</span>
                    </div>
                  </div>
                </div>

                <router-link
                  to="/login"
                  class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-glow to-ember rounded-xl text-deep font-bold hover:scale-105 transition-transform duration-300"
                >
                  Start with Brad
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </router-link>
              </div>
            </transition>
          </div>

          <!-- Sarah Card -->
          <div
            @click="toggleExpanded('sarah')"
            class="cursor-pointer opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.1s] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.06] hover:border-cyan-400/30 overflow-hidden group"
            :class="{ 'col-span-full': expandedPersona === 'sarah', 'lg:col-span-2': expandedPersona === 'sarah' }"
          >
            <div class="absolute w-[200px] h-[200px] bg-cyan-500 rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-4xl font-[--font-display] font-bold mb-2 relative z-10">Sarah</h3>
                <p class="text-sm text-cyan-400 font-semibold uppercase tracking-[0.15em] relative z-10">The Empathetic Friend</p>
              </div>
              <div class="text-3xl transform transition-transform duration-300" :class="{ 'rotate-180': expandedPersona === 'sarah' }">
                <svg class="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Your emergency contact for social escapes and life's tough moments. Sarah remembers your dating history, your parenting struggles, and always knows exactly what to say.
            </p>

            <transition name="expand">
              <div v-if="expandedPersona === 'sarah'" class="mt-8 space-y-6">
                <div class="border-l-[3px] border-cyan-400 pl-5">
                  <p class="text-cream/90 italic text-lg mb-4">
                    "Are you safe? Do you need me to keep talking or can you leave now? I've got you."
                  </p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-cyan-400 font-bold text-lg mb-3">Perfect For</h4>
                    <ul class="space-y-2 text-cream/70">
                      <li class="flex items-center gap-2">
                        <span class="text-cyan-400">•</span> Bad date escapes
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-cyan-400">•</span> Uncomfortable social situations
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-cyan-400">•</span> Emotional support calls
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-cyan-400">•</span> Life coaching moments
                      </li>
                    </ul>
                  </div>

                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-cyan-400 font-bold text-lg mb-3">Personality Traits</h4>
                    <div class="flex flex-wrap gap-2">
                      <span class="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 text-sm rounded-full font-semibold">Empathetic</span>
                      <span class="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 text-sm rounded-full font-semibold">Protective</span>
                      <span class="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 text-sm rounded-full font-semibold">Warm</span>
                      <span class="px-3 py-1.5 bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 text-sm rounded-full font-semibold">Intuitive</span>
                    </div>
                  </div>
                </div>

                <router-link
                  to="/login"
                  class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-deep font-bold hover:scale-105 transition-transform duration-300"
                >
                  Start with Sarah
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </router-link>
              </div>
            </transition>
          </div>

          <!-- Alex Card -->
          <div
            @click="toggleExpanded('alex')"
            class="cursor-pointer opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.06] hover:border-purple-400/30 overflow-hidden group"
            :class="{ 'col-span-full': expandedPersona === 'alex', 'lg:col-span-2': expandedPersona === 'alex' }"
          >
            <div class="absolute w-[200px] h-[200px] bg-purple-500 rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="text-4xl font-[--font-display] font-bold mb-2 relative z-10">Alex</h3>
                <p class="text-sm text-purple-400 font-semibold uppercase tracking-[0.15em] relative z-10">The Creative Challenger</p>
              </div>
              <div class="text-3xl transform transition-transform duration-300" :class="{ 'rotate-180': expandedPersona === 'alex' }">
                <svg class="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Practice your interview answers, rehearse that difficult conversation, or get a spontaneous adventure challenge. Alex pushes you to grow while keeping it fun.
            </p>

            <transition name="expand">
              <div v-if="expandedPersona === 'alex'" class="mt-8 space-y-6">
                <div class="border-l-[3px] border-purple-400 pl-5">
                  <p class="text-cream/90 italic text-lg mb-4">
                    "That answer was good, but you buried the lead. Start with the outcome, then explain the journey."
                  </p>
                </div>

                <div class="grid md:grid-cols-2 gap-6">
                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-purple-400 font-bold text-lg mb-3">Perfect For</h4>
                    <ul class="space-y-2 text-cream/70">
                      <li class="flex items-center gap-2">
                        <span class="text-purple-400">•</span> Interview preparation
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-purple-400">•</span> Difficult conversation practice
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-purple-400">•</span> Adventure challenges
                      </li>
                      <li class="flex items-center gap-2">
                        <span class="text-purple-400">•</span> Creative brainstorming
                      </li>
                    </ul>
                  </div>

                  <div class="bg-white/[0.05] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h4 class="text-purple-400 font-bold text-lg mb-3">Personality Traits</h4>
                    <div class="flex flex-wrap gap-2">
                      <span class="px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-400 text-sm rounded-full font-semibold">Creative</span>
                      <span class="px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-400 text-sm rounded-full font-semibold">Challenging</span>
                      <span class="px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-400 text-sm rounded-full font-semibold">Fun</span>
                      <span class="px-3 py-1.5 bg-purple-500/20 border border-purple-400/40 text-purple-400 text-sm rounded-full font-semibold">Insightful</span>
                    </div>
                  </div>
                </div>

                <router-link
                  to="/login"
                  class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl text-deep font-bold hover:scale-105 transition-transform duration-300"
                >
                  Start with Alex
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </router-link>
              </div>
            </transition>
          </div>

        </div>
      </div>
    </section>

    <!-- How Personas Work - Stylistic Diagram -->
    <section class="relative py-32 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-20 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <h2 class="text-6xl lg:text-7xl font-[--font-display] font-bold mb-6">
            How <span class="bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">Personas</span> Work
          </h2>
          <p class="text-xl text-cream/70 max-w-3xl mx-auto">
            Your AI companions remember, adapt, and grow with you over time
          </p>
        </div>

        <!-- Diagram -->
        <div class="relative opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.2s]">
          <!-- Central Hub -->
          <div class="flex justify-center mb-16">
            <div class="relative">
              <div class="w-48 h-48 rounded-full bg-gradient-to-br from-glow via-ember to-solar flex items-center justify-center text-deep font-black text-4xl shadow-[0_0_80px_rgba(251,191,36,0.6)] animate-pulse">
                YOU
              </div>
              <div class="absolute inset-0 rounded-full border-4 border-glow animate-ping opacity-20"></div>
            </div>
          </div>

          <!-- Connection Lines & Persona Nodes -->
          <div class="grid md:grid-cols-3 gap-12 relative">
            <!-- Line connectors (visual only) -->
            <div class="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 -translate-y-32 w-1 h-32 bg-gradient-to-b from-glow to-transparent"></div>

            <!-- Brad Node -->
            <div class="relative">
              <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-0.5 h-24 bg-gradient-to-b from-glow to-transparent"></div>
              <div class="bg-white/[0.05] backdrop-blur-xl border-2 border-glow/50 rounded-3xl p-8 text-center">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-glow to-ember flex items-center justify-center text-deep font-bold text-2xl shadow-[0_8px_32px_rgba(251,191,36,0.5)]">
                  B
                </div>
                <h3 class="text-2xl font-bold mb-3 text-glow">Brad</h3>
                <div class="space-y-2 text-sm text-cream/70">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Remembers your goals</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Tracks your streaks</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Celebrates your wins</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sarah Node -->
            <div class="relative">
              <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-0.5 h-24 bg-gradient-to-b from-cyan-400 to-transparent"></div>
              <div class="bg-white/[0.05] backdrop-blur-xl border-2 border-cyan-400/50 rounded-3xl p-8 text-center">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-deep font-bold text-2xl shadow-[0_8px_32px_rgba(34,211,238,0.5)]">
                  S
                </div>
                <h3 class="text-2xl font-bold mb-3 text-cyan-400">Sarah</h3>
                <div class="space-y-2 text-sm text-cream/70">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Knows your history</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Adapts to situations</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Always has your back</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alex Node -->
            <div class="relative">
              <div class="absolute -top-24 left-1/2 -translate-x-1/2 w-0.5 h-24 bg-gradient-to-b from-purple-400 to-transparent"></div>
              <div class="bg-white/[0.05] backdrop-blur-xl border-2 border-purple-400/50 rounded-3xl p-8 text-center">
                <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-deep font-bold text-2xl shadow-[0_8px_32px_rgba(168,85,247,0.5)]">
                  A
                </div>
                <h3 class="text-2xl font-bold mb-3 text-purple-400">Alex</h3>
                <div class="space-y-2 text-sm text-cream/70">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Challenges you</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Pushes boundaries</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-purple-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    <span>Makes it fun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feature Highlights -->
          <div class="mt-24 grid md:grid-cols-3 gap-8">
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-glow/20 to-ember/20 border border-glow/40 flex items-center justify-center">
                <svg class="w-8 h-8 text-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Add to Contacts</h3>
              <p class="text-cream/70">Choose your favorite personas and add them to your personal contact list</p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 flex items-center justify-center">
                <svg class="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Create Custom Personas</h3>
              <p class="text-cream/70">Design your own AI companion with unique personality and voice</p>
            </div>

            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 border border-purple-400/40 flex items-center justify-center">
                <svg class="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold mb-2">Share with Friends</h3>
              <p class="text-cream/70">Make personas public so others can discover and use them too</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="relative py-32 px-6">
      <div class="max-w-5xl mx-auto text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-7xl font-[--font-display] font-black mb-8">
          Ready to Meet <span class="bg-gradient-to-r from-glow via-ember to-cyan-400 bg-clip-text text-transparent">Your Team</span>?
        </h2>
        <p class="text-xl text-cream/80 mb-12 max-w-2xl mx-auto">
          Start with one persona, or bring the whole crew. They're ready when you are.
        </p>

        <router-link
          to="/login"
          class="inline-flex items-center justify-center px-16 py-7 text-2xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[24px] overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_20px_60px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_24px_80px_rgba(251,191,36,0.5)] group"
        >
          <span class="relative z-10 flex items-center gap-3">
            Start Free Trial
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
import { ref } from 'vue'

const expandedPersona = ref(null)

const toggleExpanded = (personaId) => {
  if (expandedPersona.value === personaId) {
    expandedPersona.value = null
  } else {
    expandedPersona.value = personaId
  }
}
</script>

<style scoped>
/* Expand transition */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 1000px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
