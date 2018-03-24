'use strict';

var User = require('../models/user');
var jwt = require('jsonwebtoken');                  // used to create, sign, and verify tokens
var config = require('../config.js');

// Load environment
const _ENV_NAME = process.env.NAME || 'development';
config = config[_ENV_NAME];

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey/*, { expiresIn: 14400 }*/);
};

exports.getHourToken = function(user) {
    return jwt.sign(user, config.secretKey, { expiresIn: 3600 });
};

exports.verifyOrdinaryUser = function(req, res, next) {
      // check header or url parameters or post parameters for token
      var token = req.headers['x-access-token'];

      // decode token
      if(token){
            // verifies secret and checks exp
            jwt.verify(token, config.secretKey, function(err, decoded) {
                  if (err) {
                        var err = new Error('You are not authenticated!');
                        err.status = 401;
                        return next(err);
                  } else {
                        // if everything is good, save to request for use in other routes
                        req.decoded = decoded;
                        next();
                  }
            })
      }
      else{
            // if there is no token
            // return an error              
            console.log('No token provided!');
            var err = new Error('No token provided!');
            err.status = 403;
            return next(err);
      }
};

exports.verifyFacilitator = function (req, res, next){
    if(!req.decoded){
        var err = new Error('You are not authorised to do so!');
        err.status = 403;
        return next(err);
    }
    else{
        if(!req.decoded.facilitator) {
            var err = new Error('You are not authorised to do so!');
            err.status = 403;
            return next(err);
        }
        else
            next();
    }
};

exports.verifyAdmin = function (req, res, next){
    if(!req.decoded){
        var err = new Error('You are not authorised to do so!');
        err.status = 403;
        return next(err);
    }
    else{
        if(!req.decoded.admin) {
            var err = new Error('You are not authorised to do so!');
            err.status = 403;
            return next(err);
        }
        else
            next();
    }
};