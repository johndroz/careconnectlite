const db = require('../db/database');
const appointmentStausModel = require('../models/appointmentStatusModel');
const {getDate, getNextWeekday} = require('../function');

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
  return stmt.get(appointmentID);
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

  function findAppointments({before = "9999-99-99 99:99:99", after = "0000-00-00 00:00:00"} = {}){
    const stmt = db.prepare(`
      SELECT * 
      FROM Appointments
      WHERE datetime < ? AND datetime > ?
    `);
    return stmt.all(before, after);
  }

  function findLastAppointmentDate() {
    const stmt = db.prepare(`
      SELECT datetime
      FROM Appointments
      ORDER BY datetime DESC
      LIMIT 1
    `);
  
    return stmt.get();
  }

  function sendConfirmation(appointmentID){
    const stmt = db.prepare(`
      UPDATE Appointments
      SET confirmationRequested = 1
      WHERE appointmentID = ?
    `);

    const result = stmt.run(appointmentID);
    return result.changes;
  }

  function receiveIntake(appointmentID){
    const stmt = db.prepare(`
      UPDATE Appointments
      SET intakeSubmitted = 1
      WHERE appointmentID = ?
    `);

    const result = stmt.run(appointmentID);
    return result.changes;
  }

  function assignProvider({providerID, appointmentID}){
    const stmt = db.prepare(`
      UPDATE Appointments
      SET providerID = ?
      WHERE appointmentID = ?
    `);

    const result = stmt.run(providerID, appointmentID);
    return result.changes;
  }

  function assignPatient({patientID, appointmentID}){
    const stmt = db.prepare(`
      UPDATE Appointments
      SET patientID = ?
      WHERE appointmentID = ?
    `);

    const result = stmt.run(patientID, appointmentID);
    return result.changes;
  }

  function createAvailableAppointmentsForDays(numberOfDays) {
    const slotTimes = [
      '08:00:00',
      '08:30:00',
      '09:00:00',
      '09:30:00',
      '10:00:00',
      '10:00:00',
      '10:00:00',
      '10:30:00',
      '11:00:00',
      '11:30:00',
      '12:00:00',
      '12:30:00',
      '13:00:00',
      '13:30:00',
      '14:00:00',
      '14:30:00',
      '15:00:00',
      '15:30:00',
      '16:00:00',
      '16:30:00',
      '17:00:00'
    ];
  
    const createSlots = db.transaction(() => {
      let createdCount = 0;
  
      const lastAppointment = findLastAppointmentDate();
  
      const baseDate = lastAppointment
        ? new Date(`${lastAppointment.datetime.split(' ')[0]}T12:00:00`)
        : new Date();
  
      const startDate = getNextWeekday(baseDate);
      const statusDateTime = getDate();
  
      for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
  
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
  
        for (const slotTime of slotTimes) {
          const appointmentDateTime = `${formattedDate} ${slotTime}`;
          const appointmentID = createAppointment(appointmentDateTime);
          insertStatus.run(appointmentID, statusDateTime);
          appointmentStausModel.createAppointmentStatus(appointmentID, "Available", statusDateTime);
          createdCount++;
        }
      }
      return createdCount;
    });
    return createSlots();
  }

module.exports = {
    createAppointment,
    findAppointmentsById,
    findAppointmentsByPatient,
    findAppointmentsByProvider,
    findAppointmentsByDate,
    findAppointments,
    sendConfirmation,
    receiveIntake,
    assignProvider,
    assignPatient,
    findLastAppointmentDate,
    createAvailableAppointmentsForDays
};