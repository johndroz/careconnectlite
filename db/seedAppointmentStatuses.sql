BEGIN TRANSACTION;

INSERT INTO AppointmentStatuses (appointmentID, status, datetime)
SELECT appointmentID, 'Available', '2026-09-09 08:00:00'
FROM Appointments
WHERE datetime IN (
  '2026-09-10 09:00:00',
  '2026-09-10 10:00:00',
  '2026-09-10 11:00:00',
  '2026-09-11 09:00:00',
  '2026-09-11 10:00:00',
  '2026-09-11 11:00:00',
  '2026-09-14 09:00:00',
  '2026-09-14 10:00:00',
  '2026-09-14 11:00:00',
  '2026-09-15 09:00:00',
  '2026-09-15 10:00:00',
  '2026-09-15 11:00:00',
  '2026-09-16 09:00:00',
  '2026-09-16 10:00:00',
  '2026-09-16 11:00:00',
  '2026-09-17 09:00:00',
  '2026-09-17 10:00:00',
  '2026-09-18 09:00:00',
  '2026-09-18 10:00:00',
  '2026-09-21 09:00:00'
);

INSERT INTO AppointmentStatuses (appointmentID, status, datetime)
SELECT appointmentID, 'Cancelled', '2026-09-18 08:00:00'
FROM Appointments
WHERE patientID = 1
  AND datetime = '2026-09-18 09:00:00';

INSERT INTO AppointmentStatuses (appointmentID, status, datetime)
SELECT appointmentID, 'No Show', '2026-09-18 10:15:00'
FROM Appointments
WHERE patientID = 1
  AND datetime = '2026-09-18 10:00:00';

INSERT INTO AppointmentStatuses (appointmentID, status, datetime)
SELECT appointmentID, 'Booked', '2026-09-19 12:00:00'
FROM Appointments
WHERE patientID = 1
  AND datetime = '2026-09-21 09:00:00';

COMMIT;
