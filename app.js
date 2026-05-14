const express = require("express");
const path = require("path");
const flash = require("connect-flash");
const cors = require("cors");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { errorHandler } = require("./middlewares/errorHandler");
const { adminSession, userSession } = require("./utils/mongodb/session-store");
require("dotenv").config();

const app = express();
//cache controle
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use(cors());
// app.use(morgan('dev'))

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.disable('view cache');
app.set('view cache', false);

app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) {
    return adminSession(req, res, next);
  }
  return userSession(req, res, next);
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLINT_ID,
      clientSecret: process.env.GOOGLE_CLINT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (_accessToken, _refreshToken, profile, done) => {
      return done(null, profile);
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use(flash());

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/", authRoutes);

app.use(errorHandler);

module.exports = app;
