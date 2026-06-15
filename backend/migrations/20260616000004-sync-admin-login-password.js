'use strict';

const bcrypt = require('bcryptjs');

/** Align production admin password with documented credentials (admin123). */
module.exports = {
  up: async (queryInterface) => {
    const [users] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@libertypath.com' LIMIT 1"
    );
    if (!users.length) return;

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await queryInterface.sequelize.query(
      `UPDATE users SET password = :password, "updatedAt" = NOW() WHERE email = 'admin@libertypath.com'`,
      { replacements: { password: hashedPassword } }
    );
  },

  down: async () => {
    // Password rollback not supported
  }
};
