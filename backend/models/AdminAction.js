module.exports = (sequelize, DataTypes) => {
  const AdminAction = sequelize.define('AdminAction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    actionType: {
      type: DataTypes.ENUM(
        'user_suspend',
        'user_activate',
        'user_kyc_approve',
        'deposit_approve',
        'deposit_reject',
        'withdrawal_approve',
        'withdrawal_reject',
        'package_create',
        'package_update',
        'package_disable',
        'task_create',
        'task_update',
        'task_disable',
        'chat_delete',
        'chat_ban',
        'system_setting_update',
        'referral_config_update',
        'emergency_stop',
        'other'
      ),
      allowNull: false
    },
    targetEntityType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    targetEntityId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    previousValue: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    },
    newValue: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'admin_actions',
    timestamps: true,
    indexes: [
      {
        fields: ['adminId']
      },
      {
        fields: ['actionType']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  AdminAction.associate = function(models) {
    AdminAction.belongsTo(models.User, {
      foreignKey: 'adminId',
      as: 'admin'
    });
  };

  return AdminAction;
};

