<template>
  <div id="app" :class="{ 'logged-in': authStore.isAuthenticated }">
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link :to="authStore.isAuthenticated ? '/dashboard' : '/'" class="brand-link">
          <h1>📞 Call Me Back</h1>
        </router-link>
      </div>
      <div class="navbar-menu">
        <!-- Visitor navigation (when not logged in) -->
        <template v-if="!authStore.isAuthenticated">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/personas" class="nav-link">Browse Personas</router-link>
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/register" class="nav-link btn-primary">Sign Up</router-link>
        </template>

        <!-- User navigation (when logged in) -->
        <template v-else>
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/schedule" class="nav-link">Schedule</router-link>
          <router-link to="/contacts" class="nav-link">Contacts</router-link>
          <router-link to="/personas" class="nav-link">Personas</router-link>
          <router-link to="/profile" class="nav-link">Profile</router-link>
          <button @click="handleLogout" class="btn-logout">Logout</button>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: #0a0e1a;
}

.navbar {
  background: rgba(255, 255, 255, 0.95);
  padding: 1rem 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.brand-link {
  text-decoration: none;
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #667eea;
  cursor: pointer;
  transition: opacity 0.3s;
}

.navbar-brand h1:hover {
  opacity: 0.8;
}

.navbar-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.nav-link {
  text-decoration: none;
  color: #333;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #667eea;
  color: white;
}

.btn-logout {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #c82333;
}

.nav-link.btn-primary {
  background: #667eea;
  color: white;
  padding: 0.5rem 1rem;
}

.nav-link.btn-primary:hover {
  background: #5a67d8;
  color: white;
}

.main-content {
  /* Pages control their own max-width and padding */
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }

  .navbar-menu {
    width: 100%;
    justify-content: center;
  }
}
</style>
