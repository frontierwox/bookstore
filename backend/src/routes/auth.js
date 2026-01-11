const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Register a new user
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required')
  ],
  authController.register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Logout user
router.post('/logout', auth, authController.logout);

// Get current user
router.get('/me', auth, authController.getCurrentUser);

// Update user profile
router.put(
  '/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number is required')
  ],
  authController.updateProfile
);

// Change password
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  authController.changePassword
);

// Add address
router.post(
  '/address',
  auth,
  authController.addAddress
);

// Update address
router.put(
  '/address/:addressId',
  auth,
  authController.updateAddress
);

// Delete address
router.delete(
  '/address/:addressId',
  auth,
  authController.deleteAddress
);

// Set default address
router.put(
  '/address/:addressId/default',
  auth,
  authController.setDefaultAddress
);

module.exports = router;
