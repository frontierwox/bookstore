const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

// Dashboard statistics
router.get('/dashboard', auth, adminController.getDashboardStats);

// Get all users with pagination
router.get(
  '/users',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('search').optional().trim()
  ],
  adminController.getAllUsers
);

// Get user details
router.get(
  '/users/:userId',
  auth,
  [param('userId').isMongoId().withMessage('Invalid user ID')],
  adminController.getUserDetails
);

// Update user status
router.put(
  '/users/:userId/status',
  auth,
  [
    param('userId').isMongoId().withMessage('Invalid user ID'),
    body('status').isIn(['active', 'blocked']).withMessage('Invalid status')
  ],
  adminController.updateUserStatus
);

// Get all orders with pagination and filters
router.get(
  '/orders',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format'),
    query('search').optional().trim()
  ],
  adminController.getAllOrders
);

// Get sales analytics
router.get(
  '/analytics/sales',
  auth,
  [
    query('period').optional().isIn(['today', 'week', 'month', 'year', 'all']).withMessage('Invalid period')
  ],
  adminController.getSalesAnalytics
);

// Get product analytics
router.get(
  '/analytics/products',
  auth,
  adminController.getProductAnalytics
);

// Get low stock products
router.get(
  '/products/low-stock',
  auth,
  [
    query('threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer')
  ],
  adminController.getLowStockProducts
);

// Bulk update product prices
router.put(
  '/products/bulk-update',
  auth,
  [
    body('productIds').isArray({ min: 1 }).withMessage('At least one product ID is required'),
    body('action').isIn(['increase', 'decrease', 'set']).withMessage('Invalid action'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be a positive number')
  ],
  adminController.bulkUpdateProducts
);

// Export orders (CSV/Excel)
router.get(
  '/orders/export',
  auth,
  [
    query('format').optional().isIn(['csv', 'excel']).withMessage('Format must be csv or excel'),
    query('dateFrom').optional().isISO8601().withMessage('Invalid date format'),
    query('dateTo').optional().isISO8601().withMessage('Invalid date format')
  ],
  adminController.exportOrders
);

// Get recent activities
router.get(
  '/activities/recent',
  auth,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  adminController.getRecentActivities
);

module.exports = router;
