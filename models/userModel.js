const db = require('../db/database');

function createUser({ email, passwordHash, firstName, lastName, role }) {
  const stmt = db.prepare(`
    INSERT INTO Users (email, passwordHash, firstName, lastName, role)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(email, passwordHash, firstName, lastName, role);
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
    SELECT userID, email, firstName, lastName, role
    FROM Users
    WHERE userID = ?
  `);
  return stmt.get(userID);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};