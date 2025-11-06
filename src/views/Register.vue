<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>📞 Call Me Back</h1>
          <p>Create your account</p>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="name">Full Name</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="form-control"
              placeholder="John Doe"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="form-control"
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone Number</label>
            <input
              id="phone"
              v-model="phone"
              type="tel"
              class="form-control"
              placeholder="+1234567890"
              required
            />
            <small class="form-hint">E.164 format (e.g., +1234567890)</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="form-control"
              placeholder="••••••••"
              required
              minlength="8"
            />
            <small class="form-hint">Minimum 8 characters</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="form-control"
              placeholder="••••••••"
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? 'Creating account...' : 'Sign Up' }}
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <router-link to="/login">Log in</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  // Validation
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    loading.value = false
    return
  }

  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    loading.value = false
    return
  }

  if (!phone.value.startsWith('+')) {
    error.value = 'Phone number must be in E.164 format (start with +)'
    loading.value = false
    return
  }

  try {
    await authStore.register(name.value, email.value, password.value, phone.value)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 2rem;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6c757d;
  font-size: 1rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: #6c757d;
  font-size: 0.875rem;
}

.btn-block {
  width: 100%;
  margin-top: 1rem;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.auth-footer {
  text-align: center;
  color: #6c757d;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.auth-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }

  .auth-header h1 {
    font-size: 1.5rem;
  }
}
</style>
