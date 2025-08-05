const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Category = require('./Category');

const Subcategory = sequelize.define('Subcategory', {
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
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
  }
}, {
  tableName: 'subcategories',
  timestamps: false
});
Subcategory.belongsTo(Category, { foreignKey: 'category_id', as: 'Category' });
Category.hasMany(Subcategory, { foreignKey: 'category_id', as: 'Subcategories' });
module.exports = Subcategory;
