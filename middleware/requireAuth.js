function requireAuth(req, res, next) {
    if (!req.session || !req.session.user) {
      return res.redirect("/login?error=auth");
    }
    next();
  }
  
  module.exports = {
    requireAuth
  };