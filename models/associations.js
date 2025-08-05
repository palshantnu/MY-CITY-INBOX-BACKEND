// models/associations.js
const User = require('./User');
const VendorRating = require('./VendorRating');

User.hasMany(VendorRating, { foreignKey: 'user_id' });
VendorRating.belongsTo(User, { foreignKey: 'user_id' });
