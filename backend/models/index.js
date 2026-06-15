const Sequelize = require('sequelize');
const config = require('../config/config');
const db = {};

// Initialize Sequelize
const useSQLite = config.database.dialect === 'sqlite' || config.database.storage;

const sequelize = useSQLite ? new Sequelize({
  dialect: 'sqlite',
  storage: config.database.storage || './database.sqlite',
  logging: config.NODE_ENV === 'development' ? console.log : false
}) : (config.database.url ? new Sequelize(
  config.database.url,
  {
    dialect: config.database.dialect,
    logging: config.NODE_ENV === 'development' ? console.log : false,
    // Small pools for managed Postgres (e.g. Render free tier): min>0 can stall startup or exhaust connections.
    pool: {
      max: config.NODE_ENV === 'production' ? 10 : 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    ...(config.database.ssl ? { dialectOptions: { ssl: config.database.ssl } } : {})
  }
) : new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    logging: config.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: config.NODE_ENV === 'production' ? 10 : 20,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    ...(config.database.ssl ? { dialectOptions: { ssl: config.database.ssl } } : {})
  }
));

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Role = require('./Role')(sequelize, Sequelize.DataTypes);
db.Wallet = require('./Wallet')(sequelize, Sequelize.DataTypes);
db.Transaction = require('./Transaction')(sequelize, Sequelize.DataTypes);
db.Deposit = require('./Deposit')(sequelize, Sequelize.DataTypes);
db.Withdrawal = require('./Withdrawal')(sequelize, Sequelize.DataTypes);
db.ParticipationPackage = require('./ParticipationPackage')(sequelize, Sequelize.DataTypes);
db.UserPackage = require('./UserPackage')(sequelize, Sequelize.DataTypes);
db.DailyTask = require('./DailyTask')(sequelize, Sequelize.DataTypes);
db.TaskCompletion = require('./TaskCompletion')(sequelize, Sequelize.DataTypes);
db.Referral = require('./Referral')(sequelize, Sequelize.DataTypes);
db.ReferralEarning = require('./ReferralEarning')(sequelize, Sequelize.DataTypes);
db.ChatMessage = require('./ChatMessage')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./AuditLog')(sequelize, Sequelize.DataTypes);
db.AdminAction = require('./AdminAction')(sequelize, Sequelize.DataTypes);
db.SystemSetting = require('./SystemSetting')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

