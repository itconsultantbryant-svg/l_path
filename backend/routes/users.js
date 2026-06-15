const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get user profile
router.get('/profile', authenticate, userController.getProfile);

// Update user profile
router.put('/profile',
  authenticate,
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('phone').optional().isMobilePhone()
  ],
  handleValidationErrors,
  userController.updateProfile
);

// Set or update withdrawal PIN (controller validates pin format and currentPin when needed)
router.put('/withdrawal-pin',
  authenticate,
  [
    body('pin').exists().withMessage('PIN is required').custom((v) => {
      const s = v != null ? String(v).trim() : '';
      return s.length >= 4 && s.length <= 8 && /^\d+$/.test(s);
    }).withMessage('PIN must be 4 to 8 digits'),
    body('currentPin').optional({ values: 'null' }).trim()
  ],
  handleValidationErrors,
  userController.setWithdrawalPin
);

// Update KYC status (admin only)
router.put('/kyc',
  authenticate,
  require('../middleware/auth').isAdmin,
  [
    body('userId').isUUID(),
    body('kycStatus').isIn(['pending', 'approved', 'rejected']),
    body('kycDocument').optional().isURL()
  ],
  handleValidationErrors,
  userController.updateKYC
);

module.exports = router;

