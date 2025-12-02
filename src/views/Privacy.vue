<template>
  <div class="min-h-screen bg-midnight text-cream font-[--font-body]">
    <!-- Subtle Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight overflow-hidden">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <div class="absolute w-[500px] h-[500px] -top-[150px] -left-[150px] opacity-8 pointer-events-none blur-[100px] animate-[float_35s_ease-in-out_infinite] bg-gradient-radial from-cyan-500/20 via-glow/15 to-transparent"></div>
      <div class="absolute w-[400px] h-[400px] bottom-[5%] -right-[100px] opacity-6 pointer-events-none blur-[80px] animate-[float_30s_ease-in-out_infinite_reverse] bg-gradient-radial from-glow/20 to-transparent"></div>
    </div>

    <!-- Sticky Header -->
    <header class="sticky top-0 z-50 backdrop-blur-xl bg-midnight/80 border-b border-white/5">
      <div class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-3 text-cream/70 hover:text-glow transition-colors duration-300 group">
          <svg class="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span class="text-sm font-medium">Back to Home</span>
        </router-link>
        <router-link to="/terms" class="text-sm text-cream/50 hover:text-glow transition-colors duration-300">
          ← Terms of Service
        </router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-16">
      <!-- Hero -->
      <div class="mb-16 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 mb-6">
          <span class="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold tracking-wider text-cyan-400 uppercase">Privacy</span>
        </div>
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-bold mb-6 tracking-tight">
          Privacy Policy
        </h1>
        <p class="text-lg text-cream/60 leading-relaxed">
          Last updated: <span class="text-cream/80">December 1, 2025</span>
        </p>
      </div>

      <!-- Privacy Commitment Banner -->
      <div class="mb-12 p-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-glow/10 border border-cyan-400/30 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms]">
        <div class="flex gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-cyan-400 mb-2">Our Commitment to Your Privacy</h3>
            <p class="text-cream/70 leading-relaxed">
              We believe in <span class="text-cream font-medium">transparency and minimal data collection</span>.
              We only collect what's necessary to provide our service, and we never sell your personal data.
            </p>
          </div>
        </div>
      </div>

      <!-- Table of Contents -->
      <nav class="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:150ms]">
        <h2 class="text-sm font-semibold text-cream/50 uppercase tracking-wider mb-4">Table of Contents</h2>
        <ol class="grid md:grid-cols-2 gap-2 text-sm">
          <li><a href="#data-collection" class="text-cream/70 hover:text-cyan-400 transition-colors">1. Data We Collect</a></li>
          <li><a href="#how-we-use" class="text-cream/70 hover:text-cyan-400 transition-colors">2. How We Use Your Data</a></li>
          <li><a href="#third-parties" class="text-cream/70 hover:text-cyan-400 transition-colors">3. Third-Party Services</a></li>
          <li><a href="#data-retention" class="text-cream/70 hover:text-cyan-400 transition-colors">4. Data Retention</a></li>
          <li><a href="#your-rights" class="text-cream/70 hover:text-cyan-400 transition-colors">5. Your Rights</a></li>
          <li><a href="#security" class="text-cream/70 hover:text-cyan-400 transition-colors">6. Security Measures</a></li>
          <li><a href="#children" class="text-cream/70 hover:text-cyan-400 transition-colors">7. Children's Privacy</a></li>
          <li><a href="#changes" class="text-cream/70 hover:text-cyan-400 transition-colors">8. Changes to This Policy</a></li>
        </ol>
      </nav>

      <!-- Content Sections -->
      <article class="space-y-12">
        <!-- Section 1: Data Collection -->
        <section id="data-collection" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-6 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
            Data We Collect
          </h2>

          <div class="space-y-6">
            <!-- Account Information -->
            <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <h3 class="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
                Account Information
              </h3>
              <ul class="space-y-2 text-cream/70 text-sm">
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Email address (via WorkOS authentication)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Name (as provided during registration)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>OAuth tokens for authentication</span>
                </li>
              </ul>
            </div>

            <!-- Phone Information -->
            <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <h3 class="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                </svg>
                Phone Information
              </h3>
              <ul class="space-y-2 text-cream/70 text-sm">
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Phone numbers (verified via Twilio SMS)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Call metadata (duration, timestamps, call status)</span>
                </li>
              </ul>
            </div>

            <!-- Usage Data -->
            <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <h3 class="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                Usage Data
              </h3>
              <ul class="space-y-2 text-cream/70 text-sm">
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Call history and scheduling preferences</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Persona customization settings</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Credit balance and purchase history</span>
                </li>
              </ul>
            </div>

            <!-- Conversation Data -->
            <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
              <h3 class="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd"/>
                </svg>
                Conversation Data
              </h3>
              <ul class="space-y-2 text-cream/70 text-sm">
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Conversation transcripts (for AI memory and continuity)</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-1.5 h-1.5 rounded-full bg-glow mt-1.5 flex-shrink-0"></span>
                  <span>Audio streams during active calls (processed, not stored long-term)</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Section 2: How We Use Data -->
        <section id="how-we-use" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:250ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
            How We Use Your Data
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">We use your data to:</p>
            <ul class="space-y-3 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-lg bg-glow/10 text-glow text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span><strong class="text-cream">Provide the Service</strong> – Make and receive AI voice calls to your verified phone numbers</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-lg bg-glow/10 text-glow text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span><strong class="text-cream">Personalize Your Experience</strong> – Remember your preferences and conversation history for continuity</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-lg bg-glow/10 text-glow text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span><strong class="text-cream">Process Payments</strong> – Handle credit purchases and track your balance</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-lg bg-glow/10 text-glow text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                <span><strong class="text-cream">Improve the Service</strong> – Analyze aggregate usage patterns to enhance features</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-6 h-6 rounded-lg bg-glow/10 text-glow text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                <span><strong class="text-cream">Communicate with You</strong> – Send service updates, security alerts, and support messages</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 3: Third-Party Services -->
        <section id="third-parties" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-6 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
            Third-Party Services
          </h2>

          <p class="text-cream/70 leading-relaxed mb-6">
            We use trusted third-party services to power Call Me Back. Here's what data each service receives:
          </p>

          <!-- Third-Party Table -->
          <div class="overflow-x-auto rounded-xl border border-white/10">
            <table class="w-full text-sm">
              <thead class="bg-white/[0.03]">
                <tr>
                  <th class="text-left p-4 font-semibold text-cream border-b border-white/5">Provider</th>
                  <th class="text-left p-4 font-semibold text-cream border-b border-white/5">Data Shared</th>
                  <th class="text-left p-4 font-semibold text-cream border-b border-white/5">Purpose</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">WorkOS</td>
                  <td class="p-4 text-cream/70">Email, OAuth tokens</td>
                  <td class="p-4 text-cream/70">User authentication</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Twilio</td>
                  <td class="p-4 text-cream/70">Phone numbers, call metadata</td>
                  <td class="p-4 text-cream/70">Phone calls, SMS verification</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">ElevenLabs</td>
                  <td class="p-4 text-cream/70">Text for synthesis</td>
                  <td class="p-4 text-cream/70">Voice generation (AI persona voices)</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Deepgram</td>
                  <td class="p-4 text-cream/70">Audio streams</td>
                  <td class="p-4 text-cream/70">Speech-to-text transcription</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Cerebras</td>
                  <td class="p-4 text-cream/70">Conversation context</td>
                  <td class="p-4 text-cream/70">AI response generation</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Stripe</td>
                  <td class="p-4 text-cream/70">Payment information</td>
                  <td class="p-4 text-cream/70">Payment processing</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Vultr</td>
                  <td class="p-4 text-cream/70">All stored data</td>
                  <td class="p-4 text-cream/70">Database hosting</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Vercel</td>
                  <td class="p-4 text-cream/70">Frontend assets, usage logs</td>
                  <td class="p-4 text-cream/70">Web hosting</td>
                </tr>
                <tr class="hover:bg-white/[0.02] transition-colors">
                  <td class="p-4 text-glow font-medium">Raindrop (LiquidMetal)</td>
                  <td class="p-4 text-cream/70">Backend code, service logs</td>
                  <td class="p-4 text-cream/70">Backend hosting</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-cream/50 text-sm mt-4">
            Each third-party service has their own privacy policy. We encourage you to review them.
          </p>
        </section>

        <!-- Section 4: Data Retention -->
        <section id="data-retention" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:350ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">4</span>
            Data Retention
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <div class="grid md:grid-cols-2 gap-4">
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 class="font-semibold text-cream mb-2">Account Data</h4>
                <p class="text-cream/70 text-sm">Retained until you request deletion</p>
              </div>
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 class="font-semibold text-cream mb-2">Call History</h4>
                <p class="text-cream/70 text-sm">Retained for 12 months</p>
              </div>
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 class="font-semibold text-cream mb-2">Conversation Transcripts</h4>
                <p class="text-cream/70 text-sm">Retained for 60 days for AI memory</p>
              </div>
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <h4 class="font-semibold text-cream mb-2">Payment Records</h4>
                <p class="text-cream/70 text-sm">Retained for 7 years (legal requirement)</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 5: Your Rights -->
        <section id="your-rights" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:400ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">5</span>
            Your Rights
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">You have the right to:</p>
            <div class="grid md:grid-cols-2 gap-4">
              <div class="p-5 rounded-xl bg-gradient-to-br from-glow/5 to-transparent border border-glow/20">
                <h4 class="font-semibold text-glow mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Access
                </h4>
                <p class="text-cream/70 text-sm">Request a copy of all your personal data</p>
              </div>
              <div class="p-5 rounded-xl bg-gradient-to-br from-glow/5 to-transparent border border-glow/20">
                <h4 class="font-semibold text-glow mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Deletion
                </h4>
                <p class="text-cream/70 text-sm">Request deletion of your account and data</p>
              </div>
              <div class="p-5 rounded-xl bg-gradient-to-br from-glow/5 to-transparent border border-glow/20">
                <h4 class="font-semibold text-glow mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Portability
                </h4>
                <p class="text-cream/70 text-sm">Export your data in a standard format</p>
              </div>
              <div class="p-5 rounded-xl bg-gradient-to-br from-glow/5 to-transparent border border-glow/20">
                <h4 class="font-semibold text-glow mb-2 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Correction
                </h4>
                <p class="text-cream/70 text-sm">Update or correct inaccurate information</p>
              </div>
            </div>
            <p class="text-cream/70 leading-relaxed mt-6">
              To exercise these rights, contact us at <a href="mailto:privacy@callmeback.ai" class="text-cyan-400 hover:text-cyan-300 transition-colors">privacy@callmeback.ai</a>.
              We will respond within 30 days.
            </p>
          </div>
        </section>

        <!-- Section 6: Security -->
        <section id="security" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:450ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">6</span>
            Security Measures
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">We protect your data with:</p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Encryption in transit:</strong> All data transmitted using TLS/SSL</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Encryption at rest:</strong> Sensitive data encrypted in our databases</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Access controls:</strong> Strict authentication and authorization</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Regular audits:</strong> Security practices reviewed regularly</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 7: Children's Privacy -->
        <section id="children" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:500ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">7</span>
            Children's Privacy
          </h2>
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <p class="text-cream/70 leading-relaxed mb-4">
              Call Me Back is <strong class="text-cream">not intended for children under 13 years of age</strong>.
              We do not knowingly collect personal information from children under 13 in compliance with COPPA
              (Children's Online Privacy Protection Act).
            </p>
            <p class="text-cream/70 leading-relaxed">
              Users between 13-17 years of age may use the Service only with parental or guardian consent.
              If you believe a child under 13 has provided us with personal information, please contact us
              immediately at <a href="mailto:privacy@callmeback.ai" class="text-cyan-400 hover:text-cyan-300 transition-colors">privacy@callmeback.ai</a>.
            </p>
          </div>
        </section>

        <!-- Section 8: Changes -->
        <section id="changes" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:550ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-cyan-400/10 text-cyan-400 text-sm font-bold flex items-center justify-center flex-shrink-0">8</span>
            Changes to This Policy
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. When we make material changes:
            </p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span>We will update the "Last updated" date at the top of this policy</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span>We will notify you via email or through the Service</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0"></span>
                <span>Continued use of the Service constitutes acceptance of the updated policy</span>
              </li>
            </ul>
          </div>
        </section>
      </article>

      <!-- Contact Section -->
      <div class="mt-16 p-8 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-glow/5 border border-cyan-400/20 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:600ms]">
        <h3 class="text-xl font-[--font-display] font-bold mb-3">Questions about your privacy?</h3>
        <p class="text-cream/60 mb-4">
          Contact our Privacy Team at <a href="mailto:privacy@callmeback.ai" class="text-cyan-400 hover:text-cyan-300 transition-colors">privacy@callmeback.ai</a>
        </p>
        <div class="flex items-center justify-center gap-4 text-sm text-cream/50">
          <router-link to="/terms" class="hover:text-cyan-400 transition-colors">Terms of Service</router-link>
          <span>•</span>
          <router-link to="/" class="hover:text-cyan-400 transition-colors">Back to Home</router-link>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-white/5 py-8 mt-16">
      <div class="max-w-4xl mx-auto px-6 text-center text-sm text-cream/40">
        <p>&copy; 2025 Call Me Back. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
// No additional logic needed - static privacy page
</script>

<style scoped>
/* Smooth scroll for anchor links */
html {
  scroll-behavior: smooth;
}

/* Custom prose styling */
.prose-cream {
  --tw-prose-body: rgb(245 243 240 / 0.7);
  --tw-prose-headings: rgb(245 243 240);
  --tw-prose-links: rgb(34 211 238);
}
</style>
