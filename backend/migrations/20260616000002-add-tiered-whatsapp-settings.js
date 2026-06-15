'use strict';

const { v4: uuidv4 } = require('uuid');

const SETTINGS = [
  {
    key: 'whatsapp_new_users_contact',
    value: '',
    valueType: 'string',
    category: 'support',
    description: 'WhatsApp chatroom for new users (after register/login, before first approved deposit).',
    isPublic: true
  },
  {
    key: 'whatsapp_new_users_enabled',
    value: 'true',
    valueType: 'boolean',
    category: 'support',
    description: 'Show the new-user WhatsApp chatroom link on the dashboard.',
    isPublic: true
  },
  {
    key: 'whatsapp_official_contact',
    value: '',
    valueType: 'string',
    category: 'support',
    description: 'Official WhatsApp group for active users (after approved deposit).',
    isPublic: true
  },
  {
    key: 'whatsapp_official_enabled',
    value: 'true',
    valueType: 'boolean',
    category: 'support',
    description: 'Show the official WhatsApp group link on the dashboard for depositors.',
    isPublic: true
  }
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (const setting of SETTINGS) {
      const existing = await queryInterface.sequelize.query(
        'SELECT id FROM system_settings WHERE key = :key LIMIT 1',
        {
          replacements: { key: setting.key },
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (existing.length > 0) continue;

      await queryInterface.bulkInsert('system_settings', [{
        id: uuidv4(),
        ...setting,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('system_settings', {
      key: SETTINGS.map((s) => s.key)
    });
  }
};
