const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const PageContent = sequelize.define('PageContent', {
  key: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false, // 'about', 'terms', 'privacy'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
}, {
  tableName: 'page_contents',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = PageContent;
