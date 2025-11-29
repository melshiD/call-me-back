/**
 * Payment services for Stripe checkout
 *
 * Note: This uses the JWT auth token to authenticate with our backend.
 * Stripe payment handling happens entirely server-side - the frontend
 * only receives a checkout URL to redirect the user to Stripe's hosted page.
 */

const apiUrl = import.meta.env.VITE_API_URL

/**
 * Create a Stripe Checkout session for purchasing minutes
 *
 * @param {string} sku - The product SKU (minutes_25, minutes_50, minutes_100)
 * @returns {Promise<{checkoutUrl: string}>} - The Stripe checkout URL
 */
export async function createCheckoutSession(sku) {
  // Get JWT auth token (NOT a Stripe token - Stripe is handled server-side)
  const authToken = localStorage.getItem('token')

  if (!authToken) {
    throw new Error('Authentication required')
  }

  const response = await fetch(`${apiUrl}/api/payments/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ sku })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `Failed to create checkout session: ${response.status}`)
  }

  const data = await response.json()
  return { checkoutUrl: data.checkoutUrl || data.url }
}
