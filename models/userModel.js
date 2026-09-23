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

function findUsersByRole(roleName) {
  const stmt = db.prepare(`
    SELECT userID, email, firstName, lastName, roleID, roleName
    FROM Users JOIN Roles ON Users.roleID = Roles.roleID
    WHERE userID = ?
  `);
  return stmt.all(roleName);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};