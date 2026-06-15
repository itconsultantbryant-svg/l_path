'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('referral_earnings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      referredUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      commissionType: {
        type: Sequelize.ENUM('task_completion', 'package_purchase', 'activity_based'),
        allowNull: false
      },
      commissionAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      baseAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      commissionRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'LRD',
        allowNull: false
      },
      referenceId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      referenceType: {
        type: Sequelize.STRING(50),
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

    await queryInterface.addIndex('referral_earnings', ['userId']);
    await queryInterface.addIndex('referral_earnings', ['referredUserId']);
    await queryInterface.addIndex('referral_earnings', ['level']);
    await queryInterface.addIndex('referral_earnings', ['commissionType']);
    await queryInterface.addIndex('referral_earnings', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('referral_earnings');
  }
};

