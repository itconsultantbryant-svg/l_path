'use strict';

module.exports = {
  up: async (queryInterface) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect !== 'postgres') {
      return;
    }
    await queryInterface.sequelize.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_transactions_type' AND e.enumlabel = 'debit') THEN ALTER TYPE enum_transactions_type ADD VALUE 'debit'; END IF; END $$;"
    );
  },

  down: async () => {
    // Removing enum values is not supported without recreating the type.
  }
};
