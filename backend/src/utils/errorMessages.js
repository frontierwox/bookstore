// Error Messages
const errorMessages = {
  // Authentication Errors
  NOT_AUTHORIZED: 'You are not authorized to access this resource',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists with this email',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  PASSWORD_MISMATCH: 'Current password is incorrect',

  // Authorization Errors
  ADMIN_ONLY: 'This action requires admin privileges',
  FORBIDDEN: 'You do not have permission to perform this action',

  // Resource Errors
  NOT_FOUND: 'Resource not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  ORDER_NOT_FOUND: 'Order not found',
  PAYMENT_NOT_FOUND: 'Payment not found',
  CART_NOT_FOUND: 'Cart not found',
  ADDRESS_NOT_FOUND: 'Address not found',

  // Validation Errors
  VALIDATION_ERROR: 'Validation failed',
  INVALID_INPUT: 'Invalid input data',
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_PINCODE: 'Invalid pincode',

  // Stock Errors
  OUT_OF_STOCK: 'Product is out of stock',
  INSUFFICIENT_STOCK: 'Insufficient stock available',

  // Order Errors
  ORDER_CANNOT_BE_CANCELLED: 'This order cannot be cancelled',
  ORDER_CANNOT_BE_UPDATED: 'This order cannot be updated',
  INVALID_ORDER_STATUS: 'Invalid order status',

  // Payment Errors
  PAYMENT_FAILED: 'Payment failed',
  PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',
  REFUND_FAILED: 'Refund failed',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',

  // Upload Errors
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',

  // Rate Limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',

  // Generic Errors
  SOMETHING_WENT_WRONG: 'Something went wrong. Please try again',
  OPERATION_FAILED: 'Operation failed'
};

// HTTP Status Codes
const httpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Success Messages
const successMessages = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  ORDER_PLACED: 'Order placed successfully',
  PAYMENT_SUCCESS: 'Payment successful',
  REFUND_INITIATED: 'Refund initiated successfully',
  VERIFIED: 'Verified successfully',
  SENT: 'Sent successfully'
};

module.exports = {
  errorMessages,
  httpStatus,
  successMessages
};
