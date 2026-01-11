// Input validation middleware functions

// Validate email
const validateEmail = (req, res, next) => {
  const { email } = req.body;

  // Check if email exists
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
      status: 'error'
    });
  }

  // Validate email format using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
      status: 'error'
    });
  }

  // Call next() if valid
  next();
};

// Validate password
const validatePassword = (req, res, next) => {
  const { password } = req.body;

  // Check if password exists
  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      status: 'error'
    });
  }

  // Validate min 6 chars
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
      status: 'error'
    });
  }

  // Call next() if valid
  next();
};

// Validate product input
const validateProductInput = (req, res, next) => {
  const { name, price, description, sku, category } = req.body;
  const errors = [];

  // Check required fields
  if (!name) errors.push('Product name is required');
  if (!price) errors.push('Product price is required');
  if (!description) errors.push('Product description is required');
  if (!sku) errors.push('Product SKU is required');
  if (!category) errors.push('Product category is required');

  // Validate price is number > 0
  if (price && (typeof price !== 'number' || price <= 0)) {
    errors.push('Price must be a positive number');
  }

  // Validate category is in allowed list
  const allowedCategories = ['silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'banarasi', 'kanchipuram', 'other'];
  if (category && !allowedCategories.includes(category)) {
    errors.push(`Category must be one of: ${allowedCategories.join(', ')}`);
  }

  // Return array of errors if invalid
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      status: 'error'
    });
  }

  next();
};

// Validate order input
const validateOrderInput = (req, res, next) => {
  const { items, customerDetails, totalAmount } = req.body;
  const errors = [];

  // Check required fields
  if (!items) {
    errors.push('Order items are required');
  }
  
  if (!customerDetails) {
    errors.push('Customer details are required');
  }
  
  if (!totalAmount) {
    errors.push('Total amount is required');
  }

  // Validate items array not empty
  if (items && (!Array.isArray(items) || items.length === 0)) {
    errors.push('Order must contain at least one item');
  }

  // Return errors if invalid
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      status: 'error'
    });
  }

  next();
};

// Validate address input
const validateAddressInput = (req, res, next) => {
  const { street, city, state, postalCode, country } = req.body;
  const errors = [];

  // Check required fields
  if (!street) errors.push('Street address is required');
  if (!city) errors.push('City is required');
  if (!state) errors.push('State is required');
  if (!postalCode) errors.push('Postal code is required');
  if (!country) errors.push('Country is required');

  // Return errors if invalid
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      status: 'error'
    });
  }

  next();
};

module.exports = {
  validateEmail,
  validatePassword,
  validateProductInput,
  validateOrderInput,
  validateAddressInput
};
