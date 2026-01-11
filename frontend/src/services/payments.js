import api from './api';

export const initiateRazorpayPayment = async (amount, orderData) => {
  const response = await api.post('/payments/razorpay/initiate', { amount, ...orderData });
  return response.data;
};

export const verifyPayment = async (razorpayData) => {
  const response = await api.post('/payments/razorpay/verify', razorpayData);
  return response.data;
};

export const initiateCoD = async (orderData) => {
  const response = await api.post('/payments/cod', orderData);
  return response.data;
};

export const paymentApi = {
  initiateRazorpayPayment,
  verifyPayment,
  initiateCoD
};

export default paymentApi;
