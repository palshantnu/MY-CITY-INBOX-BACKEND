const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Slider = sequelize.define('Slider', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  image_path: { type: DataTypes.STRING, allowNull: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'app_sliders',
  timestamps: false
});

module.exports = Slider;
