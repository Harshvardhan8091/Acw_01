// middleware/isAdmin.js
// Protects admin routes — only the designated admin Google account may access them.

function isAdmin(req, res, next) {
    // Must be logged in first
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please login to access this page.');
        return res.redirect('/login');
    }

    // Compare logged-in user's Google ID against the env-configured admin ID
    if (req.user.id !== process.env.ADMIN_GOOGLE_ID) {
        req.flash('error', 'Access denied. Admins only.');
        return res.redirect('/');
    }

    return next();
}

module.exports = isAdmin;
