const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               referralCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post('/register',
  authLimiter,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ min: 8, max: 20 }).withMessage('Please provide a valid phone number'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('referralCode').optional().trim()
  ],
  handleValidationErrors,
  (req, res, next) => {
    // Custom validation: either email or phone must be provided
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required',
        errors: [{ msg: 'Either email or phone number is required', param: 'email' }]
      });
    }
    next();
  },
  authController.register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  authLimiter,
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().isLength({ min: 8, max: 20 }).withMessage('Please provide a valid phone number'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  (req, res, next) => {
    // Custom validation: either email or phone must be provided
    const { email, phone } = req.body;
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone number is required',
        errors: [{ msg: 'Either email or phone number is required', param: 'email' }]
      });
    }
    next();
  },
  authController.login
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail()
  ],
  handleValidationErrors,
  authController.forgotPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password',
  authLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  handleValidationErrors,
  authController.resetPassword
);

/**
 * Account recovery search
 */
router.post('/recovery/search',
  authLimiter,
  [
    body('query').trim().isLength({ min: 3 }).withMessage('Please provide at least 3 characters')
  ],
  handleValidationErrors,
  authController.searchAccount
);

/**
 * Send recovery OTP
 */
router.post('/recovery/send-otp',
  authLimiter,
  [
    body('userId').isUUID(),
    body('channel').isIn(['email', 'phone'])
  ],
  handleValidationErrors,
  authController.sendRecoveryOtp
);

/**
 * Reset password with OTP
 */
router.post('/recovery/reset',
  authLimiter,
  [
    body('userId').isUUID(),
    body('code').notEmpty().withMessage('Recovery code is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  handleValidationErrors,
  authController.resetPasswordWithOtp
);

module.exports = router;

