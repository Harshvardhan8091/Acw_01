// app.js
// Main entry point for the Anonymous Confession Wall application

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const path = require('path');

// Initialize Express app
const app = express();

// ─────────────────────────────────────────────
// PASSPORT CONFIGURATION
// ─────────────────────────────────────────────
require('./config/passport')(passport);

// ─────────────────────────────────────────────
// TEMPLATE ENGINE
// ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─────────────────────────────────────────────
// MONGODB CONNECTION
// ─────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
        process.exit(1);
    });

// ─────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────

// Parse URL-encoded form data and JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Allow PUT and DELETE from HTML forms using _method query/body param
app.use(methodOverride('_method'));

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Express session configuration
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 1 day
        }
    })
);

// Initialize Passport and restore session auth state
app.use(passport.initialize());
app.use(passport.session());

// Flash messages middleware
app.use(flash());

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────
app.use('/', require('./routes/confessionRoutes'));
app.use('/', require('./routes/adminRoutes'));

// ─────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('index', {
        user: null,
        confessions: [],
        success: [],
        error: ['Page not found.']
    });
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).send('Something went wrong. Please try again later.');
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
