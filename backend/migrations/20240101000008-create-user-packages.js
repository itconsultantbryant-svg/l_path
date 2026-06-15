'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_packages', {
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
      packageId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'participation_packages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      purchaseAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'expired', 'cancelled', 'suspended'),
        defaultValue: 'active',
        allowNull: false
      },
      totalRewardsEarned: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      totalTasksCompleted: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lastRewardDate: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('user_packages', ['userId']);
    await queryInterface.addIndex('user_packages', ['packageId']);
    await queryInterface.addIndex('user_packages', ['status']);
    await queryInterface.addIndex('user_packages', ['endDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_packages');
  }
};

