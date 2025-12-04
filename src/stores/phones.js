import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Phone Numbers Store
 *
 * Manages verified phone numbers for the user.
 * Numbers are stored locally and synced with the backend on verification.
 * The primary number is the one used by default for calls.
 * Each number can have a nickname for easy identification.
 */
export const usePhonesStore = defineStore('phones', () => {
  // List of verified phone numbers
  // Each entry: { phone: string, nickname: string, verified: boolean, isPrimary: boolean, addedAt: string }
  const phoneNumbers = ref([])

  // Initialize from localStorage
  const initFromStorage = () => {
    const stored = localStorage.getItem('verifiedPhones')
    if (stored) {
      try {
        phoneNumbers.value = JSON.parse(stored)
      } catch (e) {
        phoneNumbers.value = []
      }
    }
  }

  // Save to localStorage
  const saveToStorage = () => {
    localStorage.setItem('verifiedPhones', JSON.stringify(phoneNumbers.value))
  }

  // Get the primary phone number
  const primaryPhone = computed(() => {
    const primary = phoneNumbers.value.find(p => p.isPrimary)
    return primary ? primary.phone : (phoneNumbers.value[0]?.phone || null)
  })

  // Get the primary phone entry (with nickname)
  const primaryPhoneEntry = computed(() => {
    const primary = phoneNumbers.value.find(p => p.isPrimary)
    return primary || phoneNumbers.value[0] || null
  })

  // Get all verified phone numbers
  const verifiedPhones = computed(() => {
    return phoneNumbers.value.filter(p => p.verified)
  })

  // Check if a phone number exists
  const hasPhone = (phone) => {
    const normalized = normalizePhone(phone)
    return phoneNumbers.value.some(p => normalizePhone(p.phone) === normalized)
  }

  // Normalize phone to E.164 format
  const normalizePhone = (phone) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) {
      return '+1' + digits
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return '+' + digits
    }
    if (phone.startsWith('+')) {
      return phone
    }
    return '+1' + digits
  }

  // Format phone for display: +1XXXXXXXXXX -> (XXX) XXX-XXXX
  const formatPhoneForDisplay = (phone) => {
    if (!phone) return ''
    const normalized = normalizePhone(phone)
    const digits = normalized.replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
      const local = digits.slice(1)
      return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6, 10)}`
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    return phone
  }

  // Get display label for a phone entry (nickname or formatted number)
  const getDisplayLabel = (phoneEntry) => {
    if (!phoneEntry) return ''
    if (phoneEntry.nickname) {
      return phoneEntry.nickname
    }
    return formatPhoneForDisplay(phoneEntry.phone)
  }

  // Add a verified phone number
  const addVerifiedPhone = (phone, nickname = '', makePrimary = false) => {
    const normalized = normalizePhone(phone)

    // Check if already exists
    const existing = phoneNumbers.value.find(p => normalizePhone(p.phone) === normalized)
    if (existing) {
      existing.verified = true
      if (nickname) {
        existing.nickname = nickname
      }
      if (makePrimary) {
        setPrimary(normalized)
      }
    } else {
      // If this is the first number or makePrimary is true, set as primary
      const shouldBePrimary = makePrimary || phoneNumbers.value.length === 0

      if (shouldBePrimary) {
        // Clear other primaries
        phoneNumbers.value.forEach(p => p.isPrimary = false)
      }

      phoneNumbers.value.push({
        phone: normalized,
        nickname: nickname || '',
        verified: true,
        isPrimary: shouldBePrimary,
        addedAt: new Date().toISOString()
      })
    }

    saveToStorage()
  }

  // Update nickname for a phone number
  const updateNickname = (phone, nickname) => {
    const normalized = normalizePhone(phone)
    const entry = phoneNumbers.value.find(p => normalizePhone(p.phone) === normalized)
    if (entry) {
      entry.nickname = nickname
      saveToStorage()
    }
  }

  // Remove a phone number
  const removePhone = (phone) => {
    const normalized = normalizePhone(phone)
    const index = phoneNumbers.value.findIndex(p => normalizePhone(p.phone) === normalized)

    if (index !== -1) {
      const wasPrimary = phoneNumbers.value[index].isPrimary
      phoneNumbers.value.splice(index, 1)

      // If we removed the primary and there are others, make the first one primary
      if (wasPrimary && phoneNumbers.value.length > 0) {
        phoneNumbers.value[0].isPrimary = true
      }

      saveToStorage()
    }
  }

  // Set a phone as primary
  const setPrimary = (phone) => {
    const normalized = normalizePhone(phone)

    phoneNumbers.value.forEach(p => {
      p.isPrimary = normalizePhone(p.phone) === normalized
    })

    saveToStorage()
  }

  // Sync with user data from auth store
  // Called when user logs in to ensure their verified phone is in the list
  const syncWithUser = (user) => {
    if (user?.phone && user?.phoneVerified) {
      // Only add if not already present
      if (!hasPhone(user.phone)) {
        addVerifiedPhone(user.phone, 'My Phone', true)
      }
    }
  }

  // Initialize on store creation
  initFromStorage()

  return {
    phoneNumbers,
    primaryPhone,
    primaryPhoneEntry,
    verifiedPhones,
    hasPhone,
    normalizePhone,
    formatPhoneForDisplay,
    getDisplayLabel,
    addVerifiedPhone,
    updateNickname,
    removePhone,
    setPrimary,
    syncWithUser,
    initFromStorage
  }
})
