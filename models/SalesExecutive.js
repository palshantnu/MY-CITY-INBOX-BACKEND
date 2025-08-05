// models/SalesExecutive.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SalesExecutive = sequelize.define('SalesExecutive', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  document_title: {
    type: DataTypes.STRING,
    allowNull: false,   // e.g., 'Aadhar Card'
  },
  document_file: {
    type: DataTypes.STRING,
    allowNull: false,   // file path or name
  },
  bank_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bank_account_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bank_account_number: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  bank_ifsc: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  bank_passbook_img: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: { type: DataTypes.STRING(255), allowNull: false }, 
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
}, {
  timestamps: true,
  tableName: 'sales_executives',
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = SalesExecutive;
