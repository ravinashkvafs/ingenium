'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted
var FacList = require('../models/facList.js');
var Verify = require('./verify.js');

router.route('/')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    FacList.find()
    .exec(function(err, facs){
        if(err)
            return next(err);
        res.status(200).json(facs);
    });
})

.post(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    body.date = new Date();
    FacList.create(body, function(err, facs){
        if(err)
            return next(err);
        res.status(200).json(facs);
    });
});

router.route('/:id')
.put(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    FacList.findOneAndUpdate({_id: sanitize(req.params.id)}, {$set: req.body}, {new: true})
    .exec(function(err, facs){
        if(err)
            return next(err);
        return res.status(200).json({message: "Done"});
    });

})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
	FacList.remove({_id: sanitize(req.params.id)}, function(err, fc){
		if(err)
			return next(err);
		res.status(200).json({message: "Removed Successfully !"});
	});
});

module.exports = router;