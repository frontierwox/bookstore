const express = require('express');
const router = express.Router();
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} = require('../controllers/cartController');

// 1. Import the Coupon Controller
const { validateCoupon } = require('../controllers/CouponController'); 

const { verifyToken } = require('../middleware/auth');

// All routes protected (Base URL: /api/cart)
router.get('/', verifyToken, getCart);
router.post('/add', verifyToken, addToCart);
router.put('/:productId', verifyToken, updateCartItem);
router.delete('/:productId', verifyToken, removeFromCart);
router.delete('/', verifyToken, clearCart);

// 2. Add the Validation Route here
// Final URL will be: POST /api/cart/validate-coupon
router.post('/validate-coupon', verifyToken, validateCoupon); 

module.exports = router;