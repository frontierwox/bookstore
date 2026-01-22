const mongoose = require('mongoose');

// Schema for individual color variants
const variantSchema = new mongoose.Schema({
  colorName: { 
    type: String, 
    required: true,
    trim: true 
  },
  hexCode: { 
    type: String, 
    required: true,
    trim: true 
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Variant stock cannot be negative']
  }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  images: [{
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  }
}],
  sizes: {
  type: [String],
  default: [],
},
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  
  // --- PRICING & LOGISTICS ---

  // 1. Retail Settings
  retail: {
    shippingCost: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },

  // 2. Wholesale Settings
  wholesalePrice: { 
    type: Number, 
    min: 0,
    default: 0
  },
  wholesale: {
    shippingCost: { type: Number, default: 0, min: 0 },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 }
  },

  // --- DISCOUNTS ---
  isDiscountActive: { type: Boolean, default: false },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  discountStartDate: Date,
  discountEndDate: Date,

  // --- METADATA ---
  tags: [String],
  variants: [variantSchema],
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- VIRTUALS & METHODS ---

// Virtual: Final Price (Retail with Discount)
productSchema.virtual('finalPrice').get(function() {
  if (this.checkDiscountActive()) {
    return this.price - (this.price * this.discountPercentage) / 100;
  }
  return this.price;
});

// Method: Check if discount is valid
productSchema.methods.checkDiscountActive = function() {
  if (!this.isDiscountActive || this.discountPercentage <= 0) return false;
  const now = new Date();
  if (this.discountStartDate && now < this.discountStartDate) return false;
  if (this.discountEndDate && now > this.discountEndDate) return false;
  return true;
};

// Method: Get Price based on Role
productSchema.methods.getCurrentPrice = function(userRole = 'user') {
  if (userRole === 'reseller' && this.wholesalePrice > 0) {
    return this.wholesalePrice;
  }
  if (this.checkDiscountActive()) {
    return this.finalPrice;
  }
  return this.price;
};

// ✅ FIX: Missing Method 1 - Get Shipping Cost
productSchema.methods.getShippingCost = function(userRole = 'user') {
  if (userRole === 'reseller') {
    // If wholesale shipping is set, use it. Otherwise fall back to 0 or Retail if desired.
    // Usually wholesale shipping is higher or calculated differently.
    return this.wholesale?.shippingCost || 0;
  }
  return this.retail?.shippingCost || 0;
};

// ✅ FIX: Missing Method 2 - Get Tax Percentage
productSchema.methods.getTaxPercentage = function(userRole = 'user') {
  if (userRole === 'reseller') {
    return this.wholesale?.taxPercentage || 0;
  }
  return this.retail?.taxPercentage || 0;
};

// Pre-save hook to calc total stock from variants
productSchema.pre('save', function(next) {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((total, v) => total + (v.stock || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);