import api from './api'

export const cartApi = {
  // Get user's cart
  getCart: async () => {
    const response = await api.get('/cart')
    return response.data
  },

  // Add item to cart
  addToCart: async (itemData) => {
    const response = await api.post('/cart/add', itemData)
    return response.data
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantityData) => {
    const response = await api.put(`/cart/item/${itemId}`, quantityData)
    return response.data
  },

  // Update cart item details (size, color)
  updateCartItemDetails: async (itemId, detailsData) => {
    const response = await api.put(`/cart/item/${itemId}/details`, detailsData)
    return response.data
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/item/${itemId}`)
    return response.data
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/cart/clear')
    return response.data
  },

  // Merge guest cart
  mergeCart: async (guestCartItems) => {
    const response = await api.post('/cart/merge', { guestCartItems })
    return response.data
  }
}
