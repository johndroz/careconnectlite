const db = require('../db/database');

function createIntake({
  appointmentID,
  patientID,
  appointmentReason,
  symptoms,
  patientComments
}) {
  const stmt = db.prepare(`
    INSERT INTO IntakeForms (
      appointmentID,
      patientID,
      appointmentReason,
      symptoms,
      patientComments
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    appointmentID,
    patientID,
    appointmentReason,
    symptoms,
    patientComments
  );

  return result.lastInsertRowid;
}

function deleteIntakeByFormId(formID) {
  const stmt = db.prepare(`
    DELETE FROM IntakeForms
    WHERE formID = ?
  `);

  const result = stmt.run(formID);
  return result.changes;
}

function findIntakesByPatient(patientID) {
  const stmt = db.prepare(`
    SELECT *
    FROM IntakeForms
    WHERE patientID = ?
    ORDER BY formID DESC
  `);

  return stmt.all(patientID);
}

function findIntakeByAppointment(appointmentID) {
  const stmt = db.prepare(`
    SELECT *
    FROM IntakeForms
    WHERE appointmentID = ?
  `);

  return stmt.get(appointmentID);
}

function findIntakeByFormId(formID) {
  const stmt = db.prepare(`
    SELECT *
    FROM IntakeForms
    WHERE formID = ?
  `);

  return stmt.get(formID);
}

module.exports = {
  createIntake,
  deleteIntakeByFormId,
  findIntakesByPatient,
  findIntakeByAppointment,
  findIntakeByFormId
};