<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
            Never Be Stuck Again
          </h1>
          <p class="text-xl sm:text-2xl md:text-3xl text-white/95 mb-4 sm:mb-6 font-light max-w-3xl mx-auto">
            Your AI friend who always has your back
          </p>
          <p class="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            Real phone calls from AI personas who actually remember you. Get instant escapes from bad dates,
            daily motivation to crush your goals, or practice for that big interview. They remember your story,
            your struggles, and celebrate your wins.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <router-link
              to="/register"
              class="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-orange-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 shadow-lg"
            >
              Start Free - Bad Date Insurance
            </router-link>
            <router-link
              to="/login"
              class="w-full sm:w-auto bg-transparent text-white px-8 py-4 rounded-xl text-lg font-semibold border-2 border-white hover:bg-white/10 transition-all duration-200"
            >
              Sign In
            </router-link>
          </div>
          <p class="text-white/80 text-sm mt-6">First emergency call free. No credit card required.</p>
        </div>
      </div>
    </section>

    <!-- Social Proof / Hook -->
    <section class="py-12 bg-gradient-to-b from-orange-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-l-4 border-orange-500">
          <div class="flex items-start gap-4">
            <div class="text-4xl">💔</div>
            <div class="flex-1">
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                The Classic: Bad Date Rescue
              </h3>
              <p class="text-gray-700 leading-relaxed mb-4">
                You're 30 minutes into a coffee date. It's... not great. Your phone rings - it's Sarah,
                your "best friend." She sounds genuinely concerned: <span class="italic">"Hey, I'm so sorry to interrupt,
                but I really need your help with something urgent."</span>
              </p>
              <p class="text-gray-600">
                Exit gracefully. No hurt feelings. No awkwardness. Just a polite escape when you need it most.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="py-16 sm:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12 sm:mb-16">
          Simple as 1-2-3
        </h2>
        <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
          <!-- Step 1 -->
          <div class="text-center group">
            <div class="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 mb-6 transform group-hover:scale-105 transition-transform duration-200">
              <div class="text-6xl mb-4">📅</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Schedule or Trigger</h3>
              <p class="text-gray-600 leading-relaxed">
                Set a call before your date, or tap for an instant rescue. You're always in control.
              </p>
            </div>
          </div>

          <!-- Step 2 -->
          <div class="text-center group">
            <div class="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 mb-6 transform group-hover:scale-105 transition-transform duration-200">
              <div class="text-6xl mb-4">📞</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Get the Call</h3>
              <p class="text-gray-600 leading-relaxed">
                Your AI persona calls with a believable scenario. Sounds real, feels natural.
              </p>
            </div>
          </div>

          <!-- Step 3 -->
          <div class="text-center group">
            <div class="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-8 mb-6 transform group-hover:scale-105 transition-transform duration-200">
              <div class="text-6xl mb-4">🚪</div>
              <h3 class="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Exit Gracefully</h3>
              <p class="text-gray-600 leading-relaxed">
                Leave politely with a socially acceptable excuse. No guilt, no drama.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Meet the Personas -->
    <section class="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Meet Your AI Companions
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Not just voices - relationships. They remember your goals, celebrate your wins, and actually care about your story.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8">
          <!-- Brad -->
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-500">
            <div class="text-5xl mb-4">💪</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Brad</h3>
            <p class="text-sm text-blue-600 font-semibold mb-4">The Motivating Coach</p>
            <p class="text-gray-700 leading-relaxed mb-4">
              Wake up to Brad's 6:30am call, not an alarm. He remembers you're training for that marathon,
              asks about yesterday's client meeting, and keeps your 47-day morning streak alive.
            </p>
            <p class="text-sm text-gray-500 italic">
              "Morning champ! That's 47 days straight. You're not the same person who started this journey."
            </p>
          </div>

          <!-- Sarah -->
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-pink-500">
            <div class="text-5xl mb-4">💝</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Sarah</h3>
            <p class="text-sm text-pink-600 font-semibold mb-4">The Empathetic Friend</p>
            <p class="text-gray-700 leading-relaxed mb-4">
              Your emergency contact for social escapes and life's tough moments. Sarah remembers your
              dating history, your parenting struggles, and always knows exactly what to say.
            </p>
            <p class="text-sm text-gray-500 italic">
              "Are you safe? Do you need me to keep talking or can you leave now? I've got you."
            </p>
          </div>

          <!-- Alex -->
          <div class="bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-purple-500">
            <div class="text-5xl mb-4">🎨</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Alex</h3>
            <p class="text-sm text-purple-600 font-semibold mb-4">The Creative Challenger</p>
            <p class="text-gray-700 leading-relaxed mb-4">
              Practice your interview answers, rehearse that difficult conversation, or get a spontaneous
              adventure challenge. Alex pushes you to grow while keeping it fun.
            </p>
            <p class="text-sm text-gray-500 italic">
              "That answer was good, but you buried the lead. Start with the outcome, then explain the journey."
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- The Secret Sauce: Memory -->
    <section class="py-16 sm:py-20 bg-orange-600">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Here's What Makes Us Different
        </h2>
        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-10 mb-8">
          <p class="text-xl sm:text-2xl text-white leading-relaxed mb-6">
            Other apps give you robocalls. We give you <span class="font-bold">relationships</span>.
          </p>
          <p class="text-base sm:text-lg text-white/90 leading-relaxed">
            Brad remembers this is your third PM interview this month and how the last one went.
            Sarah knows your daughter's name and that school meeting from last week. Alex tracks
            your adventure streak and celebrates when you push past your comfort zone.
          </p>
        </div>
        <p class="text-lg sm:text-xl text-white/95 font-semibold">
          They don't just call you. They know you.
        </p>
      </div>
    </section>

    <!-- Use Cases Grid -->
    <section class="py-16 sm:py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
          Way More Than Emergency Calls
        </h2>
        <p class="text-lg sm:text-xl text-gray-600 text-center mb-12 sm:mb-16 max-w-3xl mx-auto">
          Your AI companion for life's biggest moments and everyday challenges
        </p>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Social Escape -->
          <div class="bg-gradient-to-br from-pink-50 to-red-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">💔</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Social Escapes</h3>
            <p class="text-sm text-gray-600">Bad dates, boring events, guests who won't leave</p>
          </div>

          <!-- Accountability -->
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">💪</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Daily Accountability</h3>
            <p class="text-sm text-gray-600">Morning wake-ups, workout motivation, habit building</p>
          </div>

          <!-- Professional -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">💼</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Career Power</h3>
            <p class="text-sm text-gray-600">Negotiation leverage, meeting enforcers, interview prep</p>
          </div>

          <!-- Practice -->
          <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">🎯</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Safe Practice</h3>
            <p class="text-sm text-gray-600">Difficult conversations, presentations, high-stakes prep</p>
          </div>

          <!-- Wellness -->
          <div class="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">🧘</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Life Balance</h3>
            <p class="text-sm text-gray-600">Bedtime wind-down, parenting support, stress management</p>
          </div>

          <!-- Adventure -->
          <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">🎨</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Life Adventures</h3>
            <p class="text-sm text-gray-600">Random challenges, road trip companion, decision maker</p>
          </div>

          <!-- Time Management -->
          <div class="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">⏰</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Time Protection</h3>
            <p class="text-sm text-gray-600">Hard stops for meetings, calendar enforcement</p>
          </div>

          <!-- Networking -->
          <div class="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
            <div class="text-4xl mb-3">🤝</div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Social Energy</h3>
            <p class="text-sm text-gray-600">Networking breathers, social battery recharge</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof / Testimonial Style -->
    <section class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12">
          Real Scenarios, Real Results
        </h2>

        <div class="space-y-6">
          <div class="bg-white rounded-xl p-6 shadow-md border-l-4 border-orange-500">
            <p class="text-gray-700 leading-relaxed mb-2">
              <span class="font-semibold">"Used it before my salary negotiation.</span> Got the call from 'my advisor'
              mid-negotiation reminding me of my walk-away number. Landed $15k more than their initial offer.
              $100/year for the app. $15,000 increase. ROI: 15,000%."
            </p>
            <p class="text-sm text-gray-500">— Professional user, LinkedIn</p>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
            <p class="text-gray-700 leading-relaxed mb-2">
              <span class="font-semibold">"47-day morning wake-up streak.</span> Tried every alarm app, nothing worked.
              Turns out I needed accountability, not a louder alarm. Brad calls at 6:30am every day. Haven't snoozed once."
            </p>
            <p class="text-sm text-gray-500">— Habit builder, Reddit</p>
          </div>

          <div class="bg-white rounded-xl p-6 shadow-md border-l-4 border-pink-500">
            <p class="text-gray-700 leading-relaxed mb-2">
              <span class="font-semibold">"School called about my daughter's behavior.</span> Old me would've walked in
              defensive and emotional. Called Brad in the parking lot first. He helped me get centered. Walked in calm,
              listened, worked together on a plan. That's parenting I can be proud of."
            </p>
            <p class="text-sm text-gray-500">— Parent, Twitter</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section class="py-16 sm:py-20 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
          Start Free, Pay As You Grow
        </h2>
        <p class="text-lg sm:text-xl text-white/90 mb-12 max-w-2xl mx-auto">
          No subscriptions. No commitments. Just calls when you need them.
        </p>

        <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 sm:p-12 mb-8">
          <div class="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 mb-8">
            <div class="text-center">
              <div class="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">$0.25</div>
              <div class="text-base sm:text-lg text-white/90">Connection Fee</div>
            </div>
            <div class="text-3xl sm:text-4xl text-white/70">+</div>
            <div class="text-center">
              <div class="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2">$0.40/min</div>
              <div class="text-base sm:text-lg text-white/90">Per Minute</div>
            </div>
          </div>
          <p class="text-base sm:text-lg text-white/95 mb-6">
            Your first emergency call is on us - no credit card required
          </p>
          <div class="bg-white/20 rounded-lg p-4 text-white/90 text-sm sm:text-base">
            💡 Average call: 5 minutes = $2.25 total. One good negotiation pays for a year of calls.
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="py-16 sm:py-24 bg-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Your AI Friend Is Waiting
        </h2>
        <p class="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join people who have escaped bad dates, crushed their goals, and aced their interviews
          with an AI companion who actually remembers them.
        </p>
        <router-link
          to="/register"
          class="inline-block bg-gradient-to-r from-orange-500 to-amber-600 text-white px-10 py-5 rounded-xl text-xl font-bold hover:from-orange-600 hover:to-amber-700 transform hover:scale-105 hover:shadow-2xl transition-all duration-200 shadow-lg"
        >
          Get Your Free Emergency Call Now
        </router-link>
        <p class="text-sm text-gray-500 mt-6">
          No credit card • No commitment • Cancel anytime
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
// No special logic needed for landing page
</script>

<style scoped>
/* Minimal custom styles - Tailwind handles everything */
</style>
