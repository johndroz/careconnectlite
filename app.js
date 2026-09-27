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
const intakeModel = require('./models/intakeModel');
const {getDate, getNextWeekday} = require('./function')


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
        else if (role === 'Provider') return res.sendFile(path.join(__dirname, "pages/providers/providers-appointments-today.html"));
        else if (role === 'Clinic Administrator') return res.sendFile(path.join(__dirname, "pages/admins/admins-appointments-today.html"));
    }
    
    res.sendFile(path.join(__dirname, "pages/login.html"));
});

app.get('/signup', (req, res) => {
    //check if user is logged in.
    if(req.session && req.session.user){
        const role = req.session.user.role;
        if(role == "Patient") return res.sendFile(path.join(__dirname, "pages/patients/patient-account.html"));
        else if (role === 'Staff') return res.sendFile(path.join(__dirname, "pages/staff/staff-appointments-today.html"));
        else if (role === 'Provider') return res.sendFile(path.join(__dirname, "pages/providers/providers-appointments-today.html"));
        else if (role === 'Clinic Administrator') return res.sendFile(path.join(__dirname, "pages/admins/admins-appointments-today.html"));
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
    if (!user || user.isActive == 0) {
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
    else if (role.roleName === 'Provider') return res.sendFile(path.join(__dirname, "pages/providers/providers-appointments-today.html"));
    else if (role.roleName === 'Clinic Administrator') return res.sendFile(path.join(__dirname, "pages/admins/admins-appointments-today.html"));
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
    const formattedDate = getDate();

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
});
app.post("/patients/intake/create", (req, res) =>{
    const data = {success: false, message: "Intake was not submitted."};
    const intake = req.body;
    const appointmentID = intake.appointmentID;
    const patientID = req.session.user.userID;
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;

    if(appointment.currentStatus == "Confirmed" && appointment.intakeSubmitted == 0 && appointment.patientID == patientID){
        try{
            const changes = appointmentModel.receiveIntake(appointmentID);
            const formID = intakeModel.createIntake({
                appointmentID: appointmentID,
                patientID: patientID,
                appointmentReason: intake.appointmentReason,
                symptoms: intake.symptoms,
                patientComments: intake.patientComments
            });
            if(changes > 0 && formID){
                res.redirect(`/patients/appointments/details?ID=${intake.appointmentID}&intakeSubmitted=true`);
            }
        } catch(err){
            console.log(err)
            res.redirect(`/patients/appointments/details?ID=${intake.appointmentID}&intakeSubmitted=false`);
        }
    }
});
app.get("/patients/schedule", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/patients/patient-schedule.html"));
});
app.get("/patients/schedule/search", (req, res) =>{
    try{
        const user = req.session.user;
        const appointments = appointmentModel.findAppointments({after: getDate()});
        const availableAppointments = [];
        appointments.forEach(appointment =>{
            const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
            appointment.currentStatus = currentStatus.status;
            if(appointment.currentStatus == "Available") availableAppointments.push(appointment);
        });
        res.json({
            success: true,
            availableAppointments,
            user
        });
    }
    catch(err){
        console.log(err);
        res.json({
            success: false
        });
    }
});
app.post("/patients/appointments/book", (req, res) =>{
    const appointmentID = req.body.appointmentID;
    const userID = req.body.userID;

    try{
        const appointment = appointmentModel.findAppointmentsById(appointmentID);
        const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
        const user = userModel.findUserById(userID);
        const patientStatus = user.isActive;
        if(currentStatus.status == "Available" && !appointment.patientID && patientStatus == 1){
            const changes = appointmentModel.assignPatient(userID, appointmentID);
            if(changes > 0){
                res.json({
                    success: true,
                    message: "Appointment successfully booked."
                });
            }
        }

    } catch(err){
        console.log(err);
        res.json({
            success: true,
            message: "Appointment successfully booked."
        });
    }
});



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
    const formattedDate = getDate();

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

//PROVIDER ROUTES
app.use("/providers", requireAuth, requireRole("Provider", "Clinic Administrator"));
app.get("/providers/daily", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/providers/providers-appointments-today.html"));
});
app.get("/providers/appointments/today", (req, res)=>{
    //get appointments from today
    const today = new Date().toLocaleDateString('en-CA');
    const appointments = appointmentModel.findAppointmentsByDate(today);
    const confirmedAppointments = [];
    //add current status to each appointment and find confirmed appointments
    appointments.forEach(appointment => {
        let currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointment.appointmentID);
        appointment.currentStatus = currentStatus.status;
        if (appointment.currentStatus == "Confirmed") confirmedAppointments.push(appointment);
    });
    //reverse so recent appointments display first
    appointments.reverse();
    const user = userModel.findUserById(req.session.user.userID);
    res.json({
        success: true,
        confirmedAppointments,
        user
    });
});
app.get("/providers/appointments", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/providers/providers-appointments.html"));
});

app.get("/providers/appointments/search", (req, res) =>{
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
app.get("/providers/appointments/details", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/providers/providers-appointments-details.html"));
});
app.get("/providers/appointments/details/search", (req, res) =>{
    const appointmentID = req.query.ID
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;
    const patient = userModel.findUserById(appointment.patientID);
    const provider = userModel.findUserById(appointment.providerID);
    const [date, time] = appointment.datetime.split(' ');
    const intake = intakeModel.findIntakeByAppointment(appointmentID);
    const allProviders = userModel.findUsersByRole("Provider");
    const providers = allProviders.filter(provider =>{
        return (provider.isActive == 1)
    })

    appointment.intake = intake;
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
        user,
        providers
    });

});
app.post("/providers/appointments/updateStatus", (req, res) =>{
    data = {success: false, message: "Unable to update status."}
    const statusForm = req.body;
    const appointment = appointmentModel.findAppointmentsById(statusForm.ID);
    const formattedDate = getDate();

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
    res.redirect(`/providers/appointments/details?ID=${appointment.appointmentID}&update=${data.success}`);
});
app.get("/providers/intake", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/providers/intake.html"));
});
app.get("/providers/intake/search", (req, res) =>{
    const formID = req.query.formID;
    const intake = intakeModel.findIntakeByFormId(formID)
    const user = userModel.findUserById(req.session.user.userID);
    const appointment = appointmentModel.findAppointmentsById(intake.appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(intake.appointmentID);
    appointment.currentStatus = currentStatus.status;

    res.json({
        success: true,
        intake,
        user,
        appointment
    });
});
app.post("/providers/appointments/assign", (req, res) =>{
    const providerID = req.body.assignedProvider;
    const appointmentID = req.body.ID;
    try{
        const appointment = appointmentModel.findAppointmentsById(appointmentID);
        const conflicts = appointmentModel.findAppointmentsByProvider(providerID, appointment.datetime);
        if(conflicts){
            res.redirect(`/providers/appointments/details?ID=${appointmentID}&conflict=true`);
        }
        const changes = appointmentModel.assignProvider({providerID: providerID, appointmentID: appointmentID});
        if(changes > 0){
            res.redirect(`/providers/appointments/details?ID=${appointmentID}&update=true`);
        }
    } catch (err){
        console.log(err);
        res.redirect(`/providers/appointments/details?ID=${appointmentID}&update=false`);
    }

});


//ADMINISTRATOR ROUTES
app.use("/admins", requireAuth, requireRole("Clinic Administrator"));
app.get("/admins/daily", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/admins-appointments-today.html"));
});
app.get("/admins/appointments/today", (req, res)=>{
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

app.get("/admins/appointments", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/admins-appointments.html"));
});

app.get("/admins/appointments/search", (req, res) =>{
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
app.get("/admins/appointments/details", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/admins-appointments-details.html"));
});
app.get("/admins/admins/details/search", (req, res) =>{
    const appointmentID = req.query.ID
    const appointment = appointmentModel.findAppointmentsById(appointmentID);
    const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(appointmentID);
    appointment.currentStatus = currentStatus.status;
    const patient = userModel.findUserById(appointment.patientID);
    const provider = userModel.findUserById(appointment.providerID);
    const [date, time] = appointment.datetime.split(' ');
    const intake = intakeModel.findIntakeByAppointment(appointmentID);
    const providers = userModel.findUsersByRole("Provider");

    appointment.intake = intake;
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
        user,
        providers
    });

});
app.post("/admins/admins/updateStatus", (req, res) =>{
    data = {success: false, message: "Unable to update status."}
    const statusForm = req.body;
    const appointment = appointmentModel.findAppointmentsById(statusForm.ID);
    const formattedDate = getDate();

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
    res.redirect(`/admins/appointments/details?ID=${appointment.appointmentID}&update=${data.success}`);
});
app.get("/admins/intake", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/intake.html"));
});
app.get("/admins/intake/search", (req, res) =>{
    const formID = req.query.formID;

    try{
        const intake = intakeModel.findIntakeByFormId(formID)
        const user = userModel.findUserById(req.session.user.userID);
        const appointment = appointmentModel.findAppointmentsById(intake.appointmentID);
        const currentStatus = appointmentStatusModel.findCurrentStatusByAppointmentId(intake.appointmentID);
        appointment.currentStatus = currentStatus.status;
        res.json({
            success: true,
            intake,
            user,
            appointment
        });
    } catch (err){
        console.log(err);
        res.json({
            success: false
        });
    }
});
app.post("/admins/appointments/assign", (req, res) =>{
    const providerID = req.body.assignedProvider;
    const appointmentID = req.body.ID;
    try{
        const appointment = appointmentModel.findAppointmentsById(appointmentID);
        const conflicts = appointmentModel.findAppointmentsByProvider(providerID, appointment.datetime);
        if(conflicts){
            res.redirect(`/admins/appointments/details?ID=${appointmentID}&conflict=true`);
        }
        const changes = appointmentModel.assignProvider({providerID: providerID, appointmentID: appointmentID});
        if(changes > 0){
            res.redirect(`/admins/appointments/details?ID=${appointmentID}&update=true`);
        }
    } catch (err){
        console.log(err);
        res.redirect(`/admins/appointments/details?ID=${appointmentID}&update=false`);
    }

});
app.get("/admins/users", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/admins-users.html"));
});
app.get("/admins/users/search", (req, res) =>{
    const user = req.session.user;
    try{
        const users = userModel.findUsersByRole();
        res.json({
            success: true,
            users,
            user
        });
    } catch (err) {
        console.log(err);
        res.json({
            success: false
        })
    }
});
app.get("/admins/users/details", (req, res) =>{
    res.sendFile(path.join(__dirname, "pages/admins/admins-users-details.html"));
});
app.get("/admins/users/details/search", (req, res) =>{
    const admin = req.session.user;
    const userID = req.query.ID;

    try{
        user = userModel.findUserById(userID);
        const role = roleModel.findRole(user.roleID);
        user.roleName = role.roleName;
        res.json({
            success: true,
            admin,
            user
        })
    } catch(err){
        console.log(err);
        res.json({
            success: false
        });
    }
});
app.post("/admins/users/status/update", (req, res) =>{
    const adminID = req.session.user.userID;
    const data = req.body.isActiveData;
    const userID = data.ID;
    const isActive = data.userIsActive;
    //check if admin is updating self
    if(adminID == userID) res.json({success: false});

    try{
        const changes = userModel.updateUserStatus(userID, isActive);
        if(changes > 0) {
            res.json({success: true});
        }
    } catch(err){
        console.log(err);
        res.json({success: false});
    }

});
app.post("/admins/users/role/update", (req, res) =>{
    const adminID = req.session.user.userID;
    const data = req.body.roleData;
    const userID = data.ID;
    const userRole = Number(data.userRole);
    //check if admin is updating self
    if(adminID == userID) res.json({success: false});

    try{
        const changes = userModel.updateUserRole(userID, userRole);
        if(changes > 0) {
            res.json({success: true});
        }
    } catch(err){
        console.log(err);
        res.json({success: false});
    }

});









// set external port for express server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});