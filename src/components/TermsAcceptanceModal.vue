<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-[2000] flex items-center justify-center p-4 sm:p-6"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-[#0a0a0c]/98 backdrop-blur-sm"></div>

        <!-- Modal Container -->
        <div class="relative w-full max-w-3xl max-h-[90vh] flex flex-col">
          <!-- Card -->
          <div class="bg-[#1a1a1e] border border-[#2a2a2e] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

            <!-- Header - Fixed -->
            <div class="px-8 py-6 border-b border-[#2a2a2e] flex-shrink-0">
              <div class="flex items-center gap-4 mb-3">
                <div class="w-10 h-10 rounded-xl bg-[#2a2a2e] flex items-center justify-center">
                  <svg class="w-5 h-5 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-2xl font-semibold text-[#e8e6e3]">Review Our Policies</h2>
                  <p class="text-sm text-[#666] mt-1">Please review and accept to continue</p>
                </div>
              </div>
            </div>

            <!-- Scrollable Content -->
            <div class="flex-1 overflow-y-auto px-8 py-6 space-y-4">

              <!-- Terms of Service Accordion -->
              <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                <button
                  @click="termsExpanded = !termsExpanded"
                  class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span class="text-base font-medium text-[#e8e6e3]">Terms of Service</span>
                  </div>
                  <svg
                    class="w-5 h-5 text-[#666] transition-transform duration-200"
                    :class="{ 'rotate-180': termsExpanded }"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <Transition name="accordion">
                  <div v-if="termsExpanded" class="border-t border-[#2a2a2e]">
                    <div class="p-6 bg-[#0d0d0f] max-h-[400px] overflow-y-auto text-base text-[#999] space-y-6 leading-relaxed accordion-scroll">

                      <!-- Critical AI Disclaimer -->
                      <div class="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20 mb-8">
                        <h4 class="text-base font-semibold text-amber-400 uppercase tracking-wider mb-3">Important: AI Service Disclaimer</h4>
                        <p class="text-[#ccc] text-base leading-relaxed">
                          Call Me Back provides AI-powered voice companions for <strong class="text-[#e8e6e3]">entertainment and companionship purposes only</strong>.
                          Our AI personas are not real humans and should never be relied upon for professional advice.
                        </p>
                      </div>

                      <!-- Section 1: Acceptance -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">1. Acceptance of Terms</h4>
                        <p class="mb-3">By accessing or using Call Me Back ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, do not use the Service.</p>
                        <p>We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the modified Terms. We will notify users of material changes via email or through the Service.</p>
                      </div>

                      <!-- Section 2: Service Description -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">2. Service Description</h4>
                        <p class="mb-3">Call Me Back is an AI-powered voice companion service that allows users to schedule and receive phone calls from AI personas. Our service provides:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>Scheduled voice calls from customizable AI personas</li>
                          <li>On-demand instant calls for social situations</li>
                          <li>Personalized AI companions with memory of past interactions</li>
                          <li>Various use cases including motivation, companionship, and practice conversations</li>
                        </ul>
                        <p class="mt-3">The Service is provided on a credit-based system. Users purchase call minutes which do not expire and can be used at any time.</p>
                      </div>

                      <!-- Section 3: AI Limitations - CRITICAL -->
                      <div class="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
                        <h4 class="text-base font-semibold text-red-400 mb-3 flex items-center gap-2">
                          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                          </svg>
                          3. AI Limitations & Disclaimers
                        </h4>
                        <p class="text-[#ccc] mb-4 font-medium">Critical Understanding Required - You acknowledge and agree that:</p>
                        <ul class="space-y-3 text-[#bbb]">
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">AI personas are not real humans.</strong> They are artificial intelligence systems that simulate conversation.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">AI may provide inaccurate information.</strong> AI systems can "hallucinate" or generate plausible-sounding but incorrect responses. Do not rely on AI responses for factual accuracy.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">AI may contain biases.</strong> AI systems may reflect biases present in their training data. We work to minimize these but cannot guarantee bias-free responses.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">This is NOT professional advice.</strong> The Service does not provide medical, legal, financial, therapeutic, or mental health advice.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">For emergencies, contact 911.</strong> This Service is not equipped to handle emergencies or crisis situations.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">Human oversight is available.</strong> If you have concerns about AI responses or need assistance, contact our support team. We review flagged interactions and continuously improve our systems.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-full bg-red-500/20 text-red-400 text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">!</span>
                            <span><strong class="text-[#e8e6e3]">Limited risk classification.</strong> Under emerging AI regulations (EU AI Act), this service is classified as a "limited risk" entertainment AI. We provide transparency about AI nature and limitations but do not make high-stakes decisions affecting your rights or safety.</span>
                          </li>
                        </ul>

                        <div class="mt-5 pt-4 border-t border-red-500/20">
                          <p class="text-[#bbb] mb-2">The Service is designed for entertainment, companionship, motivation, and practice conversations. It should <strong class="text-[#e8e6e3]">NOT</strong> be used as a substitute for:</p>
                          <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                            <li>Licensed medical or healthcare professionals</li>
                            <li>Licensed mental health professionals or therapists</li>
                            <li>Licensed attorneys or legal advisors</li>
                            <li>Certified financial advisors</li>
                            <li>Emergency services (911, crisis hotlines)</li>
                          </ul>
                        </div>
                      </div>

                      <!-- Section 4: User Responsibilities -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">4. User Responsibilities</h4>
                        <p class="mb-3">As a user of Call Me Back, you agree to:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>Provide accurate and complete registration information</li>
                          <li>Maintain the security of your account credentials</li>
                          <li>Be at least 18 years old, or have parental consent if between 13-17</li>
                          <li>Use the Service only for lawful purposes</li>
                          <li>Not attempt to reverse engineer or exploit the Service</li>
                          <li>Report any security vulnerabilities or bugs responsibly</li>
                        </ul>
                      </div>

                      <!-- Section 5: Payment Terms -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">5. Payment Terms</h4>
                        <p class="mb-3">Call Me Back operates on a credit-based prepaid model:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li><strong class="text-[#ccc]">Minute Packages:</strong> Users purchase call minutes in advance</li>
                          <li><strong class="text-[#ccc]">No Expiration:</strong> Purchased minutes do not expire</li>
                          <li><strong class="text-[#ccc]">Payment Processing:</strong> All payments are processed securely via Stripe</li>
                          <li><strong class="text-[#ccc]">Refunds:</strong> Unused minutes may be refunded within 30 days of purchase, minus any used minutes</li>
                        </ul>
                        <p class="mt-3">Prices are subject to change with 30 days notice. Existing purchased minutes will be honored at the rate they were purchased.</p>
                      </div>

                      <!-- Section 6: Acceptable Use -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">6. Acceptable Use Policy</h4>
                        <p class="mb-3">You agree NOT to use the Service for:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>Any illegal activities or to facilitate illegal conduct</li>
                          <li>Harassment, abuse, or harm to others</li>
                          <li>Fraud, deception, or impersonation</li>
                          <li>Distribution of malware or harmful code</li>
                          <li>Attempting to extract or abuse AI systems</li>
                          <li>Creating content that exploits minors</li>
                          <li>Violating the rights of others</li>
                        </ul>
                      </div>

                      <!-- Section 7: User-Initiated Service & Consent -->
                      <div class="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <h4 class="text-base font-semibold text-emerald-400 mb-3">7. User-Initiated Service & Consent</h4>
                        <p class="text-[#ccc] mb-3">Call Me Back is a <strong class="text-[#e8e6e3]">user-initiated service</strong>. This means:</p>
                        <ul class="space-y-2 text-[#bbb]">
                          <li class="flex items-start gap-3">
                            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                            <span><strong class="text-[#ccc]">You schedule all calls.</strong> By scheduling a call or clicking "Call Now," you are explicitly requesting and consenting to receive an AI-generated phone call.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                            <span><strong class="text-[#ccc]">Using credits = consent.</strong> When you spend credits to initiate a call, this constitutes your affirmative consent to receive that call.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                            <span><strong class="text-[#ccc]">You control call timing.</strong> Since you choose when to receive calls, standard telemarketing time restrictions (8am-9pm) are satisfied by your own scheduling choices. You may schedule calls at times that work for you.</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                            <span><strong class="text-[#ccc]">You can cancel anytime.</strong> You may cancel scheduled calls, delete your account, or stop using the service at any time.</span>
                          </li>
                        </ul>
                        <p class="text-[#888] text-sm mt-4">This user-initiated model means many telemarketing regulations (TCPA) that protect consumers from unwanted calls are satisfied by your own request to receive calls.</p>
                      </div>

                      <!-- Section 8: Intellectual Property -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">8. Intellectual Property</h4>
                        <p class="mb-3">All content, features, and functionality of the Service are owned by Call Me Back and are protected by copyright, trademark, and other intellectual property laws. This includes:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>AI persona characters, names, and personalities</li>
                          <li>Voice synthesis and AI models</li>
                          <li>User interface and user experience design</li>
                          <li>Branding, logos, and trademarks</li>
                        </ul>
                        <p class="mt-3">Users retain ownership of any personal content they provide (such as custom persona preferences), but grant us a license to use this content to provide the Service.</p>
                      </div>

                      <!-- Section 8: Limitation of Liability -->
                      <div class="p-5 rounded-xl bg-[#151518] border border-[#2a2a2e]">
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">9. Limitation of Liability</h4>
                        <p class="mb-3 text-[#bbb]">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>
                        <p class="mb-3">To the maximum extent permitted by law, Call Me Back shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>Loss of profits, data, or business opportunities</li>
                          <li>Damages arising from reliance on AI-generated content</li>
                          <li>Service interruptions or technical failures</li>
                          <li>Actions taken based on AI persona advice or suggestions</li>
                        </ul>
                      </div>

                      <!-- Section 9: Termination -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">10. Termination</h4>
                        <p class="mb-3"><strong class="text-[#ccc]">User Termination:</strong> You may delete your account at any time through the Service settings. Upon deletion, your personal data will be removed according to our Privacy Policy.</p>
                        <p class="mb-3"><strong class="text-[#ccc]">Our Termination Rights:</strong> We may suspend or terminate your account if you:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>Violate these Terms of Service</li>
                          <li>Engage in fraudulent or abusive behavior</li>
                          <li>Use the Service for illegal purposes</li>
                          <li>Pose a risk to other users or the Service</li>
                        </ul>
                      </div>

                      <!-- Section 10: Governing Law -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">11. Governing Law</h4>
                        <p class="mb-3">These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.</p>
                        <p>Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.</p>
                      </div>

                      <p class="text-[#666] text-sm pt-4 border-t border-[#2a2a2e]">
                        Last updated: December 1, 2025 &bull; Contact: legal@callmeback.ai
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Privacy Policy Accordion -->
              <div class="border border-[#2a2a2e] rounded-xl overflow-hidden">
                <button
                  @click="privacyExpanded = !privacyExpanded"
                  class="w-full px-5 py-4 flex items-center justify-between bg-[#0d0d0f] hover:bg-[#151518] transition-colors text-left"
                >
                  <div class="flex items-center gap-4">
                    <div class="w-8 h-8 rounded-lg bg-[#2a2a2e] flex items-center justify-center flex-shrink-0">
                      <svg class="w-4 h-4 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span class="text-base font-medium text-[#e8e6e3]">Privacy Policy</span>
                  </div>
                  <svg
                    class="w-5 h-5 text-[#666] transition-transform duration-200"
                    :class="{ 'rotate-180': privacyExpanded }"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <Transition name="accordion">
                  <div v-if="privacyExpanded" class="border-t border-[#2a2a2e]">
                    <div class="p-6 bg-[#0d0d0f] max-h-[400px] overflow-y-auto text-base text-[#999] space-y-6 leading-relaxed accordion-scroll">

                      <!-- Privacy Commitment -->
                      <div class="p-5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 mb-8">
                        <h4 class="text-base font-semibold text-cyan-400 uppercase tracking-wider mb-3">Our Commitment to Your Privacy</h4>
                        <p class="text-[#ccc] text-base leading-relaxed">
                          We believe in <strong class="text-[#e8e6e3]">transparency and minimal data collection</strong>.
                          We only collect what's necessary to provide our service, and we never sell your personal data.
                        </p>
                      </div>

                      <!-- Section 1: Data Collection -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">1. Data We Collect</h4>

                        <div class="space-y-4">
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-2">Account Information</h5>
                            <ul class="list-disc list-inside space-y-1 text-[#aaa] text-sm ml-2">
                              <li>Email address (via WorkOS authentication)</li>
                              <li>Name (as provided during registration)</li>
                              <li>OAuth tokens for authentication</li>
                            </ul>
                          </div>

                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-2">Phone Information</h5>
                            <ul class="list-disc list-inside space-y-1 text-[#aaa] text-sm ml-2">
                              <li>Phone numbers (verified via Twilio SMS)</li>
                              <li>Call metadata (duration, timestamps, call status)</li>
                            </ul>
                          </div>

                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-2">Usage Data</h5>
                            <ul class="list-disc list-inside space-y-1 text-[#aaa] text-sm ml-2">
                              <li>Call history and scheduling preferences</li>
                              <li>Persona customization settings</li>
                              <li>Credit balance and purchase history</li>
                            </ul>
                          </div>

                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-2">Conversation Data</h5>
                            <ul class="list-disc list-inside space-y-1 text-[#aaa] text-sm ml-2">
                              <li>Conversation transcripts (for AI memory and continuity)</li>
                              <li>Audio streams during active calls (processed, not stored long-term)</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <!-- Section 2: How We Use Data -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">2. How We Use Your Data</h4>
                        <p class="mb-3">We use your data to:</p>
                        <ul class="space-y-2 text-[#aaa]">
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-lg bg-[#2a2a2e] text-[#888] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                            <span><strong class="text-[#ccc]">Provide the Service</strong> – Make and receive AI voice calls to your verified phone numbers</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-lg bg-[#2a2a2e] text-[#888] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                            <span><strong class="text-[#ccc]">Personalize Your Experience</strong> – Remember your preferences and conversation history for continuity</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-lg bg-[#2a2a2e] text-[#888] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                            <span><strong class="text-[#ccc]">Process Payments</strong> – Handle credit purchases and track your balance</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-lg bg-[#2a2a2e] text-[#888] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                            <span><strong class="text-[#ccc]">Improve the Service</strong> – Analyze aggregate usage patterns to enhance features</span>
                          </li>
                          <li class="flex items-start gap-3">
                            <span class="w-6 h-6 rounded-lg bg-[#2a2a2e] text-[#888] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">5</span>
                            <span><strong class="text-[#ccc]">Communicate with You</strong> – Send service updates, security alerts, and support messages</span>
                          </li>
                        </ul>
                      </div>

                      <!-- Section 3: Third-Party Services -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">3. Third-Party Services</h4>
                        <p class="mb-4">We use trusted third-party services to power Call Me Back:</p>

                        <div class="overflow-x-auto rounded-lg border border-[#2a2a2e]">
                          <table class="w-full text-sm">
                            <thead class="bg-[#151518]">
                              <tr>
                                <th class="text-left p-3 font-semibold text-[#ccc] border-b border-[#2a2a2e]">Provider</th>
                                <th class="text-left p-3 font-semibold text-[#ccc] border-b border-[#2a2a2e]">Purpose</th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-[#2a2a2e]">
                              <tr><td class="p-3 text-[#aaa]">WorkOS</td><td class="p-3 text-[#888]">User authentication</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Twilio</td><td class="p-3 text-[#888]">Phone calls, SMS verification</td></tr>
                              <tr><td class="p-3 text-[#aaa]">ElevenLabs</td><td class="p-3 text-[#888]">Voice generation (AI persona voices)</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Deepgram</td><td class="p-3 text-[#888]">Speech-to-text transcription</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Cerebras</td><td class="p-3 text-[#888]">AI response generation</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Stripe</td><td class="p-3 text-[#888]">Payment processing</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Vultr</td><td class="p-3 text-[#888]">Database hosting</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Vercel</td><td class="p-3 text-[#888]">Web hosting</td></tr>
                              <tr><td class="p-3 text-[#aaa]">Raindrop</td><td class="p-3 text-[#888]">Backend hosting</td></tr>
                            </tbody>
                          </table>
                        </div>
                        <p class="text-[#666] text-sm mt-3">Each third-party service has their own privacy policy. We encourage you to review them.</p>
                      </div>

                      <!-- Section 4: Data Retention -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">4. Data Retention</h4>
                        <div class="grid grid-cols-2 gap-3">
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Account Data</h5>
                            <p class="text-[#888] text-sm">Until you request deletion</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Call History</h5>
                            <p class="text-[#888] text-sm">12 months</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Conversation Transcripts</h5>
                            <p class="text-[#888] text-sm">60 days (for AI memory)</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Payment Records</h5>
                            <p class="text-[#888] text-sm">7 years (legal requirement)</p>
                          </div>
                        </div>
                      </div>

                      <!-- Section 5: Your Rights -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">5. Your Rights</h4>
                        <p class="mb-3">You have the right to:</p>
                        <div class="grid grid-cols-2 gap-3">
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Access</h5>
                            <p class="text-[#888] text-sm">Request a copy of all your personal data</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Deletion</h5>
                            <p class="text-[#888] text-sm">Request deletion of your account and data</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Portability</h5>
                            <p class="text-[#888] text-sm">Export your data in a standard format</p>
                          </div>
                          <div class="p-4 rounded-lg bg-[#151518] border border-[#2a2a2e]">
                            <h5 class="text-sm font-semibold text-[#ccc] mb-1">Correction</h5>
                            <p class="text-[#888] text-sm">Update or correct inaccurate information</p>
                          </div>
                        </div>
                        <p class="mt-4">To exercise these rights, contact us at privacy@callmeback.ai. We will respond within 30 days.</p>
                      </div>

                      <!-- Section 6: Security -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">6. Security Measures</h4>
                        <p class="mb-3">We protect your data with:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li><strong class="text-[#ccc]">Encryption in transit:</strong> All data transmitted using TLS/SSL</li>
                          <li><strong class="text-[#ccc]">Encryption at rest:</strong> Sensitive data encrypted in our databases</li>
                          <li><strong class="text-[#ccc]">Access controls:</strong> Strict authentication and authorization</li>
                          <li><strong class="text-[#ccc]">Regular audits:</strong> Security practices reviewed regularly</li>
                        </ul>
                      </div>

                      <!-- Section 7: Children's Privacy -->
                      <div class="p-5 rounded-xl bg-[#151518] border border-[#2a2a2e]">
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-2">7. Children's Privacy</h4>
                        <p class="mb-3">Call Me Back is <strong class="text-[#ccc]">not intended for children under 13 years of age</strong>. We do not knowingly collect personal information from children under 13 in compliance with COPPA (Children's Online Privacy Protection Act).</p>
                        <p>Users between 13-17 years of age may use the Service only with parental or guardian consent. If you believe a child under 13 has provided us with personal information, please contact us immediately at privacy@callmeback.ai.</p>
                      </div>

                      <!-- Section 8: Changes -->
                      <div>
                        <h4 class="text-base font-semibold text-[#e8e6e3] mb-3">8. Changes to This Policy</h4>
                        <p class="mb-3">We may update this Privacy Policy from time to time. When we make material changes:</p>
                        <ul class="list-disc list-inside space-y-1 text-[#aaa] ml-2">
                          <li>We will update the "Last updated" date at the top of this policy</li>
                          <li>We will notify you via email or through the Service</li>
                          <li>Continued use of the Service constitutes acceptance of the updated policy</li>
                        </ul>
                      </div>

                      <p class="text-[#666] text-sm pt-4 border-t border-[#2a2a2e]">
                        Last updated: December 1, 2025 &bull; Contact: privacy@callmeback.ai
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>

            </div>

            <!-- Footer - Fixed -->
            <div class="px-8 py-5 border-t border-[#2a2a2e] bg-[#151518] flex-shrink-0">
              <!-- Checkbox -->
              <label class="flex items-start gap-4 mb-5 cursor-pointer group">
                <div class="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    v-model="accepted"
                    class="peer sr-only"
                  />
                  <div class="w-5 h-5 rounded border border-[#3a3a3e] bg-[#0d0d0f] peer-checked:border-[#888] peer-checked:bg-[#2a2a2e] transition-all duration-200 peer-focus:ring-2 peer-focus:ring-[#3a3a3e] peer-focus:ring-offset-2 peer-focus:ring-offset-[#151518]"></div>
                  <svg
                    class="absolute top-0 left-0 w-5 h-5 text-[#e8e6e3] opacity-0 peer-checked:opacity-100 transition-opacity duration-200 p-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="3"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-sm text-[#888] leading-relaxed group-hover:text-[#aaa] transition-colors">
                  I have read and agree to the <span class="text-[#e8e6e3]">Terms of Service</span> and <span class="text-[#e8e6e3]">Privacy Policy</span>
                </span>
              </label>

              <!-- Accept Button -->
              <button
                @click="handleAccept"
                :disabled="!accepted || loading"
                class="w-full py-4 px-5 rounded-xl text-base font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                :class="accepted
                  ? 'bg-[#e8e6e3] text-[#0d0d0f] hover:bg-white'
                  : 'bg-[#2a2a2e] text-[#666]'"
              >
                <span v-if="loading" class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Accepting...</span>
                </span>
                <span v-else>Continue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accepted'])

const accepted = ref(false)
const loading = ref(false)
const termsExpanded = ref(false)
const privacyExpanded = ref(false)

const handleAccept = async () => {
  if (!accepted.value || loading.value) return

  loading.value = true

  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/accept-terms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      emit('accepted')
    } else {
      console.error('Failed to accept terms:', await response.text())
    }
  } catch (error) {
    console.error('Error accepting terms:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active {
  transition: all 0.2s ease-out;
}
.modal-leave-active {
  transition: all 0.15s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.98) translateY(8px);
}

/* Accordion transitions */
.accordion-enter-active {
  transition: all 0.2s ease-out;
}
.accordion-leave-active {
  transition: all 0.15s ease-in;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}
.accordion-enter-to,
.accordion-leave-from {
  opacity: 1;
  max-height: 500px;
}

/* Custom scrollbar for accordion content */
.accordion-scroll::-webkit-scrollbar {
  width: 6px;
}
.accordion-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.accordion-scroll::-webkit-scrollbar-thumb {
  background: #3a3a3e;
  border-radius: 3px;
}
.accordion-scroll::-webkit-scrollbar-thumb:hover {
  background: #4a4a4e;
}
</style>
