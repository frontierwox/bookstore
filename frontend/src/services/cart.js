import api from './api';

// Get current user's cart
export const getCart = async () => {
  const response = await api.get('/cart');
  return response.data;
};

// Add item to cart
// Payload example: { productId, quantity, selectedColor, selectedSize, price }
export const addToCart = async (item) => {
  const response = await api.post('/cart/add', item);
  return response.data;
};

// Update item quantity
// Note: Uses PUT /cart/:productId
export const updateCartItem = async (productId, quantity) => {
  const response = await api.put(`/cart/${productId}`, { quantity });
  return response.data;
};

// Remove single item
export const removeFromCart = async (productId) => {
  const response = await api.delete(`/cart/${productId}`);
  return response.data;
};

// Clear entire cart
export const clearCart = async () => {
  const response = await api.delete('/cart');
  return response.data;
};

// Validate Coupon Code
export const validateCoupon = async (couponData) => {
  // Post payload: { code, cartTotal, cartItems }
  const response = await api.post('/cart/validate-coupon', couponData);
  return response.data;
};

export const cartApi = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  validateCoupon
};

export default cartApi;