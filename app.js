const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { requireAuth } = require('./middleware/requireAuth');
const { requireRole } = require('./middleware/requireRole');
const appointmentModel = require("./models/appointmentModel");
const userModel = require('./models/userModel');
const roleModel = require('./models/roleModel');
const appointmentStatusModel = require('./models/appointmentStatusModel');


//settings for the express server
const app = express();
require("dotenv").config();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));

// ROUTES UNPROTECTED
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/login', (req, res) => {
    //check if user is logged in.
    if(req.session && req.session.user){
        const role = req.session.user.role;
        if(role == "Patient") return res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
        else if (role === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-account.html"));
    }
    
    res.sendFile(path.join(__dirname, "pages/login.html"));
});

app.get('/signup', (req, res) => {
    //check if user is logged in.
    if(req.session && req.session.user){
        const role = req.session.user.role;
        if(role == "Patient") return res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
        else if (role === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-account.html"));
    }
    res.sendFile(path.join(__dirname, "pages/signup.html"));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "pages/about.html"));
});

app.get('/service', (req, res) => {
    res.sendFile(path.join(__dirname, "pages/service.html"));
});

//LOGGING OUT
app.post("/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).send("Could not log out");
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });

// ROUTE FOR LOGIN AUTHENTICATION
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = userModel.findUserByEmail(email);
    //send error as query parameters for failed logins to display to user
    if (!user) {
        return res.redirect("/login?error=user")
    } 
    //get roleName from roleID
    const role = await roleModel.findRole(user.roleID);

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordsMatch){
        return res.redirect("/login?error=invalid")
    }
    //create session for successful login
    req.session.user = {
      userID: user.userID,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: role.roleName
    };
    //redirect user based on role
    if (role.roleName === 'Patient') return res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
    else if (role.roleName === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-account.html"));
    else res.redirect("/")
  });

//ROUTE FOR SIGNUP FORM
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName} = req.body;
    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.redirect("/signup?error=user")
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await userModel.createUser({email, passwordHash, firstName, lastName, roleID:1});
    res.redirect('/login?signup=confirmed');
  });

//ROUTES PROTECTED
//PATIENT ROUTES
app.use("/patients", requireAuth);
app.get("/patients/appointments", (req, res)=>{
    const appointments = appointmentModel.findAppointmentsByPatient(req.session.user.userID);
    appointments.forEach(appointment => {
        let currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        appointment.currentStatus = currentStatus.status;
    });
    appointments.reverse();
    const user = userModel.findUserById(req.session.user.userID);
    res.json({
        success: true,
        appointments,
        user
    });
});

//STAFF ROUTES
app.use("/staff", requireAuth, requireRole("Staff", "Provider", "Clinic Administrator"));
app.get("/staff/account", (req, res)=>{
    //get appointments from today
    const today = new Date().toISOString().split('T')[0];
    const appointments = appointmentModel.findAppointmentsByDate(today);
    appointments.forEach(appointment => {
        let currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        appointment.currentStatus = currentStatus.status;
    });
    appointments.reverse();
    const user = userModel.findUserById(req.session.user.userID);
    res.json({
        success: true,
        appointments,
        user
    });
});

app.get("/staff/appointments", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/staff/staff-appointments.html"));
});

app.get("/staff/appointments/search", (req, res) =>{
    const appointments = appointmentModel.findAppointments();
    appointments.forEach(appointment => {
        const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        const patient = userModel.findUserById(appointment.patientID);
        const provider = userModel.findUserById(appointment.providerID);
        const [date, time] = appointment.datetime.split(' ');
        appointment.currentStatus = currentStatus.status;
        if(patient){
            appointment.patientFirstName = `${patient.firstName}`;
            appointment.patientLastName = `${patient.lastName}`;
        } else {
            appointment.patientFirstName = "Not Booked";
            appointment.patientLastName = "";
        }
        if(provider){
            appointment.providerFirstName = `${provider.firstName}`;
            appointment.providerLastName = `${provider.lastName}`;
        } else {
            appointment.providerFirstName = "Not Assigned";
            appointment.providerLastName = "";
        }
        appointment.date = date;
        appointment.time = time;
    });
    appointments.reverse();
    const user = userModel.findUserById(req.session.user.userID);
    res.json({
        success: true,
        appointments,
        user
    });
});


// set external port for express server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});