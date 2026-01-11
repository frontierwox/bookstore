const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { amount, currency = 'INR' } = req.body;

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency,
    receipt: `receipt_${Date.now()}`,
    notes: {
      userId: req.user._id.toString()
    }
  };

  try {
    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      order: razorpayOrder
    });
  } catch (error) {
    throw new AppError(500, 'Failed to create payment order');
  }
});

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  // Verify signature
  const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpayOrderId}|${razorpayPaymentId}`);
  const digest = shasum.digest('hex');

  if (digest !== razorpaySignature) {
    throw new AppError(400, 'Invalid payment signature');
  }

  // Find order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Create or update payment record
  const payment = await Payment.findOneAndUpdate(
    { order: orderId },
    {
      order: orderId,
      user: req.user._id,
      amount: order.totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'completed',
      razorpayDetails: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature
      },
      transactionId: razorpayPaymentId
    },
    { upsert: true, new: true }
  );

  // Update order payment status
  order.paymentStatus = 'completed';
  await order.save();

  res.json({
    success: true,
    message: 'Payment verified successfully',
    payment
  });
});

// @desc    Handle payment failure
// @route   POST /api/payments/failed
// @access  Private
exports.handlePaymentFailure = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { orderId, razorpayOrderId, error } = req.body;

  // Find order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Create or update payment record
  const payment = await Payment.findOneAndUpdate(
    { order: orderId },
    {
      order: orderId,
      user: req.user._id,
      amount: order.totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'failed',
      razorpayDetails: {
        orderId: razorpayOrderId
      },
      failureReason: error?.code || 'Payment failed'
    },
    { upsert: true, new: true }
  );

  // Update order payment status
  order.paymentStatus = 'failed';
  await order.save();

  res.json({
    success: true,
    message: 'Payment failure recorded',
    payment
  });
});

// @desc    Initiate refund
// @route   POST /api/payments/refund
// @access  Private (Admin)
exports.initiateRefund = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { paymentId, amount, reason } = req.body;

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  if (payment.paymentStatus !== 'completed') {
    throw new AppError(400, 'Cannot refund a non-completed payment');
  }

  if (!payment.razorpayDetails.paymentId) {
    throw new AppError(400, 'No Razorpay payment found');
  }

  try {
    const refundAmount = amount || payment.amount;
    const refundOptions = {
      amount: refundAmount * 100, // Convert to paise
      notes: {
        reason: reason || 'Refund initiated'
      }
    };

    const razorpayRefund = await razorpay.payments.refund(
      payment.razorpayDetails.paymentId,
      refundOptions
    );

    // Update payment record
    payment.refundDetails = {
      refundId: razorpayRefund.id,
      amount: refundAmount,
      status: 'processed',
      refundedAt: new Date()
    };

    if (refundAmount === payment.amount) {
      payment.paymentStatus = 'refunded';
    } else {
      payment.paymentStatus = 'partial_refund';
    }

    await payment.save();

    // Update order if full refund
    if (refundAmount === payment.amount) {
      const order = await Order.findById(payment.order);
      if (order) {
        order.status = 'refunded';
        await order.save();
      }
    }

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      refund: razorpayRefund
    });
  } catch (error) {
    throw new AppError(500, 'Failed to initiate refund');
  }
});

// @desc    Get payment status
// @route   GET /api/payments/status/:paymentId
// @access  Private
exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  // Check if user owns the payment or is admin
  if (payment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'Not authorized to access this payment');
  }

  res.json({
    success: true,
    payment
  });
});

// @desc    Get payment by order
// @route   GET /api/payments/order/:orderId
// @access  Private
exports.getPaymentByOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const order = await Order.findById(req.params.orderId);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'Not authorized to access this order');
  }

  const payment = await Payment.findOne({ order: req.params.orderId });

  res.json({
    success: true,
    payment
  });
});
