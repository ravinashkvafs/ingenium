'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted
var openUser = require('../models/openUser.js');
var Verify = require('./verify.js');

router.route('/')
.get(function(req, res, next){                  // Give all keywords in ascending order
    
    openUser.find().sort('-date')
    .exec(function(err, user){
        if(err)
            return next(err);
        res.status(200).json(user);
    });
})

.post(function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    body.date = new Date();
    openUser.create(body, function(err, user){
        if(err)
            return next(err);
        return res.status(200).json({message: "Done"});
    });
});

router.route('/:id')
.put(function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    openUser.findOneAndUpdate({_id: sanitize(req.params.id)}, {$set: req.body}, {new: true})
    .exec(function(err, user){
        if(err)
            return next(err);
        return res.status(200).json({message: "Done"});
    });

});

module.exports = router;