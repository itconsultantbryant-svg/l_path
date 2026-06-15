module.exports = (sequelize, DataTypes) => {
  const TaskCompletion = sequelize.define('TaskCompletion', {
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
    taskId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'DailyTasks',
        key: 'id'
      }
    },
    packageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'UserPackages',
        key: 'id'
      },
      comment: 'Associated user package for this completion'
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    completionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address for abuse detection'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'User agent for abuse detection'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Manual verification flag'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'task_completions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'taskId', 'completionDate', 'packageId'],
        name: 'unique_user_task_package_per_day'
      },
      {
        fields: ['userId']
      },
      {
        fields: ['taskId']
      },
      {
        fields: ['completionDate']
      }
    ]
  });

  TaskCompletion.associate = function(models) {
    TaskCompletion.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    TaskCompletion.belongsTo(models.DailyTask, {
      foreignKey: 'taskId',
      as: 'task'
    });
    TaskCompletion.belongsTo(models.UserPackage, {
      foreignKey: 'packageId',
      as: 'userPackage'
    });
  };

  return TaskCompletion;
};

