module.exports = (sequelize, DataTypes) => {
  const Referral = sequelize.define('Referral', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    referrerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who referred'
    },
    referredId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who was referred'
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 5
      },
      comment: 'Referral level (1-5)'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'referrals',
    timestamps: true,
    indexes: [
      {
        fields: ['referrerId']
      },
      {
        fields: ['referredId']
      },
      {
        fields: ['level']
      },
      {
        unique: true,
        fields: ['referredId']
      }
    ]
  });

  Referral.associate = function(models) {
    Referral.belongsTo(models.User, {
      foreignKey: 'referrerId',
      as: 'referrer'
    });
    Referral.belongsTo(models.User, {
      foreignKey: 'referredId',
      as: 'referred'
    });
  };

  return Referral;
};

