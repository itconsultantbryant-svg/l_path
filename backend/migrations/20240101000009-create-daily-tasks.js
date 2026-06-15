'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('daily_tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      taskType: {
        type: Sequelize.ENUM('click', 'visit', 'watch', 'share', 'custom'),
        defaultValue: 'click',
        allowNull: false
      },
      rewardAmount: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'LRD',
        allowNull: false
      },
      targetUrl: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      instructions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isDisabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      scheduledDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('daily_tasks', ['isActive', 'isDisabled']);
    await queryInterface.addIndex('daily_tasks', ['scheduledDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('daily_tasks');
  }
};

