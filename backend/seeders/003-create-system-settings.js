'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get super admin user for updatedBy field
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@libertypath.com' LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminId = users.length > 0 ? users[0].id : null;

    const defaultSettings = [
      {
        key: 'referral_rate_level_1',
        value: '5.0',
        valueType: 'number',
        category: 'referral',
        description: 'Referral commission rate for level 1 (percentage)',
        isPublic: false
      },
      {
        key: 'referral_rate_level_2',
        value: '3.0',
        valueType: 'number',
        category: 'referral',
        description: 'Referral commission rate for level 2 (percentage)',
        isPublic: false
      },
      {
        key: 'referral_rate_level_3',
        value: '2.0',
        valueType: 'number',
        category: 'referral',
        description: 'Referral commission rate for level 3 (percentage)',
        isPublic: false
      },
      {
        key: 'referral_rate_level_4',
        value: '1.0',
        valueType: 'number',
        category: 'referral',
        description: 'Referral commission rate for level 4 (percentage)',
        isPublic: false
      },
      {
        key: 'referral_rate_level_5',
        value: '0.5',
        valueType: 'number',
        category: 'referral',
        description: 'Referral commission rate for level 5 (percentage)',
        isPublic: false
      },
      {
        key: 'referral_max_commission_per_transaction',
        value: '100.00',
        valueType: 'number',
        category: 'referral',
        description: 'Maximum referral commission per transaction (LRD)',
        isPublic: false
      },
      {
        key: 'referral_max_commission_per_day',
        value: '500.00',
        valueType: 'number',
        category: 'referral',
        description: 'Maximum referral commission per day per user (LRD)',
        isPublic: false
      },
      {
        key: 'platform_currency',
        value: 'LRD',
        valueType: 'string',
        category: 'general',
        description: 'Platform currency',
        isPublic: true
      },
      {
        key: 'service_fee_percentage',
        value: '15',
        valueType: 'number',
        category: 'financial',
        description: 'Service fee percentage for withdrawals',
        isPublic: true
      },
      {
        key: 'min_withdrawal_amount',
        value: '500',
        valueType: 'number',
        category: 'financial',
        description: 'Minimum withdrawal amount (LRD)',
        isPublic: true
      },
      {
        key: 'max_withdrawal_amount_per_week',
        value: '15000',
        valueType: 'number',
        category: 'financial',
        description: 'Maximum total withdrawal amount per week (LRD)',
        isPublic: true
      },
      {
        key: 'payment_mtn_momo_number',
        value: '0881031901',
        valueType: 'string',
        category: 'payments',
        description: 'MTN Mobile Money deposit number',
        isPublic: true
      },
      {
        key: 'payment_orange_money_number',
        value: '0775592486',
        valueType: 'string',
        category: 'payments',
        description: 'Orange Money deposit number',
        isPublic: true
      },
      {
        key: 'whatsapp_support_contact',
        value: '',
        valueType: 'string',
        category: 'support',
        description: 'Customer service WhatsApp — group invite link or phone number (e.g. +231771234567).',
        isPublic: true
      },
      {
        key: 'whatsapp_support_enabled',
        value: 'true',
        valueType: 'boolean',
        category: 'support',
        description: 'Show the floating WhatsApp customer service button across the app.',
        isPublic: true
      },
      {
        key: 'whatsapp_new_users_contact',
        value: '',
        valueType: 'string',
        category: 'support',
        description: 'WhatsApp chatroom for new users (after login, before first approved deposit).',
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
        description: 'Show the official WhatsApp group link for depositors on the dashboard.',
        isPublic: true
      }
    ];

    const existing = await queryInterface.sequelize.query(
      `SELECT key FROM system_settings WHERE key IN (${defaultSettings.map(() => '?').join(',')})`,
      {
        replacements: defaultSettings.map((setting) => setting.key),
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const existingKeys = new Set(existing.map((row) => row.key));
    const missingSettings = defaultSettings
      .filter((setting) => !existingKeys.has(setting.key))
      .map((setting) => ({
        id: uuidv4(),
        ...setting,
        updatedBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

    if (missingSettings.length > 0) {
      await queryInterface.bulkInsert('system_settings', missingSettings, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('system_settings', {
      category: ['referral', 'general', 'financial', 'payments', 'support']
    }, {});
  }
};

