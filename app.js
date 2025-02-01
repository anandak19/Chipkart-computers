const express = require("express");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const cors = require("cors");
const passport = require("passport");
const morgan = require("morgan");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();

const app = express();
//cache controle
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use(cors());
// app.use(morgan('dev'))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "chipkart-computers",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// google auth ---
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLINT_ID,
      clientSecret: process.env.GOOGLE_CLINT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (_accessToken, _refreshToken, profile, done) => {
      console.log(profile);
      return done(null, profile);
    }
  )
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

module.exports = app;
