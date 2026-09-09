const db = require('../db/database');

function createAppointment({datetime}) {
  const stmt = db.prepare(`
    INSERT INTO Appointments (datetime)
    VALUES (?)
  `);
  const result = stmt.run(datetime);
  return result.lastInsertRowid;
}

function findAppointmentById(appointmentID) {
  const stmt = db.prepare(`
    SELECT *
    FROM Appointments
    WHERE appointmentID = ?
  `);
  return stmt.get(appointmentID);
}

function findAppointmentsByPatient(patientID) {
    const stmt = db.prepare(`
      SELECT *
      FROM Appointments
      WHERE patientID = ?
    `);
    return stmt.get(patientID);
  }

  function findAppointmentsByProvider(providerID) {
    const stmt = db.prepare(`
      SELECT *
      FROM Appointments
      WHERE providerID = ?
    `);
    return stmt.get(providerID);
  }

module.exports = {
    createAppointment,
    findAppointmentById,
    findAppointmentsByPatient,
    findAppointmentsByProvider
};