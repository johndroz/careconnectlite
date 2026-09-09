const db = require('../db/database');

function createAppointment({datetime}) {
  const stmt = db.prepare(`
    INSERT INTO Appointments (datetime)
    VALUES (?)
  `);
  const result = stmt.run(datetime);
  return result.lastInsertRowid;
}

function findAppointmentsById(appointmentID) {
  const stmt = db.prepare(`
    SELECT *
    FROM Appointments
    WHERE appointmentID = ?
  `);
  return stmt.all(appointmentID);
}

function findAppointmentsByPatient(patientID) {
    const stmt = db.prepare(`
      SELECT *
      FROM Appointments
      WHERE patientID = ?
    `);
    return stmt.all(patientID);
  }

  function findAppointmentsByProvider(providerID) {
    const stmt = db.prepare(`
      SELECT *
      FROM Appointments
      WHERE providerID = ?
    `);
    return stmt.all(providerID);
  }

  function findAppointmentsByDate(date){
    const stmt = db.prepare(`
      SELECT * 
      FROM Appointments
      WHERE date(datetime) = ?
    `);
    return stmt.all(date);
  }

  function findAppointments(){
    const stmt = db.prepare(`
      SELECT * 
      FROM Appointments
    `);
    return stmt.all();
  }

module.exports = {
    createAppointment,
    findAppointmentsById,
    findAppointmentsByPatient,
    findAppointmentsByProvider,
    findAppointmentsByDate,
    findAppointments
};