module.exports = (sequelize, DataTypes) => {
  const ReferralEarning = sequelize.define('ReferralEarning', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who earned the referral commission'
    },
    referredUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User whose activity generated the commission'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Referral level (1-5)'
    },
    commissionType: {
      type: DataTypes.ENUM('task_completion', 'package_purchase', 'activity_based'),
      allowNull: false,
      comment: 'Type of activity that generated commission'
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    baseAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Base amount that commission was calculated from'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Commission percentage used'
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LRD',
      allowNull: false
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Reference to related record (task completion, package purchase, etc.)'
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Type of reference (TaskCompletion, UserPackage, etc.)'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'referral_earnings',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['referredUserId']
      },
      {
        fields: ['level']
      },
      {
        fields: ['commissionType']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  ReferralEarning.associate = function(models) {
    ReferralEarning.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    ReferralEarning.belongsTo(models.User, {
      foreignKey: 'referredUserId',
      as: 'referredUser'
    });
  };

  return ReferralEarning;
};

