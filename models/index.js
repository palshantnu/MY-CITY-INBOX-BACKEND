// models/index.js

const Bookmark = require('./Bookmark');
const Vendor = require('./Vendor');

// Define associations
Bookmark.belongsTo(Vendor, { foreignKey: 'vendor_id' });
Vendor.hasMany(Bookmark, { foreignKey: 'vendor_id' });

module.exports = { Bookmark, Vendor };
