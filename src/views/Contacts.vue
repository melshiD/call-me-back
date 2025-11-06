<template>
  <div class="contacts-page">
    <h1 class="page-title">My Contacts</h1>
    <p class="page-subtitle">Your favorite personas for quick access</p>

    <div v-if="personasStore.userContacts.length === 0" class="empty-state card">
      <div class="empty-icon">👥</div>
      <h2>No contacts yet</h2>
      <p>Add personas to your contacts for quick access when scheduling calls</p>
      <router-link to="/personas" class="btn btn-primary">
        Browse Personas
      </router-link>
    </div>

    <div v-else class="contacts-grid">
      <div
        v-for="contact in personasStore.userContacts"
        :key="contact.id"
        class="contact-card"
      >
        <div class="contact-header">
          <h3>{{ contact.name }}</h3>
          <button
            @click="removeContact(contact.id)"
            class="btn-icon"
            :disabled="removing[contact.id]"
            title="Remove from contacts"
          >
            ❌
          </button>
        </div>

        <p class="contact-description">{{ contact.description }}</p>

        <div class="contact-tags">
          <span v-for="tag in contact.tags" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>

        <div class="contact-meta">
          <div class="meta-item">
            <strong>Voice:</strong> {{ contact.voice }}
          </div>
          <div class="meta-item">
            <strong>Type:</strong>
            <span v-if="contact.is_public" class="badge badge-info">Public</span>
            <span v-else class="badge badge-warning">Custom</span>
          </div>
        </div>

        <div class="contact-actions">
          <router-link
            :to="{ path: '/schedule', query: { personaId: contact.id } }"
            class="btn btn-primary btn-block"
          >
            Schedule Call
          </router-link>
        </div>
      </div>
    </div>

    <div class="action-footer">
      <router-link to="/personas" class="btn btn-secondary">
        + Add More Contacts
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePersonasStore } from '../stores/personas'

const personasStore = usePersonasStore()
const removing = ref({})

const removeContact = async (contactId) => {
  if (!confirm('Remove this persona from your contacts?')) return

  removing.value[contactId] = true

  try {
    await personasStore.removeFromContacts(contactId)
  } catch (err) {
    alert('Failed to remove contact: ' + err.message)
  } finally {
    delete removing.value[contactId]
  }
}

onMounted(async () => {
  await personasStore.fetchContacts()
})
</script>

<style scoped>
.contacts-page {
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

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 500px;
  margin: 2rem auto;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty-state h2 {
  color: #333;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 2rem;
}

.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.contact-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.contact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.contact-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.contact-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.3s;
  padding: 0.25rem;
}

.btn-icon:hover {
  opacity: 1;
}

.contact-description {
  color: #6c757d;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.contact-tags {
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

.contact-meta {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 0.9rem;
}

.meta-item {
  margin-bottom: 0.5rem;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.contact-actions {
  margin-top: 1rem;
}

.btn-block {
  width: 100%;
}

.action-footer {
  text-align: center;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .contacts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
