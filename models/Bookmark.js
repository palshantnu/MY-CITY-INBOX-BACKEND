const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Bookmark = sequelize.define('Bookmark', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    vendor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'bookmarks',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'vendor_id'],
        }
    ]
});

Bookmark.associate = function (models) {
    Bookmark.belongsTo(models.User, { foreignKey: 'user_id' });
    Bookmark.belongsTo(models.Vendor, { foreignKey: 'vendor_id' });
};

module.exports = Bookmark;

