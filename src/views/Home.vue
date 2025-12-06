<template>
  <div class="min-h-screen bg-midnight text-cream overflow-x-hidden font-[--font-body]">
    <!-- Enhanced Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"></div>
      <!-- Morphing Orb 1 - Solar Orange -->
      <div class="absolute w-[700px] h-[700px] -top-[250px] -right-[250px] opacity-12 pointer-events-none blur-[120px] animate-[float_20s_ease-in-out_infinite,morph_15s_ease-in-out_infinite] bg-gradient-radial from-solar via-ember to-transparent"></div>
      <!-- Morphing Orb 2 - Golden -->
      <div class="absolute w-[600px] h-[600px] bottom-[5%] -left-[200px] opacity-15 pointer-events-none blur-[120px] animate-[float_25s_ease-in-out_infinite_reverse,morph_18s_ease-in-out_infinite] [animation-delay:5s] bg-gradient-radial from-glow via-glow-bright to-transparent"></div>
      <!-- Subtle accent orb for depth -->
      <div class="absolute w-[400px] h-[400px] top-[30%] right-[15%] opacity-8 pointer-events-none blur-[100px] animate-[float_22s_ease-in-out_infinite,morph_16s_ease-in-out_infinite] [animation-delay:3s] bg-gradient-radial from-ember to-transparent"></div>
    </div>

    <!-- Hero Section -->
    <section class="relative min-h-screen flex items-center overflow-hidden">
      <!-- Decorative Waveform Visualization -->
      <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <div class="flex items-end gap-[6px] h-[400px]">
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0s] h-[30%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.1s] h-[50%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.2s] h-[70%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.3s] h-[90%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.4s] h-[60%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.5s] h-[80%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.6s] h-[100%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.7s] h-[75%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.8s] h-[55%]"></div>
          <div class="w-[4px] bg-gradient-to-t from-glow to-ember rounded-full animate-[wave_2.5s_ease-in-out_infinite] [animation-delay:0.9s] h-[40%]"></div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
        <div class="grid lg:grid-cols-12 gap-16 items-center">
          <!-- Left: Content -->
          <div class="lg:col-span-7 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
            <!-- Status Badges Row -->
            <div class="flex flex-wrap items-center gap-4 mb-10">
              <!-- Live Voice AI Badge -->
              <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-glow/40 bg-gradient-to-r from-glow/10 to-ember/10 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.2)] holographic">
                <span class="w-2.5 h-2.5 bg-glow rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                <span class="text-sm font-semibold tracking-[0.15em] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent uppercase">Live Voice AI</span>
              </div>

              <!-- GitHub -->
              <a
                href="https://github.com/melshiD/call-me-back"
                target="_blank"
                rel="noopener noreferrer"
                class="group w-10 h-10 rounded-full border border-cream/20 bg-cream/[0.05] backdrop-blur-md flex items-center justify-center text-cream/70 transition-all duration-300 hover:border-cream/40 hover:bg-cream/[0.1] hover:text-cream hover:scale-110 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
                title="View source on GitHub"
              >
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            <h1 class="text-7xl lg:text-8xl xl:text-[10rem] font-[--font-display] font-extrabold leading-[0.9] mb-10 tracking-tight">
              Never Be
              <span class="block bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent [text-shadow:0_0_60px_rgba(251,191,36,0.3)] mt-3 relative">
                Stuck Again
                <span class="absolute -inset-2 bg-gradient-to-r from-glow/20 via-ember/20 to-solar/20 blur-3xl -z-10"></span>
              </span>
            </h1>

            <p class="text-xl lg:text-2xl text-cream/80 leading-relaxed mb-12 max-w-2xl">
              Real phone calls from AI companions who <span class="text-glow font-semibold">remember you</span>. Daily motivation,
              escape calls, and practice for life's biggest moments.
            </p>

            <div class="flex flex-col sm:flex-row gap-5 mb-10">
              <router-link
                to="/login"
                class="group relative inline-flex items-center justify-center px-10 py-6 text-lg font-bold text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_16px_50px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.8),0_20px_60px_rgba(251,191,36,0.5)] magnetic-hover"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Get 5 Free Minutes
                  <svg class="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </router-link>

              <router-link
                to="/login"
                class="group inline-flex items-center justify-center px-10 py-6 text-lg font-bold text-cream border-2 border-cream/30 rounded-2xl hover:border-glow/60 hover:bg-gradient-to-r hover:from-glow/10 hover:to-ember/10 transition-all duration-300 backdrop-blur-sm holographic"
              >
                <span class="group-hover:text-glow transition-colors duration-300">Sign In</span>
              </router-link>
            </div>

            <div class="flex items-center gap-3 text-sm text-cream/50">
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                5 minutes free
              </span>
              <span class="text-cream/30">·</span>
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                No commitment
              </span>
            </div>

            </div>

          <!-- Mobile Persona Cards (horizontal scroll) -->
          <div class="lg:hidden mt-12 -mx-6 px-6 overflow-x-auto scrollbar-hide">
            <div class="flex gap-4 pb-4 snap-x snap-mandatory">
              <!-- Brad -->
              <div class="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-2 border-glow rounded-2xl p-6 shadow-[0_12px_40px_rgba(251,191,36,0.3)]">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-glow/30 to-ember/30 border-2 border-glow flex items-center justify-center text-2xl font-black text-glow/80">B</div>
                  <div>
                    <h3 class="text-xl font-black text-glow uppercase">Brad</h3>
                    <span class="text-xs text-glow/70 font-bold uppercase tracking-wide">Coach</span>
                  </div>
                </div>
                <div class="bg-glow text-deep px-2 py-1 inline-block font-bold text-xs uppercase tracking-wider mb-2 rounded">NO EXCUSES</div>
                <p class="text-sm text-cream/80 leading-relaxed">Wake up to REAL motivation. Remembers your goals. Tracks progress. Zero tolerance for BS.</p>
              </div>
              <!-- Sarah -->
              <div class="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-2 border-cyan-400 rounded-2xl p-6 shadow-[0_12px_40px_rgba(34,211,238,0.3)]">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/30 to-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center text-2xl font-black text-cyan-400/80">S</div>
                  <div>
                    <h3 class="text-xl font-black text-cyan-400 uppercase">Sarah</h3>
                    <span class="text-xs text-cyan-400/70 font-bold uppercase tracking-wide">Friend</span>
                  </div>
                </div>
                <div class="bg-cyan-400 text-deep px-2 py-1 inline-block font-bold text-xs uppercase tracking-wider mb-2 rounded">ALWAYS THERE</div>
                <p class="text-sm text-cream/80 leading-relaxed">Emergency contact. Social escape artist. Knows your story. Gets you out gracefully.</p>
              </div>
              <!-- Alex -->
              <div class="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-2 border-solar rounded-2xl p-6 shadow-[0_12px_40px_rgba(255,107,53,0.3)]">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-solar/30 to-ember/30 border-2 border-solar flex items-center justify-center text-2xl font-black text-solar/80">A</div>
                  <div>
                    <h3 class="text-xl font-black text-solar uppercase">Alex</h3>
                    <span class="text-xs text-solar/70 font-bold uppercase tracking-wide">Pro</span>
                  </div>
                </div>
                <div class="bg-solar text-deep px-2 py-1 inline-block font-bold text-xs uppercase tracking-wider mb-2 rounded">LEVEL UP</div>
                <p class="text-sm text-cream/80 leading-relaxed">Practice hard conversations. Nail interviews. Push limits. Competitive growth mindset.</p>
              </div>
              <!-- Marcus -->
              <div class="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-2 border-purple-500 rounded-2xl p-6 shadow-[0_12px_40px_rgba(168,85,247,0.3)]">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 border-2 border-purple-500 flex items-center justify-center text-2xl font-black text-purple-500/80">M</div>
                  <div>
                    <h3 class="text-xl font-black text-purple-400 uppercase">Marcus</h3>
                    <span class="text-xs text-purple-400/70 font-bold uppercase tracking-wide">Closer</span>
                  </div>
                </div>
                <div class="bg-purple-500 text-deep px-2 py-1 inline-block font-bold text-xs uppercase tracking-wider mb-2 rounded">CLOSE DEALS</div>
                <p class="text-sm text-cream/80 leading-relaxed">Negotiation leverage. Strategic timing. Close with confidence.</p>
              </div>
              <!-- Jamie -->
              <div class="flex-shrink-0 w-[280px] snap-center bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-2 border-lime-400 rounded-2xl p-6 shadow-[0_12px_40px_rgba(163,230,53,0.3)]">
                <div class="flex items-center gap-3 mb-3">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-400/30 to-lime-500/30 border-2 border-lime-400 flex items-center justify-center text-2xl font-black text-lime-400/80">J</div>
                  <div>
                    <h3 class="text-xl font-black text-lime-400 uppercase">Jamie</h3>
                    <span class="text-xs text-lime-400/70 font-bold uppercase tracking-wide">Wild</span>
                  </div>
                </div>
                <div class="bg-lime-400 text-deep px-2 py-1 inline-block font-bold text-xs uppercase tracking-wider mb-2 rounded">LET'S GO!</div>
                <p class="text-sm text-cream/80 leading-relaxed">Random challenges. Road trip decision maker. Break routine. Say yes to life.</p>
              </div>
            </div>
          </div>

          <!-- Right: Interactive Persona Showcase (Desktop) -->
          <div class="lg:col-span-5 relative h-[600px] hidden lg:flex items-center justify-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
            <!-- Gradient fade masks at top and bottom -->
            <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-midnight to-transparent z-20 pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-midnight to-transparent z-20 pointer-events-none"></div>

            <!-- Navigation Dots -->
            <div class="absolute right-0 top-0 flex flex-col gap-3 z-30 pr-4 pt-2">
              <button
                v-for="(persona, index) in personas"
                :key="index"
                @click="scrollToPersona(index)"
                class="group relative w-3 h-3 transition-all duration-300"
                :class="activePersona === index ? 'scale-125' : 'scale-100 hover:scale-110'"
              >
                <!-- Outer glow ring -->
                <div
                  class="absolute inset-0 rounded-full transition-all duration-500"
                  :class="activePersona === index ? 'opacity-100 scale-150 blur-md' : 'opacity-0 scale-100'"
                  :style="{ backgroundColor: persona.color }"
                ></div>

                <!-- Main dot -->
                <div
                  class="relative w-full h-full rounded-full border-2 transition-all duration-300"
                  :class="activePersona === index ? 'bg-opacity-100 shadow-lg' : 'bg-opacity-30 border-opacity-50'"
                  :style="{
                    backgroundColor: activePersona === index ? persona.color : 'transparent',
                    borderColor: persona.color,
                    boxShadow: activePersona === index ? `0 0 20px ${persona.color}, 0 0 10px ${persona.color}` : 'none'
                  }"
                ></div>

                <!-- Pulse effect for active -->
                <div
                  v-if="activePersona === index"
                  class="absolute inset-0 rounded-full animate-ping"
                  :style="{ backgroundColor: persona.color }"
                  style="animation-duration: 2s;"
                ></div>
              </button>
            </div>

            <div ref="personaContainer" class="persona-showcase relative w-[320px] h-full overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory scrollbar-hide" @scroll="handleScroll">
              <!-- Persona cards - NO DUPLICATES, just the 5 personas -->
              <div class="flex flex-col gap-6">

                <!-- Brad Card - The No-Excuses Coach -->
                <div class="persona-card-wrapper flex-shrink-0 snap-start">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-glow rounded-[24px] shadow-[0_24px_80px_rgba(251,191,36,0.4)] h-[420px] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_32px_100px_rgba(251,191,36,0.6)]">
                    <!-- Dynamic diagonal stripes background -->
                    <div class="absolute inset-0 opacity-10" style="background: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(251,191,36,0.3) 20px, rgba(251,191,36,0.3) 40px);"></div>

                    <!-- Bold yellow accent block -->
                    <div class="absolute top-0 right-0 w-32 h-32 bg-glow -mr-8 -mt-8 rotate-12 opacity-90"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-ember -ml-6 -mb-6 -rotate-12 opacity-80"></div>

                    <!-- Portrait placeholder - Replace with actual image -->
                    <div class="relative z-10 w-36 h-36 mx-auto mt-6 mb-4 rounded-2xl overflow-hidden border-4 border-glow shadow-[0_12px_40px_rgba(251,191,36,0.6)] bg-gradient-to-br from-glow/30 to-ember/30 flex items-center justify-center">
                      <!-- Placeholder - Add actual portrait image here -->
                      <div class="text-6xl font-black text-glow/60 select-none">B</div>
                      <div class="absolute top-2 right-2 bg-deep text-glow text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">Coach</div>
                    </div>

                    <!-- Magazine-style text overlays -->
                    <div class="relative z-20 px-6">
                      <!-- Main name -->
                      <h3 class="text-5xl font-[--font-display] font-black text-glow mb-1 tracking-tight uppercase" style="text-shadow: 3px 3px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(251,191,36,0.3);">Brad</h3>

                      <!-- Punchy tagline -->
                      <div class="bg-glow text-deep px-3 py-1.5 inline-block font-black text-base uppercase tracking-wider mb-3 -rotate-1 shadow-lg">
                        NO EXCUSES
                      </div>

                      <!-- Badge cluster -->
                      <div class="flex flex-wrap gap-2 mb-3">
                        <div class="bg-deep border-2 border-glow text-glow px-3 py-1 text-xs font-bold uppercase rounded-lg">6:30AM DAILY</div>
                        <div class="bg-glow text-deep px-3 py-1 text-xs font-black uppercase rounded-lg">47 DAY STREAK</div>
                        <div class="bg-white/10 backdrop-blur text-cream px-3 py-1 text-xs font-bold uppercase rounded-lg">100% ACCOUNTABILITY</div>
                      </div>

                      <!-- Description with bold overlay -->
                      <div class="bg-glow/20 backdrop-blur border-l-4 border-glow p-3 mb-2">
                        <p class="text-sm text-cream font-semibold leading-tight">
                          Wake up to REAL motivation. Remembers your goals. Tracks progress. Zero tolerance for BS.
                        </p>
                      </div>

                      <!-- Stats callout -->
                      <div class="flex justify-between items-center bg-deep/80 rounded-xl p-2 border-2 border-glow/40">
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-glow">∞</div>
                          <div class="text-[9px] text-glow/70 uppercase font-bold">Motivation</div>
                        </div>
                        <div class="w-px h-8 bg-glow/30"></div>
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-glow">RISE</div>
                          <div class="text-[9px] text-glow/70 uppercase font-bold">& Grind</div>
                        </div>
                      </div>
                    </div>

                    <!-- Corner badge -->
                    <div class="absolute bottom-3 right-3 bg-glow text-deep w-12 h-12 rounded-full flex items-center justify-center font-black text-xl rotate-12 shadow-xl border-2 border-deep">
                      💪
                    </div>
                  </div>
                </div>

                <!-- Sarah Card - The Always-There Friend -->
                <div class="persona-card-wrapper flex-shrink-0 snap-start">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-cyan-400 rounded-[24px] shadow-[0_24px_80px_rgba(34,211,238,0.4)] h-[420px] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_32px_100px_rgba(34,211,238,0.6)]">
                    <!-- Dynamic pattern background -->
                    <div class="absolute inset-0 opacity-8" style="background-image: radial-gradient(circle, rgba(34,211,238,0.4) 1px, transparent 1px); background-size: 20px 20px;"></div>

                    <!-- Accent blocks -->
                    <div class="absolute top-0 left-0 w-28 h-28 bg-cyan-400 -ml-8 -mt-8 -rotate-12 opacity-90"></div>
                    <div class="absolute bottom-0 right-0 w-20 h-20 bg-cyan-500 -mr-4 -mb-4 rotate-12 opacity-80"></div>

                    <!-- Portrait placeholder -->
                    <div class="relative z-10 w-36 h-36 mx-auto mt-6 mb-4 rounded-2xl overflow-hidden border-4 border-cyan-400 shadow-[0_12px_40px_rgba(34,211,238,0.6)] bg-gradient-to-br from-cyan-400/30 to-cyan-500/30 flex items-center justify-center">
                      <!-- Placeholder - Add actual portrait image here -->
                      <div class="text-6xl font-black text-cyan-400/60 select-none">S</div>
                      <div class="absolute top-2 right-2 bg-deep text-cyan-400 text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">Friend</div>
                    </div>

                    <!-- Magazine-style text overlays -->
                    <div class="relative z-20 px-6">
                      <!-- Main name -->
                      <h3 class="text-5xl font-[--font-display] font-black text-cyan-400 mb-1 tracking-tight uppercase" style="text-shadow: 3px 3px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(34,211,238,0.3);">Sarah</h3>

                      <!-- Punchy tagline -->
                      <div class="bg-cyan-400 text-deep px-3 py-1.5 inline-block font-black text-base uppercase tracking-wider mb-3 rotate-1 shadow-lg">
                        ALWAYS THERE
                      </div>

                      <!-- Badge cluster -->
                      <div class="flex flex-wrap gap-2 mb-3">
                        <div class="bg-deep border-2 border-cyan-400 text-cyan-400 px-3 py-1 text-xs font-bold uppercase rounded-lg">24/7 SOS</div>
                        <div class="bg-cyan-400 text-deep px-3 py-1 text-xs font-black uppercase rounded-lg">INSTANT ESCAPE</div>
                        <div class="bg-white/10 backdrop-blur text-cream px-3 py-1 text-xs font-bold uppercase rounded-lg">YOUR LIFELINE</div>
                      </div>

                      <!-- Description -->
                      <div class="bg-cyan-400/20 backdrop-blur border-l-4 border-cyan-400 p-3 mb-2">
                        <p class="text-sm text-cream font-semibold leading-tight">
                          Emergency contact. Social escape artist. Knows your story. Gets you out gracefully.
                        </p>
                      </div>

                      <!-- Stats callout -->
                      <div class="flex justify-between items-center bg-deep/80 rounded-xl p-2 border-2 border-cyan-400/40">
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-cyan-400">911</div>
                          <div class="text-[9px] text-cyan-400/70 uppercase font-bold">Response</div>
                        </div>
                        <div class="w-px h-8 bg-cyan-400/30"></div>
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-cyan-400">∞</div>
                          <div class="text-[9px] text-cyan-400/70 uppercase font-bold">Empathy</div>
                        </div>
                      </div>
                    </div>

                    <!-- Corner badge -->
                    <div class="absolute bottom-3 right-3 bg-cyan-400 text-deep w-12 h-12 rounded-full flex items-center justify-center font-black text-xl -rotate-12 shadow-xl border-2 border-deep">
                      🛟
                    </div>
                  </div>
                </div>

                <!-- Alex Card - The Level-Up Challenger -->
                <div class="persona-card-wrapper flex-shrink-0 snap-start">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-solar rounded-[24px] shadow-[0_24px_80px_rgba(255,107,53,0.4)] h-[420px] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_32px_100px_rgba(255,107,53,0.6)]">
                    <!-- Geometric pattern background -->
                    <div class="absolute inset-0 opacity-10" style="background: repeating-linear-gradient(-45deg, transparent, transparent 15px, rgba(255,107,53,0.3) 15px, rgba(255,107,53,0.3) 30px);"></div>

                    <!-- Accent blocks -->
                    <div class="absolute top-0 right-0 w-32 h-32 bg-solar -mr-10 -mt-10 rotate-45 opacity-90"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-ember -ml-8 -mb-8 rotate-12 opacity-80"></div>

                    <!-- Portrait placeholder -->
                    <div class="relative z-10 w-36 h-36 mx-auto mt-6 mb-4 rounded-2xl overflow-hidden border-4 border-solar shadow-[0_12px_40px_rgba(255,107,53,0.6)] bg-gradient-to-br from-solar/30 to-ember/30 flex items-center justify-center">
                      <!-- Placeholder - Add actual portrait image here -->
                      <div class="text-6xl font-black text-solar/60 select-none">A</div>
                      <div class="absolute top-2 right-2 bg-deep text-solar text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">Pro</div>
                    </div>

                    <!-- Magazine-style text overlays -->
                    <div class="relative z-20 px-6">
                      <!-- Main name -->
                      <h3 class="text-5xl font-[--font-display] font-black text-solar mb-1 tracking-tight uppercase" style="text-shadow: 3px 3px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(255,107,53,0.3);">Alex</h3>

                      <!-- Punchy tagline -->
                      <div class="bg-solar text-deep px-3 py-1.5 inline-block font-black text-base uppercase tracking-wider mb-3 -rotate-2 shadow-lg">
                        LEVEL UP
                      </div>

                      <!-- Badge cluster -->
                      <div class="flex flex-wrap gap-2 mb-3">
                        <div class="bg-deep border-2 border-solar text-solar px-3 py-1 text-xs font-bold uppercase rounded-lg">INTERVIEW PREP</div>
                        <div class="bg-solar text-deep px-3 py-1 text-xs font-black uppercase rounded-lg">CHALLENGE MODE</div>
                        <div class="bg-white/10 backdrop-blur text-cream px-3 py-1 text-xs font-bold uppercase rounded-lg">GROWTH HACKER</div>
                      </div>

                      <!-- Description -->
                      <div class="bg-solar/20 backdrop-blur border-l-4 border-solar p-3 mb-2">
                        <p class="text-sm text-cream font-semibold leading-tight">
                          Practice hard conversations. Nail interviews. Push limits. Competitive growth mindset.
                        </p>
                      </div>

                      <!-- Stats callout -->
                      <div class="flex justify-between items-center bg-deep/80 rounded-xl p-2 border-2 border-solar/40">
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-solar">↗</div>
                          <div class="text-[9px] text-solar/70 uppercase font-bold">Next Level</div>
                        </div>
                        <div class="w-px h-8 bg-solar/30"></div>
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-solar">TOP 1%</div>
                          <div class="text-[9px] text-solar/70 uppercase font-bold">Mindset</div>
                        </div>
                      </div>
                    </div>

                    <!-- Corner badge -->
                    <div class="absolute bottom-3 right-3 bg-solar text-deep w-12 h-12 rounded-full flex items-center justify-center font-black text-xl rotate-12 shadow-xl border-2 border-deep">
                      ⚡
                    </div>
                  </div>
                </div>

                <!-- Marcus Card - The Deal Closer -->
                <div class="persona-card-wrapper flex-shrink-0 snap-start">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-purple-500 rounded-[24px] shadow-[0_24px_80px_rgba(168,85,247,0.4)] h-[420px] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_32px_100px_rgba(168,85,247,0.6)]">
                    <!-- Hexagon pattern background -->
                    <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 25px, rgba(168,85,247,0.3) 25px, rgba(168,85,247,0.3) 27px), repeating-linear-gradient(90deg, transparent, transparent 25px, rgba(168,85,247,0.3) 25px, rgba(168,85,247,0.3) 27px);"></div>

                    <!-- Accent blocks -->
                    <div class="absolute top-0 left-0 w-28 h-28 bg-purple-500 -ml-10 -mt-10 rotate-45 opacity-90"></div>
                    <div class="absolute bottom-0 right-0 w-24 h-24 bg-purple-600 -mr-8 -mb-8 -rotate-12 opacity-80"></div>

                    <!-- Portrait placeholder -->
                    <div class="relative z-10 w-36 h-36 mx-auto mt-6 mb-4 rounded-2xl overflow-hidden border-4 border-purple-500 shadow-[0_12px_40px_rgba(168,85,247,0.6)] bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                      <div class="text-6xl font-black text-purple-500/60 select-none">M</div>
                      <div class="absolute top-2 right-2 bg-deep text-purple-400 text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">Closer</div>
                    </div>

                    <!-- Magazine-style text overlays -->
                    <div class="relative z-20 px-6">
                      <h3 class="text-5xl font-[--font-display] font-black text-purple-400 mb-1 tracking-tight uppercase" style="text-shadow: 3px 3px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(168,85,247,0.3);">Marcus</h3>

                      <div class="bg-purple-500 text-deep px-3 py-1.5 inline-block font-black text-base uppercase tracking-wider mb-3 rotate-1 shadow-lg">
                        CLOSE DEALS
                      </div>

                      <div class="flex flex-wrap gap-2 mb-3">
                        <div class="bg-deep border-2 border-purple-500 text-purple-400 px-3 py-1 text-xs font-bold uppercase rounded-lg">NEGOTIATION</div>
                        <div class="bg-purple-500 text-deep px-3 py-1 text-xs font-black uppercase rounded-lg">SALES PRO</div>
                        <div class="bg-white/10 backdrop-blur text-cream px-3 py-1 text-xs font-bold uppercase rounded-lg">POWER MOVES</div>
                      </div>

                      <div class="bg-purple-500/20 backdrop-blur border-l-4 border-purple-500 p-3 mb-2">
                        <p class="text-sm text-cream font-semibold leading-tight">
                          Negotiation leverage. Strategic timing. Calls during deals to boost your position. Close with confidence.
                        </p>
                      </div>

                      <div class="flex justify-between items-center bg-deep/80 rounded-xl p-2 border-2 border-purple-500/40">
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-purple-400">$$$</div>
                          <div class="text-[9px] text-purple-400/70 uppercase font-bold">Value Add</div>
                        </div>
                        <div class="w-px h-8 bg-purple-500/30"></div>
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-purple-400">WIN</div>
                          <div class="text-[9px] text-purple-400/70 uppercase font-bold">Every Time</div>
                        </div>
                      </div>
                    </div>

                    <div class="absolute bottom-3 right-3 bg-purple-500 text-deep w-12 h-12 rounded-full flex items-center justify-center font-black text-xl -rotate-12 shadow-xl border-2 border-deep">
                      💼
                    </div>
                  </div>
                </div>

                <!-- Jamie Card - The Adventure Buddy -->
                <div class="persona-card-wrapper flex-shrink-0 snap-start">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-lime-400 rounded-[24px] shadow-[0_24px_80px_rgba(163,230,53,0.4)] h-[420px] overflow-hidden relative group transition-all duration-500 hover:shadow-[0_32px_100px_rgba(163,230,53,0.6)]">
                    <!-- Wave pattern background -->
                    <div class="absolute inset-0 opacity-10" style="background: repeating-radial-gradient(circle at 0 0, transparent 0, rgba(163,230,53,0.3) 25px, transparent 50px);"></div>

                    <!-- Accent blocks -->
                    <div class="absolute top-0 right-0 w-32 h-32 bg-lime-400 -mr-12 -mt-12 -rotate-45 opacity-90"></div>
                    <div class="absolute bottom-0 left-0 w-20 h-20 bg-lime-500 -ml-6 -mb-6 rotate-12 opacity-80"></div>

                    <!-- Portrait placeholder -->
                    <div class="relative z-10 w-36 h-36 mx-auto mt-6 mb-4 rounded-2xl overflow-hidden border-4 border-lime-400 shadow-[0_12px_40px_rgba(163,230,53,0.6)] bg-gradient-to-br from-lime-400/30 to-lime-500/30 flex items-center justify-center">
                      <div class="text-6xl font-black text-lime-400/60 select-none">J</div>
                      <div class="absolute top-2 right-2 bg-deep text-lime-400 text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">Wild</div>
                    </div>

                    <!-- Magazine-style text overlays -->
                    <div class="relative z-20 px-6">
                      <h3 class="text-5xl font-[--font-display] font-black text-lime-400 mb-1 tracking-tight uppercase" style="text-shadow: 3px 3px 0px rgba(0,0,0,0.8), -1px -1px 0px rgba(163,230,53,0.3);">Jamie</h3>

                      <div class="bg-lime-400 text-deep px-3 py-1.5 inline-block font-black text-base uppercase tracking-wider mb-3 -rotate-2 shadow-lg">
                        LET'S GO!
                      </div>

                      <div class="flex flex-wrap gap-2 mb-3">
                        <div class="bg-deep border-2 border-lime-400 text-lime-400 px-3 py-1 text-xs font-bold uppercase rounded-lg">SPONTANEOUS</div>
                        <div class="bg-lime-400 text-deep px-3 py-1 text-xs font-black uppercase rounded-lg">ADVENTURE</div>
                        <div class="bg-white/10 backdrop-blur text-cream px-3 py-1 text-xs font-bold uppercase rounded-lg">LIVE WILD</div>
                      </div>

                      <div class="bg-lime-400/20 backdrop-blur border-l-4 border-lime-400 p-3 mb-2">
                        <p class="text-sm text-cream font-semibold leading-tight">
                          Random challenges. Road trip decision maker. Break routine. Say yes to life. Your fun enabler.
                        </p>
                      </div>

                      <div class="flex justify-between items-center bg-deep/80 rounded-xl p-2 border-2 border-lime-400/40">
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-lime-400">🎲</div>
                          <div class="text-[9px] text-lime-400/70 uppercase font-bold">Random Fun</div>
                        </div>
                        <div class="w-px h-8 bg-lime-400/30"></div>
                        <div class="text-center flex-1">
                          <div class="text-xl font-black text-lime-400">YOLO</div>
                          <div class="text-[9px] text-lime-400/70 uppercase font-bold">Mindset</div>
                        </div>
                      </div>
                    </div>

                    <div class="absolute bottom-3 right-3 bg-lime-400 text-deep w-12 h-12 rounded-full flex items-center justify-center font-black text-xl rotate-12 shadow-xl border-2 border-deep">
                      🚀
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Hook Story -->
    <section class="py-32 relative">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] bg-white/[0.03] backdrop-blur-xl border border-white/10 border-l-4 border-l-glow rounded-[32px] p-10 lg:p-14 transition-all duration-[400ms] hover:bg-white/[0.05] hover:border-glow/30 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(251,191,36,0.1)]">
          <h3 class="text-4xl lg:text-5xl font-[--font-display] font-bold mb-6 text-glow">
            Bad Date? Get Your Escape Call
          </h3>
          <div class="space-y-4 text-lg lg:text-xl text-cream/80 leading-relaxed">
            <p>
              You're 30 minutes into a coffee date. It's... not great. Your phone rings - it's Sarah,
              your "best friend." She sounds genuinely concerned: <span class="italic text-cream font-medium">"Hey, I'm so sorry to interrupt,
              but I really need your help with something urgent."</span>
            </p>
            <p class="text-glow font-medium">
              Exit gracefully. No hurt feelings. No awkwardness.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-32 relative">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-28 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <h2 class="text-6xl lg:text-7xl font-[--font-display] font-extrabold mb-6 tracking-tight">
            How It <span class="italic font-[--font-accent] bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent">Works</span>
          </h2>
          <p class="text-xl text-cream/60 max-w-2xl mx-auto">Three simple steps to to </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
          <!-- Step 1 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:shadow-[0_32px_100px_rgba(251,191,36,0.2)] holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-glow/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-glow to-ember text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-transform duration-300">
              1
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-glow transition-colors duration-300">Schedule or Trigger</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              Set a call to be made sometime in the future, or have your persona call now. <span class="text-cream font-semibold">You're always in control.</span>
            </p>
          </div>

          <!-- Step 2 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-ember/50 hover:shadow-[0_32px_100px_rgba(255,140,66,0.2)] holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-ember/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-ember to-solar text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(255,140,66,0.5)] group-hover:scale-110 transition-transform duration-300">
              2
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-ember transition-colors duration-300">Get the Call</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              Your AI persona calls ready and in character for the call. <span class="text-cream font-semibold">Sounds real, feels natural.</span>
            </p>
          </div>

          <!-- Step 3 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:shadow-[0_32px_100px_rgba(255,107,53,0.2)] holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solar/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-solar to-plasma text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(255,107,53,0.5)] group-hover:scale-110 transition-transform duration-300">
              3
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-solar transition-colors duration-300">Leave Satisfied</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              When the call is done, your personas don't forget you or the relationship they have with you.  Call them back from you phone or schedule another call later. <span class="text-cream font-semibold">No guilt, no drama.</span>
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Personas -->
    <section class="py-32 relative">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <h2 class="text-6xl lg:text-7xl font-[--font-display] font-bold mb-6">
            Meet Your AI Companions
          </h2>
          <p class="text-2xl text-cream/70 max-w-3xl mx-auto leading-relaxed">
            Not just voices - relationships. They remember your goals, celebrate your wins, and care about your story.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Brad -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 overflow-hidden group">
            <div class="absolute w-[200px] h-[200px] bg-glow rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>
            <h3 class="text-3xl font-[--font-display] font-bold mb-2 relative z-10">Brad</h3>
            <p class="text-sm text-glow font-semibold mb-6 uppercase tracking-[0.15em] relative z-10">The Motivating Coach</p>
            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Wake up to Brad's 6:30am call, not an alarm. He remembers you're training for that marathon,
              asks about yesterday's client meeting, and keeps your 47-day morning streak alive.
            </p>
            <div class="border-l-[3px] border-white/15 pl-5 mt-6 relative z-10">
              <p class="text-sm text-cream/60 italic">
                "Morning champ! That's 47 days straight. You're not the same person who started this journey."
              </p>
            </div>
          </div>

          <!-- Sarah -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 overflow-hidden group">
            <div class="absolute w-[200px] h-[200px] bg-cyan-500 rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>
            <h3 class="text-3xl font-[--font-display] font-bold mb-2 relative z-10">Sarah</h3>
            <p class="text-sm text-cyan-400 font-semibold mb-6 uppercase tracking-[0.15em] relative z-10">The Empathetic Friend</p>
            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Your emergency contact for social escapes and life's tough moments. Sarah remembers your
              dating history, your parenting struggles, and always knows exactly what to say.
            </p>
            <div class="border-l-[3px] border-white/15 pl-5 mt-6 relative z-10">
              <p class="text-sm text-cream/60 italic">
                "Are you safe? Do you need me to keep talking or can you leave now? I've got you."
              </p>
            </div>
          </div>

          <!-- Alex -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 overflow-hidden group">
            <div class="absolute w-[200px] h-[200px] bg-purple-500 rounded-full -top-[100px] -right-[100px] blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"></div>
            <h3 class="text-3xl font-[--font-display] font-bold mb-2 relative z-10">Alex</h3>
            <p class="text-sm text-purple-400 font-semibold mb-6 uppercase tracking-[0.15em] relative z-10">The Creative Challenger</p>
            <p class="text-cream/70 leading-relaxed mb-6 text-lg relative z-10">
              Practice your interview answers, rehearse that difficult conversation, or get a spontaneous
              adventure challenge. Alex pushes you to grow while keeping it fun.
            </p>
            <div class="border-l-[3px] border-white/15 pl-5 mt-6 relative z-10">
              <p class="text-sm text-cream/60 italic">
                "That answer was good, but you buried the lead. Start with the outcome, then explain the journey."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Differentiation -->
    <section class="py-32 relative">
      <div class="absolute inset-0 bg-gradient-to-br from-glow/10 via-transparent to-cyan-500/5"></div>
      <div class="relative max-w-5xl mx-auto px-6 lg:px-12 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-7xl font-[--font-display] font-bold mb-16">
          What Makes Us Different
        </h2>
        <div class="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] p-12 lg:p-16">
          <p class="text-4xl lg:text-5xl font-light leading-tight mb-10">
            Other apps give you robocalls.<br/>
            We give you <span class="font-bold text-glow">relationships</span>.
          </p>
          <p class="text-xl text-cream/70 leading-relaxed max-w-3xl mx-auto">
            Brad remembers this is your third PM interview this month and how the last one went.
            Sarah knows your dog's name and how great your week was. Alex tracks
            your adventure streak and celebrates when you push past your comfort zone.
          </p>
        </div>
      </div>
    </section>

    <!-- Use Cases -->
    <section class="py-32 relative">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          <h2 class="text-6xl lg:text-7xl font-[--font-display] font-bold mb-6">
            Calls for Every Situation
          </h2>
          <p class="text-2xl text-cream/70 max-w-3xl mx-auto">
            Your AI companion for life's biggest moments and everyday challenges
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:50ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Social Escapes</h3>
            <p class="text-sm text-cream/60">Bad dates, boring events, guests who won't leave</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Daily Accountability</h3>
            <p class="text-sm text-cream/60">Morning wake-ups, workout motivation, habit building</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:150ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Career Power</h3>
            <p class="text-sm text-cream/60">Negotiation leverage, meeting enforcers, interview prep</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Safe Practice</h3>
            <p class="text-sm text-cream/60">Difficult conversations, presentations, high-stakes prep</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:250ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Life Balance</h3>
            <p class="text-sm text-cream/60">Bedtime wind-down, parenting support, stress management</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Life Adventures</h3>
            <p class="text-sm text-cream/60">Random challenges, road trip companion, decision maker</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:350ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Time Protection</h3>
            <p class="text-sm text-cream/60">Hard stops for meetings, calendar enforcement</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:400ms] bg-white/[0.03] backdrop-blur-[10px] border border-white/10 rounded-[20px] p-8 transition-all duration-300 hover:bg-white/[0.06] hover:border-glow/40 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(251,191,36,0.1)]">
            <h3 class="font-semibold text-lg mb-2">Social Energy</h3>
            <p class="text-sm text-cream/60">Networking breathers, social battery recharge</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="py-32 relative">
      <div class="max-w-4xl mx-auto px-6 lg:px-12">
        <h2 class="text-5xl lg:text-6xl font-[--font-display] font-bold text-center mb-20 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
          Real Scenarios, Real Results
        </h2>

        <div class="space-y-6">
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] bg-white/[0.03] backdrop-blur-xl border border-white/10 border-l-4 border-l-glow rounded-3xl p-10 transition-all duration-[400ms] hover:bg-white/[0.05] hover:border-l-glow-bright hover:translate-x-2 hover:shadow-[0_16px_48px_rgba(251,191,36,0.12)]">
            <p class="text-xl text-cream/90 leading-relaxed mb-5">
              <span class="font-bold text-cream">"Used it before my salary negotiation.</span> Got the call from 'my advisor'
              mid-negotiation reminding me of my walk-away number. Landed $15k more than their initial offer.
              $100/year for the app. $15,000 increase. ROI: 15,000%."
            </p>
            <p class="text-sm text-cream/50">— Professional user, LinkedIn</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] bg-white/[0.03] backdrop-blur-xl border border-white/10 border-l-4 border-l-glow rounded-3xl p-10 transition-all duration-[400ms] hover:bg-white/[0.05] hover:border-l-glow-bright hover:translate-x-2 hover:shadow-[0_16px_48px_rgba(251,191,36,0.12)]">
            <p class="text-xl text-cream/90 leading-relaxed mb-5">
              <span class="font-bold text-cream">"47-day morning wake-up streak.</span> Turns out I needed accountability, not a louder alarm. Brad calls at 6:30am every day. Haven't snoozed once."
            </p>
            <p class="text-sm text-cream/50">— Habit builder, Reddit</p>
          </div>

          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] bg-white/[0.03] backdrop-blur-xl border border-white/10 border-l-4 border-l-glow rounded-3xl p-10 transition-all duration-[400ms] hover:bg-white/[0.05] hover:border-l-glow-bright hover:translate-x-2 hover:shadow-[0_16px_48px_rgba(251,191,36,0.12)]">
            <p class="text-xl text-cream/90 leading-relaxed mb-5">
              <span class="font-bold text-cream">"School called about my daughter's behavior.</span> Old me would've walked in
              defensive and emotional. Called Brad in the parking lot first. He helped me get centered. Walked in calm,
              listened, worked together on a plan. That's parenting I can be proud of."
            </p>
            <p class="text-sm text-cream/50">— Parent, Twitter</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing CTA -->
    <section class="py-32 relative overflow-hidden">
      <!-- Accent gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-glow/5 to-transparent"></div>

      <div class="relative max-w-5xl mx-auto px-6 lg:px-12 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-7xl font-[--font-display] font-extrabold mb-6 tracking-tight">
          Pay Only <span class="italic font-[--font-accent] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">What You Use</span>
        </h2>
        <p class="text-2xl text-cream/70 mb-16">
          Buy minutes, use them whenever. No subscriptions, no expiration.
        </p>

        <div class="grid md:grid-cols-3 gap-8 mb-16">
          <!-- Starter - 25 Minutes -->
          <router-link to="/pricing" class="relative group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:shadow-[0_24px_80px_rgba(251,191,36,0.2)] holographic cursor-pointer block">
            <h3 class="text-2xl font-[--font-display] font-bold mb-2">Starter</h3>
            <div class="flex items-baseline justify-center gap-2 mb-2">
              <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$14.99</span>
            </div>
            <p class="text-lg text-cream/80 font-semibold mb-4">25 minutes</p>
            <ul class="text-sm text-cream/70 space-y-2 text-left">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                ~5 calls at 5 min each
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                All AI personas
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Minutes never expire
              </li>
            </ul>
          </router-link>

          <!-- Basic - 50 Minutes -->
          <router-link to="/pricing" class="relative group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border-2 border-glow/50 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/70 hover:shadow-[0_32px_100px_rgba(251,191,36,0.3)] holographic cursor-pointer block">
            <h3 class="text-2xl font-[--font-display] font-bold mb-2">Basic</h3>
            <div class="flex items-baseline justify-center gap-2 mb-2">
              <span class="text-5xl font-black bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">$24.99</span>
            </div>
            <p class="text-lg text-cream/80 font-semibold mb-1">50 minutes</p>
            <p class="text-xs text-cream/50 mb-4"><span class="text-glow">Save 17%</span></p>
            <ul class="text-sm text-cream/70 space-y-2 text-left">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                ~10 calls at 5 min each
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                All AI personas
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Priority support
              </li>
            </ul>
          </router-link>

          <!-- Plus - 100 Minutes -->
          <router-link to="/pricing" class="relative group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-10 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:shadow-[0_24px_80px_rgba(255,107,53,0.2)] holographic cursor-pointer block">
            <h3 class="text-2xl font-[--font-display] font-bold mb-2">Plus</h3>
            <div class="flex items-baseline justify-center gap-2 mb-2">
              <span class="text-5xl font-black bg-gradient-to-r from-solar to-ember bg-clip-text text-transparent">$44.99</span>
            </div>
            <p class="text-lg text-cream/80 font-semibold mb-1">100 minutes</p>
            <p class="text-xs text-cream/50 mb-4"><span class="text-solar">Save 25%</span></p>
            <ul class="text-sm text-cream/70 space-y-2 text-left">
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-solar flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                ~20 calls at 5 min each
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-solar flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Deep AI memory
              </li>
              <li class="flex items-center gap-2">
                <svg class="w-4 h-4 text-solar flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Priority support
              </li>
            </ul>
          </router-link>
        </div>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
          <router-link
            to="/pricing"
            class="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-glow via-ember to-solar rounded-xl text-deep font-black text-lg hover:scale-105 transition-transform duration-300 shadow-[0_12px_40px_rgba(251,191,36,0.4)]"
          >
            Get Started
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </router-link>

          <div class="inline-flex items-center gap-3 bg-gradient-to-r from-glow/15 to-ember/15 border-2 border-glow/40 rounded-xl px-6 py-3 backdrop-blur-sm">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="text-cream text-sm font-semibold">Minutes never expire</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="relative py-40 overflow-hidden">
      <!-- Dramatic gradient backdrop -->
      <div class="absolute inset-0 bg-gradient-to-t from-glow/15 via-ember/10 to-transparent"></div>
      <div class="absolute inset-0">
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-glow/20 via-ember/10 to-transparent blur-[100px]"></div>
      </div>

      <div class="relative max-w-5xl mx-auto px-6 lg:px-12 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-8xl font-[--font-display] font-black mb-12 tracking-tight leading-[1.1]">
          Ready to <span class="block mt-2 bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent italic font-[--font-accent]">Never Be Stuck</span> Again?
        </h2>
        <p class="text-2xl lg:text-3xl text-cream/80 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
          Join thousands using Call Me Back for <span class="text-glow font-semibold">emergency calls</span> and <span class="text-ember font-semibold">daily wins</span>
        </p>

        <div class="flex flex-col items-center gap-6 mb-12">
          <router-link
            to="/login"
            class="group relative inline-flex items-center justify-center px-16 py-8 text-2xl lg:text-3xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[28px] overflow-hidden transition-all duration-500 hover:scale-[1.08] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_24px_80px_rgba(251,191,36,0.5)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_32px_100px_rgba(251,191,36,0.6)] magnetic-hover"
          >
            <span class="relative z-10 flex items-center gap-3">
              Get 5 Free Minutes
              <svg class="w-7 h-7 group-hover:translate-x-3 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div class="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
          </router-link>

          <div class="flex items-center gap-6 text-base text-cream/60">
            <span class="flex items-center gap-2 font-medium">
              <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              5 minutes free
            </span>
            <span class="text-cream/30">•</span>
            <span class="flex items-center gap-2 font-medium">
              <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              No commitment
            </span>
            <span class="text-cream/30">•</span>
            <span class="flex items-center gap-2 font-medium">
              <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              Pay-as-you-go
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Persona data with colors for navigation dots
const personas = [
  { name: 'Brad', color: '#fbbf24' }, // glow
  { name: 'Sarah', color: '#22d3ee' }, // cyan-400
  { name: 'Alex', color: '#ff6b35' }, // solar
  { name: 'Marcus', color: '#a855f7' }, // purple-500
  { name: 'Jamie', color: '#a3e635' }  // lime-400
];

// Reactive state
const activePersona = ref(0);
const personaContainer = ref(null);

// Scroll to a specific persona
const scrollToPersona = (index) => {
  if (personaContainer.value) {
    const cards = personaContainer.value.querySelectorAll('.persona-card-wrapper');
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};

// Detect which persona is currently in view
const handleScroll = () => {
  if (!personaContainer.value) return;

  const container = personaContainer.value;
  const cards = container.querySelectorAll('.persona-card-wrapper');
  const containerRect = container.getBoundingClientRect();
  const containerCenter = containerRect.top + containerRect.height / 2;

  let closestIndex = 0;
  let closestDistance = Infinity;

  cards.forEach((card, index) => {
    const cardRect = card.getBoundingClientRect();
    const cardCenter = cardRect.top + cardRect.height / 2;
    const distance = Math.abs(cardCenter - containerCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  activePersona.value = closestIndex;
};

// Setup scroll listener
onMounted(() => {
  if (personaContainer.value) {
    personaContainer.value.addEventListener('scroll', handleScroll);
  }
});

onUnmounted(() => {
  if (personaContainer.value) {
    personaContainer.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
/* Hide scrollbar but keep functionality */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari, Opera */
}
</style>
