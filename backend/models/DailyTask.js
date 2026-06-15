module.exports = (sequelize, DataTypes) => {
  const DailyTask = sequelize.define('DailyTask', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    packageId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'ParticipationPackages',
        key: 'id'
      },
      comment: 'Optional package scope for this task'
    },
    taskType: {
      type: DataTypes.ENUM('click', 'visit', 'watch', 'share', 'custom'),
      defaultValue: 'click',
      allowNull: false
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'LRD',
      allowNull: false
    },
    targetUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
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
    scheduledDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Specific date for task (null = available daily)'
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
    tableName: 'daily_tasks',
    timestamps: true,
    indexes: [
      {
        fields: ['isActive', 'isDisabled']
      },
      {
        fields: ['scheduledDate']
      },
      {
        fields: ['packageId']
      }
    ]
  });

  DailyTask.associate = function(models) {
    DailyTask.hasMany(models.TaskCompletion, {
      foreignKey: 'taskId',
      as: 'completions'
    });
  };

  return DailyTask;
};

