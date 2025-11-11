const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token and get user
 * @access  Private
 */
router.get('/verify', authenticate, authController.verifyToken);

/**
 * @route   POST /api/auth/verify-email-pin
 * @desc    Verify email and PIN for forgot password
 * @access  Public
 */
router.post('/verify-email-pin', authController.verifyEmailAndPin);

/**
 * @route   POST /api/auth/reset-password-with-email-pin
 * @desc    Reset password with email and PIN (without login)
 * @access  Public
 */
router.post('/reset-password-with-email-pin', authController.resetPasswordWithEmailPin);

module.exports = router;
