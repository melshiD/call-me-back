<template>
  <div class="min-h-screen bg-midnight text-cream font-[--font-body]">
    <!-- Subtle Ambient Background -->
    <div class="fixed inset-0 -z-10 bg-midnight overflow-hidden">
      <div class="grain-overlay absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"></div>
      <div class="absolute w-[600px] h-[600px] -top-[200px] -right-[200px] opacity-8 pointer-events-none blur-[100px] animate-[float_30s_ease-in-out_infinite] bg-gradient-radial from-glow/30 via-ember/20 to-transparent"></div>
      <div class="absolute w-[400px] h-[400px] bottom-[10%] -left-[150px] opacity-6 pointer-events-none blur-[80px] animate-[float_35s_ease-in-out_infinite_reverse] bg-gradient-radial from-solar/20 to-transparent"></div>
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
        <router-link to="/privacy" class="text-sm text-cream/50 hover:text-glow transition-colors duration-300">
          Privacy Policy →
        </router-link>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-16">
      <!-- Hero -->
      <div class="mb-16 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-glow/30 bg-glow/5 mb-6">
          <span class="w-2 h-2 bg-glow rounded-full animate-pulse"></span>
          <span class="text-xs font-semibold tracking-wider text-glow uppercase">Legal</span>
        </div>
        <h1 class="text-5xl lg:text-6xl font-[--font-display] font-bold mb-6 tracking-tight">
          Terms of Service
        </h1>
        <p class="text-lg text-cream/60 leading-relaxed">
          Last updated: <span class="text-cream/80">December 1, 2025</span>
        </p>
      </div>

      <!-- Important Notice Banner -->
      <div class="mb-12 p-6 rounded-2xl bg-gradient-to-r from-glow/10 to-ember/10 border border-glow/30 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:100ms]">
        <div class="flex gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-xl bg-glow/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-glow" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-glow mb-2">Important: AI Service Disclaimer</h3>
            <p class="text-cream/70 leading-relaxed">
              Call Me Back provides AI-powered voice companions for <span class="text-cream font-medium">entertainment and companionship purposes only</span>.
              Our AI personas are not real humans and should never be relied upon for professional advice.
            </p>
          </div>
        </div>
      </div>

      <!-- Table of Contents -->
      <nav class="mb-12 p-6 rounded-2xl bg-white/[0.02] border border-white/5 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:150ms]">
        <h2 class="text-sm font-semibold text-cream/50 uppercase tracking-wider mb-4">Table of Contents</h2>
        <ol class="grid md:grid-cols-2 gap-2 text-sm">
          <li><a href="#acceptance" class="text-cream/70 hover:text-glow transition-colors">1. Acceptance of Terms</a></li>
          <li><a href="#service" class="text-cream/70 hover:text-glow transition-colors">2. Service Description</a></li>
          <li><a href="#ai-limitations" class="text-cream/70 hover:text-glow transition-colors">3. AI Limitations & Disclaimers</a></li>
          <li><a href="#user-responsibilities" class="text-cream/70 hover:text-glow transition-colors">4. User Responsibilities</a></li>
          <li><a href="#payment" class="text-cream/70 hover:text-glow transition-colors">5. Payment Terms</a></li>
          <li><a href="#acceptable-use" class="text-cream/70 hover:text-glow transition-colors">6. Acceptable Use Policy</a></li>
          <li><a href="#intellectual-property" class="text-cream/70 hover:text-glow transition-colors">7. Intellectual Property</a></li>
          <li><a href="#liability" class="text-cream/70 hover:text-glow transition-colors">8. Limitation of Liability</a></li>
          <li><a href="#termination" class="text-cream/70 hover:text-glow transition-colors">9. Termination</a></li>
          <li><a href="#governing-law" class="text-cream/70 hover:text-glow transition-colors">10. Governing Law</a></li>
        </ol>
      </nav>

      <!-- Content Sections -->
      <article class="space-y-12">
        <!-- Section 1: Acceptance -->
        <section id="acceptance" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:200ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">1</span>
            Acceptance of Terms
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              By accessing or using Call Me Back ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you do not agree to all of these Terms, do not use the Service.
            </p>
            <p class="text-cream/70 leading-relaxed">
              We reserve the right to modify these Terms at any time. Continued use of the Service after changes
              constitutes acceptance of the modified Terms. We will notify users of material changes via email or
              through the Service.
            </p>
          </div>
        </section>

        <!-- Section 2: Service Description -->
        <section id="service" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:250ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">2</span>
            Service Description
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              Call Me Back is an AI-powered voice companion service that allows users to schedule and receive phone calls
              from AI personas. Our service provides:
            </p>
            <ul class="space-y-2 text-cream/70 mb-4">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Scheduled voice calls from customizable AI personas</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>On-demand instant calls for social situations</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Personalized AI companions with memory of past interactions</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Various use cases including motivation, companionship, and practice conversations</span>
              </li>
            </ul>
            <p class="text-cream/70 leading-relaxed">
              The Service is provided on a credit-based system. Users purchase call minutes which do not expire
              and can be used at any time.
            </p>
          </div>
        </section>

        <!-- Section 3: AI Limitations - CRITICAL -->
        <section id="ai-limitations" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:300ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-ember/20 text-ember text-sm font-bold flex items-center justify-center">3</span>
            AI Limitations & Disclaimers
          </h2>

          <!-- Critical Warning Box -->
          <div class="p-6 rounded-2xl bg-ember/10 border border-ember/30 mb-6">
            <h3 class="text-lg font-semibold text-ember mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              Critical Understanding Required
            </h3>
            <div class="space-y-4 text-cream/80">
              <p class="font-medium">You acknowledge and agree that:</p>
              <ul class="space-y-3">
                <li class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-ember/20 text-ember text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                  <span><strong class="text-cream">AI personas are not real humans.</strong> They are artificial intelligence systems that simulate conversation.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-ember/20 text-ember text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                  <span><strong class="text-cream">AI may provide inaccurate information.</strong> Do not rely on AI responses for factual accuracy.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-ember/20 text-ember text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                  <span><strong class="text-cream">This is NOT professional advice.</strong> The Service does not provide medical, legal, financial, therapeutic, or mental health advice.</span>
                </li>
                <li class="flex items-start gap-3">
                  <span class="w-6 h-6 rounded-full bg-ember/20 text-ember text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                  <span><strong class="text-cream">For emergencies, contact 911.</strong> This Service is not equipped to handle emergencies or crisis situations.</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              The Service is designed for <strong class="text-cream">entertainment, companionship, motivation, and practice conversations</strong>.
              It should not be used as a substitute for:
            </p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Licensed medical or healthcare professionals</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Licensed mental health professionals or therapists</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Licensed attorneys or legal advisors</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Certified financial advisors</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Emergency services (911, crisis hotlines)</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 4: User Responsibilities -->
        <section id="user-responsibilities" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:350ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">4</span>
            User Responsibilities
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">As a user of Call Me Back, you agree to:</p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Provide accurate and complete registration information</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Maintain the security of your account credentials</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Be at least 18 years old, or have parental consent if between 13-17</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Use the Service only for lawful purposes</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Not attempt to reverse engineer or exploit the Service</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Report any security vulnerabilities or bugs responsibly</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 5: Payment Terms -->
        <section id="payment" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:400ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">5</span>
            Payment Terms
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              Call Me Back operates on a credit-based prepaid model:
            </p>
            <ul class="space-y-2 text-cream/70 mb-4">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Minute Packages:</strong> Users purchase call minutes in advance</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">No Expiration:</strong> Purchased minutes do not expire</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Payment Processing:</strong> All payments are processed securely via Stripe</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span><strong class="text-cream">Refunds:</strong> Unused minutes may be refunded within 30 days of purchase, minus any used minutes</span>
              </li>
            </ul>
            <p class="text-cream/70 leading-relaxed">
              Prices are subject to change with 30 days notice. Existing purchased minutes will be honored at the rate
              they were purchased.
            </p>
          </div>
        </section>

        <!-- Section 6: Acceptable Use -->
        <section id="acceptable-use" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:450ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">6</span>
            Acceptable Use Policy
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">You agree NOT to use the Service for:</p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Any illegal activities or to facilitate illegal conduct</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Harassment, abuse, or harm to others</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Fraud, deception, or impersonation</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Distribution of malware or harmful code</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Attempting to extract or abuse AI systems</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Creating content that exploits minors</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-plasma mt-2 flex-shrink-0"></span>
                <span>Violating the rights of others</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 7: Intellectual Property -->
        <section id="intellectual-property" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:500ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">7</span>
            Intellectual Property
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              All content, features, and functionality of the Service are owned by Call Me Back and are protected
              by copyright, trademark, and other intellectual property laws. This includes:
            </p>
            <ul class="space-y-2 text-cream/70 mb-4">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>AI persona characters, names, and personalities</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Voice synthesis and AI models</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>User interface and user experience design</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-glow mt-2 flex-shrink-0"></span>
                <span>Branding, logos, and trademarks</span>
              </li>
            </ul>
            <p class="text-cream/70 leading-relaxed">
              Users retain ownership of any personal content they provide (such as custom persona preferences),
              but grant us a license to use this content to provide the Service.
            </p>
          </div>
        </section>

        <!-- Section 8: Limitation of Liability -->
        <section id="liability" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:550ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">8</span>
            Limitation of Liability
          </h2>
          <div class="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <p class="text-cream/70 leading-relaxed mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED.
            </p>
            <p class="text-cream/70 leading-relaxed mb-4">
              To the maximum extent permitted by law, Call Me Back shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including but not limited to:
            </p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Loss of profits, data, or business opportunities</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Damages arising from reliance on AI-generated content</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Service interruptions or technical failures</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Actions taken based on AI persona advice or suggestions</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 9: Termination -->
        <section id="termination" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:600ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">9</span>
            Termination
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              <strong class="text-cream">User Termination:</strong> You may delete your account at any time through the
              Service settings. Upon deletion, your personal data will be removed according to our Privacy Policy.
            </p>
            <p class="text-cream/70 leading-relaxed mb-4">
              <strong class="text-cream">Our Termination Rights:</strong> We may suspend or terminate your account if you:
            </p>
            <ul class="space-y-2 text-cream/70">
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Violate these Terms of Service</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Engage in fraudulent or abusive behavior</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Use the Service for illegal purposes</span>
              </li>
              <li class="flex items-start gap-3">
                <span class="w-1.5 h-1.5 rounded-full bg-cream/50 mt-2 flex-shrink-0"></span>
                <span>Pose a risk to other users or the Service</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Section 10: Governing Law -->
        <section id="governing-law" class="scroll-mt-24 opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:650ms]">
          <h2 class="text-2xl font-[--font-display] font-bold mb-4 text-cream flex items-center gap-3 pt-4">
            <span class="w-8 h-8 rounded-lg bg-glow/10 text-glow text-sm font-bold flex items-center justify-center">10</span>
            Governing Law
          </h2>
          <div class="prose prose-invert prose-cream max-w-none">
            <p class="text-cream/70 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware,
              United States, without regard to its conflict of law provisions.
            </p>
            <p class="text-cream/70 leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding
              arbitration in accordance with the rules of the American Arbitration Association.
            </p>
          </div>
        </section>
      </article>

      <!-- Contact Section -->
      <div class="mt-16 p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center opacity-0 translate-y-8 animate-[revealUp_0.8s_cubic-bezier(0.4,0,0.2,1)_forwards] [animation-delay:700ms]">
        <h3 class="text-xl font-[--font-display] font-bold mb-3">Questions about these Terms?</h3>
        <p class="text-cream/60 mb-4">
          Contact us at <a href="mailto:legal@callmeback.ai" class="text-glow hover:text-glow-bright transition-colors">legal@callmeback.ai</a>
        </p>
        <div class="flex items-center justify-center gap-4 text-sm text-cream/50">
          <router-link to="/privacy" class="hover:text-glow transition-colors">Privacy Policy</router-link>
          <span>•</span>
          <router-link to="/" class="hover:text-glow transition-colors">Back to Home</router-link>
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
// No additional logic needed - static legal page
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
  --tw-prose-links: rgb(251 191 36);
}
</style>
