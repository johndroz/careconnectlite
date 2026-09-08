INSERT OR IGNORE INTO Roles (
  roleName,
  viewAppointmentsSelf,
  viewAppointmentsOthers,
  viewIntakes,
  viewReports,
  editUsers
)
VALUES
  ('Patient', 1, 0, 0, 0, 0),
  ('Staff', 1, 1, 0, 0, 0),
  ('Provider', 1, 1, 1, 0, 0),
  ('Clinic Administrator', 1, 1, 1, 1, 1);