const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,      // ✅ Add image column
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // lowest priority if not set
  }
}, {
  tableName: 'categories',
  timestamps: false
});

module.exports = Category;
