import api from './api';

export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

export const addToCart = async (item) => {
  const response = await api.post('/cart/add', item);
  return response.data;
};

export const updateCartItem = async (productId, quantity) => {
  const response = await api.put(`/cart/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

export const clearCart = async () => {
  const response = await api.delete('/cart');
  return response.data;
};

// --- UPDATED FUNCTION ---
export const validateCoupon = async (couponData) => {
  // Updated URL to match the route in backend/routes/cart.js
  const response = await api.post('/cart/validate-coupon', couponData);
  return response.data;
};

export const cartApi = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCoupon // Ensure this is exported
};

export default cartApi;