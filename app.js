const express = require('express');
const path = require('path');
const cors = require('cors');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const apiRoutes = require('./routes/apiRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// EJS and Layout setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'admin/views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Static files (SB Admin assets)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (must come before admin routes)
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Make admin data available to all EJS templates (must be before routes)
app.use((req, res, next) => {
  res.locals.admin = req.session.admin || null;
  next();
});

// Routes (after session + res.locals)
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

module.exports = app;
