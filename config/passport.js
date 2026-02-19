// config/passport.js
// Google OAuth 2.0 strategy configuration using passport-google-oauth20

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

module.exports = function (passport) {
    // Use Google OAuth 2.0 Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.CALLBACK_URL
            },
            // Callback after Google verifies the user
            (accessToken, refreshToken, profile, done) => {
                // We store only the Google profile ID and display name in session
                // No database lookup needed — userId is profile.id
                const user = {
                    id: profile.id,
                    displayName: profile.displayName,
                    email: profile.emails[0].value,
                    photo: profile.photos[0] ? profile.photos[0].value : null
                };
                return done(null, user);
            }
        )
    );

    // Serialize: store user object in session
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // Deserialize: retrieve user object from session
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
};
