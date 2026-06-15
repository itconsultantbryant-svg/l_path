'use strict';

const { v4: uuidv4 } = require('uuid');

const STAFF_ROLE_DEFS = [
  {
    name: 'hop',
    description: 'Head of Operation (HOP)',
    permissions: {
      dashboard: true,
      users: true,
      usersWrite: true,
      usersBulk: true,
      deposits: true,
      depositsWrite: true,
      withdrawals: true,
      withdrawalsWrite: true,
      packages: true,
      packagesWrite: true,
      tasks: true,
      tasksWrite: true,
      reports: true
    }
  },
  {
    name: 'hom',
    description: 'Head of Marketing (HOM)',
    permissions: {
      dashboard: true,
      packages: true,
      packagesWrite: true,
      tasks: true,
      tasksWrite: true,
      referrals: true,
      referralsWrite: true,
      promotion: true,
      reports: true,
      chat: true,
      chatWrite: true,
      chatBroadcast: true
    }
  },
  {
    name: 'finance',
    description: 'Account / Finance Officer',
    permissions: {
      dashboard: true,
      deposits: true,
      depositsWrite: true,
      withdrawals: true,
      withdrawalsWrite: true,
      reports: true,
      users: true
    }
  },
  {
    name: 'csm',
    description: 'Customer Service Manager (CSM)',
    permissions: {
      dashboard: true,
      users: true,
      usersWrite: true,
      chat: true,
      chatWrite: true
    }
  }
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      for (const role of STAFF_ROLE_DEFS) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_roles_name" ADD VALUE IF NOT EXISTS '${role.name}'`
        ).catch(() => {
          // Older Postgres without IF NOT EXISTS — try plain ADD VALUE
          return queryInterface.sequelize.query(
            `ALTER TYPE "enum_roles_name" ADD VALUE '${role.name}'`
          ).catch(() => {});
        });
      }
    }

    for (const role of STAFF_ROLE_DEFS) {
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
      name: STAFF_ROLE_DEFS.map((r) => r.name)
    });
  }
};
