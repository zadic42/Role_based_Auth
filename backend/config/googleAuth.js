const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models/User');
const { logger } = require('../utils/logger');
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/api/auth/google/callback",
    proxy: true
},
async function(accessToken, refreshToken, profile, done) {
    try {
        // Check if user already exists by email
        let user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Update googleId and name if not already set
            if (!user.googleId) {
                user.googleId = profile.id;
            }
            if (!user.name) {
                user.name = profile.displayName;
            }
            await user.save();
            logger.info(`Google OAuth login successful for existing user: ${user.email}`);
            return done(null, user);
        }
        
        // Create new user if doesn't exist
        user = await User.create({
            name: profile.displayName,
            email: profile.emails[0].value,
            googleId: profile.id,
            role: 'user',
            permissions: ['read'],
            mfaEnabled: false,
            mfaSecret: null,
            mfaVerified: false,
            loginAttempts: 0,
            lockUntil: null
        });
        
        logger.info(`New user created via Google OAuth: ${user.email}`);
        return done(null, user);
    } catch (error) {
        logger.error('Google OAuth error:', error);
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport; 