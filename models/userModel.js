const db = require('../db/database');

function createUser({ email, passwordHash, firstName, lastName, roleID }) {
  const stmt = db.prepare(`
    INSERT INTO Users (email, passwordHash, firstName, lastName, roleID)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(email, passwordHash, firstName, lastName, roleID);
  return result.lastInsertRowid;
}

function findUserByEmail(email) {
  const stmt = db.prepare(`
    SELECT * FROM Users
    WHERE email = ?
  `);
  return stmt.get(email);
}

function findUserById(userID) {
  const stmt = db.prepare(`
    SELECT userID, email, firstName, lastName, roleID
    FROM Users
    WHERE userID = ?
  `);
  return stmt.get(userID);
}

function findUsersByRole(roleName = null) {
  roleName = roleName || null;
  const stmt = db.prepare(`
    SELECT u.userID, u.email, u.firstName, u.lastName, u.roleID, r.roleName
    FROM Users u JOIN Roles r ON u.roleID = r.roleID
    WHERE (? IS NULL OR r.roleName = ?)
  `);
  return stmt.all(roleName, roleName);
}

function updateUserRole(userID, roleID){
  const stmt = db.prepare(`
    UPDATE Users
    SET roleID = ?
    WHERE userID = ?
    `);
    
    const result = stmt.run(roleID, userID);
    return result.changes;
}

function updateUserStatus(userID, status){
  const stmt = db.prepare(`
    UPDATE Users
    SET isActive = ?
    WHERE userID = ?
    `);

    const result = stmt.run(status, userID);
    return result.changes;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  findUsersByRole
};