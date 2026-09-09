const db = require('../db/database');

function createAppointmentStatus({ appointmentID, status, datetime }) {
  const stmt = db.prepare(`
    INSERT INTO AppointmentStatuses (appointmentID, status, datetime)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(appointmentID, status, datetime);
  return result.lastInsertRowid;
}

function findStatusById(statusID) {
  const stmt = db.prepare(`
    SELECT *
    FROM AppointmentStatuses
    WHERE statusID = ?
  `);

  return stmt.get(statusID);
}

function findStatusesByAppointmentId(appointmentID) {
  const stmt = db.prepare(`
    SELECT *
    FROM AppointmentStatuses
    WHERE appointmentID = ?
    ORDER BY datetime DESC
  `);

  return stmt.all(appointmentID);
}

function findCurrentStatusByAppointmentId(appointmentID) {
  const stmt = db.prepare(`
    SELECT *
    FROM AppointmentStatuses
    WHERE appointmentID = ?
    ORDER BY datetime DESC
    LIMIT 1
  `);

  return stmt.get(appointmentID);
}

function updateAppointmentStatus({ statusID, status, datetime }) {
  const stmt = db.prepare(`
    UPDATE AppointmentStatuses
    SET status = ?, datetime = ?
    WHERE statusID = ?
  `);

  return stmt.run(status, datetime, statusID);
}

function deleteAppointmentStatus(statusID) {
  const stmt = db.prepare(`
    DELETE FROM AppointmentStatuses
    WHERE statusID = ?
  `);

  return stmt.run(statusID);
}

module.exports = {
  createAppointmentStatus,
  findStatusById,
  findStatusesByAppointmentId,
  findCurrentStatusByAppointmentId,
  updateAppointmentStatus,
  deleteAppointmentStatus
};