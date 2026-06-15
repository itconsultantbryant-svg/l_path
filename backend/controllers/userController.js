const { User, Wallet } = require('../models');
const { logAction, logAdminAction } = require('../utils/audit');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

/**
 * Get user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Wallet,
        as: 'wallet'
      }],
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires']
      }
    });

    user.dataValues.hasWithdrawalPin = !!(user.withdrawalPinHash && String(user.withdrawalPinHash).trim());

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) {
      // Check if phone is already taken
      const existingUser = await User.findOne({
        where: {
          phone,
          id: { [require('sequelize').Op.ne]: user.id }
        }
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Phone number already in use.'
        });
      }
      user.phone = phone;
    }

    await user.save();

    await logAction(user.id, 'PROFILE_UPDATE', 'User', user.id, 'User profile updated', req);

    user.dataValues.hasWithdrawalPin = !!(user.withdrawalPinHash && String(user.withdrawalPinHash).trim());

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set or update withdrawal PIN.
 * When user has no existing PIN (e.g. after admin reset), only the new PIN is required.
 * When user already has a PIN, current PIN is required to update.
 * Uses User.update() so we do not trigger User model validations (e.g. email/phone) on a partial instance.
 */
const setWithdrawalPin = async (req, res, next) => {
  try {
    const rawPin = req.body.pin;
    const pinStr = rawPin != null ? String(rawPin).trim() : '';
    if (pinStr.length < 4 || pinStr.length > 8 || !/^\d+$/.test(pinStr)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 to 8 digits.'
      });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'withdrawalPinHash']
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Only require current PIN if user actually has a PIN set (e.g. not after admin reset or first-time setup).
    const hasExistingPin = !!(user.withdrawalPinHash && String(user.withdrawalPinHash).trim());
    if (hasExistingPin) {
      const currentPinStr = req.body.currentPin != null ? String(req.body.currentPin).trim() : '';
      if (!currentPinStr) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is required to update your withdrawal PIN.'
        });
      }
      const isValid = await bcrypt.compare(currentPinStr, user.withdrawalPinHash);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Current PIN is incorrect.'
        });
      }
    }

    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const withdrawalPinHash = await bcrypt.hash(pinStr, salt);
    const withdrawalPinUpdatedAt = new Date();

    await User.update(
      { withdrawalPinHash, withdrawalPinUpdatedAt },
      { where: { id: req.user.id }, hooks: false, validate: false }
    );

    await logAction(req.user.id, 'WITHDRAWAL_PIN_UPDATE', 'User', req.user.id, 'Withdrawal PIN updated', req);

    res.json({
      success: true,
      message: 'Withdrawal PIN set successfully.',
      data: { hasWithdrawalPin: true }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update KYC status (Admin only)
 */
const updateKYC = async (req, res, next) => {
  try {
    const { userId, kycStatus, kycDocument } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const previousStatus = user.kycStatus;
    user.kycStatus = kycStatus;
    if (kycDocument) user.kycDocument = kycDocument;

    await user.save();

    await logAdminAction(
      req.user.id,
      'user_kyc_approve',
      'User',
      user.id,
      `KYC status updated from ${previousStatus} to ${kycStatus}`,
      { kycStatus: previousStatus },
      { kycStatus },
      req
    );

    res.json({
      success: true,
      message: 'KYC status updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateKYC,
  setWithdrawalPin
};

