const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const cookieSession = require('cookie-session');
const flash = require('connect-flash');
const indexRouter = require('./v1/routes/index');
const usersRouter = require('./v1/routes/users');
const indexAdminRouter = require('./admin/routes/index');
const adminRouter = require('./admin/routes/admin');
const campaginRouter = require('./v1/routes/campaign.rout');
const taxRouter = require('./v1/routes/tax.rout')
const billRouter = require('./v1/routes/bill.routes')

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

app.use(
  cookieSession({
    secret: 'I Love India...',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false // Set to true in production when using HTTPS
    }
  })
);

//Database connection with mongodb
const mongoose = require('./config/database');
app.use('/uploads', express.static('uploads'));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://13.127.99.157", "http://13.127.99.157:7002", "http://13.127.99.157:7001"],
    credentials: true,
  })
);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/v1/users', usersRouter);
app.use('/v1/', indexAdminRouter);
app.use('/admin', adminRouter);
app.use('/v1/campaigns', campaginRouter);
app.use('/v1/tax', taxRouter);
app.use('/v1/bill', billRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.log("err..........", err)
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
