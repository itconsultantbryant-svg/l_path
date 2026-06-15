'use strict';

const { v4: uuidv4 } = require('uuid');

const SETTINGS = [
  {
    key: 'whatsapp_support_contact',
    value: '',
    valueType: 'string',
    category: 'support',
    description: 'Customer service WhatsApp — paste a group invite link (https://chat.whatsapp.com/...) or phone number (e.g. +231771234567).',
    isPublic: true
  },
  {
    key: 'whatsapp_support_enabled',
    value: 'true',
    valueType: 'boolean',
    category: 'support',
    description: 'Show the floating WhatsApp customer service button across the app.',
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
