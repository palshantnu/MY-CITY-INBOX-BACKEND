require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/db');
const User = require('./models/User'); // ensure model loads
require('./models/associations');
require('./models/index');

const PORT = process.env.PORT || 5001;



(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Connected');

    await sequelize.sync(); // sync models to DB

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error);
  }
})();
