const express = require('express')
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const nocache = require("nocache");


const app = express()
app.use(nocache());
app.use((req, res, next) => {
  // Set headers to prevent caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0'); // Expiry date set to 0 ensures no caching

  // Continue processing the request
  next();
});
app.use(cors());

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, 'public')))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
    session({
      secret: 'chipkart-computers',
      resave: false,
      saveUninitialized: true,
      cookie: {
        httpOnly: true,
      },
    })
  );

app.use(flash());

const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')

app.use("/", userRoutes);
app.use("/", authRoutes);
app.use("/admin", adminRoutes);



module.exports = app