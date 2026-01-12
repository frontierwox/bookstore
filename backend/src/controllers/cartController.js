const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: []
    });
  }

  let shouldSave = false;
  for (const item of cart.items) {
    const product = item.product;
    if (product && typeof product.getCurrentPrice === 'function') {
      const currentPrice = product.getCurrentPrice();
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        shouldSave = true;
      }
    }
  }

  if (shouldSave) {
    await cart.save();
    await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');
  }

  res.json({
    success: true,
    cart
  });
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

  // Check if product exists
  const productDoc = await Product.findById(product);
  if (!productDoc) {
    throw new AppError(404, 'Product not found');
  }

  // Check stock
  if (productDoc.stock < quantity) {
    throw new AppError(400, 'Insufficient stock');
  }

  // Get user's cart
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: []
    });
  }

  // Check if product already in cart
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
    cart.items[existingItemIndex].price = unitPrice;
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
  await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  res.json({
    success: true,
    message: 'Item added to cart',
    cart
  });
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId or PUT /api/cart/item/:itemId
// @access  Private
exports.updateCartItem = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const identifier = req.params.productId || req.params.itemId;
  const item = cart.items.id(identifier) || cart.items.find(i => i.product.toString() === identifier);

  if (!item) {
    throw new AppError(404, 'Item not found in cart');
  }

  // Check stock
  const product = await Product.findById(item.product);
  if (product.stock < quantity) {
    throw new AppError(400, 'Insufficient stock');
  }

  item.quantity = quantity;
  item.price = typeof product.getCurrentPrice === 'function' ? product.getCurrentPrice() : product.price;

  await cart.save();
  await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  res.json({
    success: true,
    message: 'Cart item updated',
    cart
  });
});

// @desc    Update cart item details (size, color)
// @route   PUT /api/cart/item/:itemId/details
// @access  Private
exports.updateCartItemDetails = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { selectedSize, selectedColor } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const item = cart.items.id(req.params.itemId);
  if (!item) {
    throw new AppError(404, 'Item not found in cart');
  }

  if (selectedSize) item.selectedSize = selectedSize;
  if (selectedColor) item.selectedColor = selectedColor;

  await cart.save();
  await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  res.json({
    success: true,
    message: 'Cart item details updated',
    cart
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId or DELETE /api/cart/item/:itemId
// @access  Private
exports.removeFromCart = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const identifier = req.params.productId || req.params.itemId;
  const item = cart.items.id(identifier) || cart.items.find(i => i.product.toString() === identifier);

  if (!item) {
    throw new AppError(404, 'Item not found in cart');
  }

  item.remove();
  await cart.save();
  await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  res.json({
    success: true,
    message: 'Item removed from cart',
    cart
  });
});

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  cart.items = [];
  await cart.save();

  res.json({
    success: true,
    message: 'Cart cleared',
    cart
  });
});

// @desc    Merge cart (for guest users)
// @route   POST /api/cart/merge
// @access  Private
exports.mergeCart = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { guestCartItems } = req.body;

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: guestCartItems
    });
  } else {
    // Merge guest cart items
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
  await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');

  let shouldSave = false;
  for (const item of cart.items) {
    const product = item.product;
    if (product && typeof product.getCurrentPrice === 'function') {
      const currentPrice = product.getCurrentPrice();
      if (item.price !== currentPrice) {
        item.price = currentPrice;
        shouldSave = true;
      }
    }
  }

  if (shouldSave) {
    await cart.save();
    await cart.populate('items.product', 'name price images stock discountedPrice discountPercentage discountStartDate discountEndDate');
  }

  res.json({
    success: true,
    message: 'Cart merged successfully',
    cart
  });
});
