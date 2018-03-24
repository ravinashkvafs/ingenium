'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted
var Recs = require('../models/beliefs');     // Profile Model
var Verify = require('./verify');

router.route('/')
.get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){                  // Give all recommends in ascending order
    
    Recs.find().sort({"sID":1})
    .exec(function(err, recs){
        if(err)
            return next(err);
        res.status(200).json(recs);
    });
})

.post(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){                // Store recommend with extra-ordinary conditions
        //checking 3 things: 1=>checking respective length(s), 2=>checking whether sID and section_id representing same profile number-section number pair or not, 3=> sID with 7th index 'K'
    
        var body = sanitize(req.body);      // NoSQL injection prevention
    
        if(body.sID.length==6 && body.sID[0]=='P' && body.sID[3]=='N')
        {   
            Recs.find({sID: body.sID})
            .exec(function(err, rec){
                if(err)
                    next(err);
                if(!(rec.length == 0))
                    res.status(501).send({"message": "Type-ID Exists Already!"});
                else
                    Recs.create(body, function(err, rec){
                        if(err)
                            return next(err);
                        res.status(200).json(rec);
                    });                    
            });
        }
        else
            res.status(501).send({"message": "Please Enter Valid Type-ID !"});
    
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){               // Drop Whole Collection
    
    Recs.find()
    .exec(function(err){
        if(err)
            next(err);
        
        var ver = Recs.length>0 ? Recs.collection.drop() : false;
        if(ver)
            res.status(200).send({"message": "Collection Removed"});
        else
            res.status(501).send({"message": "Collection Doesn't Exist"});
    });    
});

router.route('/:profile_num')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var profile_num = 'P'+sanitize(req.params.profile_num);     // NoSQL injection prevention
    
    Recs.find({ sID: { $regex: profile_num } }).sort('sID')
    .exec(function(err, rec){
        if(err)
            return next(err);
        res.status(200).json(rec);
    });    
})

.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var profile_num = 'P'+sanitize(req.params.profile_num);     // NoSQL injection prevention
    
    Recs.findOneAndRemove({ sID: { $regex: profile_num } })
    .exec(function(err, rec){
        if(err)
            return next(err);
        
        res.status(200).send({"message": "Removed"});
    });    
});

router.route('/:profile_num/:num')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var num = 'P'+sanitize(req.params.profile_num)+'N'+sanitize(req.params.num);       // NoSQL injection prevention
    
    Recs.find({ sID: { $regex: num } })
    .exec(function(err, rec){
        if(err)
            return next(err);
        res.status(200).json(rec);
    });    
})

.put(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var num = 'P'+sanitize(req.params.profile_num)+'N'+sanitize(req.params.num);       // NoSQL injection prevention
    
    Recs.findOneAndUpdate({ sID: { $regex: num }}, {$set: sanitize(req.body)}, {new: true})
    .exec(function(err, rec){
        if(err)
            return next(err);
        res.status(200).json(rec);
    });
})

module.exports = router;