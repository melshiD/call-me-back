<template>
  <div class="persona-admin">
    <div v-if="!isAdmin" class="unauthorized">
      <h2>Unauthorized</h2>
      <p>You don't have access to this page.</p>
    </div>

    <div v-else>
      <h1>Persona Administration</h1>

      <div v-if="loading" class="loading">Loading personas...</div>
      <div v-else-if="error" class="error">{{ error }}</div>

      <div v-else class="persona-list">
        <div v-for="persona in personas" :key="persona.id" class="persona-card">
          <h2>{{ persona.name }}</h2>

          <div class="form-group">
            <label>Voice ID (ElevenLabs)</label>
            <input v-model="persona.default_voice_id" type="text" />
          </div>

          <div class="form-group">
            <label>Core System Prompt</label>
            <textarea v-model="persona.core_system_prompt" rows="6"></textarea>
          </div>

          <div class="form-group">
            <label>Max Tokens</label>
            <input v-model.number="persona.max_tokens" type="number" />
            <small>Current: {{ persona.max_tokens || 150 }}. Lower = shorter responses</small>
          </div>

          <div class="form-group">
            <label>Temperature</label>
            <input v-model.number="persona.temperature" type="number" step="0.1" min="0" max="2" />
            <small>Current: {{ persona.temperature || 0.7 }}. Higher = more creative</small>
          </div>

          <button @click="savePersona(persona)" :disabled="saving === persona.id">
            {{ saving === persona.id ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isAdmin = computed(() => authStore.user?.email === 'dave.melshman@gmail.com')

const personas = ref([])
const loading = ref(true)
const error = ref(null)
const saving = ref(null)

const API_URL = import.meta.env.VITE_API_URL || 'https://svc-01ka41sfy58tbr0dxm8kwz8jyy.01k8eade5c6qxmxhttgr2hn2nz.lmapp.run'

async function loadPersonas() {
  if (!isAdmin.value) return

  try {
    const response = await fetch(`${API_URL}/api/admin/personas`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    })

    if (!response.ok) throw new Error('Failed to load personas')
    personas.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function savePersona(persona) {
  saving.value = persona.id

  try {
    const response = await fetch(`${API_URL}/api/admin/personas/${persona.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authStore.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        default_voice_id: persona.default_voice_id,
        core_system_prompt: persona.core_system_prompt,
        max_tokens: persona.max_tokens || 150,
        temperature: persona.temperature || 0.7
      })
    })

    if (!response.ok) throw new Error('Failed to save persona')
    alert(`${persona.name} saved successfully!`)
  } catch (err) {
    alert(`Error saving ${persona.name}: ${err.message}`)
  } finally {
    saving.value = null
  }
}

onMounted(() => {
  if (isAdmin.value) {
    loadPersonas()
  } else {
    loading.value = false
  }
})
</script>

<style scoped>
.persona-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.unauthorized {
  text-align: center;
  padding: 40px;
}

.persona-list {
  display: grid;
  gap: 20px;
}

.persona-card {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
}

button {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: red;
}
</style>
