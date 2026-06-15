 'use strict';
 
 module.exports = {
   up: async (queryInterface, Sequelize) => {
     await queryInterface.addColumn('daily_tasks', 'packageId', {
       type: Sequelize.UUID,
       allowNull: true,
       references: {
         model: 'participation_packages',
         key: 'id'
       }
     });
 
     await queryInterface.addIndex('daily_tasks', ['packageId']);
   },
 
   down: async (queryInterface, Sequelize) => {
     await queryInterface.removeIndex('daily_tasks', ['packageId']);
     await queryInterface.removeColumn('daily_tasks', 'packageId');
   }
 };
