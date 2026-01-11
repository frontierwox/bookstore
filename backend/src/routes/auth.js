const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateEmail, validatePassword } = require('../middleware/validation');

// Public routes
router.post('/register', validateEmail, validatePassword, register);
router.post('/login', validateEmail, validatePassword, login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
