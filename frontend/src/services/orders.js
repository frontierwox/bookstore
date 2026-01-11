import api from './api'

export const orderApi = {
  // Create new order
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  // Get user's orders
  getUserOrders: async (params = {}) => {
    const response = await api.get('/orders', { params })
    return response.data
  },

  // Get order by ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  // Cancel order
  cancelOrder: async (id) => {
    const response = await api.put(`/orders/${id}/cancel`)
    return response.data
  },

  // Track order
  trackOrder: async (id) => {
    const response = await api.get(`/orders/${id}/tracking`)
    return response.data
  }
}

// Admin specific
export const adminOrderApi = {
  // Get all orders (Admin)
  getAllOrders: async (params = {}) => {
    const response = await api.get('/admin/orders', { params })
    return response.data
  },

  // Update order status (Admin)
  updateOrderStatus: async (id, statusData) => {
    const response = await api.put(`/admin/orders/${id}/status`, statusData)
    return response.data
  },

  // Add note to order (Admin)
  addOrderNote: async (id, noteData) => {
    const response = await api.post(`/admin/orders/${id}/notes`, noteData)
    return response.data
  }
}
