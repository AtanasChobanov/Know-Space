import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import flash from "connect-flash";
import env from "dotenv";
import channelRoutes from "./routes/channelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import {
  createNewUser,
  getUserByEmail,
  verifyPassword,
} from "./models/userModel.js";

const app = express();
const port = process.env.PORT || 3000;
env.config();

// Initialize Cookies and Sessions middlewares
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Other middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));

// Middlewares for global data
app.use((req, res, next) => {
  if (req.user) {
    // if user is logged in
    res.locals.user = req.user;
  } else {
    // if user is logged out
    res.locals.user = null;
  }
  next();
});

app.use(flash());

app.use((req, res, next) => {
  res.locals.errorMessage = req.flash("error");
  next();
});

// Setup for all routes
app.use("/", channelRoutes);

app.use("/", authRoutes);

app.use("/", postRoutes);

// Local passport authentication
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      const user = await getUserByEmail(username);

      if (!user) {
        return cb(null, false, { message: "Имейлът не съществува." });
      }

      const isPasswordCorrect = await verifyPassword(password, user.password);

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
      callbackURL: "https://know-space.onrender.com/auth/google",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: ["profile", "email"],
    },
    async function verify(accessToken, refreshToken, profile, cb) {
      try {
        const user = await getUserByEmail(profile.email);
        
        // Checks if user exists with normal password
        if(user){
          if(user.password !== "google") {
            return cb(null, false, { message: "Имейлът е регистриран чрез парола." });
          }
        }
        else {
          const newUser = await createNewUser(
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

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}...`);
});
