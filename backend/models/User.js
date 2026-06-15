const bcrypt = require('bcryptjs');
const config = require('../config/config');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
      validate: {
        len: {
          args: [10, 20],
          msg: 'Phone number must be between 10 and 20 characters'
        }
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    referralCode: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Roles',
        key: 'id'
      },
      defaultValue: null // Will be set via seed
    },
    referredBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kycStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    },
    kycDocument: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isSuspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    withdrawalPinHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    withdrawalPinUpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    recoveryCodeHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    recoveryCodeExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    recoveryCodeChannel: {
      type: DataTypes.STRING(20),
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeValidate: async (user) => {
        // Require email or phone only when creating a new user (never on update; e.g. withdrawal PIN setup must not require them)
        const isCreate = user.isNewRecord === true;
        if (isCreate && !user.email && !user.phone) {
          throw new Error('Either email or phone number is required');
        }
        // Generate unique referral code for new users if not provided (must be before validation)
        if (isCreate && (!user.referralCode || String(user.referralCode).trim() === '')) {
          user.referralCode = `REF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
      },
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(config.security.bcryptRounds);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(config.security.bcryptRounds);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;
    delete values.withdrawalPinHash;
    delete values.recoveryCodeHash;
    delete values.recoveryCodeExpires;
    delete values.recoveryCodeChannel;
    return values;
  };

  // Associations
  User.associate = function(models) {
    User.belongsTo(models.Role, {
      foreignKey: 'roleId',
      as: 'role'
    });
    User.hasOne(models.Wallet, {
      foreignKey: 'userId',
      as: 'wallet'
    });
    User.hasMany(models.Transaction, {
      foreignKey: 'userId',
      as: 'transactions'
    });
    User.hasMany(models.Deposit, {
      foreignKey: 'userId',
      as: 'deposits'
    });
    User.hasMany(models.Withdrawal, {
      foreignKey: 'userId',
      as: 'withdrawals'
    });
    User.hasMany(models.UserPackage, {
      foreignKey: 'userId',
      as: 'packages'
    });
    User.hasMany(models.TaskCompletion, {
      foreignKey: 'userId',
      as: 'taskCompletions'
    });
    // Self-referential for referrals
    User.belongsTo(models.User, {
      foreignKey: 'referredBy',
      as: 'referrer'
    });
    User.hasMany(models.User, {
      foreignKey: 'referredBy',
      as: 'referrals'
    });
    User.hasMany(models.Referral, {
      foreignKey: 'referrerId',
      as: 'referralRecords'
    });
    User.hasMany(models.ReferralEarning, {
      foreignKey: 'userId',
      as: 'referralEarnings'
    });
    User.hasMany(models.ChatMessage, {
      foreignKey: 'userId',
      as: 'chatMessages'
    });
    User.hasMany(models.AuditLog, {
      foreignKey: 'userId',
      as: 'auditLogs'
    });
    User.hasMany(models.AdminAction, {
      foreignKey: 'adminId',
      as: 'adminActions'
    });
  };

  return User;
};

