import api from './api'

export const paymentApi = {
  // Create Razorpay order
  createRazorpayOrder: async (orderData) => {
    const response = await api.post('/payments/create-order', orderData)
    return response.data
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await api.post('/payments/verify', paymentData)
    return response.data
  },

  // Handle payment failure
  handlePaymentFailure: async (failureData) => {
    const response = await api.post('/payments/failed', failureData)
    return response.data
  },

  // Get payment status
  getPaymentStatus: async (paymentId) => {
    const response = await api.get(`/payments/status/${paymentId}`)
    return response.data
  },

  // Get payment by order
  getPaymentByOrder: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`)
    return response.data
  }
}
