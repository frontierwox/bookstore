const express = require('express');
const router = express.Router();
const { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  bulkUpdateStock, 
  getLowStockProducts, 
  uploadImage 
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

// Analytics
router.get('/analytics/stats', getDashboardStats);  // GET /api/admin/analytics/stats
router.get('/analytics/sales-by-date', getSalesByDate);  // GET /api/admin/analytics/sales-by-date
router.get('/analytics/top-products', getTopProducts);  // GET /api/admin/analytics/top-products
router.get('/analytics/low-stock', getLowStockAnalytics);  // GET /api/admin/analytics/low-stock
router.get('/analytics/orders', getOrderSummary);  // GET /api/admin/analytics/orders

module.exports = router;
