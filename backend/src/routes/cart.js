const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const cartController = require('../controllers/cartController');
const auth = require('../middleware/auth');

// Get user's cart
router.get('/', auth, cartController.getCart);

// Add item to cart
router.post(
  '/add',
  auth,
  [
    body('product').isMongoId().withMessage('Valid product ID is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('selectedSize').optional().isIn(['S', 'M', 'L', 'XL', 'XXL', 'Free Size']),
    body('selectedColor').optional().trim()
  ],
  cartController.addToCart
);

// Update cart item quantity
router.put(
  '/item/:itemId',
  auth,
  [
    param('itemId').isMongoId().withMessage('Invalid item ID'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  cartController.updateCartItem
);

// Update cart item details (size, color)
router.put(
  '/item/:itemId/details',
  auth,
  [
    param('itemId').isMongoId().withMessage('Invalid item ID'),
    body('selectedSize').optional().isIn(['S', 'M', 'L', 'XL', 'XXL', 'Free Size']),
    body('selectedColor').optional().trim()
  ],
  cartController.updateCartItemDetails
);

// Remove item from cart
router.delete(
  '/item/:itemId',
  auth,
  [param('itemId').isMongoId().withMessage('Invalid item ID')],
  cartController.removeFromCart
);

// Clear cart
router.delete('/clear', auth, cartController.clearCart);

// Merge cart (for guest users)
router.post(
  '/merge',
  auth,
  [body('guestCartItems').isArray().withMessage('Guest cart items must be an array')],
  cartController.mergeCart
);

module.exports = router;
