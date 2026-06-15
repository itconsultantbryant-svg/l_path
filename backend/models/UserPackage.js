module.exports = (sequelize, DataTypes) => {
  const UserPackage = sequelize.define('UserPackage', {
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
      }
    },
    packageId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ParticipationPackages',
        key: 'id'
      }
    },
    purchaseAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled', 'suspended'),
      defaultValue: 'active',
      allowNull: false
    },
    totalRewardsEarned: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    totalTasksCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastRewardDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'user_packages',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['packageId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['endDate']
      }
    ]
  });

  UserPackage.associate = function(models) {
    UserPackage.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    UserPackage.belongsTo(models.ParticipationPackage, {
      foreignKey: 'packageId',
      as: 'package'
    });
  };

  return UserPackage;
};

