'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

const ADMIN_EMAIL = 'admin@libertypath.com';
const ADMIN_DEFAULT_PASSWORD = 'admin123';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = await queryInterface.sequelize.query(
      'SELECT id FROM roles WHERE name = :role LIMIT 1',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { role: 'super_admin' }
      }
    );

    if (roles.length === 0) {
      throw new Error('Super admin role not found. Please run role seeder first.');
    }

    const superAdminRoleId = roles[0].id;

    const existingAdmin = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE email = :email LIMIT 1',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { email: ADMIN_EMAIL }
      }
    );

    let userId = existingAdmin?.[0]?.id;

    if (!userId) {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, salt);
      userId = uuidv4();
      const referralCode = `ADMIN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await queryInterface.bulkInsert('users', [
        {
          id: userId,
          email: ADMIN_EMAIL,
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          referralCode,
          roleId: superAdminRoleId,
          emailVerified: true,
          phoneVerified: false,
          kycStatus: 'approved',
          isActive: true,
          isSuspended: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    } else {
      // Do not reset password on redeploy — only ensure account remains usable.
      await queryInterface.bulkUpdate(
        'users',
        {
          roleId: superAdminRoleId,
          isActive: true,
          isSuspended: false,
          kycStatus: 'approved',
          emailVerified: true,
          updatedAt: new Date()
        },
        { id: userId }
      );
    }

    const existingWallet = await queryInterface.sequelize.query(
      'SELECT id FROM wallets WHERE "userId" = :userId LIMIT 1',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { userId }
      }
    );
    if (existingWallet.length === 0) {
      await queryInterface.bulkInsert('wallets', [
        {
          id: uuidv4(),
          userId,
          balance: 0.00,
          currency: 'LRD',
          totalEarned: 0.00,
          totalWithdrawn: 0.00,
          totalDeposited: 0.00,
          isLocked: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ], {});
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: ADMIN_EMAIL }, {});
  }
};
