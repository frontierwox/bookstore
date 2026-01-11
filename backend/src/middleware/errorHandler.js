const { errorMessages } = require('../utils/errorMessages');

// Custom error class
class AppError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Handle Mongoose CastError (invalid ObjectId)
const handleCastErrorDB = (err) => {
  return new AppError(400, `Invalid ${err.path}: ${err.value}`);
};

// Handle Mongoose duplicate key error
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return new AppError(400, `Duplicate field value: ${value}. Please use another value.`);
};

// Handle Mongoose validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  return new AppError(400, `Invalid input data. ${errors.join('. ')}`);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError(401, errorMessages.INVALID_TOKEN);
};

const handleJWTExpiredError = () => {
  return new AppError(401, errorMessages.TOKEN_EXPIRED);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        stack: err.stack,
        ...err
      }
    });
  } else {
    // Production mode
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    // Mongoose validation errors
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    // Operational, trusted error: send message to client
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      // Programming or other unknown error
      console.error('ERROR 💥:', err);
      res.status(500).json({
        success: false,
        message: errorMessages.INTERNAL_SERVER_ERROR
      });
    }
  }
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new AppError(404, `Route ${req.originalUrl} not found`);
  next(error);
};

// Async handler wrapper to avoid try-catch blocks
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  AppError,
  asyncHandler
};
