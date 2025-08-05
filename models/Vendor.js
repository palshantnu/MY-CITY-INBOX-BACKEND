// models/Vendor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');
const Subcategory = require('./Subcategory');

const Vendor = sequelize.define('Vendor', {
  shop_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  contact_number: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  facilities: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.ENUM('admin', 'sales_executive', 'self'),
    defaultValue: 'self'
  },
  images: {
    type: DataTypes.JSON,  // Stores array like ["1.jpg", "2.png"]
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'vendors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

Vendor.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Vendor.belongsTo(Subcategory, { foreignKey: 'subcategory_id', as: 'subcategory' });
Vendor.belongsTo(require('./SalesExecutive'), {
  foreignKey: 'sales_executive_id',
  as: 'sales_executive'
});
module.exports = Vendor;
