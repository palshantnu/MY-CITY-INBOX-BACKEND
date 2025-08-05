// scripts/createSuperAdmin.js
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
const sequelize = require('./config/db');

async function createSuperAdmin() {
  try {
    await sequelize.sync(); // Ensure tables exist

    const hashedPassword = await bcrypt.hash('12345678', 10);

    const admin = await Admin.create({
      role: 'super_admin',
      name: 'Main Admin',
      email: 'admin@gmail.com',
      mobile: '9999999999',
      password: hashedPassword
    });

    console.log('Super Admin Created:', admin.toJSON());
    process.exit();
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
