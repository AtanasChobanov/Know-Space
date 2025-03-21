import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import session from "express-session";
import flash from "connect-flash";
import env from "dotenv";
import path from "path";
import channelRoutes from "./routes/channelRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import passport from "./config/passport.js";

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
app.set("view engine", "ejs");
app.set("views", path.join(path.resolve(), "views"));

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

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}...`);
});
