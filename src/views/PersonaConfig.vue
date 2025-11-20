<template>
  <div class="personas-page">
    <h1 class="page-title">Explore Personas</h1>
    <p class="page-subtitle">Discover and create AI personas for your calls</p>

    <!-- Search and Filter -->
    <div class="search-section card">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control search-input"
        placeholder="Search personas by name or description..."
        @input="handleSearch"
      />
    </div>

    <!-- Create Custom Persona Button -->
    <div class="action-bar">
      <button @click="showCreateModal = true" class="btn btn-success">
        + Create Custom Persona
      </button>
    </div>

    <!-- Personas Grid -->
    <div v-if="loading" class="loading-state">
      <p>Loading personas...</p>
    </div>

    <div v-else-if="filteredPersonas.length === 0" class="empty-state card">
      <h2>No personas found</h2>
      <p>Try a different search term or create a custom persona</p>
    </div>

    <div v-else class="personas-grid">
      <div
        v-for="persona in filteredPersonas"
        :key="persona.id"
        class="persona-card"
      >
        <div class="persona-header">
          <h3>{{ persona.name }}</h3>
          <span v-if="persona.is_public" class="badge badge-info">Public</span>
          <span v-else class="badge badge-warning">Custom</span>
        </div>

        <p class="persona-description">{{ persona.description }}</p>

        <div class="persona-tags">
          <span v-for="tag in persona.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <div class="persona-details">
          <div class="detail-item">
            <strong>Voice:</strong> {{ persona.voice }}
          </div>
          <div class="detail-item">
            <strong>Prompt:</strong>
            <p class="system-prompt">{{ persona.system_prompt }}</p>
          </div>
        </div>

        <div class="persona-actions">
          <button
            v-if="!isInContacts(persona.id)"
            @click="addToContacts(persona.id)"
            class="btn btn-primary"
            :disabled="adding[persona.id]"
          >
            {{ adding[persona.id] ? 'Adding...' : 'Add to Contacts' }}
          </button>
          <button v-else class="btn btn-secondary" disabled>
            In Contacts ✓
          </button>

          <button
            v-if="!persona.is_public && persona.created_by !== 'system'"
            @click="editPersona(persona)"
            class="btn btn-secondary"
          >
            Edit
          </button>

          <button
            v-if="!persona.is_public && persona.created_by !== 'system'"
            @click="deletePersona(persona.id)"
            class="btn btn-danger"
            :disabled="deleting[persona.id]"
          >
            {{ deleting[persona.id] ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Persona Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ editingPersona ? 'Edit Persona' : 'Create Custom Persona' }}</h2>
          <button @click="closeModal" class="btn-close">×</button>
        </div>

        <form @submit.prevent="handleCreatePersona" class="persona-form">
          <div class="form-group">
            <label class="form-label" for="persona-name">Name</label>
            <input
              id="persona-name"
              v-model="newPersona.name"
              type="text"
              class="form-control"
              placeholder="e.g., Best Friend"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="persona-description">Description</label>
            <input
              id="persona-description"
              v-model="newPersona.description"
              type="text"
              class="form-control"
              placeholder="Brief description of the persona"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="persona-voice">Voice ID</label>
            <input
              id="persona-voice"
              v-model="newPersona.voice"
              type="text"
              class="form-control"
              placeholder="ElevenLabs voice ID (e.g., rachel)"
              required
            />
            <small class="form-hint">Enter an ElevenLabs voice ID</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="persona-prompt">System Prompt</label>
            <textarea
              id="persona-prompt"
              v-model="newPersona.system_prompt"
              class="form-control"
              placeholder="Describe how this persona should behave during calls..."
              required
            ></textarea>
            <small class="form-hint">Instructions for how the AI should act</small>
          </div>

          <div class="form-group">
            <label class="form-label" for="persona-tags">Tags (comma-separated)</label>
            <input
              id="persona-tags"
              v-model="newPersona.tagsInput"
              type="text"
              class="form-control"
              placeholder="friendly, professional, urgent"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="newPersona.is_public" type="checkbox" />
              Make this persona public (visible to other users)
            </label>
          </div>

          <div v-if="createError" class="error-message">
            {{ createError }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="creating">
              {{ creating ? 'Saving...' : (editingPersona ? 'Update' : 'Create') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { usePersonasStore } from '../stores/personas'

const personasStore = usePersonasStore()

const searchQuery = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const editingPersona = ref(null)

const adding = ref({})
const deleting = ref({})
const creating = ref(false)
const createError = ref('')

const newPersona = ref({
  name: '',
  description: '',
  voice: '',
  system_prompt: '',
  tagsInput: '',
  is_public: false
})

const filteredPersonas = computed(() => {
  if (!searchQuery.value) return personasStore.personas

  const query = searchQuery.value.toLowerCase()
  return personasStore.personas.filter(persona =>
    persona.name.toLowerCase().includes(query) ||
    persona.description.toLowerCase().includes(query) ||
    persona.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

const handleSearch = () => {
  // In a real app, this would trigger an API call with debouncing
  // For now, it's handled by the computed property
}

const isInContacts = (personaId) => {
  return personasStore.userContacts.some(c => c.id === personaId)
}

const addToContacts = async (personaId) => {
  adding.value[personaId] = true

  try {
    await personasStore.addToContacts(personaId)
  } catch (err) {
    alert('Failed to add to contacts: ' + err.message)
  } finally {
    delete adding.value[personaId]
  }
}

const editPersona = (persona) => {
  editingPersona.value = persona
  newPersona.value = {
    name: persona.name,
    description: persona.description,
    voice: persona.voice,
    system_prompt: persona.system_prompt,
    tagsInput: persona.tags.join(', '),
    is_public: persona.is_public
  }
  showCreateModal.value = true
}

const deletePersona = async (personaId) => {
  if (!confirm('Are you sure you want to delete this persona?')) return

  deleting.value[personaId] = true

  try {
    await personasStore.deletePersona(personaId)
  } catch (err) {
    alert('Failed to delete persona: ' + err.message)
  } finally {
    delete deleting.value[personaId]
  }
}

const handleCreatePersona = async () => {
  creating.value = true
  createError.value = ''

  try {
    const personaData = {
      name: newPersona.value.name,
      description: newPersona.value.description,
      voice: newPersona.value.voice,
      system_prompt: newPersona.value.system_prompt,
      tags: newPersona.value.tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      is_public: newPersona.value.is_public
    }

    if (editingPersona.value) {
      await personasStore.updatePersona(editingPersona.value.id, personaData)
    } else {
      await personasStore.createPersona(personaData)
    }

    closeModal()
    await personasStore.fetchPersonas()
  } catch (err) {
    createError.value = err.message || 'Failed to save persona'
  } finally {
    creating.value = false
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingPersona.value = null
  newPersona.value = {
    name: '',
    description: '',
    voice: '',
    system_prompt: '',
    tagsInput: '',
    is_public: false
  }
  createError.value = ''
}

onMounted(async () => {
  loading.value = true
  await personasStore.fetchPersonas()
  await personasStore.fetchContacts()
  loading.value = false
})
</script>

<style scoped>
.personas-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 0.5rem;
  text-align: center;
  font-weight: 700;
}

.page-subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.search-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
}

.search-input {
  font-size: 1.1rem;
  padding: 1rem;
}

.action-bar {
  margin-bottom: 2rem;
  text-align: center;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: white;
  font-size: 1.2rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
}

.empty-state h2 {
  color: #333;
  margin-bottom: 1rem;
}

.personas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.persona-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.persona-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.persona-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.persona-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.persona-description {
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.persona-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tag {
  background: #e7f3ff;
  color: #0c5460;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
}

.persona-details {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.detail-item {
  margin-bottom: 0.75rem;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.system-prompt {
  margin: 0.5rem 0 0 0;
  color: #495057;
  font-style: italic;
  line-height: 1.4;
}

.persona-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.persona-actions .btn {
  flex: 1;
  min-width: 120px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6c757d;
  line-height: 1;
  padding: 0;
}

.persona-form {
  /* Form styles inherited from main.css */
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .personas-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .persona-actions {
    flex-direction: column;
  }

  .persona-actions .btn {
    width: 100%;
  }
}
</style>
