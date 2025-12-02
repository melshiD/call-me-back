<template>
  <div id="app" :class="{ 'logged-in': authStore.isAuthenticated }" class="min-h-screen bg-midnight text-cream">
    <!-- Toast Notifications -->
    <div class="fixed top-20 right-4 z-[1100] flex flex-col gap-3 max-w-md">
      <transition-group name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'px-5 py-4 rounded-xl backdrop-blur-xl border shadow-lg flex items-start gap-3',
            toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' :
            toast.type === 'error' ? 'bg-red-500/20 border-red-500/40 text-red-200' :
            toast.type === 'warning' ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' :
            'bg-blue-500/20 border-blue-500/40 text-blue-200'
          ]"
        >
          <svg v-if="toast.type === 'success'" class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="toast.type === 'error'" class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          <svg v-else class="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button @click="removeToast(toast.id)" class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      </transition-group>
    </div>
    <!-- Floating Navigation (hidden on admin routes) -->
    <nav v-if="!isAdminRoute" class="nav-container">
      <div class="nav-wrapper">
        <!-- Logo / Brand -->
        <router-link
          :to="authStore.isAuthenticated ? '/dashboard' : '/'"
          class="brand group"
        >
          <div class="brand-icon">
            <svg class="w-6 h-6 text-glow transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span class="brand-text">Call Me Back</span>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="nav-links">
          <!-- Visitor navigation (when not logged in) -->
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/" class="nav-item">
              <span>Home</span>
            </router-link>
            <router-link to="/personas" class="nav-item">
              <span>Personas</span>
            </router-link>
            <router-link to="/pricing" class="nav-item">
              <span>Pricing</span>
            </router-link>
            <router-link to="/login" class="nav-item">
              <span>Login</span>
            </router-link>
            <router-link to="/login" class="nav-item-primary">
              <span class="relative z-10">Start Free Trial</span>
              <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full blur-md"></div>
            </router-link>
          </template>

          <!-- User navigation (when logged in) -->
          <template v-else>
            <router-link to="/dashboard" class="nav-item">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </router-link>
            <router-link to="/schedule" class="nav-item">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Schedule</span>
            </router-link>
            <router-link to="/personas/config" class="nav-item">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>My Personas</span>
            </router-link>
            <router-link to="/profile" class="nav-item">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Profile</span>
            </router-link>
            <button @click="handleLogout" class="nav-item-logout">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="mobile-menu-button"
          :class="{ 'open': mobileMenuOpen }"
        >
          <span class="menu-line"></span>
          <span class="menu-line"></span>
          <span class="menu-line"></span>
        </button>
      </div>

      <!-- Mobile Navigation Overlay -->
      <transition name="mobile-menu">
        <div v-if="mobileMenuOpen" class="mobile-nav-overlay" @click="mobileMenuOpen = false">
          <div class="mobile-nav-content" @click.stop>
            <!-- Mobile Navigation Items -->
            <template v-if="!authStore.isAuthenticated">
              <router-link to="/" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <span>Home</span>
              </router-link>
              <router-link to="/personas" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <span>Browse Personas</span>
              </router-link>
              <router-link to="/pricing" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <span>Pricing</span>
              </router-link>
              <router-link to="/login" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <span>Login</span>
              </router-link>
              <router-link to="/login" class="mobile-nav-item-primary" @click="mobileMenuOpen = false">
                <span>Start Free Trial</span>
              </router-link>
            </template>

            <template v-else>
              <router-link to="/dashboard" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Dashboard</span>
              </router-link>
              <router-link to="/schedule" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Schedule</span>
              </router-link>
              <router-link to="/personas/config" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>My Personas</span>
              </router-link>
              <router-link to="/profile" class="mobile-nav-item" @click="mobileMenuOpen = false">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile</span>
              </router-link>
              <button @click="handleLogout(); mobileMenuOpen = false" class="mobile-nav-item-logout">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </template>
          </div>
        </div>
      </transition>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from './stores/toast'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const mobileMenuOpen = ref(false)
const { toasts, removeToast } = useToast()

// Hide main nav on admin routes
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})

const handleLogout = () => {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* Navigation Container */
.nav-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(10, 14, 26, 0.85);
  backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(251, 191, 36, 0.2);
  box-shadow:
    0 1px 0 0 rgba(251, 191, 36, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 4px 60px rgba(251, 191, 36, 0.08);
}

.nav-wrapper {
  max-width: 90rem;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  position: relative;
}

/* Grain texture overlay */
.nav-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
  opacity: 0.3;
  mix-blend-mode: overlay;
  pointer-events: none;
}

/* Brand Logo */
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: var(--color-cream, #f5f3f0);
  font-family: var(--font-display, 'Bricolage Grotesque', sans-serif);
  font-weight: 700;
  font-size: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.brand:hover {
  color: var(--color-glow, #fbbf24);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(255, 140, 66, 0.15));
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 0.75rem;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.2);
}

.brand-text {
  background: linear-gradient(135deg, var(--color-glow, #fbbf24), var(--color-ember, #ff8c42));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.02em;
}

/* Desktop Navigation Links */
.nav-links {
  display: none;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .nav-links {
    display: flex;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  color: rgba(245, 243, 240, 0.7);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.nav-item svg {
  opacity: 0.7;
  transition: opacity 0.3s;
}

.nav-item:hover {
  color: var(--color-glow, #fbbf24);
  background: rgba(251, 191, 36, 0.08);
}

.nav-item:hover svg {
  opacity: 1;
}

.nav-item.router-link-active {
  color: var(--color-glow, #fbbf24);
  background: rgba(251, 191, 36, 0.12);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}

/* Primary CTA Button */
.nav-item-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, var(--color-glow, #fbbf24), var(--color-ember, #ff8c42));
  color: var(--color-deep, #050814);
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.3),
    0 4px 16px rgba(251, 191, 36, 0.3);
}

.nav-item-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.5),
    0 8px 24px rgba(251, 191, 36, 0.4);
}

/* Logout Button */
.nav-item-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: rgba(255, 107, 53, 0.9);
  font-size: 0.9375rem;
  font-weight: 500;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item-logout:hover {
  background: rgba(255, 107, 53, 0.1);
  border-color: rgba(255, 107, 53, 0.5);
  color: var(--color-solar, #ff6b35);
  box-shadow: 0 0 20px rgba(255, 107, 53, 0.2);
}

/* Mobile Menu Button */
.mobile-menu-button {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  background: transparent;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  z-index: 50;
}

@media (min-width: 768px) {
  .mobile-menu-button {
    display: none;
  }
}

.menu-line {
  width: 1.5rem;
  height: 2px;
  background: linear-gradient(90deg, var(--color-glow, #fbbf24), var(--color-ember, #ff8c42));
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-button.open .menu-line:nth-child(1) {
  transform: rotate(45deg) translateY(0.5rem);
}

.mobile-menu-button.open .menu-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-button.open .menu-line:nth-child(3) {
  transform: rotate(-45deg) translateY(-0.5rem);
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 20, 0.95);
  backdrop-filter: blur(24px);
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.mobile-nav-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 24rem;
  background: rgba(10, 14, 26, 0.9);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.1),
    0 16px 48px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(251, 191, 36, 0.1);
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: rgba(245, 243, 240, 0.8);
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 500;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid transparent;
}

.mobile-nav-item:hover,
.mobile-nav-item.router-link-active {
  color: var(--color-glow, #fbbf24);
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.2);
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}

.mobile-nav-item-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, var(--color-glow, #fbbf24), var(--color-ember, #ff8c42));
  color: var(--color-deep, #050814);
  text-decoration: none;
  font-size: 1.125rem;
  font-weight: 700;
  border-radius: 1rem;
  margin-top: 0.5rem;
  box-shadow:
    0 0 0 1px rgba(251, 191, 36, 0.3),
    0 4px 16px rgba(251, 191, 36, 0.3);
}

.mobile-nav-item-logout {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 107, 53, 0.3);
  color: rgba(255, 107, 53, 0.9);
  font-size: 1.125rem;
  font-weight: 500;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 0.5rem;
}

.mobile-nav-item-logout:hover {
  background: rgba(255, 107, 53, 0.1);
  border-color: rgba(255, 107, 53, 0.5);
  color: var(--color-solar, #ff6b35);
}

/* Mobile Menu Transitions */
.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-active .mobile-nav-content,
.mobile-menu-leave-active .mobile-nav-content {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from .mobile-nav-content {
  transform: scale(0.95) translateY(-2rem);
  opacity: 0;
}

.mobile-menu-leave-to .mobile-nav-content {
  transform: scale(0.95) translateY(2rem);
  opacity: 0;
}

/* Main Content */
.main-content {
  /* Pages control their own layout */
}

/* Scroll Enhancement - Hide on scroll down, show on scroll up */
@media (min-width: 768px) {
  .nav-container {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

/* Toast Transitions */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
