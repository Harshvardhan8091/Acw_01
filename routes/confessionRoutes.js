// routes/confessionRoutes.js
// All REST routes for confessions + authentication routes

const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const passport = require('passport');

// ─────────────────────────────────────────────
// MIDDLEWARE: Ensure user is authenticated
// ─────────────────────────────────────────────
function ensureAuth(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please login with Google to post a confession.');
    res.redirect('/login');
}

// ─────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────

// GET /login → show login page
router.get('/login', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/');
    res.render('login', { error: req.flash('error') });
});

// GET /auth/google → start Google OAuth flow
router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /auth/google/callback → handle OAuth callback
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', failureFlash: true }),
    (req, res) => {
        req.flash('success', `Welcome, ${req.user.displayName}!`);
        res.redirect('/');
    }
);

// GET /logout → log user out
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) return next(err);
        req.flash('success', 'You have been logged out.');
        res.redirect('/');
    });
});

// ─────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────

// GET / → homepage: show all confessions
router.get('/', async (req, res) => {
    try {
        // Fetch all confessions sorted newest first
        const confessions = await Confession.find().sort({ createdAt: -1 });
        res.render('index', {
            user: req.user || null,
            confessions: confessions,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        console.error('Error fetching confessions:', err);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/');
    }
});

// ─────────────────────────────────────────────
// CONFESSION ROUTES
// ─────────────────────────────────────────────

// GET /confessions → redirect to homepage
router.get('/confessions', (req, res) => {
    res.redirect('/');
});

// POST /confessions → create a new confession (auth required)
router.post('/confessions', ensureAuth, async (req, res) => {
    try {
        const { text, secretCode } = req.body;

        // Basic validation
        if (!text || text.trim() === '') {
            req.flash('error', 'Confession text cannot be empty.');
            return res.redirect('/');
        }
        if (!secretCode || secretCode.length < 4) {
            req.flash('error', 'Secret code must be at least 4 characters long.');
            return res.redirect('/');
        }

        // Create and save the confession
        await Confession.create({
            text: text.trim(),
            secretCode: secretCode.trim(),
            userId: req.user.id
        });

        req.flash('success', 'Your confession has been posted anonymously!');
        res.redirect('/');
    } catch (err) {
        console.error('Error creating confession:', err);
        req.flash('error', err.message || 'Failed to post confession.');
        res.redirect('/');
    }
});

// ─────────────────────────────────────────────
// EDIT ROUTES
// ─────────────────────────────────────────────

// GET /edit/:id → show edit form (verify secret code first)
router.get('/edit/:id', async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id);
        if (!confession) {
            req.flash('error', 'Confession not found.');
            return res.redirect('/');
        }

        const { secretCode } = req.query;

        // Verify the secret code before showing the edit form
        if (!secretCode || secretCode !== confession.secretCode) {
            req.flash('error', 'Wrong secret code! You cannot edit this confession.');
            return res.redirect('/');
        }

        res.render('edit', {
            confession: confession,
            secretCode: secretCode,
            error: req.flash('error'),
            success: req.flash('success')
        });
    } catch (err) {
        console.error('Error loading edit page:', err);
        req.flash('error', 'Something went wrong.');
        res.redirect('/');
    }
});

// PUT /confessions/:id → update confession (verify secret code)
router.put('/confessions/:id', async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id);
        if (!confession) {
            req.flash('error', 'Confession not found.');
            return res.redirect('/');
        }

        const { secretCode, text } = req.body;

        // Verify secret code
        if (!secretCode || secretCode !== confession.secretCode) {
            req.flash('error', 'Wrong secret code! Edit failed.');
            return res.redirect('/');
        }

        // Validate new text
        if (!text || text.trim() === '') {
            req.flash('error', 'Confession text cannot be empty.');
            return res.redirect(`/edit/${req.params.id}?secretCode=${secretCode}`);
        }

        // Update the confession
        confession.text = text.trim();
        await confession.save();

        req.flash('success', 'Confession updated successfully!');
        res.redirect('/');
    } catch (err) {
        console.error('Error updating confession:', err);
        req.flash('error', 'Failed to update confession.');
        res.redirect('/');
    }
});

// DELETE /confessions/:id → delete confession (verify secret code)
router.delete('/confessions/:id', async (req, res) => {
    try {
        const confession = await Confession.findById(req.params.id);
        if (!confession) {
            req.flash('error', 'Confession not found.');
            return res.redirect('/');
        }

        const { secretCode } = req.body;

        // Verify secret code
        if (!secretCode || secretCode !== confession.secretCode) {
            req.flash('error', 'Wrong secret code! Deletion failed.');
            return res.redirect('/');
        }

        // Delete the confession
        await Confession.findByIdAndDelete(req.params.id);

        req.flash('success', 'Confession deleted successfully.');
        res.redirect('/');
    } catch (err) {
        console.error('Error deleting confession:', err);
        req.flash('error', 'Failed to delete confession.');
        res.redirect('/');
    }
});

// ─────────────────────────────────────────────
// REACTION ROUTE
// ─────────────────────────────────────────────

// POST /confessions/:id/react → add one reaction per user (like, love, or laugh)
router.post('/confessions/:id/react', ensureAuth, async (req, res) => {
    try {
        const { reaction } = req.body;
        const validReactions = ['like', 'love', 'laugh'];

        // Validate reaction type
        if (!validReactions.includes(reaction)) {
            req.flash('error', 'Invalid reaction type.');
            return res.redirect('/');
        }

        const confession = await Confession.findById(req.params.id);
        if (!confession) {
            req.flash('error', 'Confession not found.');
            return res.redirect('/');
        }

        // Check if this user has already reacted with this same reaction
        const alreadyReacted = confession.reactedUsers.some(
            (entry) => entry.userId === req.user.id && entry.reaction === reaction
        );

        if (alreadyReacted) {
            req.flash('error', 'You have already reacted to this confession!');
            return res.redirect('/');
        }

        // User hasn't reacted with this type yet → increment count and record the user
        const incField = {};
        incField[`reactions.${reaction}`] = 1;

        await Confession.findByIdAndUpdate(req.params.id, {
            $inc: incField,
            $push: { reactedUsers: { userId: req.user.id, reaction: reaction } }
        });

        res.redirect('/');
    } catch (err) {
        console.error('Error adding reaction:', err);
        req.flash('error', 'Failed to add reaction.');
        res.redirect('/');
    }
});

module.exports = router;
