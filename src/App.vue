<template>
  <div id="app" :class="{ 'logged-in': authStore.isAuthenticated }">
    <nav v-if="authStore.isAuthenticated" class="navbar">
      <div class="navbar-brand">
        <h1>📞 Call Me Back</h1>
      </div>
      <div class="navbar-menu">
        <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
        <router-link to="/schedule" class="nav-link">Schedule</router-link>
        <router-link to="/contacts" class="nav-link">Contacts</router-link>
        <router-link to="/personas" class="nav-link">Personas</router-link>
        <router-link to="/profile" class="nav-link">Profile</router-link>
        <button @click="handleLogout" class="btn-logout">Logout</button>
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #667eea;
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

.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
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

  .main-content {
    padding: 1rem;
  }
}
</style>
