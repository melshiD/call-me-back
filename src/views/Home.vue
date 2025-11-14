<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Call Me Back</h1>
        <p class="hero-subtitle">Your AI-powered escape plan, always on standby</p>
        <p class="hero-description">
          Get instant phone calls from realistic AI personas to help you gracefully exit any situation.
          Perfect for awkward dates, boring meetings, or when you just need a believable excuse.
        </p>
        <div class="hero-actions">
          <router-link to="/register" class="btn btn-primary btn-lg">
            Get Started Free
          </router-link>
          <router-link to="/login" class="btn btn-secondary btn-lg">
            Sign In
          </router-link>
        </div>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">How It Works</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📞</div>
          <h3>1. Choose a Persona</h3>
          <p>Select from our library of AI personas - your boss, best friend, family member, or create your own custom character.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⏰</div>
          <h3>2. Schedule or Trigger</h3>
          <p>Set up a call for a specific time or trigger one instantly with a tap when you need to escape.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎭</div>
          <h3>3. Get the Call</h3>
          <p>Your AI persona calls you with a convincing scenario, giving you the perfect excuse to leave.</p>
        </div>
      </div>
    </div>

    <div class="personas-preview">
      <h2 class="section-title">Meet Our AI Personas</h2>
      <div class="personas-grid">
        <div class="persona-preview-card">
          <h3>💼 The Boss</h3>
          <p>An urgent work matter needs your immediate attention</p>
        </div>
        <div class="persona-preview-card">
          <h3>👨‍⚕️ The Doctor</h3>
          <p>Important test results require a private conversation</p>
        </div>
        <div class="persona-preview-card">
          <h3>👥 Best Friend</h3>
          <p>A personal emergency that only you can help with</p>
        </div>
        <div class="persona-preview-card">
          <h3>👨‍👩‍👧 Family Member</h3>
          <p>An urgent family matter needs your attention</p>
        </div>
      </div>
      <div class="cta-section">
        <router-link to="/register" class="btn btn-primary btn-lg">
          Create Your First Persona
        </router-link>
      </div>
    </div>

    <div class="use-cases-section">
      <h2 class="section-title">Perfect For</h2>
      <div class="use-cases-grid">
        <div class="use-case">
          <div class="use-case-emoji">💔</div>
          <h3>Bad Dates</h3>
          <p>Gracefully exit when things aren't working out</p>
        </div>
        <div class="use-case">
          <div class="use-case-emoji">😴</div>
          <h3>Boring Events</h3>
          <p>Have a believable excuse to leave early</p>
        </div>
        <div class="use-case">
          <div class="use-case-emoji">🤝</div>
          <h3>Awkward Situations</h3>
          <p>Get out of uncomfortable conversations politely</p>
        </div>
        <div class="use-case">
          <div class="use-case-emoji">⏱️</div>
          <h3>Time Management</h3>
          <p>Keep meetings and calls on schedule</p>
        </div>
      </div>
    </div>

    <div class="pricing-teaser">
      <h2 class="section-title">Simple, Pay-As-You-Go Pricing</h2>
      <div class="pricing-info">
        <div class="price-item">
          <div class="price">$0.25</div>
          <div class="price-label">Connection Fee</div>
        </div>
        <div class="price-plus">+</div>
        <div class="price-item">
          <div class="price">$0.40/min</div>
          <div class="price-label">Per Minute</div>
        </div>
      </div>
      <p class="pricing-subtext">No subscriptions. No commitments. Pay only for what you use.</p>
    </div>

    <div class="final-cta">
      <h2>Ready to Never Be Stuck Again?</h2>
      <router-link to="/register" class="btn btn-primary btn-xl">
        Get Started Now
      </router-link>
    </div>
  </div>
</template>

<script setup>
// No special logic needed for landing page
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 4rem 2rem;
  text-align: center;
  color: white;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  font-weight: 300;
}

.hero-description {
  font-size: 1.2rem;
  margin-bottom: 2.5rem;
  line-height: 1.6;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-lg {
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
}

.btn-xl {
  padding: 1.25rem 3rem;
  font-size: 1.4rem;
  font-weight: 700;
}

.btn-primary {
  background: white;
  color: #667eea;
  border: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
}

.features-section,
.personas-preview,
.use-cases-section,
.pricing-teaser {
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 3rem;
  color: #333;
  font-weight: 700;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.feature-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

.feature-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.feature-card p {
  color: #6c757d;
  line-height: 1.6;
}

.personas-preview {
  background: #f8f9fa;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.persona-preview-card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.persona-preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.persona-preview-card h3 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.persona-preview-card p {
  color: #6c757d;
  line-height: 1.5;
}

.cta-section {
  text-align: center;
  margin-top: 3rem;
}

.use-cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}

.use-case {
  text-align: center;
  padding: 2rem;
}

.use-case-emoji {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.use-case h3 {
  font-size: 1.4rem;
  margin-bottom: 0.75rem;
  color: #333;
}

.use-case p {
  color: #6c757d;
  line-height: 1.5;
}

.pricing-teaser {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  margin: 4rem auto;
  max-width: 900px;
}

.pricing-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.price-item {
  text-align: center;
}

.price {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.price-label {
  font-size: 1.1rem;
  opacity: 0.9;
}

.price-plus {
  font-size: 2rem;
  font-weight: 300;
}

.pricing-subtext {
  text-align: center;
  font-size: 1.1rem;
  opacity: 0.95;
}

.final-cta {
  text-align: center;
  padding: 5rem 2rem;
  background: #f8f9fa;
}

.final-cta h2 {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #333;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.3rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-lg {
    width: 100%;
    max-width: 300px;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid,
  .personas-grid,
  .use-cases-grid {
    grid-template-columns: 1fr;
  }

  .pricing-info {
    flex-direction: column;
    gap: 1rem;
  }

  .price-plus {
    transform: rotate(90deg);
  }
}
</style>
