// models/Admin.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  role: {
    type: DataTypes.ENUM('super_admin', 'sub_admin'),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  mobile: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  allotted_section: {
    type: DataTypes.STRING,  // For sub_admin (can be NULL for super_admin)
    allowNull: true,
  }
}, {
  timestamps: true,
  tableName: 'admins',
  created_at: 'created_at',
  updatedAt: false
});

module.exports = Admin;
