const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Create Razorpay order
router.post(
  '/create-order',
  auth,
  [
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Invalid currency code')
  ],
  paymentController.createRazorpayOrder
);

// Verify payment
router.post(
  '/verify',
  auth,
  [
    body('razorpayOrderId').trim().notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpayPaymentId').trim().notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpaySignature').trim().notEmpty().withMessage('Razorpay signature is required'),
    body('orderId').isMongoId().withMessage('Invalid order ID')
  ],
  paymentController.verifyPayment
);

// Process failed payment
router.post(
  '/failed',
  auth,
  [
    body('orderId').isMongoId().withMessage('Invalid order ID'),
    body('razorpayOrderId').trim().notEmpty().withMessage('Razorpay order ID is required'),
    body('error').optional().isObject()
  ],
  paymentController.handlePaymentFailure
);

// Initiate refund
router.post(
  '/refund',
  auth,
  [
    body('paymentId').isMongoId().withMessage('Invalid payment ID'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
    body('reason').optional().trim().notEmpty().withMessage('Refund reason cannot be empty')
  ],
  paymentController.initiateRefund
);

// Get payment status
router.get(
  '/status/:paymentId',
  auth,
  [param('paymentId').isMongoId().withMessage('Invalid payment ID')],
  paymentController.getPaymentStatus
);

// Get payment by order
router.get(
  '/order/:orderId',
  auth,
  [param('orderId').isMongoId().withMessage('Invalid order ID')],
  paymentController.getPaymentByOrder
);

module.exports = router;
