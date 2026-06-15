 'use strict';
 
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.getDialect() === 'sqlite';
    if (isSqlite) {
      return;
    }

    await queryInterface.changeColumn('users', 'referralCode', {
      type: Sequelize.STRING(50),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.getDialect() === 'sqlite';
    if (isSqlite) {
      return;
    }

    await queryInterface.changeColumn('users', 'referralCode', {
      type: Sequelize.STRING(20),
      allowNull: false
    });
  }
};
