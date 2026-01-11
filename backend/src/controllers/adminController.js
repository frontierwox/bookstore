const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
exports.getDashboardStats = asyncHandler(async (req, res) => {
  // Total revenue
  const completedOrders = await Order.find({ paymentStatus: 'completed' });
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  // Total orders
  const totalOrders = await Order.countDocuments();

  // Total users
  const totalUsers = await User.countDocuments();

  // Total products
  const totalProducts = await Product.countDocuments();

  // Recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('user', 'name email');

  // Pending orders
  const pendingOrders = await Order.countDocuments({ status: 'pending' });

  // Low stock products
  const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });

  // Today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysOrders = await Order.countDocuments({
    createdAt: { $gte: today }
  });

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      totalUsers,
      totalProducts,
      pendingOrders,
      lowStockProducts,
      todaysOrders
    },
    recentOrders
  });
});

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  res.json({
    success: true,
    count: users.length,
    total,
    users
  });
});

// @desc    Get user details
// @route   GET /api/admin/users/:userId
// @access  Private (Admin)
exports.getUserDetails = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const user = await User.findById(req.params.userId).select('-password');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Get user's orders
  const orders = await Order.find({ user: req.params.userId })
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    user,
    orders: orders.length,
    recentOrders: orders
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:userId/status
// @access  Private (Admin)
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { status } = req.body;

  const user = await User.findById(req.params.userId);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Prevent blocking the admin
  if (user.role === 'admin') {
    throw new AppError(400, 'Cannot update admin status');
  }

  user.isActive = status === 'active';
  await user.save();

  res.json({
    success: true,
    message: 'User status updated successfully',
    user
  });
});

// @desc    Get all orders with pagination and filters
// @route   GET /api/admin/orders
// @access  Private (Admin)
exports.getAllOrders = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.dateFrom || req.query.dateTo) {
    query.createdAt = {};
    if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
  }

  if (req.query.search) {
    query.orderNumber = { $regex: req.query.search, $options: 'i' };
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    count: orders.length,
    total,
    orders
  });
});

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Private (Admin)
exports.getSalesAnalytics = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const period = req.query.period || 'month';
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate = new Date(0);
      break;
  }

  const orders = await Order.find({
    createdAt: { $gte: startDate },
    paymentStatus: 'completed'
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Sales by category
  const categorySales = {};
  for (const order of orders) {
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const category = product.category;
        if (!categorySales[category]) {
          categorySales[category] = { count: 0, revenue: 0 };
        }
        categorySales[category].count += item.quantity;
        categorySales[category].revenue += item.price * item.quantity;
      }
    }
  }

  res.json({
    success: true,
    analytics: {
      period,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      categorySales
    }
  });
});

// @desc    Get product analytics
// @route   GET /api/admin/analytics/products
// @access  Private (Admin)
exports.getProductAnalytics = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();

  const featuredProducts = await Product.countDocuments({ featured: true });
  const outOfStockProducts = await Product.countDocuments({ stock: 0 });
  const lowStockProducts = await Product.countDocuments({ stock: { $gt: 0, $lt: 10 } });

  // Top selling products
  const topSelling = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        category: '$product.category',
        totalSold: 1,
        revenue: 1
      }
    }
  ]);

  res.json({
    success: true,
    analytics: {
      totalProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      topSelling
    }
  });
});

// @desc    Get low stock products
// @route   GET /api/admin/products/low-stock
// @access  Private (Admin)
exports.getLowStockProducts = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const threshold = parseInt(req.query.threshold) || 10;

  const products = await Product.find({ stock: { $lt: threshold } })
    .sort({ stock: 1 })
    .select('name category stock price');

  res.json({
    success: true,
    count: products.length,
    products
  });
});

// @desc    Bulk update product prices
// @route   PUT /api/admin/products/bulk-update
// @access  Private (Admin)
exports.bulkUpdateProducts = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const { productIds, action, value } = req.body;

  const products = await Product.find({ _id: { $in: productIds } });

  for (const product of products) {
    switch (action) {
      case 'increase':
        product.price = Math.round(product.price * (1 + value / 100) * 100) / 100;
        break;
      case 'decrease':
        product.price = Math.round(product.price * (1 - value / 100) * 100) / 100;
        break;
      case 'set':
        product.price = value;
        break;
    }
    await product.save();
  }

  res.json({
    success: true,
    message: 'Products updated successfully',
    count: products.length
  });
});

// @desc    Export orders
// @route   GET /api/admin/orders/export
// @access  Private (Admin)
exports.exportOrders = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const format = req.query.format || 'csv';
  const query = {};

  if (req.query.dateFrom || req.query.dateTo) {
    query.createdAt = {};
    if (req.query.dateFrom) query.createdAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) query.createdAt.$lte = new Date(req.query.dateTo);
  }

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  // In a real implementation, you would generate CSV/Excel files here
  // For now, return the data
  res.json({
    success: true,
    message: `Orders exported in ${format} format`,
    count: orders.length,
    orders
  });
});

// @desc    Get recent activities
// @route   GET /api/admin/activities/recent
// @access  Private (Admin)
exports.getRecentActivities = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, errors.array()[0].msg);
  }

  const limit = parseInt(req.query.limit) || 20;

  // Get recent orders
  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('orderNumber status createdAt user')
    .populate('user', 'name email');

  // Format as activities
  const activities = recentOrders.map(order => ({
    type: 'order',
    message: `Order ${order.orderNumber} ${order.status}`,
    user: order.user?.name || 'Unknown',
    timestamp: order.createdAt
  }));

  res.json({
    success: true,
    activities
  });
});
