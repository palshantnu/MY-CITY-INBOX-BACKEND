const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const StateCity = sequelize.define('StateCity', {
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'state_and_city',
  timestamps: false
});

module.exports = StateCity;
