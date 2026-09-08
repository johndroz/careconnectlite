-- foreign keys must be enabled in sqlite
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Roles (
  roleID INTEGER PRIMARY KEY AUTOINCREMENT,
  roleName TEXT NOT NULL UNIQUE CHECK (roleName IN ('Patient', 'Staff', 'Provider', 'Clinic Administrator')),
  viewAppointmentsSelf INTEGER NOT NULL DEFAULT 0 CHECK (viewAppointmentsSelf IN (0, 1)),
  viewAppointmentsOthers INTEGER NOT NULL DEFAULT 0 CHECK (viewAppointmentsOthers IN (0, 1)),
  viewIntakes INTEGER NOT NULL DEFAULT 0 CHECK (viewIntakes IN (0, 1)),
  viewReports INTEGER NOT NULL DEFAULT 0 CHECK (viewReports IN (0, 1)),
  editUsers INTEGER NOT NULL DEFAULT 0 CHECK (editUsers IN (0, 1))
);

CREATE TABLE IF NOT EXISTS Users (
  userID INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  roleID INTEGER NOT NULL,
  FOREIGN KEY (roleID) REFERENCES Roles(roleID)
);

CREATE TABLE IF NOT EXISTS Appointments (
  appointmentID INTEGER PRIMARY KEY AUTOINCREMENT,
  patientID INTEGER,
  providerID INTEGER NOT NULL,
  datetime TEXT NOT NULL,
  appointmentType TEXT NOT NULL CHECK (appointmentType IN ('Virtual', 'In-person')),
  FOREIGN KEY (patientID) REFERENCES Users(userID),
  FOREIGN KEY (providerID) REFERENCES Users(userID)
);

CREATE TABLE IF NOT EXISTS IntakeForms (
  formID INTEGER PRIMARY KEY AUTOINCREMENT,
  appointmentID INTEGER NOT NULL UNIQUE,
  patientDOB TEXT NOT NULL,
  patientGender TEXT NOT NULL CHECK (patientGender IN ('M', 'F', 'NB')),
  appointmentReason TEXT NOT NULL CHECK (
    appointmentReason IN (
      'Wellness Exam',
      'Follow-up Visit',
      'New Patient Consultation',
      'Sick Visit',
      'Chronic Disease Management',
      'Medication Management',
      'Preventative Screening / Lab Work'
    )
  ),
  symptoms TEXT CHECK (length(symptoms) <= 100),
  patientComments TEXT CHECK (length(patientComments) <= 250),
  FOREIGN KEY (appointmentID) REFERENCES Appointments(appointmentID)
);

CREATE TABLE IF NOT EXISTS AppointmentStatuses (
  statusID INTEGER PRIMARY KEY AUTOINCREMENT,
  appointmentID INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'Available',
      'Booked',
      'Confirmed',
      'Checked in',
      'Cancelled',
      'No Show',
      'Completed'
    )
  ),
  datetime TEXT NOT NULL,
  FOREIGN KEY (appointmentID) REFERENCES Appointments(appointmentID)
);

CREATE TABLE IF NOT EXISTS ActivityLog (
  eventID INTEGER PRIMARY KEY AUTOINCREMENT,
  userID INTEGER NOT NULL,
  eventType TEXT NOT NULL,
  datetime TEXT NOT NULL,
  FOREIGN KEY (userID) REFERENCES Users(userID)
);