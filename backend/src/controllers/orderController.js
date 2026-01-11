const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { SHIPPING, TAX_RATE } = require('../config/constants');
const { sendOrderConfirmation, sendOrderShipped, sendOrderDelivered, sendAdminNotification } = require('../utils/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { items, shippingAddress, paymentMethod } = req.body;

  // Calculate subtotal and discounts
  let subtotal = 0;
  let totalDiscount = 0;
  const appliedDiscounts = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new AppError(404, `Product ${item.product} not found`);
    }

    const itemPrice = product.getCurrentPrice();
    const originalPrice = product.price;
    const discountAmount = originalPrice - itemPrice;
    const discountPercentage = product.discountPercentage;

    if (discountAmount > 0) {
      totalDiscount += discountAmount * item.quantity;
      appliedDiscounts.push({
        productId: product._id,
        productName: product.name,
        originalPrice,
        discountPercentage,
        discountAmount: discountAmount * item.quantity,
        finalPrice: itemPrice * item.quantity
      });
    }

    subtotal += itemPrice * item.quantity;
  }

  // Calculate shipping cost
  const shippingCost = subtotal >= SHIPPING.FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING.DEFAULT_COST;

  // Calculate tax
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

  // Calculate total
  const totalAmount = subtotal + shippingCost + tax;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    customerEmail: req.user.email,
    customerPhone: req.user.phone || shippingAddress.phone,
    items: items.map(item => ({
      ...item,
      price: item.price // Keep original price for historical purposes
    })),
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingCost,
    tax,
    discount: totalDiscount,
    discountDetails: {
      totalDiscount,
      appliedDiscounts
    },
    totalAmount,
    estimatedDelivery: new Date(Date.now() + SHIPPING.ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000)
  });

  // Update product stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity }
    });
  }

  // Clear cart
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] }
  );

  // Add initial status
  order.statusHistory.push({
    status: 'pending',
    note: 'Order placed'
  });
  await order.save();

  // Send order confirmation email
  try {
    await sendOrderConfirmation(order);
    order.emailNotifications.confirmationSent = true;
    order.emailNotifications.confirmationSentAt = new Date();
    await order.save();
  } catch (emailError) {
    console.error('Failed to send order confirmation email:', emailError);
    // Don't fail the order creation if email fails
  }

  // Send admin notification
  try {
    await sendAdminNotification(order);
  } catch (emailError) {
    console.error('Failed to send admin notification:', emailError);
    // Don't fail the order creation if admin email fails
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    order
  });
});

// @desc    Get user's orders with pagination
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { user: req.user._id };

  if (req.query.status) {
    query.status = req.query.status;
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.product', 'name images');

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    orders
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images specifications');

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError(403, 'Not authorized to access this order');
  }

  res.json({
    success: true,
    order
  });
});

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'Not authorized to cancel this order');
  }

  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled', 'refunded'].includes(order.status)) {
    throw new AppError(400, 'Order cannot be cancelled');
  }

  // Update order status
  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    note: 'Order cancelled by user'
  });
  await order.save();

  // Restore product stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    order
  });
});

// @desc    Track order
// @route   GET /api/orders/:id/tracking
// @access  Private
exports.trackOrder = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  // Check if user owns the order
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError(403, 'Not authorized to access this order');
  }

  res.json({
    success: true,
    tracking: {
      orderNumber: order.orderNumber,
      status: order.status,
      statusHistory: order.statusHistory,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt
    }
  });
});

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  const oldStatus = order.status;

  // Update status
  order.status = status;
  order.statusHistory.push({
    status,
    note: note || `Status updated to ${status}`
  });

  // Set delivered date if status is delivered
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'completed';
  }

  await order.save();

  // Send email notification based on status change
  try {
    if (status === 'shipped' && !order.emailNotifications.shippedSent) {
      await sendOrderShipped(order);
      order.emailNotifications.shippedSent = true;
      order.emailNotifications.shippedSentAt = new Date();
      await order.save();
    } else if (status === 'delivered' && !order.emailNotifications.deliveredSent) {
      await sendOrderDelivered(order);
      order.emailNotifications.deliveredSent = true;
      order.emailNotifications.deliveredSentAt = new Date();
      await order.save();
    }
  } catch (emailError) {
    console.error('Failed to send status update email:', emailError);
    // Don't fail the status update if email fails
  }

  res.json({
    success: true,
    message: 'Order status updated successfully',
    order
  });
});

// @desc    Add note to order (Admin)
// @route   POST /api/orders/:id/notes
// @access  Private (Admin)
exports.addOrderNote = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  order.notes = note;
  await order.save();

  res.json({
    success: true,
    message: 'Note added successfully',
    order
  });
});

// Alias for route compatibility
exports.getOrders = exports.getUserOrders;

// @desc    Resend order email notification (Admin)
// @route   POST /api/orders/:id/resend-email
// @access  Private (Admin)
exports.resendOrderEmail = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { emailType } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (!order) {
    throw new AppError(404, 'Order not found');
  }

  let emailResult;

  try {
    switch (emailType) {
      case 'confirmation':
        emailResult = await sendOrderConfirmation(order);
        order.emailNotifications.confirmationSent = true;
        order.emailNotifications.confirmationSentAt = new Date();
        break;
      case 'shipped':
        emailResult = await sendOrderShipped(order);
        order.emailNotifications.shippedSent = true;
        order.emailNotifications.shippedSentAt = new Date();
        break;
      case 'delivered':
        emailResult = await sendOrderDelivered(order);
        order.emailNotifications.deliveredSent = true;
        order.emailNotifications.deliveredSentAt = new Date();
        break;
      default:
        throw new AppError(400, 'Invalid email type');
    }

    await order.save();

    res.json({
      success: true,
      message: `${emailType} email sent successfully`,
      result: emailResult
    });
  } catch (emailError) {
    console.error(`Failed to send ${emailType} email:`, emailError);
    throw new AppError(500, `Failed to send ${emailType} email`);
  }
});
