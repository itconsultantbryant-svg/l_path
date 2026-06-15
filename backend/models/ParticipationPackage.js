module.exports = (sequelize, DataTypes) => {
  const ParticipationPackage = sequelize.define('ParticipationPackage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LRD',
      allowNull: false
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    dailyRewardAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    maxRewardAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Maximum total reward cap (null = unlimited)'
    },
    tasksPerDay: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isDisabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Emergency stop switch'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'participation_packages',
    timestamps: true,
    indexes: [
      {
        fields: ['isActive', 'isDisabled']
      }
    ]
  });

  ParticipationPackage.associate = function(models) {
    ParticipationPackage.hasMany(models.UserPackage, {
      foreignKey: 'packageId',
      as: 'userPackages'
    });
  };

  return ParticipationPackage;
};

