const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const session = require("express-session");
require("dotenv").config();

const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  collectionName: "sessions",
  ttl: 20000,
});

const userSession = session({
  name: "userSession",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
});

const adminSession = session({
  name: "adminSession",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
  },
});

module.exports = { adminSession, userSession };
