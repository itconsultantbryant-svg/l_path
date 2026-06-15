const {
  User, Role, Wallet, Transaction, Deposit, Withdrawal,
  ParticipationPackage, UserPackage, DailyTask, TaskCompletion,
  Referral, ReferralEarning, ChatMessage, AuditLog, AdminAction, SystemSetting
} = require('../models');
const { v4: uuidv4 } = require('uuid');
const ReferralEarningModel = require('../models').ReferralEarning || ReferralEarning;
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const config = require('../config/config');
const { updateWalletBalance, calculateServiceFee, calculateNetWithdrawal, initializeWallet } = require('../utils/wallet');
const { getReferralChain, getReferralRates, isMarch15HolidayPromoActive, wasReferredDuringMarch15Promo, getMarch15PromoStatus } = require('../utils/referral');
const { logAdminAction } = require('../utils/audit');
const {
  STAFF_ROLES,
  ASSIGNABLE_STAFF_ROLES,
  ROLE_LABELS,
  canManageStaff,
  getRoleName
} = require('../utils/permissions');
const { resolveWhatsAppUrl } = require('../utils/whatsapp');
const db = require('../models');

const normalizeTaskType = (value) => {
  if (!value) return 'click';
  const map = {
    daily: 'click',
    visit_url: 'visit',
    watch_video: 'watch',
    read_content: 'custom'
  };
  return map[value] || value;
};

const getUserActivityLiterals = () => {
  const dialect = db.sequelize.getDialect();
  const userIdColumn = dialect === 'postgres' ? '"userId"' : 'userId';
  const userIdRef = '"User"."id"';
  const approvedDepositCount = `(SELECT COUNT(*) FROM deposits WHERE deposits.${userIdColumn} = ${userIdRef} AND deposits.status = 'approved')`;
  const packageCount = `(SELECT COUNT(*) FROM user_packages WHERE user_packages.${userIdColumn} = ${userIdRef})`;
  return { approvedDepositCount, packageCount };
};

/**
 * Get admin dashboard overview
 */
const getDashboard = async (req, res, next) => {
  try {
    // User stats
    const totalUsers = await User.count();
    const { approvedDepositCount, packageCount } = getUserActivityLiterals();
    const activeUsers = await User.count({
      where: {
        isSuspended: false,
        [Op.and]: [
          db.sequelize.literal(`${approvedDepositCount} > 0`),
          db.sequelize.literal(`${packageCount} > 0`)
        ]
      }
    });
    const inactiveUsers = await User.count({
      where: {
        isSuspended: false,
        [Op.and]: [
          db.sequelize.literal(`${approvedDepositCount} = 0`),
          db.sequelize.literal(`${packageCount} = 0`)
        ]
      }
    });
    const suspendedUsers = await User.count({
      where: { isSuspended: true }
    });

    // Financial stats
    const totalDeposits = await Deposit.sum('amount', {
      where: { status: 'approved' }
    }) || 0;

    const totalWithdrawals = await Withdrawal.sum('amount', {
      where: { status: { [Op.in]: ['approved', 'processing', 'completed'] } }
    }) || 0;

    const pendingWithdrawals = await Withdrawal.sum('amount', {
      where: { status: 'pending' }
    }) || 0;

    const totalServiceFees = await Withdrawal.sum('serviceFee', {
      where: { status: { [Op.in]: ['approved', 'processing', 'completed'] } }
    }) || 0;

    const totalRewards = await Transaction.sum('amount', {
      where: { type: 'reward', status: 'completed' }
    }) || 0;

    const totalReferralEarnings = await ReferralEarning.sum('commissionAmount') || 0;

    // Platform revenue = service fees
    const platformRevenue = totalServiceFees;

    // Reward liability = total rewards paid out
    const rewardLiability = totalRewards;

    // Additional stats
    const totalPackages = await UserPackage.count({
      where: { status: 'active' }
    });
    const totalPackagePurchases = await UserPackage.count();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const packagePurchasesToday = await UserPackage.count({
      where: {
        createdAt: { [Op.between]: [todayStart, todayEnd] }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalTaskCompletions = await TaskCompletion.count({
      where: {
        completionDate: today.toISOString().split('T')[0]
      }
    });
    const totalTaskCompletionsAll = await TaskCompletion.count();

    // Get recent activities
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'kycStatus', 'phone']
    });

    const recentDeposits = await Deposit.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
      }]
    });

    const recentWithdrawals = await Withdrawal.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'phone']
      }]
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          inactiveUsers,
          suspendedUsers,
          totalPackages,
          totalPackagePurchases,
          packagePurchasesToday,
          totalTaskCompletions,
          totalTaskCompletionsAll,
          financials: {
            totalDeposits: parseFloat(totalDeposits),
            totalWithdrawals: parseFloat(totalWithdrawals),
            pendingWithdrawals: parseFloat(pendingWithdrawals),
            platformRevenue: parseFloat(platformRevenue),
            rewardLiability: parseFloat(rewardLiability),
            totalReferralEarnings: parseFloat(totalReferralEarnings)
          }
        },
        recent: {
          users: recentUsers,
          deposits: recentDeposits,
          withdrawals: recentWithdrawals
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, kycStatus } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      const searchOp = db.sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
      where[Op.or] = [
        { email: { [searchOp]: `%${search}%` } },
        { phone: { [searchOp]: `%${search}%` } },
        { firstName: { [searchOp]: `%${search}%` } },
        { lastName: { [searchOp]: `%${search}%` } },
        { referralCode: { [searchOp]: `%${search}%` } }
      ];
    }
    const { approvedDepositCount, packageCount } = getUserActivityLiterals();
    if (status === 'active') {
      where.isSuspended = false;
      where[Op.and] = [
        db.sequelize.literal(`${approvedDepositCount} > 0`),
        db.sequelize.literal(`${packageCount} > 0`)
      ];
    } else if (status === 'inactive') {
      where.isSuspended = false;
      where[Op.and] = [
        db.sequelize.literal(`${approvedDepositCount} = 0`),
        db.sequelize.literal(`${packageCount} = 0`)
      ];
    } else if (status === 'suspended') {
      where.isSuspended = true;
    }
    if (kycStatus) {
      where.kycStatus = kycStatus;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{
        model: Role,
        as: 'role'
      }, {
        model: Wallet,
        as: 'wallet'
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires'],
        include: [
          [db.sequelize.literal(approvedDepositCount), 'approvedDepositCount'],
          [db.sequelize.literal(packageCount), 'packageCount']
        ]
      }
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single user
 */
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        { model: Role, as: 'role' },
        { model: Wallet, as: 'wallet' }
      ],
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get comprehensive user stats
    const depositCount = await Deposit.count({ where: { userId: id } });
    const approvedDeposits = await Deposit.sum('amount', { where: { userId: id, status: 'approved' } }) || 0;
    const pendingDeposits = await Deposit.sum('amount', { where: { userId: id, status: 'pending' } }) || 0;
    
    const withdrawalCount = await Withdrawal.count({ where: { userId: id } });
    const totalWithdrawals = await Withdrawal.sum('amount', { where: { userId: id, status: { [Op.in]: ['approved', 'completed'] } } }) || 0;
    const pendingWithdrawals = await Withdrawal.sum('amount', { where: { userId: id, status: 'pending' } }) || 0;
    const totalServiceFees = await Withdrawal.sum('serviceFee', { where: { userId: id, status: { [Op.in]: ['approved', 'completed'] } } }) || 0;
    
    const taskCompletions = await TaskCompletion.count({ where: { userId: id } });
    const totalRewards = await Transaction.sum('amount', { where: { userId: id, type: 'reward', status: 'completed' } }) || 0;
    
    const referralCount = await User.count({ where: { referredBy: id } });
    const totalReferralEarnings = await ReferralEarning.sum('commissionAmount', { where: { userId: id } }) || 0;
    
    const activePackages = await UserPackage.count({ where: { userId: id, status: 'active' } });
    const totalPackages = await UserPackage.count({ where: { userId: id } });

    // Get recent deposits
    const recentDeposits = await Deposit.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get recent withdrawals
    const recentWithdrawals = await Withdrawal.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Get referral team
    const referralTeam = await User.findAll({
      where: { referredBy: id },
      attributes: ['id', 'email', 'firstName', 'lastName', 'phone', 'createdAt', 'kycStatus'],
      include: [{
        model: Wallet,
        as: 'wallet',
        attributes: ['balance', 'totalEarned', 'totalDeposited']
      }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Get referral earnings
    const referralEarnings = await ReferralEarning.findAll({
      where: { userId: id },
      include: [{
        model: User,
        as: 'referredUser',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Get recent transactions
    const recentTransactions = await Transaction.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    // Packages (detailed)
    const userPackages = await UserPackage.findAll({
      where: { userId: id },
      include: [{ model: ParticipationPackage, as: 'package' }],
      order: [['createdAt', 'DESC']]
    });

    const now = new Date();
    const detailedPackages = userPackages.map((up) => {
      const pkg = up.package;
      const start = new Date(up.startDate);
      const durationDays = parseInt(pkg?.durationDays || 0, 10);
      const computedEnd = new Date(start);
      if (!Number.isNaN(start.getTime()) && durationDays) {
        computedEnd.setDate(computedEnd.getDate() + durationDays);
        computedEnd.setHours(23, 59, 59, 999);
      }

      const remainingDays = (!Number.isNaN(computedEnd.getTime()))
        ? Math.max(0, Math.ceil((computedEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        : null;

      return {
        ...up.toJSON(),
        package: pkg ? pkg.toJSON() : null,
        purchaseDate: up.createdAt,
        computedEndDate: computedEnd && !Number.isNaN(computedEnd.getTime()) ? computedEnd.toISOString() : null,
        remainingDays
      };
    });

    // Task completions (detailed; includes which user-package it was completed for)
    const taskCompletionsDetailed = await TaskCompletion.findAll({
      where: { userId: id },
      include: [
        { model: DailyTask, as: 'task' },
        {
          model: UserPackage,
          as: 'userPackage',
          include: [{ model: ParticipationPackage, as: 'package' }]
        }
      ],
      order: [['completedAt', 'DESC']],
      limit: 500
    });

    res.json({
      success: true,
      data: {
        user,
        stats: {
          depositCount,
          approvedDeposits: parseFloat(approvedDeposits),
          pendingDeposits: parseFloat(pendingDeposits),
          withdrawalCount,
          totalWithdrawals: parseFloat(totalWithdrawals),
          pendingWithdrawals: parseFloat(pendingWithdrawals),
          totalServiceFees: parseFloat(totalServiceFees),
          taskCompletions,
          totalRewards: parseFloat(totalRewards),
          referralCount,
          totalReferralEarnings: parseFloat(totalReferralEarnings),
          activePackages,
          totalPackages
        },
        recent: {
          deposits: recentDeposits,
          withdrawals: recentWithdrawals,
          transactions: recentTransactions
        },
        packages: detailedPackages,
        taskCompletions: taskCompletionsDetailed,
        referralTeam,
        referralEarnings
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend user
 */
const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const previousStatus = user.isSuspended;
    user.isSuspended = true;
    await user.save();

    await logAdminAction(
      req.user.id,
      'user_suspend',
      'User',
      user.id,
      `User suspended: ${user.email}`,
      { isSuspended: previousStatus },
      { isSuspended: true },
      req
    );

    res.json({
      success: true,
      message: 'User suspended successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user
 */
const activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const previousStatus = user.isSuspended;
    user.isSuspended = false;
    user.isActive = true;
    await user.save();

    await logAdminAction(
      req.user.id,
      'user_activate',
      'User',
      user.id,
      `User activated: ${user.email}`,
      { isSuspended: previousStatus },
      { isSuspended: false },
      req
    );

    res.json({
      success: true,
      message: 'User activated successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Soft delete: mark as suspended and inactive
    // For safety, we'll mark as deleted rather than hard delete
    user.isActive = false;
    user.isSuspended = true;
    await user.save();

    await logAdminAction(
      req.user.id,
      'user_delete',
      'User',
      user.id,
      `User deleted: ${user.email}`,
      {},
      { isActive: false, isSuspended: true },
      req
    );

    res.json({
      success: true,
      message: 'User deleted successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk user action
 */
const bulkUserAction = async (req, res, next) => {
  try {
    const { action, userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one user.'
      });
    }

    const sanitizedIds = userIds.filter((id) => id !== req.user.id);
    if (sanitizedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You cannot apply bulk actions to your own account.'
      });
    }

    if (!['suspend', 'activate', 'delete'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action.'
      });
    }

    let updatePayload = {};
    if (action === 'suspend') {
      updatePayload = { isSuspended: true };
    } else if (action === 'activate') {
      updatePayload = { isSuspended: false, isActive: true };
    } else if (action === 'delete') {
      updatePayload = { isActive: false, isSuspended: true };
    }

    const [updatedCount] = await User.update(updatePayload, {
      where: { id: { [Op.in]: sanitizedIds } }
    });

    await logAdminAction(
      req.user.id,
      `user_bulk_${action}`,
      'User',
      null,
      `Bulk action ${action} on ${updatedCount} users`,
      { userIds: sanitizedIds },
      updatePayload,
      req
    );

    res.json({
      success: true,
      message: `Bulk action "${action}" applied to ${updatedCount} users.`,
      data: { updatedCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password (admin action)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.'
      });
    }

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const requesterRole = req.user?.role?.name;
    const targetRole = user.role?.name;
    if (targetRole === 'super_admin' && requesterRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can reset super admin passwords.'
      });
    }

    // Set plain password so model hook hashes it once
    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    await logAdminAction(
      req.user.id,
      'user_password_reset',
      'User',
      user.id,
      `Password reset by admin: ${req.user.email}`,
      null,
      { resetBy: req.user.id },
      req
    );

    res.json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user withdrawal PIN (admin action)
 */
const resetUserWithdrawalPin = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const requesterRole = req.user?.role?.name;
    const targetRole = user.role?.name;
    if (targetRole === 'super_admin' && requesterRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can reset super admin withdrawal PINs.'
      });
    }

    user.withdrawalPinHash = null;
    user.withdrawalPinUpdatedAt = null;
    await user.save();

    await logAdminAction(
      req.user.id,
      'user_withdrawal_pin_reset',
      'User',
      user.id,
      `Withdrawal PIN reset: ${user.email || user.phone || user.id}`,
      {},
      { withdrawalPinHash: null },
      req
    );

    res.json({
      success: true,
      message: 'User withdrawal PIN reset successfully.',
      data: { userId: user.id }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Set user withdrawal PIN (admin action). Admin provides new PIN and confirm; user can use this PIN immediately.
 * Uses User.update() to avoid User model validations on partial instance.
 */
const setUserWithdrawalPin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rawPin = req.body.pin;
    const rawConfirm = req.body.confirmPin;
    const pinStr = rawPin != null ? String(rawPin).trim() : '';
    const confirmStr = rawConfirm != null ? String(rawConfirm).trim() : '';

    if (pinStr.length < 4 || pinStr.length > 8 || !/^\d+$/.test(pinStr)) {
      return res.status(400).json({
        success: false,
        message: 'PIN must be 4 to 8 digits.'
      });
    }
    if (pinStr !== confirmStr) {
      return res.status(400).json({
        success: false,
        message: 'PIN and confirmation do not match.'
      });
    }

    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'email', 'phone']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const requesterRole = req.user?.role?.name;
    const targetRole = user.role?.name;
    if (targetRole === 'super_admin' && requesterRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can set super admin withdrawal PINs.'
      });
    }

    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const withdrawalPinHash = await bcrypt.hash(pinStr, salt);
    const withdrawalPinUpdatedAt = new Date();
    await User.update(
      { withdrawalPinHash, withdrawalPinUpdatedAt },
      { where: { id }, hooks: false, validate: false }
    );

    await logAdminAction(
      req.user.id,
      'user_withdrawal_pin_set',
      'User',
      user.id,
      `Withdrawal PIN set by admin: ${user.email || user.phone || user.id}`,
      {},
      {},
      req
    );

    res.json({
      success: true,
      message: "User's withdrawal PIN has been set. They can use this PIN for withdrawals.",
      data: { userId: user.id }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user KYC
 */
const updateUserKYC = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { kycStatus, kycDocument } = req.body;

    const user = await User.findByPk(id);
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
      message: 'KYC status updated successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get deposits
 */
const getDeposits = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Deposit.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        deposits: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve deposit
 */
const approveDeposit = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const deposit = await Deposit.findByPk(id, {
      include: [{
        model: Wallet,
        as: 'wallet'
      }],
      transaction
    });

    if (!deposit) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Deposit not found.'
      });
    }

    if (deposit.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}.`
      });
    }

    const previousStatus = deposit.status;
    deposit.status = 'approved';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    await deposit.save({ transaction });

    // Credit wallet
    await updateWalletBalance(
      deposit.walletId,
      deposit.amount,
      'deposit',
      `Deposit approved: ${deposit.amount} ${deposit.currency}`,
      deposit.userId,
      { depositId: deposit.id },
      { transaction }
    );

    // March 15 Holiday Promo: when a referred user's deposit is approved, credit referrer 10% immediately (direct referrer only).
    // Only applies to NEW users referred during the promo (registered between promo start and end).
    if (isMarch15HolidayPromoActive()) {
      const depositor = await User.findByPk(deposit.userId, { attributes: ['id', 'referredBy', 'createdAt'], transaction });
      if (depositor && depositor.referredBy && wasReferredDuringMarch15Promo(depositor.createdAt)) {
        const existingBonus = await ReferralEarning.findOne({
          where: {
            referenceId: deposit.id,
            referenceType: 'Deposit'
          },
          transaction
        });
        if (!existingBonus) {
          const baseAmount = parseFloat(deposit.amount);
          const commissionAmount = parseFloat((baseAmount * 0.1).toFixed(2));
          if (commissionAmount >= 0.01) {
            await ReferralEarning.create({
              userId: depositor.referredBy,
              referredUserId: deposit.userId,
              level: 1,
              commissionType: 'activity_based',
              commissionAmount,
              baseAmount,
              commissionRate: 10,
              currency: deposit.currency || 'LRD',
              referenceId: deposit.id,
              referenceType: 'Deposit',
              metadata: { source: 'march15_holiday_deposit_bonus' }
            }, { transaction });

            const referrerWallet = await Wallet.findOne({
              where: { userId: depositor.referredBy },
              transaction
            });
            if (referrerWallet) {
              await updateWalletBalance(
                referrerWallet.id,
                commissionAmount,
                'referral',
                `March 15 Holiday: 10% referral bonus on referred user deposit`,
                depositor.referredBy,
                {
                  referredUserId: deposit.userId,
                  level: 1,
                  referenceId: deposit.id,
                  depositId: deposit.id
                },
                { transaction }
              );
            }
          }
        }
      }
    }

    await transaction.commit();

    await logAdminAction(
      req.user.id,
      'deposit_approve',
      'Deposit',
      deposit.id,
      `Deposit approved: ${deposit.amount} ${deposit.currency}`,
      { status: previousStatus },
      { status: 'approved' },
      req
    );

    res.json({
      success: true,
      message: 'Deposit approved successfully.',
      data: { deposit }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Reject deposit
 */
const rejectDeposit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const deposit = await Deposit.findByPk(id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found.'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Deposit is already ${deposit.status}.`
      });
    }

    const previousStatus = deposit.status;
    deposit.status = 'rejected';
    deposit.approvedBy = req.user.id;
    deposit.approvedAt = new Date();
    deposit.rejectionReason = reason || null;
    await deposit.save();

    await logAdminAction(
      req.user.id,
      'deposit_reject',
      'Deposit',
      deposit.id,
      `Deposit rejected: ${reason || 'No reason provided'}`,
      { status: previousStatus },
      { status: 'rejected', reason },
      req
    );

    res.json({
      success: true,
      message: 'Deposit rejected successfully.',
      data: { deposit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get withdrawals
 */
const getWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await Withdrawal.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        withdrawals: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve withdrawal
 */
const approveWithdrawal = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findByPk(id, {
      include: [{
        model: Wallet,
        as: 'wallet'
      }],
      transaction
    });

    if (!withdrawal) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found.'
      });
    }

    if (withdrawal.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}.`
      });
    }

    const expectedProcessingAt = withdrawal.metadata?.expectedProcessingAt;
    if (expectedProcessingAt) {
      const expectedDate = new Date(expectedProcessingAt);
      if (Number.isNaN(expectedDate.getTime())) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid expected processing date in withdrawal metadata.'
        });
      }
    }

    // Check balance
    const wallet = await Wallet.findByPk(withdrawal.walletId, {
      lock: transaction.LOCK.UPDATE,
      transaction
    });
    if (!wallet) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Wallet not found.'
      });
    }
    if (parseFloat(wallet.balance) < parseFloat(withdrawal.amount)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for withdrawal.'
      });
    }

    const previousStatus = withdrawal.status;
    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();
    await withdrawal.save({ transaction });

    // Deduct net amount and record service fee separately
    await updateWalletBalance(
      withdrawal.walletId,
      withdrawal.netAmount,
      'withdrawal',
      `Withdrawal approved: ${withdrawal.netAmount} ${withdrawal.currency}`,
      withdrawal.userId,
      { withdrawalId: withdrawal.id },
      { transaction }
    );

    if (parseFloat(withdrawal.serviceFee || 0) > 0) {
      await updateWalletBalance(
        withdrawal.walletId,
        withdrawal.serviceFee,
        'fee',
        `Service fee for withdrawal: ${withdrawal.serviceFee} ${withdrawal.currency}`,
        withdrawal.userId,
        { withdrawalId: withdrawal.id, feeType: 'withdrawal_service_fee' },
        { transaction }
      );
    }

    await transaction.commit();

    await logAdminAction(
      req.user.id,
      'withdrawal_approve',
      'Withdrawal',
      withdrawal.id,
      `Withdrawal approved: ${withdrawal.netAmount} ${withdrawal.currency}`,
      { status: previousStatus },
      { status: 'approved' },
      req
    );

    res.json({
      success: true,
      message: 'Withdrawal approved successfully.',
      data: { withdrawal }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Reject withdrawal
 */
const rejectWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const withdrawal = await Withdrawal.findByPk(id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found.'
      });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}.`
      });
    }

    const previousStatus = withdrawal.status;
    withdrawal.status = 'rejected';
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();
    withdrawal.rejectionReason = reason || null;
    await withdrawal.save();

    await logAdminAction(
      req.user.id,
      'withdrawal_reject',
      'Withdrawal',
      withdrawal.id,
      `Withdrawal rejected: ${reason || 'No reason provided'}`,
      { status: previousStatus },
      { status: 'rejected', reason },
      req
    );

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully.',
      data: { withdrawal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete withdrawal
 */
const completeWithdrawal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionReference } = req.body || {};

    const withdrawal = await Withdrawal.findByPk(id);
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found.'
      });
    }

    if (!['approved', 'processing'].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal must be approved before completion (current: ${withdrawal.status}).`
      });
    }

    const expectedProcessingAt = withdrawal.metadata?.expectedProcessingAt;
    if (expectedProcessingAt) {
      const expectedDate = new Date(expectedProcessingAt);
      if (Number.isNaN(expectedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid expected processing date in withdrawal metadata.'
        });
      }
    }

    const previousStatus = withdrawal.status;
    withdrawal.status = 'completed';
    withdrawal.processedAt = new Date();
    if (transactionReference) {
      withdrawal.transactionReference = transactionReference;
    }
    await withdrawal.save();

    await logAdminAction(
      req.user.id,
      'withdrawal_complete',
      'Withdrawal',
      withdrawal.id,
      `Withdrawal completed: ${withdrawal.netAmount} ${withdrawal.currency}`,
      { status: previousStatus },
      { status: 'completed', transactionReference },
      req
    );

    res.json({
      success: true,
      message: 'Withdrawal marked as completed.',
      data: { withdrawal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get packages
 */
const getPackages = async (req, res, next) => {
  try {
    const packages = await ParticipationPackage.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    });

    const purchaseCounts = await UserPackage.findAll({
      attributes: [
        'packageId',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'purchaseCount']
      ],
      group: ['packageId'],
      raw: true
    });

    const purchaseMap = purchaseCounts.reduce((acc, row) => {
      acc[row.packageId] = parseInt(row.purchaseCount, 10);
      return acc;
    }, {});

    const packagesWithCounts = packages.map((pkg) => ({
      ...pkg.toJSON(),
      purchaseCount: purchaseMap[pkg.id] || 0
    }));

    res.json({
      success: true,
      data: { packages: packagesWithCounts }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create package
 */
const createPackage = async (req, res, next) => {
  try {
    const {
      name, description, price, durationDays, dailyRewardAmount,
      maxRewardAmount, tasksPerDay, isActive, sortOrder
    } = req.body;

    const packageData = await ParticipationPackage.create({
      name,
      description,
      price: parseFloat(price),
      durationDays: parseInt(durationDays),
      dailyRewardAmount: parseFloat(dailyRewardAmount || 0),
      maxRewardAmount: maxRewardAmount ? parseFloat(maxRewardAmount) : null,
      tasksPerDay: parseInt(tasksPerDay || 1),
      isActive: isActive !== false,
      isDisabled: false,
      sortOrder: parseInt(sortOrder || 0)
    });

    await logAdminAction(
      req.user.id,
      'package_create',
      'ParticipationPackage',
      packageData.id,
      `Package created: ${name}`,
      null,
      packageData.toJSON(),
      req
    );

    res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      data: { package: packageData }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update package
 */
const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const packageData = await ParticipationPackage.findByPk(id);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.'
      });
    }

    const previousValue = packageData.toJSON();
    const durationWas = parseInt(packageData.durationDays, 10);

    // Update allowed fields
    if (updates.name !== undefined) packageData.name = updates.name;
    if (updates.description !== undefined) packageData.description = updates.description;
    if (updates.price !== undefined) packageData.price = parseFloat(updates.price);
    if (updates.durationDays !== undefined) packageData.durationDays = parseInt(updates.durationDays);
    if (updates.dailyRewardAmount !== undefined) packageData.dailyRewardAmount = parseFloat(updates.dailyRewardAmount);
    if (updates.maxRewardAmount !== undefined) packageData.maxRewardAmount = updates.maxRewardAmount ? parseFloat(updates.maxRewardAmount) : null;
    if (updates.tasksPerDay !== undefined) packageData.tasksPerDay = parseInt(updates.tasksPerDay);
    if (updates.isActive !== undefined) packageData.isActive = updates.isActive;
    if (updates.sortOrder !== undefined) packageData.sortOrder = parseInt(updates.sortOrder);

    await packageData.save();

    // If duration changed, update existing user packages end dates so the change takes effect system-wide.
    // Daily reward changes already take effect immediately because task payouts reference ParticipationPackage.dailyRewardAmount.
    const durationNow = parseInt(packageData.durationDays, 10);
    if (!Number.isNaN(durationWas) && !Number.isNaN(durationNow) && durationWas !== durationNow) {
      const userPackages = await UserPackage.findAll({
        where: {
          packageId: packageData.id,
          status: { [Op.in]: ['active', 'expired'] }
        }
      });

      for (const up of userPackages) {
        const start = new Date(up.startDate);
        if (Number.isNaN(start.getTime())) continue;
        const newEnd = new Date(start);
        newEnd.setDate(newEnd.getDate() + durationNow);

        up.endDate = newEnd;

        // Keep status consistent with new end date
        const now = new Date();
        if (now > newEnd) {
          if (up.status === 'active') up.status = 'expired';
        } else {
          if (up.status === 'expired') up.status = 'active';
        }

        await up.save();
      }
    }

    await logAdminAction(
      req.user.id,
      'package_update',
      'ParticipationPackage',
      packageData.id,
      `Package updated: ${packageData.name}`,
      previousValue,
      packageData.toJSON(),
      req
    );

    res.json({
      success: true,
      message: 'Package updated successfully.',
      data: { package: packageData }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disable package
 */
const disablePackage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const packageData = await ParticipationPackage.findByPk(id);
    if (!packageData) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.'
      });
    }

    const previousValue = packageData.isDisabled;
    packageData.isDisabled = true;
    await packageData.save();

    await logAdminAction(
      req.user.id,
      'package_disable',
      'ParticipationPackage',
      packageData.id,
      `Package disabled: ${packageData.name}`,
      { isDisabled: previousValue },
      { isDisabled: true },
      req
    );

    res.json({
      success: true,
      message: 'Package disabled successfully.',
      data: { package: packageData }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const tasks = await DailyTask.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
    });
    const totalTaskCompletions = await TaskCompletion.count();

    res.json({
      success: true,
      data: {
        tasks,
        stats: {
          totalTaskCompletions
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create task
 */
const createTask = async (req, res, next) => {
  try {
    const {
      title, description, taskType, rewardAmount, targetUrl,
      instructions, isActive, scheduledDate, sortOrder, packageId
    } = req.body;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'Package is required for tasks.'
      });
    }

    const packageRecord = await ParticipationPackage.findByPk(packageId);
    if (!packageRecord) {
      return res.status(400).json({
        success: false,
        message: 'Selected package not found.'
      });
    }

    const task = await DailyTask.create({
      title,
      description,
      packageId,
      taskType: normalizeTaskType(taskType),
      rewardAmount: parseFloat(rewardAmount || 0),
      targetUrl: targetUrl || null,
      instructions: instructions || null,
      isActive: isActive !== false,
      isDisabled: false,
      scheduledDate: scheduledDate || null,
      sortOrder: parseInt(sortOrder || 0)
    });

    await logAdminAction(
      req.user.id,
      'task_create',
      'DailyTask',
      task.id,
      `Task created: ${title}`,
      null,
      task.toJSON(),
      req
    );

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update task
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const task = await DailyTask.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const previousValue = task.toJSON();

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.taskType !== undefined) task.taskType = normalizeTaskType(updates.taskType);
    if (updates.packageId !== undefined) {
      if (!updates.packageId) {
        return res.status(400).json({
          success: false,
          message: 'Package is required for tasks.'
        });
      }
      const packageRecord = await ParticipationPackage.findByPk(updates.packageId);
      if (!packageRecord) {
        return res.status(400).json({
          success: false,
          message: 'Selected package not found.'
        });
      }
      task.packageId = updates.packageId;
    }
    if (updates.rewardAmount !== undefined) task.rewardAmount = parseFloat(updates.rewardAmount);
    if (updates.targetUrl !== undefined) task.targetUrl = updates.targetUrl;
    if (updates.instructions !== undefined) task.instructions = updates.instructions;
    if (updates.isActive !== undefined) task.isActive = updates.isActive;
    if (updates.isDisabled !== undefined) {
      task.isDisabled = updates.isDisabled;
      if (updates.isDisabled === false && updates.isActive === undefined) {
        task.isActive = true;
      }
    }
    if (updates.scheduledDate !== undefined) task.scheduledDate = updates.scheduledDate;
    if (updates.sortOrder !== undefined) task.sortOrder = parseInt(updates.sortOrder);

    await task.save();

    await logAdminAction(
      req.user.id,
      'task_update',
      'DailyTask',
      task.id,
      `Task updated: ${task.title}`,
      previousValue,
      task.toJSON(),
      req
    );

    res.json({
      success: true,
      message: 'Task updated successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disable task
 */
const disableTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await DailyTask.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    const previousValue = task.isDisabled;
    task.isDisabled = true;
    task.isActive = false;
    await task.save();

    await logAdminAction(
      req.user.id,
      'task_disable',
      'DailyTask',
      task.id,
      `Task disabled: ${task.title}`,
      { isDisabled: previousValue },
      { isDisabled: true },
      req
    );

    res.json({
      success: true,
      message: 'Task disabled successfully.',
      data: { task }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await DailyTask.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found.'
      });
    }

    await TaskCompletion.destroy({
      where: { taskId: id }
    });

    await task.destroy();

    await logAdminAction(
      req.user.id,
      'task_delete',
      'DailyTask',
      task.id,
      `Task deleted: ${task.title}`,
      task.toJSON(),
      null,
      req
    );

    res.json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get referrals
 */
const getReferrals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, level } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (level) {
      where.level = parseInt(level);
    }

    const { count, rows } = await Referral.findAndCountAll({
      where,
      include: [
        { model: User, as: 'referrer', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'referred', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        referrals: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update referral config
 */
const updateReferralConfig = async (req, res, next) => {
  try {
    const {
      rates,
      maxCommission,
      maxCommissionPerDay,
      level1,
      level2,
      level3,
      level4,
      level5,
      maxCommissionPerTransaction,
      maxDailyCommission
    } = req.body;

    // Update rates
    const normalizedRates = rates || {
      1: level1,
      2: level2,
      3: level3,
      4: level4,
      5: level5
    };
    if (normalizedRates) {
      for (const [level, rate] of Object.entries(normalizedRates)) {
        if (rate === undefined || rate === null || Number.isNaN(parseFloat(rate))) {
          continue;
        }
        await SystemSetting.upsert({
          key: `referral_rate_level_${level}`,
          value: parseFloat(rate).toString(),
          valueType: 'number',
          category: 'referral',
          description: `Referral commission rate for level ${level}`,
          updatedBy: req.user.id
        });
      }
    }

    // Update max commission
    const normalizedMaxCommission = maxCommissionPerTransaction ?? maxCommission;
    if (normalizedMaxCommission !== undefined) {
      await SystemSetting.upsert({
        key: 'referral_max_commission_per_transaction',
        value: parseFloat(normalizedMaxCommission).toString(),
        valueType: 'number',
        category: 'referral',
        description: 'Maximum referral commission per transaction',
        updatedBy: req.user.id
      });
    }

    // Update max commission per day
    const normalizedMaxDailyCommission = maxDailyCommission ?? maxCommissionPerDay;
    if (normalizedMaxDailyCommission !== undefined) {
      await SystemSetting.upsert({
        key: 'referral_max_commission_per_day',
        value: parseFloat(normalizedMaxDailyCommission).toString(),
        valueType: 'number',
        category: 'referral',
        description: 'Maximum referral commission per day',
        updatedBy: req.user.id
      });
    }

    await logAdminAction(
      req.user.id,
      'referral_config_update',
      'SystemSetting',
      null,
      'Referral configuration updated',
      null,
      { rates: normalizedRates, maxCommission: normalizedMaxCommission, maxCommissionPerDay: normalizedMaxDailyCommission },
      req
    );

    res.json({
      success: true,
      message: 'Referral configuration updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Backfill referral records and commissions
 */
const backfillReferralCommissions = async (req, res, next) => {
  try {
    const { since } = req.body || {};
    const sinceDate = since ? new Date(since) : null;
    if (since && Number.isNaN(sinceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid "since" date format.'
      });
    }

    // Create missing referral records based on users.referredBy
    const referredUsers = await User.findAll({
      where: { referredBy: { [Op.ne]: null } },
      attributes: ['id', 'referredBy']
    });

    const existingReferralMap = new Set(
      (await Referral.findAll({ attributes: ['referredId'] }))
        .map((ref) => ref.referredId)
    );

    const missingReferrals = referredUsers
      .filter((user) => !existingReferralMap.has(user.id))
      .map((user) => ({
        id: uuidv4(),
        referrerId: user.referredBy,
        referredId: user.id,
        level: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    if (missingReferrals.length > 0) {
      await Referral.bulkCreate(missingReferrals);
    }

    // Backfill referral earnings for task completions
    const completionWhere = sinceDate ? { createdAt: { [Op.gte]: sinceDate } } : {};
    const completions = await TaskCompletion.findAll({
      where: completionWhere,
      attributes: ['id', 'userId', 'rewardAmount']
    });

    const rates = await getReferralRates();
    let createdCount = 0;

    for (const completion of completions) {
      const baseAmount = parseFloat(completion.rewardAmount);
      if (!baseAmount || Number.isNaN(baseAmount)) continue;

      const referralChain = await getReferralChain(completion.userId, 5);
      if (referralChain.length === 0) continue;

      for (const referral of referralChain) {
        const exists = await ReferralEarning.findOne({
          where: {
            userId: referral.userId,
            referenceId: completion.id,
            referenceType: 'TaskCompletion'
          }
        });
        if (exists) continue;

        const rate = rates[referral.level] || 0;
        const commissionAmount = parseFloat((baseAmount * (rate / 100)).toFixed(2));
        if (commissionAmount <= 0) continue;

        await ReferralEarning.create({
          userId: referral.userId,
          referredUserId: completion.userId,
          level: referral.level,
          commissionType: 'task_completion',
          commissionAmount,
          baseAmount,
          commissionRate: rate,
          currency: 'LRD',
          referenceId: completion.id,
          referenceType: 'TaskCompletion'
        });

        const wallet = await Wallet.findOne({ where: { userId: referral.userId } });
        if (wallet) {
          await updateWalletBalance(
            wallet.id,
            commissionAmount,
            'referral',
            `Referral commission (Level ${referral.level})`,
            referral.userId,
            {
              referredUserId: completion.userId,
              level: referral.level,
              referenceId: completion.id
            }
          );
        }

        createdCount += 1;
      }
    }

    res.json({
      success: true,
      message: 'Referral commissions backfilled successfully.',
      data: {
        createdReferrals: missingReferrals.length,
        createdEarnings: createdCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * March 15 Holiday Promo report: list of referral bonus payments (referred user, referrer, deposit amount, % and amount paid)
 */
const getMarch15PromoReport = async (req, res, next) => {
  try {
    const promo = getMarch15PromoStatus();

    const earnings = await ReferralEarning.findAll({
      where: { referenceType: 'Deposit' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
        { model: User, as: 'referredUser', attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const entries = earnings.map((e) => ({
      id: e.id,
      referredUser: e.referredUser
        ? {
            id: e.referredUserId,
            firstName: e.referredUser.firstName,
            lastName: e.referredUser.lastName,
            email: e.referredUser.email,
            phone: e.referredUser.phone,
            registeredAt: e.referredUser.createdAt
          }
        : null,
      referredBy: e.user
        ? {
            id: e.userId,
            firstName: e.user.firstName,
            lastName: e.user.lastName,
            email: e.user.email,
            phone: e.user.phone
          }
        : null,
      depositAmount: parseFloat(e.baseAmount) || 0,
      currency: e.currency || 'LRD',
      commissionRate: parseFloat(e.commissionRate) || 10,
      commissionAmount: parseFloat(e.commissionAmount) || 0,
      depositId: e.referenceId,
      paidAt: e.createdAt
    }));

    const totalBonusPaid = entries.reduce((sum, x) => sum + x.commissionAmount, 0);
    const totalDepositVolume = entries.reduce((sum, x) => sum + x.depositAmount, 0);

    res.json({
      success: true,
      data: {
        promo,
        summary: {
          totalEntries: entries.length,
          totalBonusPaid: parseFloat(totalBonusPaid.toFixed(2)),
          totalDepositVolume: parseFloat(totalDepositVolume.toFixed(2))
        },
        entries
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reports and analytics overview
 */
const getReportsOverview = async (req, res, next) => {
  try {
    const { approvedDepositCount, packageCount } = getUserActivityLiterals();
    const totalUsers = await User.count();
    const activeUsers = await User.count({
      where: {
        isSuspended: false,
        [Op.and]: [
          db.sequelize.literal(`${approvedDepositCount} > 0`),
          db.sequelize.literal(`${packageCount} > 0`)
        ]
      }
    });
    const inactiveUsers = await User.count({
      where: {
        isSuspended: false,
        [Op.and]: [
          db.sequelize.literal(`${approvedDepositCount} = 0`),
          db.sequelize.literal(`${packageCount} = 0`)
        ]
      }
    });
    const suspendedUsers = await User.count({ where: { isSuspended: true } });

    const totalPackages = await ParticipationPackage.count();
    const totalPackagePurchases = await UserPackage.count();
    const activePackagePurchases = await UserPackage.count({ where: { status: 'active' } });

    const totalTasks = await DailyTask.count();
    const totalTaskCompletions = await TaskCompletion.count();

    const totalDeposits = await Deposit.sum('amount', { where: { status: 'approved' } }) || 0;
    const depositCount = await Deposit.count();
    const pendingDeposits = await Deposit.count({ where: { status: 'pending' } });

    const totalWithdrawals = await Withdrawal.sum('amount', {
      where: { status: { [Op.in]: ['approved', 'processing', 'completed'] } }
    }) || 0;
    const withdrawalCount = await Withdrawal.count();
    const pendingWithdrawals = await Withdrawal.count({ where: { status: 'pending' } });
    const rejectedWithdrawals = await Withdrawal.count({ where: { status: 'rejected' } });

    const totalReferrals = await Referral.count();
    const totalReferralEarnings = await ReferralEarning.sum('commissionAmount') || 0;

    const pendingKyc = await User.count({ where: { kycStatus: 'pending' } });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          suspended: suspendedUsers,
          pendingKyc
        },
        packages: {
          total: totalPackages,
          purchases: totalPackagePurchases,
          activePurchases: activePackagePurchases
        },
        tasks: {
          total: totalTasks,
          completions: totalTaskCompletions
        },
        deposits: {
          totalAmount: parseFloat(totalDeposits),
          totalCount: depositCount,
          pendingCount: pendingDeposits
        },
        withdrawals: {
          totalAmount: parseFloat(totalWithdrawals),
          totalCount: withdrawalCount,
          pendingCount: pendingWithdrawals,
          rejectedCount: rejectedWithdrawals
        },
        referrals: {
          total: totalReferrals,
          totalEarnings: parseFloat(totalReferralEarnings)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get chat messages
 */
const getChatMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, isReported } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { isDeleted: false };
    if (isReported === 'true') {
      where.isReported = true;
    }

    const { count, rows } = await ChatMessage.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        messages: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete chat message
 */
const deleteChatMessage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const message = await ChatMessage.findByPk(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.'
      });
    }

    message.isDeleted = true;
    message.deletedBy = req.user.id;
    message.deletedAt = new Date();
    await message.save();

    await logAdminAction(
      req.user.id,
      'chat_delete',
      'ChatMessage',
      message.id,
      'Chat message deleted',
      null,
      null,
      req
    );

    res.json({
      success: true,
      message: 'Chat message deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Broadcast message
 */
const broadcastMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    const broadcast = await ChatMessage.create({
      userId: req.user.id,
      message: message.trim(),
      messageType: 'admin_broadcast',
      isDeleted: false,
      isReported: false,
      isPinned: true
    });

    await logAdminAction(
      req.user.id,
      'chat_broadcast',
      'ChatMessage',
      broadcast.id,
      'Admin broadcast message',
      null,
      null,
      req
    );

    res.status(201).json({
      success: true,
      message: 'Broadcast sent successfully.',
      data: { message: broadcast }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get settings
 */
const getSettings = async (req, res, next) => {
  try {
    const { category } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }

    const settings = await SystemSetting.findAll({
      where,
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update setting
 */
const updateSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await SystemSetting.findOne({ where: { key } });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found.'
      });
    }

    if (key === 'whatsapp_support_contact' && value && String(value).trim() && !resolveWhatsAppUrl(value)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid WhatsApp invite link or phone number (e.g. +231771234567).'
      });
    }

    const whatsappContactKeys = [
      'whatsapp_new_users_contact',
      'whatsapp_official_contact'
    ];
    if (whatsappContactKeys.includes(key) && value && String(value).trim() && !resolveWhatsAppUrl(value)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid WhatsApp invite link or phone number (e.g. +231771234567).'
      });
    }

    const previousValue = setting.value;
    setting.value = value;
    setting.updatedBy = req.user.id;
    await setting.save();

    await logAdminAction(
      req.user.id,
      'system_setting_update',
      'SystemSetting',
      setting.id,
      `System setting updated: ${key}`,
      { value: previousValue },
      { value },
      req
    );

    res.json({
      success: true,
      message: 'Setting updated successfully.',
      data: { setting }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get audit logs
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, userId, action } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get admin actions
 */
const getAdminActions = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, adminId, actionType } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = actionType;

    const { count, rows } = await AdminAction.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'admin',
        attributes: ['id', 'email', 'firstName', 'lastName']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        actions: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List assignable staff positions (for admin staff creation form)
 */
const getStaffRoles = async (req, res, next) => {
  try {
    if (!canManageStaff(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can manage staff accounts.'
      });
    }

    const roles = await Role.findAll({
      where: { name: ASSIGNABLE_STAFF_ROLES },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        roles: roles.map((role) => ({
          name: role.name,
          label: ROLE_LABELS[role.name] || role.description || role.name,
          description: role.description
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List staff users (all non-end-user roles)
 */
const getStaffUsers = async (req, res, next) => {
  try {
    if (!canManageStaff(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view staff accounts.'
      });
    }

    const staffRoles = await Role.findAll({
      where: { name: STAFF_ROLES },
      attributes: ['id', 'name', 'description']
    });
    const roleIds = staffRoles.map((r) => r.id);

    const staffUsers = await User.findAll({
      where: { roleId: roleIds },
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }],
      attributes: {
        exclude: ['password', 'passwordResetToken', 'passwordResetExpires', 'withdrawalPinHash']
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { staff: staffUsers }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a staff user with a position (HOP, HOM, Finance, CSM)
 */
const createStaffUser = async (req, res, next) => {
  try {
    if (!canManageStaff(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create staff accounts.'
      });
    }

    const { firstName, lastName, email, phone, password, roleName } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Either email or phone is required.'
      });
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role || !ASSIGNABLE_STAFF_ROLES.includes(roleName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff position selected.'
      });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : [])
        ]
      }
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email or phone already exists.'
      });
    }

    const staffUser = await User.create({
      email: email || null,
      phone: phone || null,
      password,
      firstName,
      lastName,
      roleId: role.id,
      emailVerified: true,
      phoneVerified: !!phone,
      kycStatus: 'approved',
      isActive: true,
      isSuspended: false
    });

    await initializeWallet(staffUser.id, 'LRD');

    await logAdminAction(
      req.user.id,
      'staff_create',
      'User',
      staffUser.id,
      `Staff user created: ${firstName} ${lastName} (${roleName})`,
      null,
      { roleName, email, phone },
      req
    );

    res.status(201).json({
      success: true,
      message: `${ROLE_LABELS[roleName] || roleName} account created successfully.`,
      data: {
        user: {
          id: staffUser.id,
          email: staffUser.email,
          phone: staffUser.phone,
          firstName: staffUser.firstName,
          lastName: staffUser.lastName,
          role: role.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getStaffRoles,
  getStaffUsers,
  createStaffUser,
  getUsers,
  getUser,
  suspendUser,
  activateUser,
  deleteUser,
  bulkUserAction,
  resetUserPassword,
  resetUserWithdrawalPin,
  setUserWithdrawalPin,
  updateUserKYC,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  completeWithdrawal,
  getPackages,
  createPackage,
  updatePackage,
  disablePackage,
  getTasks,
  createTask,
  updateTask,
  disableTask,
  deleteTask,
  getReferrals,
  backfillReferralCommissions,
  updateReferralConfig,
  getMarch15PromoReport,
  getReportsOverview,
  getChatMessages,
  deleteChatMessage,
  broadcastMessage,
  getSettings,
  updateSetting,
  getAuditLogs,
  getAdminActions
};

