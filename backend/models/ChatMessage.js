module.exports = (sequelize, DataTypes) => {
  const ChatMessage = sequelize.define('ChatMessage', {
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM('user', 'admin_broadcast', 'system'),
      defaultValue: 'user',
      allowNull: false
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deletedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isReported: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isPinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true
    }
  }, {
    tableName: 'chat_messages',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['isDeleted', 'messageType']
      }
    ]
  });

  ChatMessage.associate = function(models) {
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    ChatMessage.belongsTo(models.User, {
      foreignKey: 'deletedBy',
      as: 'deleter'
    });
  };

  return ChatMessage;
};

