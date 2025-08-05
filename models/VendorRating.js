const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VendorRating = sequelize.define('VendorRating', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  vendor_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rating: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'vendor_ratings',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'vendor_id']
    }
  ]
});

module.exports = VendorRating;
