const express = require('express');
const router = express.Router();
const { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

// All routes protected
router.get('/', verifyToken, getCart);  // GET /api/cart
router.post('/add', verifyToken, addToCart);  // POST /api/cart/add
router.put('/:productId', verifyToken, updateCartItem);  // PUT /api/cart/:productId
router.delete('/:productId', verifyToken, removeFromCart);  // DELETE /api/cart/:productId
router.delete('/', verifyToken, clearCart);  // DELETE /api/cart

module.exports = router;
