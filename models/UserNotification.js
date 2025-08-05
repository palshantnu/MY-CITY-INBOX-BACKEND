const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');


const UserNotification = sequelize.define('UserNotification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    notification_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    seen_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'user_notifications',
    timestamps: false // or true if you want `createdAt`/`updatedAt` handled by Sequelize
});

UserNotification.associate = models => {
    UserNotification.belongsTo(models.Notification, { foreignKey: 'notification_id' });
    UserNotification.belongsTo(models.User, { foreignKey: 'user_id' });
};


module.exports = UserNotification;