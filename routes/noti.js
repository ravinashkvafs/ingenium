'use strict';                                   // Strictly follow latest JS standards

// Required Dependencies
var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');       // To stop NoSQL injections - any req starts with $ will be emitted
var Noti = require('../models/noti.js');
var User = require('../models/user.js');
var Verify = require('./verify.js');

router.route('/fac_noti')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){                  // Give all keywords in ascending order
    
	User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true})
		.exec(function(e, f){
			Noti.find({facilitator_name: f.firstname + ' ' + f.lastname}).sort('-date').limit(50)
				.exec(function(err, noti){
					if(err)
						next(err);
					res.status(200).json(noti);
				});
		});
});

router.route('/')
.get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){                  // Give all keywords in ascending order
    
    Noti.find().sort('-date').limit(50)
    .exec(function(err, noti){
        if(err)
            next(err);
        res.status(200).json(noti);
    });
})

.post(Verify.verifyOrdinaryUser, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    body.date = new Date();
    Noti.create(body, function(err, noti){
        if(err)
            next(err);
        res.status(200).json(noti);
    });
});

router.route('/:id')
.put(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    Noti.findOneAndUpdate({_id: sanitize(req.params.id)}, {$set: req.body}, {new: true})
    .exec(function(err, noti){
        if(err)
            return next(err);
        return res.status(200).json({message: "Done"});
    });

});

router.route('/removeNotiByFac')
.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    Noti.remove({facilitator_name: body.facilitator_name})
    .exec(function(err, noti){
        if(err)
            return next(err);
		//console.log(noti);
        return res.status(200).json({message: "Done"});
    });
});

router.route('/removeNotiByNameAndFac')
.delete(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    var body = sanitize(req.body);      // NoSQL injection prevention
    
    Noti.remove({who: body.name, facilitator_name: body.facilitator_name})
    .exec(function(err, noti){
        if(err)
            return next(err);
		//console.log(noti);
        return res.status(200).json({message: "Done"});
    });
});

router.route('/removeDuplicates')
.get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){                  // Give all keywords in ascending order
    var len = 0, l = 0, l1 = 0;
	
	Noti.find().sort('-date').limit(200)
	.exec(function(err, noti){
		if(err)
			return next(err);
		
		//console.log("* " + noti.length);
		//console.log(noti);
		
		while(l < noti.length-1){
			//console.log(l);
			l1 = l + 1;
			while(l1 < noti.length){
				
				if((noti[l].date.toString() == noti[l1].date.toString()) && (noti[l1].who == noti[l].who) && (noti[l1].statement == noti[l].statement) && (noti[l1].facilitator_name == noti[l].facilitator_name)){
					//console.log(noti[l1].date + " | " + noti[l].date);
					Noti.findByIdAndRemove({_id: noti[l1]._id}, function(e, c){});
					noti.splice(l1, 1);
					//console.log(l+''+l1 + " " + noti[l1]._id + " | now len: " + noti.length + ' | ' + noti.splice(l1, 1));
				}
				else
					l1++;
			}
			
			l++;
		}
		//console.log(noti.length);
		res.status(200).json({success: true, message: "Done"});
	});
});

router.route('/removeDuplicatesForFac')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){                  // Give all keywords in ascending order
    var len = 0, l = 0, l1 = 0;
	
	User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true})
		.exec(function(e, f){
			Noti.find({facilitator_name: f.firstname + ' ' + f.lastname}).sort('-date').limit(200)
			.exec(function(err, noti){
				if(err)
					return next(err);

				//console.log("* " + noti.length);
				//console.log(noti);

				while(l < noti.length-1){
					//console.log(l);
					l1 = l + 1;
					while(l1 < noti.length){

						if((noti[l].date.toString() == noti[l1].date.toString()) && (noti[l1].who == noti[l].who) && (noti[l1].statement == noti[l].statement) && (noti[l1].facilitator_name == noti[l].facilitator_name)){
							//console.log(noti[l1].date + " | " + noti[l].date);
							Noti.findByIdAndRemove({_id: noti[l1]._id}, function(er, c){});
							noti.splice(l1, 1);
							//console.log(l+''+l1 + " " + noti[l1]._id + " | now len: " + noti.length + ' | ' + noti.splice(l1, 1));
						}
						else
							l1++;
					}

					l++;
				}
				//console.log(noti.length);
				res.status(200).json({success: true, message: "Done"});
			});
		});
});

module.exports = router;