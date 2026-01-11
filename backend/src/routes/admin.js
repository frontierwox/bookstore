const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  bulkUpdateStock, 
  getLowStockProducts, 
  uploadImage,
  getAnalyticsOverview,
  getTopSellingProducts,
  updateProductDiscount,
  getDiscountAnalytics,
  getAllOrders,
  updateOrderStatus,
  resendOrderEmail
} = require('../controllers/adminController');
const { 
  getDashboardStats, 
  getSalesByDate, 
  getTopProducts, 
  getLowStockAnalytics, 
  getOrderSummary 
} = require('../controllers/analyticController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { validateProductInput } = require('../middleware/validation');
const multer = require('multer');

// File upload setup
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// All routes protected + admin only
router.use(verifyToken, verifyAdmin);  // Middleware for all routes below

// Product management
router.post('/products', validateProductInput, createProduct);  // POST /api/admin/products
router.put('/products/:id', updateProduct);  // PUT /api/admin/products/:id
router.delete('/products/:id', deleteProduct);  // DELETE /api/admin/products/:id
router.put('/products/stock', bulkUpdateStock);  // PUT /api/admin/products/stock
router.get('/products/stock', getLowStockProducts);  // GET /api/admin/products/stock
router.post('/products/upload', upload.single('image'), uploadImage);  // POST /api/admin/products/upload

// Product discount management
router.put('/products/:id/discount', updateProductDiscount);  // PUT /api/admin/products/:id/discount

// Analytics routes
router.get('/analytics/overview', getAnalyticsOverview);  // GET /api/admin/analytics/overview
router.get('/analytics/top-products', getTopSellingProducts);  // GET /api/admin/analytics/top-products
router.get('/analytics/discounts', getDiscountAnalytics);  // GET /api/admin/analytics/discounts

// Legacy analytics routes (keeping for compatibility)
router.get('/analytics/stats', getDashboardStats);  // GET /api/admin/analytics/stats
router.get('/analytics/sales-by-date', getSalesByDate);  // GET /api/admin/analytics/sales-by-date
router.get('/analytics/top-products-legacy', getTopProducts);  // GET /api/admin/analytics/top-products-legacy
router.get('/analytics/low-stock', getLowStockAnalytics);  // GET /api/admin/analytics/low-stock
router.get('/analytics/orders', getOrderSummary);  // GET /api/admin/analytics/orders

// Order management
router.get('/orders', getAllOrders);  // GET /api/admin/orders
router.put('/orders/:id/status', updateOrderStatus);  // PUT /api/admin/orders/:id/status
router.post('/orders/:id/resend-email', resendOrderEmail);  // POST /api/admin/orders/:id/resend-email

module.exports = router;
