'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get super_admin role
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
        replacements: { email: 'admin@libertypath.com' }
      }
    );

    // Hash password
    const salt = await bcrypt.genSalt(config.security.bcryptRounds);
    const hashedPassword = await bcrypt.hash('Admin@LibertyPath1215', salt);

    let userId = existingAdmin?.[0]?.id;
    if (!userId) {
      // Create super admin user
      userId = uuidv4();
      const referralCode = `ADMIN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await queryInterface.bulkInsert('users', [
        {
          id: userId,
          email: 'admin@libertypath.com',
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
      await queryInterface.bulkUpdate(
        'users',
        {
          password: hashedPassword,
          updatedAt: new Date()
        },
        { id: userId }
      );
    }

    // Create wallet for super admin
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
          userId: userId,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { email: 'admin@libertypath.com' }, {});
  }
};

