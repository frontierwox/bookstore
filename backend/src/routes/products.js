const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');

// Get all products with filtering and pagination
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be a positive number'),
    query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be a positive number'),
    query('category').optional().isIn(['silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'banarasi', 'kanchipuram', 'other']),
    query('sort').optional().isIn(['price-asc', 'price-desc', 'newest', 'popular'])
  ],
  productController.getAllProducts
);

// Get featured products
router.get('/featured', productController.getFeaturedProducts);

// Get product by ID
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID')],
  productController.getProductById
);

// Search products
router.get(
  '/search/:query',
  [param('query').trim().notEmpty().withMessage('Search query is required')],
  productController.searchProducts
);

// Get products by category
router.get(
  '/category/:category',
  [param('category').trim().notEmpty().withMessage('Category is required')],
  productController.getProductsByCategory
);

// Create product (Admin only)
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('category').isIn(['silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'banarasi', 'kanchipuram', 'other']),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
  ],
  productController.createProduct
);

// Update product (Admin only)
router.put(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
  ],
  productController.updateProduct
);

// Delete product (Admin only)
router.delete(
  '/:id',
  auth,
  [param('id').isMongoId().withMessage('Invalid product ID')],
  productController.deleteProduct
);

// Add product review
router.post(
  '/:id/reviews',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().notEmpty().withMessage('Comment cannot be empty')
  ],
  productController.addReview
);

module.exports = router;
