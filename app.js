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
app.use(express.json());
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
        else if (role === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-today.html"));
    }
    
    res.sendFile(path.join(__dirname, "pages/login.html"));
});

app.get('/signup', (req, res) => {
    //check if user is logged in.
    if(req.session && req.session.user){
        const role = req.session.user.role;
        if(role == "Patient") return res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
        else if (role === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-today.html"));
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
    else if (role.roleName === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-today.html"));
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
app.get("/patients/account", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
});
app.get("/patients/appointments", (req, res)=>{
    const appointments = appointmentModel.findAppointmentsByPatient(req.session.user.userID);
    //add current status to each appointment
    appointments.forEach(appointment => {
        let currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        appointment.currentStatus = currentStatus.status;
    });
    //reverse so recent appointments display first
    appointments.reverse();
    const user = userModel.findUserById(req.session.user.userID);
    res.json({
        success: true,
        appointments,
        user
    });
});
app.get("/patients/appointments/details", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/patients/patients-appointments-details.html"));
});
app.get("/patients/appointments/details/search", (req, res) =>{
    const appointmentID = req.query.ID
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;
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
        const user = userModel.findUserById(req.session.user.userID);
        res.json({
            success: true,
            appointment,
            user
        });

});
app.post("/patients/appointments/confirmation", (req, res) =>{
    const appointmentID = req.body.ID;
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const data = {success: false, message: "Unable to confirm"};

    //get current date in format (yyyy-mm-dd hh:mm:ss)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;
    if(appointment.currentStatus == "Booked"){
        try{
            const confirmedStatus = appointmentStatusModel.createAppointmentStatus({appointmentID: appointmentID, status: "Confirmed", datetime: formattedDate});
            if(confirmedStatus){
                data.success = true;
                data.message = "Appointment has been confirmed."
            }
        } catch(err){
            console.log(err)
        }
    }
    res.json(data);
})

//STAFF ROUTES
app.use("/staff", requireAuth, requireRole("Staff", "Provider", "Clinic Administrator"));
app.get("/staff/daily", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-today.html"));
});
app.get("/staff/appointments/today", (req, res)=>{
    //get appointments from today
    const today = new Date().toLocaleDateString('en-CA');
    const appointments = appointmentModel.findAppointmentsByDate(today);
    //add current status to each appointment
    appointments.forEach(appointment => {
        let currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        appointment.currentStatus = currentStatus.status;
    });
    //reverse so recent appointments display first
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

app.get("/staff/appointments/details", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-details.html"));
});
app.get("/staff/appointments/details/search", (req, res) =>{
    const appointmentID = req.query.ID
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;
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
        const user = userModel.findUserById(req.session.user.userID);
        res.json({
            success: true,
            appointment,
            user
        });

});

app.post("/staff/appointments/requestConfirmation", (req, res) =>{
    const appointmentID = req.body.ID;
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const data = {success: false, message: "Unable to send confirmation"};
    if(appointment.confirmationRequested == 0){
        try{
            const changes = appointmentModel.sendConfirmation(appointmentID);
            if(changes > 0){
                data.success = true;
                data.message = "Confirmation request has been sent."
            }
        } catch(err){
            console.log(err)
        }
        
    }
    res.json(data);
});

app.post("/staff/appointments/updateStatus", (req, res) =>{
    data = {success: false, message: "Unable to update status."}
    const statusForm = req.body;
    const appointment = appointmentModel.findAppointmentsById(statusForm.ID);

    //get current date in format (yyyy-mm-dd hh:mm:ss)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    if(appointment){
        try{
            appointmentStatusModel.createAppointmentStatus({appointmentID: appointment.appointmentID, status: statusForm.appointmentStatus, datetime: formattedDate});
            data.success = true;
            data.message = "Appointment status has been successfully added."
        }
        catch(err){
            console.log(err);
        }
    }
    res.redirect(`/staff/appointments/details?ID=${appointment.appointmentID}&update=${data.success}`);
});

// set external port for express server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});