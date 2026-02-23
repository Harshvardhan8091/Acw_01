// routes/adminRoutes.js
// Admin panel routes — protected by ensureAuth + isAdmin middleware

const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const isAdmin = require('../middleware/isAdmin');
const passport = require('passport');

// ─────────────────────────────────────────────
// MIDDLEWARE: Ensure user is authenticated
// ─────────────────────────────────────────────
function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    req.flash('error', 'Please login to access this page.');
    res.redirect('/login');
}

// ─────────────────────────────────────────────
// GET /admin → show all pending confessions
// ─────────────────────────────────────────────
router.get('/admin', ensureAuth, isAdmin, async (req, res) => {
    try {
        const pending = await Confession.find({ status: 'pending' }).sort({ createdAt: -1 });
        res.render('admin', {
            user: req.user,
            confessions: pending,
            success: req.flash('success'),
            error: req.flash('error'),
            isAdmin: true
        });
    } catch (err) {
        console.error('Error loading admin panel:', err);
        req.flash('error', 'Failed to load admin panel.');
        res.redirect('/');
    }
});

// ─────────────────────────────────────────────
// POST /admin/:id/approve → approve a confession
// ─────────────────────────────────────────────
router.post('/admin/:id/approve', ensureAuth, isAdmin, async (req, res) => {
    try {
        await Confession.findByIdAndUpdate(req.params.id, { status: 'approved' });
        req.flash('success', 'Confession approved and published.');
    } catch (err) {
        console.error('Error approving confession:', err);
        req.flash('error', 'Failed to approve confession.');
    }
    res.redirect('/admin');
});

// ─────────────────────────────────────────────
// POST /admin/:id/reject → reject a confession
// ─────────────────────────────────────────────
router.post('/admin/:id/reject', ensureAuth, isAdmin, async (req, res) => {
    try {
        await Confession.findByIdAndUpdate(req.params.id, { status: 'rejected' });
        req.flash('success', 'Confession rejected.');
    } catch (err) {
        console.error('Error rejecting confession:', err);
        req.flash('error', 'Failed to reject confession.');
    }
    res.redirect('/admin');
});

module.exports = router;
