'use strict';

//IMPORTING
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
//var fs = require('fs');
var logger = require('morgan');                     //HTTP request logger - will show requests in Command Prompt

//importing required header file - Help to make logs in a file 'logs.json'
/*
var bunyan = require('bunyan');

var bunyanOpts = {
    name: 'IDM Logs',
    streams: [
    {
        level: 'info',
        //stream: process.stdout          // log INFO to stdout
        path: 'info-logs.json'               // log INFO to stdout and to a file
    },
    {
        level: 'error',
        path: 'error-logs.json'               // log ERROR to stdout and to a file
    }
  ]
};

var blog = bunyan.createLogger(bunyanOpts);*/
//nowonwards we can create logs using blog.info() and blog.error()  ***

//Retrieving log and showing to stdout
/*
var obj;
fs.readFile('logs.json', 'utf8', function (err, data) {
  if (err) throw err;
  obj = data;
    console.log(obj);
});
*/

var config = require('./config');

// Load environment
const _ENV_NAME = process.env.NAME || 'development';
config = config[_ENV_NAME];

// Mongoose Connection
mongoose.Promise = global.Promise;
mongoose.connect(config.mongoUrl);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("Connected correctly to server");
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// passport config
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Importing Routing files
var routes = require('./routes/index');
var keyword = require('./routes/keyword');
var added = require('./routes/added');
var user = require('./routes/user');
var noti = require('./routes/noti');
var ques = require('./routes/ques');
var rec_for_man = require('./routes/rec_for_man');
var growth_rec = require('./routes/growth_rec');
var beliefs = require('./routes/beliefs');
var facList = require('./routes/facList');
var openQues = require('./routes/openQues');
var openUser = require('./routes/openUser');
var library = require('./routes/library');

// linking callback function to route
app.use('/', routes);
app.use('/keyword', keyword);
app.use('/added', added);
app.use('/user', user);
app.use('/noti', noti);
app.use('/ques', ques);
app.use('/rec_for_man', rec_for_man);
app.use('/beliefs', beliefs);
app.use('/growth_rec', growth_rec);
app.use('/facList', facList);
app.use('/openQues', openQues);
app.use('/openUser', openUser);
app.use('/library', library);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found!');
  err.status = 404;
  next(err);
});

//blog.info(';oiuahdf');
//blog.error('8tgyubk80y');

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
};

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// Secure traffic only
app.all('*', function(req, res, next){
    console.log('req start: ',req.secure, req.hostname, req.url, app.get('port'));
  if (req.secure) {
    return next();
  };

 res.redirect('https://'+req.hostname+':'+app.get('secPort')+req.url);
});

module.exports = app;
