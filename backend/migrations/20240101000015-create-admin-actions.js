'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('admin_actions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      adminId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actionType: {
        type: Sequelize.ENUM(
          'user_suspend',
          'user_activate',
          'user_kyc_approve',
          'deposit_approve',
          'deposit_reject',
          'withdrawal_approve',
          'withdrawal_reject',
          'package_create',
          'package_update',
          'package_disable',
          'task_create',
          'task_update',
          'task_disable',
          'chat_delete',
          'chat_ban',
          'system_setting_update',
          'referral_config_update',
          'emergency_stop',
          'other'
        ),
        allowNull: false
      },
      targetEntityType: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      targetEntityId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      previousValue: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: true
      },
      newValue: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('admin_actions', ['adminId']);
    await queryInterface.addIndex('admin_actions', ['actionType']);
    await queryInterface.addIndex('admin_actions', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('admin_actions');
  }
};

