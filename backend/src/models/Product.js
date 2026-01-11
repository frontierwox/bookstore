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

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
