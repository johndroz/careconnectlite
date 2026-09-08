const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const { createUser, findUserByEmail } = require('./models/userModel');


//settings for the express server
require("dotenv").config();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  }));

// routes for navigation - unprotected
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, "signup.html"));
});

// route for authetication 
app.post('/login', (req, res) => {
    //CODE FOR AUTHETICATION OF USER
});

app.get('/register', (req, res) => {
    //CODE FOR AUTHETICATION OF USER
});

// routes for navigation - protected
app.get('/staff', (req, res) => {
    res.sendFile(path.join(__dirname, "staff.html"));
});

app.get('/patient', (req, res) => {
    res.sendFile(path.join(__dirname, "patient.html"));
});


// set external port for express server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});