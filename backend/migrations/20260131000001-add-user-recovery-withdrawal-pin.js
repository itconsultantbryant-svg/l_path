module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'withdrawalPinHash', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'withdrawalPinUpdatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'recoveryCodeHash', {
      type: Sequelize.STRING(255),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'recoveryCodeExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'recoveryCodeChannel', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'withdrawalPinHash');
    await queryInterface.removeColumn('users', 'withdrawalPinUpdatedAt');
    await queryInterface.removeColumn('users', 'recoveryCodeHash');
    await queryInterface.removeColumn('users', 'recoveryCodeExpires');
    await queryInterface.removeColumn('users', 'recoveryCodeChannel');
  }
};
