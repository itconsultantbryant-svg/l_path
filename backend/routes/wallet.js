const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');
const { withdrawalLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get wallet balance
router.get('/balance', authenticate, walletController.getBalance);

// Get wallet transactions
router.get('/transactions', authenticate, walletController.getTransactions);

// Get deposit options
router.get('/deposit-options', authenticate, walletController.getDepositOptions);

// Request deposit
router.post('/deposit',
  authenticate,
  [
    body('amount').isFloat({ min: 0.01 }),
    body('paymentMethod').isIn(['bank_transfer', 'mobile_money', 'cash', 'other']),
    body('paymentReference').optional().trim(),
    body('receiptUrl').optional().isURL()
  ],
  handleValidationErrors,
  walletController.requestDeposit
);

// Get deposit history
router.get('/deposits', authenticate, walletController.getDeposits);

// Request withdrawal
router.post('/withdrawal',
  authenticate,
  withdrawalLimiter,
  [
    body('amount').isFloat({ min: 100 }), // Minimum 100 LRD
    body('paymentMethod').isIn(['bank_transfer', 'mobile_money', 'cash', 'other']),
    body('withdrawalPin').notEmpty().withMessage('Withdrawal PIN is required'),
    body('accountNumber')
      .if(body('paymentMethod').equals('mobile_money'))
      .notEmpty()
      .withMessage('Mobile money number is required')
      .bail()
      .trim(),
    body('accountName')
      .if(body('paymentMethod').equals('mobile_money'))
      .notEmpty()
      .withMessage('Account name is required')
      .bail()
      .trim(),
    body('bankName').optional().trim()
  ],
  handleValidationErrors,
  walletController.requestWithdrawal
);

// Get withdrawal history
router.get('/withdrawals', authenticate, walletController.getWithdrawals);

module.exports = router;

