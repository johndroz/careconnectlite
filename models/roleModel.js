function findRole(roleID) {
    const stmt = db.prepare(`
      SELECT roleName
      FROM Roles
      WHERE roleID = ?
    `);
    return stmt.get(roleID);
  }

  module.exports = {
    findRole
  };