'use strict';

const { v4: uuidv4 } = require('uuid');

const BASE_ROLES = [
  {
    name: 'user',
    description: 'Regular user role',
    permissions: {
      canCompleteTasks: true,
      canMakeDeposits: true,
      canRequestWithdrawals: true,
      canPurchasePackages: true,
      canViewReferrals: true,
      canChat: true
    }
  },
  {
    name: 'admin',
    description: 'Administrator role',
    permissions: {
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
    }
  },
  {
    name: 'super_admin',
    description: 'Super administrator role',
    permissions: {
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
    }
  }
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();

    for (const role of BASE_ROLES) {
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM roles WHERE name = :name LIMIT 1',
        {
          replacements: { name: role.name },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (existing.length > 0) continue;

      const permissionsJson = JSON.stringify(role.permissions);

      if (dialect === 'postgres') {
        await queryInterface.sequelize.query(
          `INSERT INTO roles (id, name, description, permissions, "createdAt", "updatedAt")
           VALUES (:id, :name, :description, :permissions::jsonb, NOW(), NOW())`,
          {
            replacements: {
              id: uuidv4(),
              name: role.name,
              description: role.description,
              permissions: permissionsJson
            }
          }
        );
      } else {
        await queryInterface.bulkInsert('roles', [{
          id: uuidv4(),
          name: role.name,
          description: role.description,
          permissions: permissionsJson,
          createdAt: new Date(),
          updatedAt: new Date()
        }]);
      }
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('roles', {
      name: BASE_ROLES.map((r) => r.name)
    });
  }
};
