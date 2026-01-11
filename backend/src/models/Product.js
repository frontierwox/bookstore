const mongoose = require('mongoose');

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
  discountedPrice: {
    type: Number,
    default: null
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100%']
  },
  discountStartDate: {
    type: Date
  },
  discountEndDate: {
    type: Date
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'banarasi', 'kanchipuram', 'other']
  },
  brand: {
    type: String,
    trim: true
  },
  colors: [{
    type: String,
    trim: true
  }],
  sizes: [{
    type: String,
    enum: ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']
  }],
  images: [{
    url: String,
    alt: String
  }],
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  featured: {
    type: Boolean,
    default: false
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  specifications: {
    fabric: String,
    length: String,
    work: String,
    blousePiece: {
      type: Boolean,
      default: true
    }
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  if (this.discountPercentage > 0) {
    const discountAmount = (this.price * this.discountPercentage) / 100;
    return this.price - discountAmount;
  }
  return this.price;
});

// Method to check if discount is currently active
productSchema.methods.isDiscountActive = function() {
  if (this.discountPercentage <= 0) return false;
  
  const now = new Date();
  
  if (this.discountStartDate && now < this.discountStartDate) return false;
  if (this.discountEndDate && now > this.discountEndDate) return false;
  
  return true;
};

// Method to get current final price
productSchema.methods.getCurrentPrice = function() {
  if (this.isDiscountActive()) {
    return this.finalPrice;
  }
  return this.price;
};

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save middleware to update discountedPrice when discount changes
productSchema.pre('save', function(next) {
  if (this.isDiscountActive()) {
    this.discountedPrice = this.finalPrice;
  } else {
    this.discountedPrice = null;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
