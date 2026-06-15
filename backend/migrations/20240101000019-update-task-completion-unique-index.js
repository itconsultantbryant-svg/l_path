 'use strict';
 
 module.exports = {
   up: async (queryInterface, Sequelize) => {
     try {
       await queryInterface.removeIndex('task_completions', 'unique_user_task_per_day');
     } catch (error) {
       // Index may not exist in some environments
     }
 
     await queryInterface.addIndex('task_completions', ['userId', 'taskId', 'completionDate', 'packageId'], {
       unique: true,
       name: 'unique_user_task_package_per_day'
     });
   },
 
   down: async (queryInterface, Sequelize) => {
     try {
       await queryInterface.removeIndex('task_completions', 'unique_user_task_package_per_day');
     } catch (error) {
       // Ignore if missing
     }
 
     await queryInterface.addIndex('task_completions', ['userId', 'taskId', 'completionDate'], {
       unique: true,
       name: 'unique_user_task_per_day'
     });
   }
 };
