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
            <!-- Status Badge -->
            <div class="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-glow/40 bg-gradient-to-r from-glow/10 to-ember/10 mb-10 backdrop-blur-md shadow-[0_4px_20px_rgba(251,191,36,0.2)] holographic">
              <span class="w-2.5 h-2.5 bg-glow rounded-full animate-[pulseGlow_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
              <span class="text-sm font-semibold tracking-[0.15em] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent uppercase">Live Voice AI</span>
            </div>

            <h1 class="text-7xl lg:text-8xl xl:text-[10rem] font-[--font-display] font-extrabold leading-[0.9] mb-10 tracking-tight">
              Never Be
              <span class="block bg-gradient-to-r from-glow via-ember to-solar bg-clip-text text-transparent [text-shadow:0_0_60px_rgba(251,191,36,0.3)] mt-3 relative">
                Stuck Again
                <span class="absolute -inset-2 bg-gradient-to-r from-glow/20 via-ember/20 to-solar/20 blur-3xl -z-10"></span>
              </span>
            </h1>

            <p class="text-xl lg:text-2xl text-cream/80 leading-relaxed mb-12 max-w-2xl">
              Real phone calls from AI companions who <span class="text-glow font-semibold">remember you</span>. Emergency escapes,
              daily motivation, and practice for life's biggest moments.
            </p>

            <div class="flex flex-col sm:flex-row gap-5 mb-10">
              <router-link
                to="/register"
                class="group relative inline-flex items-center justify-center px-10 py-6 text-lg font-bold text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:bg-[position:100%_0] shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_16px_50px_rgba(251,191,36,0.4)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.8),0_20px_60px_rgba(251,191,36,0.5)] magnetic-hover"
              >
                <span class="relative z-10 flex items-center gap-2">
                  Start Free Trial
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
                First call free
              </span>
              <span class="text-cream/30">·</span>
              <span class="flex items-center gap-2">
                <svg class="w-4 h-4 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                No credit card
              </span>
            </div>
          </div>

          <!-- Right: 3D Rotating Carousel -->
          <div class="lg:col-span-5 relative h-[600px] hidden lg:flex items-center justify-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:0.3s]">
            <div class="carousel-container" style="perspective: 1200px; perspective-origin: 50% 50%;">
              <div class="carousel-track animate-[carouselSpin_20s_linear_infinite] hover:[animation-play-state:paused]" style="transform-style: preserve-3d; width: 300px; height: 450px; position: relative;">

                <!-- Brad Card - The No-Excuses Coach -->
                <div class="carousel-card" style="transform: rotateY(0deg) translateZ(380px);">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-glow rounded-[24px] shadow-[0_24px_80px_rgba(251,191,36,0.4)] h-full overflow-hidden relative group">
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
                <div class="carousel-card" style="transform: rotateY(120deg) translateZ(380px);">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-cyan-400 rounded-[24px] shadow-[0_24px_80px_rgba(34,211,238,0.4)] h-full overflow-hidden relative group">
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
                <div class="carousel-card" style="transform: rotateY(240deg) translateZ(380px);">
                  <div class="persona-card bg-gradient-to-br from-black via-deep/95 to-black backdrop-blur-xl border-4 border-solar rounded-[24px] shadow-[0_24px_80px_rgba(255,107,53,0.4)] h-full overflow-hidden relative group">
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
          <p class="text-xl text-cream/60 max-w-2xl mx-auto">Three simple steps to your perfect escape or daily motivation</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
          <!-- Step 1 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-glow/50 hover:-translate-y-3 hover:shadow-[0_32px_100px_rgba(251,191,36,0.2)] magnetic-hover holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-glow/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-glow to-ember text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(251,191,36,0.5)] group-hover:scale-110 transition-transform duration-300">
              1
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-glow transition-colors duration-300">Schedule or Trigger</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              Set a call before your date, or tap for an instant rescue. <span class="text-cream font-semibold">You're always in control.</span>
            </p>
          </div>

          <!-- Step 2 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-ember/50 hover:-translate-y-3 hover:shadow-[0_32px_100px_rgba(255,140,66,0.2)] magnetic-hover holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-ember/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-ember to-solar text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(255,140,66,0.5)] group-hover:scale-110 transition-transform duration-300">
              2
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-ember transition-colors duration-300">Get the Call</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              Your AI persona calls with a believable scenario. <span class="text-cream font-semibold">Sounds real, feels natural.</span>
            </p>
          </div>

          <!-- Step 3 - Enhanced with diagonal accent -->
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.12] hover:border-solar/50 hover:-translate-y-3 hover:shadow-[0_32px_100px_rgba(255,107,53,0.2)] magnetic-hover holographic overflow-hidden">
            <!-- Diagonal accent strip -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-solar/20 to-transparent -mr-16 -mt-16 rotate-45 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="absolute -top-5 -left-5 w-[70px] h-[70px] bg-gradient-to-br from-solar to-plasma text-deep rounded-[18px] flex items-center justify-center text-[2rem] font-black font-[--font-display] shadow-[0_12px_40px_rgba(255,107,53,0.5)] group-hover:scale-110 transition-transform duration-300">
              3
            </div>
            <h3 class="text-3xl lg:text-4xl font-[--font-display] font-extrabold mb-5 mt-8 group-hover:text-solar transition-colors duration-300">Exit Gracefully</h3>
            <p class="text-cream/75 text-lg leading-relaxed">
              Leave politely with a socially acceptable excuse. <span class="text-cream font-semibold">No guilt, no drama.</span>
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
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden group">
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
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden group">
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
          <div class="opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms] relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[32px] p-12 transition-all duration-500 hover:bg-white/[0.06] hover:border-glow/30 hover:-translate-y-3 hover:scale-[1.02] overflow-hidden group">
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
            Sarah knows your daughter's name and that school meeting from last week. Alex tracks
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
            More Than Emergency Calls
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

    <!-- Pricing -->
    <section class="py-32 relative overflow-hidden">
      <!-- Accent gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-glow/5 to-transparent"></div>

      <div class="relative max-w-5xl mx-auto px-6 lg:px-12 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <h2 class="text-6xl lg:text-7xl font-[--font-display] font-extrabold mb-6 tracking-tight">
          Simple, <span class="italic font-[--font-accent] bg-gradient-to-r from-glow to-ember bg-clip-text text-transparent">Transparent</span> Pricing
        </h2>
        <p class="text-2xl text-cream/70 mb-24">
          Pay only for what you use
        </p>

        <div class="relative group bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border-2 border-glow/30 rounded-[40px] p-14 lg:p-20 shadow-[0_0_0_1px_rgba(251,191,36,0.1),0_32px_100px_rgba(251,191,36,0.15)] hover:border-glow/50 hover:shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_40px_120px_rgba(251,191,36,0.25)] transition-all duration-500 holographic">
          <!-- Decorative corner accents -->
          <div class="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-glow/40 rounded-tl-3xl"></div>
          <div class="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-glow/40 rounded-br-3xl"></div>

          <div class="flex flex-col sm:flex-row justify-center items-center gap-12 lg:gap-20 mb-16">
            <div class="text-center group/price hover:scale-110 transition-transform duration-300">
              <div class="text-7xl lg:text-8xl font-black mb-4 bg-gradient-to-r from-glow via-ember to-glow bg-clip-text text-transparent">
                $0.25
              </div>
              <div class="text-lg text-cream/70 uppercase tracking-[0.2em] font-semibold">Connection Fee</div>
            </div>
            <div class="text-6xl text-glow/40 font-light">+</div>
            <div class="text-center group/price hover:scale-110 transition-transform duration-300">
              <div class="text-7xl lg:text-8xl font-black mb-4 bg-gradient-to-r from-glow via-ember to-glow bg-clip-text text-transparent">
                $0.40<span class="text-4xl text-cream/60">/min</span>
              </div>
              <div class="text-lg text-cream/70 uppercase tracking-[0.2em] font-semibold">Per Minute</div>
            </div>
          </div>

          <div class="inline-flex items-center gap-3 bg-gradient-to-r from-glow/15 to-ember/15 border-2 border-glow/40 rounded-2xl px-10 py-6 mb-10 shadow-[0_8px_32px_rgba(251,191,36,0.2)]">
            <svg class="w-6 h-6 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <p class="text-cream text-xl font-semibold">
              Your first emergency call is on us - no credit card required
            </p>
          </div>

          <div class="inline-block bg-gradient-to-r from-white/5 to-white/10 border border-white/20 rounded-2xl px-8 py-5 backdrop-blur-sm">
            <p class="text-cream/90 text-lg">
              <span class="font-bold text-glow">Average call: 5 minutes = $2.25 total.</span><br/>
              One good negotiation pays for a year of calls.
            </p>
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
            to="/register"
            class="group relative inline-flex items-center justify-center px-16 py-8 text-2xl lg:text-3xl font-black text-deep bg-gradient-to-r from-glow via-ember to-glow bg-[length:200%_100%] rounded-[28px] overflow-hidden transition-all duration-500 hover:scale-[1.08] hover:bg-[position:100%_0] shadow-[0_0_0_2px_rgba(251,191,36,0.5),0_24px_80px_rgba(251,191,36,0.5)] hover:shadow-[0_0_0_2px_rgba(251,191,36,0.8),0_32px_100px_rgba(251,191,36,0.6)] magnetic-hover"
          >
            <span class="relative z-10 flex items-center gap-3">
              Start Your Free Trial
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
              No credit card
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
              Cancel anytime
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// No JS needed - pure Tailwind implementation
</script>
