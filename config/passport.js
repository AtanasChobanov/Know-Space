import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import User from "../models/userModel.js";

// Local passport authentication
passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
        try {
            const user = await User.getForeignUserByEmail(username);

            if (!user) {
                return cb(null, false, { message: "Имейлът не съществува." });
            }

            const isPasswordCorrect = await user.loginVerification(password);

            if (!isPasswordCorrect) {
                return cb(null, false, { message: "Грешна парола." });
            }

            return cb(null, user);
        } catch (err) {
            return cb(err);
        }
    })
);

// Google passport authentication
passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3000/auth/google",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
            scope: ["profile", "email"],
        },
        async function verify(accessToken, refreshToken, profile, cb) {
            try {
                const user = await User.getForeignUserByEmail(profile.email);

                // Checks if user exists with normal password
                if (user) {
                    if (user.password !== "google") {
                        return cb(null, false, { message: "Имейлът е регистриран чрез парола." });
                    }
                }
                else {
                    const newUser = await User.create(
                        profile.email,
                        profile.displayName,
                        "google",
                        "Друг",
                        profile.picture
                    );

                    return cb(null, newUser);
                }
                return cb(null, user);
            } catch (err) {
                return cb(err);
            }
        }
    )
);

// Process users to put in session
passport.serializeUser((user, cb) => {
    return cb(null, user);
});

passport.deserializeUser((user, cb) => {
    return cb(null, user);
});

export default passport;