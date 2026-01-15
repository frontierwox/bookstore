const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// Helper to populate cart
const populateCart = async (cart) => {
  return await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check for price updates
  await populateCart(cart);
  let shouldSave = false;

  cart.items.forEach(item => {
    const product = item.product;
    if (product && typeof product.getCurrentPrice === 'function') {
      const currentPrice = product.getCurrentPrice();
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        shouldSave = true;
      }
    }
  });

  if (shouldSave) {
    await cart.save();
  }

  res.json({ success: true, cart });
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { product, quantity, selectedSize, selectedColor } = req.body;

  const productDoc = await Product.findById(product);
  if (!productDoc) throw new AppError(404, 'Product not found');
  if (productDoc.stock < quantity) throw new AppError(400, 'Insufficient stock');

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === product &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
  );

  const unitPrice = typeof productDoc.getCurrentPrice === 'function'
    ? productDoc.getCurrentPrice()
    : productDoc.price;

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
    cart.items[existingItemIndex].price = unitPrice; // Update price on add
  } else {
    cart.items.push({
      product,
      quantity,
      price: unitPrice,
      selectedSize,
      selectedColor
    });
  }

  await cart.save();
  await populateCart(cart);

  res.json({ success: true, message: 'Item added to cart', cart });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  // 1. Manual validation check (safety net)
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    throw new AppError(400, 'Quantity must be at least 1');
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError(404, 'Cart not found');

  // 2. Robust ID Lookup (Handles both ItemID and ProductID)
  const identifier = req.params.productId || req.params.itemId;
  
  // Find index of the item
  const itemIndex = cart.items.findIndex(i => 
    i._id.toString() === identifier || i.product.toString() === identifier
  );

  if (itemIndex === -1) {
    throw new AppError(404, 'Item not found in cart');
  }

  const item = cart.items[itemIndex];

  // 3. Check Stock
  // We need to fetch the product to check stock, as it might not be populated yet if we just fetched the cart
  const product = await Product.findById(item.product);
  
  if (!product) {
    // Edge case: Product was deleted from DB but is still in cart
    cart.items.pull(item._id);
    await cart.save();
    throw new AppError(404, 'Product no longer exists');
  }

  if (product.stock < quantity) {
    throw new AppError(400, `Only ${product.stock} items available`);
  }

  // 4. Update
  cart.items[itemIndex].quantity = quantity;
  cart.items[itemIndex].price = typeof product.getCurrentPrice === 'function' ? product.getCurrentPrice() : product.price;

  await cart.save();
  await populateCart(cart);

  res.json({ success: true, message: 'Cart updated', cart });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError(404, 'Cart not found');

  const identifier = req.params.productId || req.params.itemId;

  // Find the item to ensure it exists
  const item = cart.items.find(i => 
    i._id.toString() === identifier || i.product.toString() === identifier
  );

  if (!item) {
    throw new AppError(404, 'Item not found in cart');
  }

  // FIX: Use pull() on the array instead of item.remove()
  cart.items.pull(item._id);

  await cart.save();
  await populateCart(cart);

  res.json({ success: true, message: 'Item removed', cart });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new AppError(404, 'Cart not found');

  cart.items = [];
  await cart.save();

  res.json({ success: true, message: 'Cart cleared', cart });
});

// @desc    Merge cart
// @route   POST /api/cart/merge
// @access  Private
exports.mergeCart = asyncHandler(async (req, res) => {
  const { guestCartItems } = req.body;
  if (!guestCartItems || !Array.isArray(guestCartItems)) {
    throw new AppError(400, 'Invalid guest cart items');
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: guestCartItems });
  } else {
    for (const guestItem of guestCartItems) {
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === guestItem.product &&
                item.selectedSize === guestItem.selectedSize &&
                item.selectedColor === guestItem.selectedColor
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += guestItem.quantity;
      } else {
        cart.items.push(guestItem);
      }
    }
  }

  await cart.save();
  // Perform price update check
  await populateCart(cart);
  
  // Logic to refresh prices after merge
  let shouldSave = false;
  cart.items.forEach(item => {
    const product = item.product;
    if (product && typeof product.getCurrentPrice === 'function') {
      const currentPrice = product.getCurrentPrice();
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        shouldSave = true;
      }
    }
  });

  if (shouldSave) await cart.save();

  res.json({ success: true, message: 'Cart merged', cart });
});