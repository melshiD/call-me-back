<template>
  <div class="dashboard-page">
    <h1 class="page-title">Dashboard</h1>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <router-link to="/schedule" class="action-card">
        <div class="action-icon">📞</div>
        <h3>Schedule Call</h3>
        <p>Set up a new call</p>
      </router-link>

      <router-link to="/contacts" class="action-card">
        <div class="action-icon">👥</div>
        <h3>My Contacts</h3>
        <p>Manage personas</p>
      </router-link>

      <router-link to="/personas" class="action-card">
        <div class="action-icon">🎭</div>
        <h3>Explore Personas</h3>
        <p>Find new personas</p>
      </router-link>
    </div>

    <!-- Stats Overview -->
    <div v-if="userStore.usageStats" class="stats-section">
      <h2 class="section-title">Usage Overview</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ userStore.usageStats.total_calls }}</div>
          <div class="stat-label">Total Calls</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ userStore.usageStats.total_minutes }}</div>
          <div class="stat-label">Total Minutes</div>
        </div>

        <div class="stat-card">
          <div class="stat-value">${{ userStore.usageStats.total_spent.toFixed(2) }}</div>
          <div class="stat-label">Total Spent</div>
        </div>

        <div class="stat-card highlight">
          <div class="stat-value">{{ userStore.usageStats.current_month.calls }}</div>
          <div class="stat-label">This Month</div>
          <small>${{ userStore.usageStats.current_month.spent.toFixed(2) }}</small>
        </div>
      </div>
    </div>

    <!-- Recent Calls -->
    <div class="recent-calls-section">
      <h2 class="section-title">Recent Calls</h2>

      <div v-if="callsStore.calls.length === 0" class="empty-state">
        <p>No calls yet. <router-link to="/schedule">Schedule your first call</router-link></p>
      </div>

      <div v-else class="calls-list">
        <div v-for="call in callsStore.calls.slice(0, 5)" :key="call.id" class="call-card">
          <div class="call-header">
            <div class="call-persona">
              <h3>{{ call.persona_name }}</h3>
              <span
                class="badge"
                :class="{
                  'badge-success': call.status === 'completed',
                  'badge-danger': call.status === 'failed',
                  'badge-warning': call.status === 'in-progress'
                }"
              >
                {{ call.status }}
              </span>
            </div>
            <div class="call-cost">${{ call.cost.toFixed(2) }}</div>
          </div>

          <!-- NEW: Show scenario if present -->
          <div v-if="call.call_scenario" class="call-scenario-badge">
            <span class="scenario-icon">🎭</span>
            <span class="scenario-preview">{{ truncateScenario(call.call_scenario) }}</span>
          </div>

          <div class="call-details">
            <div class="call-detail">
              <strong>Duration:</strong> {{ Math.floor(call.duration / 60) }}m {{ call.duration % 60 }}s
            </div>
            <div class="call-detail">
              <strong>Started:</strong> {{ formatDate(call.start_time) }}
            </div>
            <div v-if="call.sid" class="call-detail">
              <strong>Call ID:</strong> {{ call.sid }}
            </div>
          </div>
        </div>

        <router-link v-if="callsStore.calls.length > 5" to="/profile" class="view-all-link">
          View all calls →
        </router-link>
      </div>
    </div>

    <!-- Upcoming Scheduled Calls -->
    <div v-if="callsStore.scheduledCalls.length > 0" class="scheduled-section">
      <h2 class="section-title">Upcoming Calls</h2>

      <div class="scheduled-list">
        <div
          v-for="call in callsStore.scheduledCalls"
          :key="call.id"
          class="scheduled-card"
        >
          <div class="scheduled-info">
            <h3>{{ getPersonaName(call.persona_id) }}</h3>
            <p class="scheduled-time">{{ formatScheduledTime(call.scheduled_time) }}</p>
          </div>
          <router-link to="/schedule" class="btn btn-secondary">Manage</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCallsStore } from '../stores/calls'
import { useUserStore } from '../stores/user'
import { usePersonasStore } from '../stores/personas'

const callsStore = useCallsStore()
const userStore = useUserStore()
const personasStore = usePersonasStore()

const formatDate = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const truncateScenario = (scenario) => {
  if (!scenario) return ''
  return scenario.length > 60 ? scenario.substring(0, 60) + '...' : scenario
}

const formatScheduledTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getPersonaName = (personaId) => {
  const persona = personasStore.personas.find(p => p.id === personaId)
  return persona ? persona.name : 'Unknown'
}

onMounted(async () => {
  await callsStore.fetchCalls()
  await callsStore.fetchScheduledCalls()
  await userStore.fetchUsageStats()
  await personasStore.fetchPersonas()
})
</script>

<style scoped>
.dashboard-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2.5rem;
  color: white;
  margin-bottom: 2rem;
  text-align: center;
  font-weight: 700;
}

.section-title {
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

/* Quick Actions */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.action-card h3 {
  margin: 0.5rem 0;
  color: #333;
  font-size: 1.2rem;
}

.action-card p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

/* Stats Section */
.stats-section {
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card small {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

/* Recent Calls */
.recent-calls-section,
.scheduled-section {
  margin-bottom: 3rem;
}

.calls-list,
.scheduled-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.call-card,
.scheduled-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.call-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.call-persona {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.call-persona h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.call-cost {
  font-size: 1.3rem;
  font-weight: 700;
  color: #667eea;
}

.call-scenario-badge {
  background: #f8f9fa;
  border-left: 3px solid #667eea;
  padding: 0.75rem;
  margin: 0.75rem 0;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.scenario-icon {
  font-size: 1.2em;
  flex-shrink: 0;
}

.scenario-preview {
  color: #495057;
  font-size: 0.9rem;
  font-style: italic;
  line-height: 1.4;
}

.call-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  color: #6c757d;
  font-size: 0.9rem;
}

.scheduled-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scheduled-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
}

.scheduled-time {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: #6c757d;
}

.empty-state a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.view-all-link {
  display: block;
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.3s;
}

.view-all-link:hover {
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .call-header,
  .scheduled-card {
    flex-direction: column;
    gap: 1rem;
  }

  .call-persona {
    flex-direction: column;
    align-items: flex-start;
  }

  .scheduled-card .btn {
    width: 100%;
  }
}
</style>
