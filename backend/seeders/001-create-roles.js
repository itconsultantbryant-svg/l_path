'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM roles',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const existingCount = parseInt(existing?.[0]?.count, 10) || 0;
    if (existingCount > 0) {
      return;
    }

    const dialect = queryInterface.sequelize.getDialect();
    const buildPermissionsValue = (permissions) => {
      const payload = JSON.stringify(permissions);
      if (dialect === 'postgres') {
        const escaped = payload.replace(/'/g, "''");
        return Sequelize.literal(`'${escaped}'::jsonb`);
      }
      return payload;
    };
    
    await queryInterface.bulkInsert('roles', [
      {
        id: uuidv4(),
        name: 'user',
        description: 'Regular user role',
        permissions: buildPermissionsValue({
          canCompleteTasks: true,
          canMakeDeposits: true,
          canRequestWithdrawals: true,
          canPurchasePackages: true,
          canViewReferrals: true,
          canChat: true
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'admin',
        description: 'Administrator role',
        permissions: buildPermissionsValue({
          canCompleteTasks: true,
          canMakeDeposits: true,
          canRequestWithdrawals: true,
          canPurchasePackages: true,
          canViewReferrals: true,
          canChat: true,
          canManageUsers: true,
          canApproveDeposits: true,
          canApproveWithdrawals: true,
          canManagePackages: true,
          canManageTasks: true,
          canModerateChat: true,
          canViewReports: true
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'super_admin',
        description: 'Super administrator role',
        permissions: buildPermissionsValue({
          canCompleteTasks: true,
          canMakeDeposits: true,
          canRequestWithdrawals: true,
          canPurchasePackages: true,
          canViewReferrals: true,
          canChat: true,
          canManageUsers: true,
          canApproveDeposits: true,
          canApproveWithdrawals: true,
          canManagePackages: true,
          canManageTasks: true,
          canModerateChat: true,
          canViewReports: true,
          canManageAdmins: true,
          canManageSystemSettings: true,
          canEmergencyStop: true
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', null, {});
  }
};

