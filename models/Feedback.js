// models/Feedback.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { isEmail: true }
  },
  subject: {
    type: DataTypes.STRING(250),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new','in_progress','resolved'),
    defaultValue: 'new'
  }
}, {
  tableName: 'help_feedback',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Feedback;
