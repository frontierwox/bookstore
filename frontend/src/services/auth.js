import api from './api'

// Register new user
export const authApi = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    const response = await api.post('/auth/logout')
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData)
    return response.data
  },

  addAddress: async (addressData) => {
    const response = await api.post('/auth/address', addressData)
    return response.data
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/auth/address/${addressId}`, addressData)
    return response.data
  },

  deleteAddress: async (addressId) => {
    const response = await api.delete(`/auth/address/${addressId}`)
    return response.data
  },

  setDefaultAddress: async (addressId) => {
    const response = await api.put(`/auth/address/${addressId}/default`)
    return response.data
  }
}
