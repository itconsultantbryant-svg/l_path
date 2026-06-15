const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middleware/auth');

// Get referral link and stats
router.get('/my', authenticate, referralController.getMyReferrals);

// Get referral tree
router.get('/tree', authenticate, referralController.getReferralTree);

// Get referral earnings
router.get('/earnings', authenticate, referralController.getReferralEarnings);

module.exports = router;

