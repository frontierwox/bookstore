const express = require('express');
const router = express.Router();
const { 
  initiateRazorpayPayment, 
  verifyRazorpayPayment, 
  initiateCoD, 
  getPaymentStatus 
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

// All payment routes protected
router.post('/razorpay', verifyToken, initiateRazorpayPayment);  // POST /api/payments/razorpay
router.post('/verify', verifyToken, verifyRazorpayPayment);  // POST /api/payments/verify
router.post('/cod', verifyToken, initiateCoD);  // POST /api/payments/cod
router.get('/:orderId', verifyToken, getPaymentStatus);  // GET /api/payments/:orderId

module.exports = router;
