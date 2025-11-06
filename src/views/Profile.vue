<template>
  <div class="profile-page">
    <h1 class="page-title">Profile & Settings</h1>

    <div class="profile-container">
      <!-- User Profile Section -->
      <div class="card">
        <h2 class="card-title">Profile Information</h2>

        <form v-if="!editingProfile" class="profile-display">
          <div class="info-item">
            <strong>Name:</strong> {{ authStore.user?.name }}
          </div>
          <div class="info-item">
            <strong>Email:</strong> {{ authStore.user?.email }}
          </div>
          <div class="info-item">
            <strong>Phone:</strong> {{ authStore.user?.phone }}
          </div>
          <div class="info-item">
            <strong>Member since:</strong> {{ formatDate(authStore.user?.created_at) }}
          </div>

          <button @click="editingProfile = true" class="btn btn-secondary">
            Edit Profile
          </button>
        </form>

        <form v-else @submit.prevent="handleUpdateProfile" class="profile-form">
          <div class="form-group">
            <label class="form-label" for="name">Name</label>
            <input
              id="name"
              v-model="profileForm.name"
              type="text"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              id="email"
              v-model="profileForm.email"
              type="email"
              class="form-control"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="phone">Phone</label>
            <input
              id="phone"
              v-model="profileForm.phone"
              type="tel"
              class="form-control"
              required
            />
          </div>

          <div v-if="profileError" class="error-message">
            {{ profileError }}
          </div>

          <div v-if="profileSuccess" class="success-message">
            Profile updated successfully!
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="profileLoading">
              {{ profileLoading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Billing Section -->
      <div class="card">
        <h2 class="card-title">Payment Methods</h2>

        <div v-if="userStore.billingInfo?.payment_methods.length === 0" class="empty-state-small">
          <p>No payment methods added</p>
        </div>

        <div v-else class="payment-methods-list">
          <div
            v-for="pm in userStore.billingInfo?.payment_methods"
            :key="pm.id"
            class="payment-method-item"
          >
            <div class="payment-info">
              <div class="card-icon">💳</div>
              <div>
                <strong>{{ pm.brand.toUpperCase() }} •••• {{ pm.last4 }}</strong>
                <p class="text-muted">Expires {{ pm.exp_month }}/{{ pm.exp_year }}</p>
              </div>
              <span v-if="pm.is_default" class="badge badge-success">Default</span>
            </div>

            <div class="payment-actions">
              <button
                v-if="!pm.is_default"
                @click="setDefaultPayment(pm.id)"
                class="btn btn-secondary btn-sm"
              >
                Set Default
              </button>
              <button
                @click="removePayment(pm.id)"
                class="btn btn-danger btn-sm"
                :disabled="pm.is_default"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <button @click="showAddPaymentModal = true" class="btn btn-primary mt-1">
          + Add Payment Method
        </button>
      </div>

      <!-- Usage Statistics -->
      <div class="card full-width">
        <h2 class="card-title">Usage & Billing</h2>

        <div v-if="userStore.usageStats" class="usage-stats">
          <div class="stats-summary">
            <div class="stat-box">
              <div class="stat-number">{{ userStore.usageStats.total_calls }}</div>
              <div class="stat-label">Total Calls</div>
            </div>
            <div class="stat-box">
              <div class="stat-number">{{ userStore.usageStats.total_minutes }}</div>
              <div class="stat-label">Total Minutes</div>
            </div>
            <div class="stat-box highlight">
              <div class="stat-number">${{ userStore.usageStats.total_spent.toFixed(2) }}</div>
              <div class="stat-label">Total Spent</div>
            </div>
          </div>

          <div class="current-month">
            <h3>This Month</h3>
            <div class="month-stats">
              <div>
                <strong>{{ userStore.usageStats.current_month.calls }}</strong> calls
              </div>
              <div>
                <strong>{{ userStore.usageStats.current_month.minutes }}</strong> minutes
              </div>
              <div>
                <strong>${{ userStore.usageStats.current_month.spent.toFixed(2) }}</strong> spent
              </div>
            </div>
          </div>

          <div class="monthly-breakdown">
            <h3>Monthly Breakdown</h3>
            <div class="breakdown-table">
              <div class="table-header">
                <div>Month</div>
                <div>Calls</div>
                <div>Minutes</div>
                <div>Spent</div>
              </div>
              <div
                v-for="month in userStore.usageStats.monthly_breakdown"
                :key="month.month"
                class="table-row"
              >
                <div>{{ month.month }}</div>
                <div>{{ month.calls }}</div>
                <div>{{ month.minutes }}</div>
                <div>${{ month.spent.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Call History -->
      <div class="card full-width">
        <h2 class="card-title">Call History</h2>

        <div v-if="callsStore.calls.length === 0" class="empty-state-small">
          <p>No calls yet</p>
        </div>

        <div v-else class="call-history-table">
          <div class="table-header">
            <div>Persona</div>
            <div>Date</div>
            <div>Duration</div>
            <div>Cost</div>
            <div>Status</div>
          </div>
          <div
            v-for="call in callsStore.calls"
            :key="call.id"
            class="table-row"
          >
            <div>{{ call.persona_name }}</div>
            <div>{{ formatDateTime(call.start_time) }}</div>
            <div>{{ formatDuration(call.duration) }}</div>
            <div>${{ call.cost.toFixed(2) }}</div>
            <div>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Add Payment Method Modal -->
    <div v-if="showAddPaymentModal" class="modal-overlay" @click="closePaymentModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add Payment Method</h2>
          <button @click="closePaymentModal" class="btn-close">×</button>
        </div>

        <div class="payment-info-box">
          <p>In a real implementation, this would integrate with Stripe Elements to securely collect card information.</p>
          <p><strong>For demo purposes:</strong> Enter any card details below</p>
        </div>

        <form @submit.prevent="handleAddPayment" class="payment-form">
          <div class="form-group">
            <label class="form-label" for="card-number">Card Number</label>
            <input
              id="card-number"
              v-model="paymentForm.cardNumber"
              type="text"
              class="form-control"
              placeholder="4242 4242 4242 4242"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="exp-date">Expiry</label>
              <input
                id="exp-date"
                v-model="paymentForm.expiry"
                type="text"
                class="form-control"
                placeholder="MM/YY"
                required
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="cvc">CVC</label>
              <input
                id="cvc"
                v-model="paymentForm.cvc"
                type="text"
                class="form-control"
                placeholder="123"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="paymentForm.setAsDefault" type="checkbox" />
              Set as default payment method
            </label>
          </div>

          <div v-if="paymentError" class="error-message">
            {{ paymentError }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closePaymentModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="paymentLoading">
              {{ paymentLoading ? 'Adding...' : 'Add Card' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useUserStore } from '../stores/user'
import { useCallsStore } from '../stores/calls'

const authStore = useAuthStore()
const userStore = useUserStore()
const callsStore = useCallsStore()

// Profile editing
const editingProfile = ref(false)
const profileForm = ref({
  name: '',
  email: '',
  phone: ''
})
const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)

// Payment modal
const showAddPaymentModal = ref(false)
const paymentForm = ref({
  cardNumber: '',
  expiry: '',
  cvc: '',
  setAsDefault: false
})
const paymentLoading = ref(false)
const paymentError = ref('')

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDateTime = (isoString) => {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

const cancelEdit = () => {
  editingProfile.value = false
  profileError.value = ''
  profileSuccess.value = false
}

const handleUpdateProfile = async () => {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = false

  try {
    await userStore.updateProfile(profileForm.value)

    // Update auth store user
    authStore.user = {
      ...authStore.user,
      ...profileForm.value
    }

    profileSuccess.value = true
    setTimeout(() => {
      editingProfile.value = false
      profileSuccess.value = false
    }, 2000)
  } catch (err) {
    profileError.value = err.message || 'Failed to update profile'
  } finally {
    profileLoading.value = false
  }
}

const handleAddPayment = async () => {
  paymentLoading.value = true
  paymentError.value = ''

  try {
    /**
     * In a real implementation, you would:
     * 1. Use Stripe Elements to securely tokenize the card
     * 2. Send the token to your backend
     * 3. Backend creates PaymentMethod and attaches to customer
     *
     * For now, we'll just mock it
     */
    const mockPaymentMethodId = 'pm_' + Math.random().toString(36).substr(2, 9)

    await userStore.addPaymentMethod(mockPaymentMethodId, paymentForm.value.setAsDefault)

    closePaymentModal()
  } catch (err) {
    paymentError.value = err.message || 'Failed to add payment method'
  } finally {
    paymentLoading.value = false
  }
}

const setDefaultPayment = async (paymentMethodId) => {
  try {
    await userStore.setDefaultPaymentMethod(paymentMethodId)
  } catch (err) {
    alert('Failed to set default payment method: ' + err.message)
  }
}

const removePayment = async (paymentMethodId) => {
  if (!confirm('Remove this payment method?')) return

  try {
    await userStore.removePaymentMethod(paymentMethodId)
  } catch (err) {
    alert('Failed to remove payment method: ' + err.message)
  }
}

const closePaymentModal = () => {
  showAddPaymentModal.value = false
  paymentForm.value = {
    cardNumber: '',
    expiry: '',
    cvc: '',
    setAsDefault: false
  }
  paymentError.value = ''
}

onMounted(async () => {
  // Initialize profile form
  if (authStore.user) {
    profileForm.value = {
      name: authStore.user.name,
      email: authStore.user.email,
      phone: authStore.user.phone
    }
  }

  await userStore.fetchBillingInfo()
  await userStore.fetchUsageStats()
  await callsStore.fetchCalls()
})
</script>

<style scoped>
.profile-page {
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

.profile-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

/* Profile Section */
.profile-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.profile-display .btn {
  margin-top: 1rem;
  align-self: flex-start;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

/* Payment Methods */
.payment-methods-list {
  margin-bottom: 1.5rem;
}

.payment-method-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.payment-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.card-icon {
  font-size: 2rem;
}

.payment-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Usage Stats */
.usage-stats {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-box {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-box.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.current-month {
  padding: 1.5rem;
  background: #e7f3ff;
  border-radius: 8px;
}

.current-month h3 {
  margin: 0 0 1rem 0;
  color: #0c5460;
}

.month-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.monthly-breakdown h3 {
  margin-bottom: 1rem;
  color: #333;
}

/* Tables */
.breakdown-table,
.call-history-table {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  padding: 0.75rem;
  align-items: center;
}

.call-history-table .table-header,
.call-history-table .table-row {
  grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr;
}

.table-header {
  font-weight: 600;
  background: #f8f9fa;
  border-radius: 6px;
}

.table-row {
  border-bottom: 1px solid #e9ecef;
}

.table-row:last-child {
  border-bottom: none;
}

.empty-state-small {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

/* Modal */
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
  max-width: 500px;
  width: 100%;
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

.payment-info-box {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  color: #856404;
  font-size: 0.9rem;
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
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

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }

  .payment-method-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .payment-actions {
    width: 100%;
  }

  .payment-actions .btn {
    flex: 1;
  }

  .table-header,
  .table-row {
    font-size: 0.85rem;
    gap: 0.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
