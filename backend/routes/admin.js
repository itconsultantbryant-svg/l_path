const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isStaff, isSuperAdmin, requirePermission } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Dashboard overview
router.get('/dashboard', authenticate, isStaff, requirePermission('dashboard'), adminController.getDashboard);

// Staff management (admin / super_admin only)
router.get('/staff/roles', authenticate, isStaff, adminController.getStaffRoles);
router.get('/staff', authenticate, isStaff, adminController.getStaffUsers);
router.post('/staff',
  authenticate,
  isStaff,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').optional({ nullable: true }).isEmail().withMessage('Valid email required'),
    body('phone').optional({ nullable: true }).isLength({ min: 8 }).withMessage('Valid phone required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('roleName').isIn(['hop', 'hom', 'finance', 'csm']).withMessage('Invalid staff position')
  ],
  handleValidationErrors,
  adminController.createStaffUser
);

// User Management
router.get('/users', authenticate, isStaff, requirePermission('users'), adminController.getUsers);
router.get('/users/:id', authenticate, isStaff, requirePermission('users'), adminController.getUser);
router.put('/users/:id/suspend', authenticate, isStaff, requirePermission('usersWrite'), adminController.suspendUser);
router.put('/users/:id/activate', authenticate, isStaff, requirePermission('usersWrite'), adminController.activateUser);
router.put('/users/:id/kyc', authenticate, isStaff, requirePermission('usersWrite'), adminController.updateUserKYC);
router.put('/users/:id/password',
  authenticate,
  isStaff,
  requirePermission('usersWrite'),
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long.')
  ],
  handleValidationErrors,
  adminController.resetUserPassword
);
router.put('/users/:id/withdrawal-pin/reset', authenticate, isStaff, requirePermission('usersWrite'), adminController.resetUserWithdrawalPin);
router.put('/users/:id/withdrawal-pin',
  authenticate,
  isStaff,
  requirePermission('usersWrite'),
  [
    body('pin')
      .notEmpty().withMessage('PIN is required')
      .isLength({ min: 4, max: 8 }).withMessage('PIN must be 4-8 digits'),
    body('confirmPin')
      .notEmpty().withMessage('Confirm PIN is required')
      .custom((value, { req }) => value === req.body.pin).withMessage('PIN and confirmation do not match')
  ],
  handleValidationErrors,
  adminController.setUserWithdrawalPin
);
router.put('/users/bulk', authenticate, isStaff, requirePermission('usersBulk'), adminController.bulkUserAction);
router.delete('/users/:id', authenticate, isSuperAdmin, adminController.deleteUser);

// Financial Management
router.get('/deposits', authenticate, isStaff, requirePermission('deposits'), adminController.getDeposits);
router.put('/deposits/:id/approve', authenticate, isStaff, requirePermission('depositsWrite'), adminController.approveDeposit);
router.put('/deposits/:id/reject', authenticate, isStaff, requirePermission('depositsWrite'), adminController.rejectDeposit);
router.get('/withdrawals', authenticate, isStaff, requirePermission('withdrawals'), adminController.getWithdrawals);
router.put('/withdrawals/:id/approve', authenticate, isStaff, requirePermission('withdrawalsWrite'), adminController.approveWithdrawal);
router.put('/withdrawals/:id/reject', authenticate, isStaff, requirePermission('withdrawalsWrite'), adminController.rejectWithdrawal);
router.put('/withdrawals/:id/complete', authenticate, isStaff, requirePermission('withdrawalsWrite'), adminController.completeWithdrawal);

// Package Management
router.get('/packages', authenticate, isStaff, requirePermission('packages'), adminController.getPackages);
router.post('/packages', authenticate, isStaff, requirePermission('packagesWrite'), adminController.createPackage);
router.put('/packages/:id', authenticate, isStaff, requirePermission('packagesWrite'), adminController.updatePackage);
router.put('/packages/:id/disable', authenticate, isStaff, requirePermission('packagesWrite'), adminController.disablePackage);

// Task Management
router.get('/tasks', authenticate, isStaff, requirePermission('tasks'), adminController.getTasks);
router.post('/tasks', authenticate, isStaff, requirePermission('tasksWrite'), adminController.createTask);
router.put('/tasks/:id', authenticate, isStaff, requirePermission('tasksWrite'), adminController.updateTask);
router.put('/tasks/:id/disable', authenticate, isStaff, requirePermission('tasksWrite'), adminController.disableTask);
router.delete('/tasks/:id', authenticate, isStaff, requirePermission('tasksWrite'), adminController.deleteTask);

// Referral Management
router.get('/referrals', authenticate, isStaff, requirePermission('referrals'), adminController.getReferrals);
router.put('/referrals/config', authenticate, isStaff, requirePermission('referralsWrite'), adminController.updateReferralConfig);
router.post('/referrals/backfill', authenticate, isStaff, requirePermission('referralsWrite'), adminController.backfillReferralCommissions);

// Reports & Analytics
router.get('/reports/overview', authenticate, isStaff, requirePermission('reports'), adminController.getReportsOverview);

// March 15 Promotion monitor
router.get('/promotion', authenticate, isStaff, requirePermission('promotion'), adminController.getMarch15PromoReport);

// Chat Moderation
router.get('/chat', authenticate, isStaff, requirePermission('chat'), adminController.getChatMessages);
router.delete('/chat/:id', authenticate, isStaff, requirePermission('chatWrite'), adminController.deleteChatMessage);
router.post('/chat/broadcast', authenticate, isStaff, requirePermission('chatBroadcast'), adminController.broadcastMessage);

// System Settings
router.get('/settings', authenticate, isStaff, requirePermission('settings'), adminController.getSettings);
router.put('/settings/:key', authenticate, isStaff, requirePermission('settings'), adminController.updateSetting);

// Audit Logs
router.get('/audit-logs', authenticate, isStaff, requirePermission('settings'), adminController.getAuditLogs);
router.get('/admin-actions', authenticate, isStaff, requirePermission('settings'), adminController.getAdminActions);

module.exports = router;
