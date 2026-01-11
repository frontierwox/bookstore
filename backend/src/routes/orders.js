const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Create new order
router.post(
  '/',
  auth,
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('shippingAddress.name').trim().notEmpty().withMessage('Name is required'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Phone is required'),
    body('shippingAddress.address').trim().notEmpty().withMessage('Address is required'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
    body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
    body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),
    body('paymentMethod').isIn(['cod', 'razorpay', 'card']).withMessage('Invalid payment method')
  ],
  orderController.createOrder
);

// Get user's orders with pagination
router.get(
  '/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
  ],
  orderController.getUserOrders
);

// Get order by ID
router.get(
  '/:id',
  auth,
  [param('id').isMongoId().withMessage('Invalid order ID')],
  orderController.getOrderById
);

// Cancel order
router.put(
  '/:id/cancel',
  auth,
  [param('id').isMongoId().withMessage('Invalid order ID')],
  orderController.cancelOrder
);

// Track order
router.get(
  '/:id/tracking',
  auth,
  [param('id').isMongoId().withMessage('Invalid order ID')],
  orderController.trackOrder
);

// Update order status (Admin only)
router.put(
  '/:id/status',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    body('note').optional().trim()
  ],
  orderController.updateOrderStatus
);

// Add note to order (Admin only)
router.post(
  '/:id/notes',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('note').trim().notEmpty().withMessage('Note cannot be empty')
  ],
  orderController.addOrderNote
);

module.exports = router;
