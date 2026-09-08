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

// ROUTES UNPROTECTED
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, "signup.html"));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "about.html"));
});

app.get('/service', (req, res) => {
    res.sendFile(path.join(__dirname, "service.html"));
});

// ROUTE FOR LOGIN AUTHENTICATION
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = findUserByEmail(email);

    if (!user) return res.status(401).send('Invalid email or password.');
    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordsMatch) return res.status(401).send('Invalid email or password.');

    req.session.user = {
      userID: user.userID,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    if (user.role === 'patient') return res.redirect('/patient/account');
    if (user.role === 'staff') return res.redirect('/staff/account');
    if (user.role === 'provider') return res.redirect('/provider/account');
    if (user.role === 'clinic administrator') return res.redirect('/admin/account');
  
    res.redirect('/');
  });


//ROUTE FOR SIGNUP FORM
app.post('/signup', async (req, res) => {
    const { email, password, firstName, lastName, role } = req.body;
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).send('An account with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(password, 12);
    createUser({email, passwordHash, firstName, lastName, role});
    res.redirect('/pages/login.html');
  });


// set external port for express server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});