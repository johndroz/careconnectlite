function requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.session || !req.session.user) {
        return res.redirect("/login?error=auth");
      }
      const userRole = req.session.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).send("Access denied");
      }
      next();
    };
  }
  
  module.exports = {
    requireRole
  };