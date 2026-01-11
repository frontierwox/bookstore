import api from './api'

export const productsApi = {
  // Get all products with filtering and pagination
  getAllProducts: async (params = {}) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Get featured products
  getFeaturedProducts: async (limit = 10) => {
    const response = await api.get('/products/featured', { params: { limit } })
    return response.data
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const response = await api.get(`/products/search/${query}`, { params })
    return response.data
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    const response = await api.get(`/products/category/${category}`, { params })
    return response.data
  },

  // Create product (Admin)
  createProduct: async (productData) => {
    const response = await api.post('/products', productData)
    return response.data
  },

  // Update product (Admin)
  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData)
    return response.data
  },

  // Delete product (Admin)
  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`)
    return response.data
  },

  // Add product review
  addReview: async (productId, reviewData) => {
    const response = await api.post(`/products/${productId}/reviews`, reviewData)
    return response.data
  }
}
