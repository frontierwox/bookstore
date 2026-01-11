// Custom error class
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper to avoid try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log error with timestamp, message, stack
  console.error('='.repeat(80));
  console.error(`[${new Date().toISOString()}] ERROR:`);
  console.error(`Message: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  console.error('='.repeat(80));

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let additionalDetails = null;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = 'Validation failed';
    additionalDetails = errors.join(', ');
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired';
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
    additionalDetails = `${field} already exists`;
  }

  // Handle custom error objects with status property
  if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
  }

  // Response format
  const response = {
    success: false,
    message: message,
    status: 'error'
  };

  // Add additional details only in development
  if (process.env.NODE_ENV === 'development' && additionalDetails) {
    response.error = additionalDetails;
  }

  // Never expose stack trace in production
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Default 500 status if not specified
  res.status(statusCode).json(response);
};

module.exports = errorHandler;

// Also export AppError and asyncHandler for use in controllers
module.exports.AppError = AppError;
module.exports.asyncHandler = asyncHandler;
