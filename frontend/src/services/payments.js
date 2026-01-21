import api from './api';

export const paymentApi = {
  
  // ✅ SECURE: Send only orderId. Backend calculates amount.
  createRazorpayOrder: async ({ orderId }) => {
    // Matches backend route: router.post('/create-order', ...)
    const response = await api.post('/payments/create-order', { orderId });
    return response.data;
  },

  // ✅ Verify Signature
  verifyPayment: async (verificationData) => {
    // Matches backend route: router.post('/verify', ...)
    // verificationData = { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }
    const response = await api.post('/payments/verify', verificationData);
    return response.data;
  },

  // ✅ Cash on Delivery
  initiateCoD: async ({ orderId }) => {
    // Matches backend route: router.post('/cod', ...)
    const response = await api.post('/payments/cod', { orderId });
    return response.data;
  },

  // ✅ Get Status (Used in Admin/Order Details)
  getPaymentStatus: async (orderId) => {
    const response = await api.get(`/payments/${orderId}`);
    return response.data;
  }
};

export default paymentApi;