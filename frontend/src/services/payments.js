import api from './api';

export const createRazorpayOrder = async ({ amount, currency = 'INR' }) => {
  const response = await api.post('/payments/razorpay', { amount, currency });
  return response.data;
};

export const verifyPayment = async (razorpayData) => {
  const response = await api.post('/payments/verify', razorpayData);
  return response.data;
};

export const initiateCoD = async (orderData) => {
  const response = await api.post('/payments/cod', orderData);
  return response.data;
};

// Backwards compatibility
export const initiateRazorpayPayment = async (amount, orderData = {}) => {
  return createRazorpayOrder({ amount, currency: orderData.currency || 'INR' });
};

export const paymentApi = {
  createRazorpayOrder,
  initiateRazorpayPayment,
  verifyPayment,
  initiateCoD
};

export default paymentApi;
