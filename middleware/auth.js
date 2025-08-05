// middleware/auth.js
function requireAuth(req, res, next) {
    if (!req.session || !req.session.admin) {
      return res.redirect('/admin/login');  // Redirect to login if not logged in
    }
    next();
  }
  
  module.exports = requireAuth;
  