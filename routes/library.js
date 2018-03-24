'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted
var Stat = require('../models/library');     // Profile Model
var Verify = require('./verify');

router.route('/')
.get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){                  // Give all keywords in ascending order
    
    Stat.find().sort({"sID":1})
    .exec(function(err, statement){
        if(err)
            next(err);
        res.status(200).json(statement);
    });
})

.post(Verify.verifyOrdinaryUser, function(req, res, next){                 // Store keyword with extra-ordinary conditions
        //checking 3 things: 1=>checking respective length(s), 2=>checking whether sID and section_id representing same profile number-section number pair or not, 3=> sID with 7th index 'N'
    
        var body = sanitize(req.body);      // NoSQL injection prevention
    
        if(body.sID.length==6 && body.sID[0]=='P' && body.sID[3]=='N')
        {	Stat.create(body, function(err, statement){
				if(err)
					return next(err);
				res.status(200).json(statement);
			});
        }
        else
            res.status(501).send({"message": "Please Enter Valid Section ID-Keyword ID Pair !"});
    
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){               // Drop Whole Collection
    
    Stat.find()
    .exec(function(err, statement){
        if(err)
            next(err);
        
        var ver = Stat.length>0 ? Stat.collection.drop() : false;
        if(ver)
            res.status(200).send({"message": "Collection Removed"});
        else
            res.status(501).send({"message": "Collection Doesn't Exist"});
    });    
});

router.route('/:profile_num')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var profile_num = 'P'+sanitize(req.params.profile_num);     // NoSQL injection prevention
    
    Stat.find({ sID: { $regex: profile_num } }).sort('sID')
    .exec(function(err, statement){
        if(err)
            next(err);
        res.status(200).json(statement);
    });    
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var profile_num = 'P'+sanitize(req.params.profile_num);     // NoSQL injection prevention
    
    Stat.findOneAndRemove({ sID: { $regex: profile_num } })
    .exec(function(err, statement){
        if(err)
            next(err);
        
        res.status(200).send({"message": "Removed"});
    });    
});

router.route('/:profile_num/:s_num')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var num = 'P'+sanitize(req.params.profile_num)+'N'+sanitize(req.params.s_num);       // NoSQL injection prevention
    
    Stat.find({ sID: { $regex: num } })
    .exec(function(err, statement){
        if(err)
            next(err);
        res.status(200).json(statement);
    });    
})

.put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var num = 'P'+sanitize(req.params.profile_num)+'N'+sanitize(req.params.s_num);       // NoSQL injection prevention
    
    Stat.findOneAndUpdate({ sID: { $regex: num }}, {$set: sanitize(req.body)}, {new: true})
    .exec(function(err, statement){
        if(err)
            next(err);
        res.status(200).json(statement);
    });
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var num = 'P'+sanitize(req.params.profile_num)+'N'+sanitize(req.params.s_num);       // NoSQL injection prevention
    
    Stat.findOneAndRemove({ sID: { $regex: num } })
    .exec(function(err, statement){
        if(err)
            next(err);
            
        res.status(200).send({"message": "Removed"});
    });    
});

module.exports = router;