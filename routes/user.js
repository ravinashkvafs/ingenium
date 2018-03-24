'use strict';

var express = require('express');
var router = express.Router();
var sanitize = require('mongo-sanitize');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var CryptoJS = require('node-cryptojs-aes').CryptoJS;
var child_process = require('child_process');

var User = require('../models/user.js');
var Keyword = require('../models/keyword.js');
var Verify = require('./verify.js');
var authe = require('../authenticate.js');
var mailer = require('../mailer.js');

router.route('/list')
.get(Verify.verifyOrdinaryUser, Verify.verifyAdmin, function(req, res, next){
    User.find({}, {username: true, firstname: true, lastname: true, important_date: true, are_you: true, 'profile.profile_number': true, 'work_details.current_company': true, 'work_details.department': true}).sort('-important_date.registration')
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
});

router.route('/fac_list')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
	User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true})
		.exec(function(e, f){
			User.find({facilitator_name: f.firstname + ' ' + f.lastname}, {username: true, firstname: true, lastname: true, important_date: true, are_you: true, 'profile.profile_number': true, 'work_details.current_company': true, 'work_details.department': true}).sort('-important_date.registration')
				.exec(function(err, user){
					if(err)
						next(err);
					res.status(200).json(user);
				});
		});
});

router.route('/mailToFac')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
	User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true, facilitator_name: true})
		.exec(function(e, f){
			if(e)
				return next(e);
			//console.log(f);
		
			if(f.facilitator_name != '--UNKNOWN--'){
				var arr = f.facilitator_name.split(' ');

				User.find({'firstname': { $regex: arr[0] }, 'are_you.facilitator': true}, {username: true, firstname: true, lastname: true})
					.exec(function(err, user){
						if(err)
							return next(err);
					
						var i=0;
						while((user[i].firstname + ' ' + user[i].lastname) != f.facilitator_name){
							i++;
						}

						var mailData = {to: user[i].username};
						var link = "app.idiscover.me/#/user/"+req.decoded._id;
						mailData.subject = "iDiscover.me | Progress | "+f.firstname+' '+f.lastname+" Filled their Trueself Profile";
						mailData.html = 'Hello,<br> Please click on the link below to start assessing '+user.firstname+' '+user.lastname+'\'s Profile .<br><a href='+link+'>Start Assessing</a>';

								mailer.custom_mail(mailData, function(ret){
									var res_from_mailer = ret;
									//console.log(res_from_mailer);

									if(res_from_mailer == false){
										//console.log('Updated error!');
										return res.status(501).json({ success: false, message: 'Some Error Occured !' });
									}
									else if(res_from_mailer == true){
										//console.log('Updated token!');
										res.status(200).json({success: true, message: "Mail Sent to Reviewers Successfully !"});
									}
								});
					});
			}
			else
				return res.status(501).json({ success: false, message: 'Please Select Your Facilitator !' });
		});
});

router.route('/mailToOwn')
.post(Verify.verifyOrdinaryUser, function(req, res, next){
	var mailData = sanitize(req.body);
	//console.log(mailData);
	User.findOne({_id: req.decoded._id}, {username: true})
		.exec(function(e, user){
			if(e)
				return next(e);
			//console.log(f);
		
			mailData.to = user.username;

			mailer.custom_mail(mailData, function(ret){
				var res_from_mailer = ret;
				//console.log(res_from_mailer);

				if(res_from_mailer == false){
					//console.log('Updated error!');
					return res.status(501).json({ success: false, message: 'Some Error Occured !' });
				}
				else if(res_from_mailer == true){
					//console.log('Updated token!');
					res.status(200).json({success: true, message: "Mail Sent to Reviewers Successfully !"});
				}
			});
		});
});

router.route('/name')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'username': true, 'firstname': true, 'lastname': true, 'facilitator_name': true, 'profile.profile_content': true})
    .exec(function(err, user){
        if(err)
            return next(err);
		else if(!user)
				return res.status(200).send({ success: false, message: 'Not Found !' });
		
		var allDone = true;
		if(user.profile.profile_content.length){
            for(var k = 0; k < user.profile.profile_content.length; k++){
                for(var p = 0; p < user.profile.profile_content[k].mini_descriptions.length; p++){
					//console.log(user.profile.profile_content[k].mini_descriptions[p].mini_description_id);
					if(!user.profile.profile_content[k].mini_descriptions[p].relate.length && user.profile.profile_content[k].mini_descriptions[p].mini_description_id[5]!=4)
						allDone = false;
					break;
                }
				if(!allDone)
					break;
            }
        }
		if(user.profile.profile_content.length == 0)
			allDone =false;
			
		var finalObj = {	username: user.username,
							firstname: user.firstname,
							lastname: user.lastname,
							facilitator_name: user.facilitator_name,
							'profile.profile_content': [],
							profile_filled: allDone,
							_id: id
					   };
		
		
        return res.status(200).json(finalObj);
    });
});

router.route('/personal')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'_id': false, 'important_date': false, 'OauthId': false, 'OauthToken': false, 'password': false, 'password_reset_token': false, 'are_you': false, 'profile': false, 'question': false, 'device_details': false, 'assessor': false})
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
});

router.route('/details')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'age': true, 'sex': true, 'facilitator_name': true, 'work_details': true})
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
})
.post(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    //console.log(req.body);
    User.findOneAndUpdate({_id: id}, {$set: sanitize(req.body)}, {new: true})
    .exec(function(err, user){
        if(err)
            return next(err);
        return res.status(200).json({success: true, message: "Done"});
    });
});

router.route('/questions')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'question': true})
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
});

router.route('/feedback')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'_id': false, 'feedback': true})
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
});

router.route('/reviewers')
.post(Verify.verifyOrdinaryUser, function(req, res, next){
    var body = sanitize(req.body);
	
    User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true, peer_reviewers: true})
    .exec(function(err, user){
        if(err)
            next(err);
		
		var mailData = {to: []};
		var curDate = new Date();
		body.forEach(function(v, i){
			body[i].date = curDate;
			mailData.to.push(body[i].emailid);
			user.peer_reviewers.push(body[i]);
		});
		
		var link = "app.idiscover.me/#/peer-review/"+user._id;
		mailData.subject = "iDiscover.me | Request to Review "+user.firstname+' '+user.lastname+"'s Profile";
		mailData.html = 'Hello,<br> Please click on the link below to start reviewing '+user.firstname+' '+user.lastname+'\'s Profile .<br><a href='+link+'>Start Reviewing</a>';
		
		user.save(function(e, u){
			if(e)
				return next(e);
			else{
				mailer.custom_mail(mailData, function(ret){
					var res_from_mailer = ret;
					//console.log(res_from_mailer);

					if(res_from_mailer == false){
						//console.log('Updated error!');
						return res.status(501).json({ success: false, message: 'Some Error Occured !' });
					}
					else if(res_from_mailer == true){
						//console.log('Updated token!');
						res.status(200).json({success: true, message: "Mail Sent to Reviewers Successfully !"});
					}
				});
			}
		});
    });
});

router.route('/report/:id')
.get(function(req, res, next){
    var id = sanitize(req.params.id);
    
    User.findOne({_id: id}, {'profile.profile_content': true, 'firstname': true, 'lastname': true})
    .exec(function(err, user){
        if(err)
            next(err);
		
        res.status(200).json(user);
    });
});

router.route('/peer_check/:id')
.post(function(req, res, next){
    var id = sanitize(req.params.id);
	var eid = sanitize(req.body.eid);
    
    User.findOne({_id: id}, {'peer_reviewers': true})
    .exec(function(err, user){
        if(err)
            next(err);
		//console.log("inside");
		var found = true;
		if(user.peer_reviewers.length != 0){
			//console.log("sent:" + eid);
			for(var i=0; i<user.peer_reviewers.length; i++){
				//console.log(user.peer_reviewers[i].emailid);
				if(user.peer_reviewers[i].emailid == eid){
					found = true;
					//console.log("popo ");
					return res.status(200).json({success: true, message: "Successfully Verified !"});
					break;
				}
				else if(((user.peer_reviewers.length-1) == i) && !found){
					//console.log("LAST");
					return res.status(200).json({success: false, message: "Email-ID Not Found !"});
					break;
				}
				else
					found = false;
			}
		}
		else if(user.peer_reviewers.length == 0)
        	return res.status(200).json({success: false, message: "Email-ID Not Found !"});
		if(!found)
			return res.status(200).json({success: false, message: "Email-ID Not Found !"});
    });
});

router.route('/peer/:id/:eid')
.get(function(req, res, next){
    var id = sanitize(req.params.id);
    var eid = sanitize(req.params.eid);
    
    User.findOne({_id: id}, {'profile.profile_content': true, peer_reviews: true})
    .exec(function(err, user){
        if(err)
            next(err);
		else{
			for(var k=0; k<user.peer_reviews.length; k++){
				if(user.peer_reviews[k].emailid == eid){
					//console.log("found at: "+k);
					var to_send = {};
					to_send.profile = user.profile;
					to_send.peer_reviewer_number = k;
					to_send.peer_reviewer_data = user.peer_reviews[to_send.peer_reviewer_number];
					//console.log(to_send);
					return res.status(200).json(to_send);
					break;
				}
			}
			//console.log("k: "+user.peer_reviews.length);
			
			var revs = [];
			for(var s=0; s<user.profile.profile_content.length; s++){
				var mini = [];
				for(var m=0; m<user.profile.profile_content[s].mini_descriptions.length; m++){
					mini.push({
						mini_description_id: user.profile.profile_content[s].mini_descriptions[m].mini_description_id
					});
				}
				revs.push({
					keyword_id: user.profile.profile_content[s].keyword_id,
					mini_descriptions: mini
				});
			}
				
			user.peer_reviews.push({
				emailid: eid,
				reviews: revs,
				date: new Date()
			});
			//console.log("k: "+user.peer_reviews.length);
			user.save(function(er, us){
				if(er)
					return next(er);
				else{
					var to_send = {};
					to_send.profile = us.profile;
					to_send.peer_reviewer_number = k;
					to_send.peer_reviewer_data = us.peer_reviews[to_send.peer_reviewer_number];
					
					//console.log(to_send);
					return res.status(200).json(to_send);
				}
			});
			
		}
    });
});

router.route('/peer_submit/:id/:peer_index')
.post(function(req, res, next){
    var id = sanitize(req.params.id);
	var pi = sanitize(req.params.peer_index);
	var body = sanitize(req.body);
	
    User.findOne({_id: id}, {'peer_reviews': true})
    .exec(function(err, user){
        if(err)
            next(err);
		
		user.peer_reviews[pi].reviews = body.reviews;
		user.peer_reviews[pi].last_modified = new Date();
		
		user.save(function(e, u){
			if(e)
				return next(err);
			else{
				return res.status(200).json({success: true, message: "Review Submitted !"});
			}
		});
    });
});

router.route('/specific/:id')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var id = sanitize(req.params.id);
    
    User.findOne({_id: id})
    .exec(function(err, user){
        if(err)
            next(err);
		
        res.status(200).json(user);
    });
})
.put(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var id = sanitize(req.params.id);
    
    User.findOneAndUpdate({_id: id}, {$set: sanitize(req.body)}, {new: true})
    .exec(function(err, user){
        if(err)
            return next(err);
		
        return res.status(200).json({success: true, message: "Done"});
    });
});
/*
//FACILITATOR NAME OR ID
router.route('/candidate/:fac_name')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var fac_name = sanitize(req.params.fac_name);
    
    User.find({'facilitator_name': fac_name}, {'firstname': true, 'lastname': true, 'facilitator_name': true})
    .exec(function(err, user){
        if(err)
            next(err);
        res.status(200).json(user);
    });
});
*/
router.route('/profile/insertProfile')                          // will use req.decoded._id later
.post(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    var body = sanitize(req.body);
    
    //console.log(body);
    if(!(body.profile_number > 0 && body.profile_number < 10))                    //profile_num is string here
        return res.status(501).send({message: "Invalid Request !", success: false});
    
    var pr_num = parseInt(body.profile_number);
    body.profile_number = 'P0' + body.profile_number;
        
    Keyword.find({keyword_id: { $regex: body.profile_number }}/*, {'comment': false, 'mini_descriptions.relate': false}*/).sort({ keyword_id: 1 })
    .exec(function(err, keyword){
        if(err)
            next(err);
        return keyword;
    })
    .then(function(key){
        //console.log(key);
        User.findOne({_id: id}, {profile: true})
        .exec(function(err_u, user){
            if(err_u)
               return next(err_u);
			
			//saving old-profile
			if(user.profile.profile_number)
				user.profile.old.push({pro: user.profile.profile_content, pro_num: user.profile.profile_number});
			
            user.profile.profile_number = pr_num;
            user.profile.profile_content = key;
			user.profile.eachSectionEditable = new Array(5).fill(false);
            user.save(function(e, us){
                if(e)
                    return next(e);
                res.status(200).send({message: "success !", success: true});
            });

        });
    });
});

router.route('/profile/insertProfileByFacilitator/:id')                          // will use req.decoded._id later
.post(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = sanitize(req.params.id);
    var body = sanitize(req.body);
    
    //console.log(body);
    if(!(body.profile_number > 0 && body.profile_number < 10))                    //profile_num is string here
        return res.status(501).send({message: "Invalid Request !", success: false});
    
    var pr_num = parseInt(body.profile_number);
    body.profile_number = 'P0' + body.profile_number;
        
    Keyword.find({keyword_id: { $regex: body.profile_number }}/*, {'comment': false, 'mini_descriptions.relate': false}*/).sort({ keyword_id: 1 })
    .exec(function(err, keyword){
        if(err)
            next(err);
        return keyword;
    })
    .then(function(key){
        //console.log(key);
        User.findOne({_id: id}, {profile: true})
        .exec(function(err_u, user){
            if(err_u)
               return next(err_u);
			
			//saving old-profile
			if(user.profile.profile_number)
				user.profile.old.push({pro: user.profile.profile_content, pro_num: user.profile.profile_number});
			
            user.profile.profile_number = pr_num;
            user.profile.profile_content = key;
            user.save(function(e, us){
                if(e)
                    return next(e);
                res.status(200).send({message: "success !", success: true});
            });

        });
    });
});

//RESPONSES COULD CACHE HERE, SO TESTING NEEDED LATER, IF IT FAILS THEN WILL USE INDIVDUAL ROUTE OF EACH MODULE - /module1, /module2, /module3
router.route('/profile/insertProfile/module/:m')                          // will use req.decoded._id later
.put(function(req, res, next){
    var body = sanitize(req.body), key;
    
    if(body.profile_num.length!=2 || body._id.length==0)                    //profile_num is string here
        return res.status(501).send({"message": "Invalid Request !"});
    
    var pr_num = parseInt(body.profile_num);
    body.profile_num = 'P' + body.profile_num;
    
    var m = parseInt(sanitize(req.params.m));
    
    if(m == 1){
        Keyword.find({$or:[{keyword_id: { $regex: body.profile_num + "S01" }}, {keyword_id: { $regex: body.profile_num + "S02" }}, {keyword_id: { $regex: body.profile_num + "S03" }}]}, {'section_id': true, 'keyword_id': true, 'mini_descriptions.mini_description_id': true, 'version': true, '_id': false, 'keyword': true, 'linked_keyword': true, 'balancing_description': true, 'mini_descriptions.mini_description': true, 'mini_descriptions.tag': true}).sort({ keyword_id: 1 })
        .exec(function(err, keyword){
            if(err)
                next(err);
            key = keyword;
        });
    }
    else if(m == 2){
        Keyword.find({$or:[{keyword_id: { $regex: body.profile_num + "S04" }}, {keyword_id: { $regex: body.profile_num + "S05" }}, {keyword_id: { $regex: body.profile_num + "S06" }}]}, {'section_id': true, 'keyword_id': true, 'mini_descriptions.mini_description_id': true, 'version': true, '_id': false, 'keyword': true, 'linked_keyword': true, 'balancing_description': true, 'mini_descriptions.mini_description': true, 'mini_descriptions.tag': true}).sort({ keyword_id: 1 })
        .exec(function(err, keyword){
            if(err)
                next(err);
            key = keyword;
        });
    }
    else if(m == 3){
        Keyword.find({$or:[{keyword_id: { $regex: body.profile_num + "S07" }}, {keyword_id: { $regex: body.profile_num + "S08" }}, {keyword_id: { $regex: body.profile_num + "S09" }}]}, {'section_id': true, 'keyword_id': true, 'mini_descriptions.mini_description_id': true, 'version': true, '_id': false, 'keyword': true, 'linked_keyword': true, 'balancing_description': true, 'mini_descriptions.mini_description': true, 'mini_descriptions.tag': true}).sort({ keyword_id: 1 })
        .exec(function(err, keyword){
            if(err)
                next(err);
            key = keyword;
        });
    }
    
    User.findOne({_id: body._id})
    .exec(function(err_u, user){
        if(err_u)
           next(err_u);
        if(!key)
            return res.status(501).send({"message": "Some Error Occured !"});
        
        if(user.profile.profile_content.length == 0 && user.profile.module1 == false && m == 1){
            user.profile.module1 = true;
            user.profile.profile_number = pr_num;
            user.profile.profile_content = key;
            user.save(function(e, us){
                if(e)
                    next(e);
                res.status(200).send({"message": "Success !"});
            });
        }
        else if((user.profile.module1 == true && user.profile.module2 == false && m == 2)||(user.profile.module1 == true && user.profile.module2 == true && user.profile.module3 == false && m == 3)){
            if(m==2)    user.profile.module2 = true;
            else        user.profile.module3 = true;
            user.profile.profile_number = pr_num;
            var i, j=0;
            for(i = user.profile.profile_content.length; j<key.length; i++,j++)
                user.profile.profile_content.push(key[j]);
            user.save(function(e, us){
                if(e)
                    next(e);
                res.status(200).send({"message": "Success !"});
            });
        }
        else
            res.status(501).send({"message": "Some Error Occured !"});
    });
});

router.route('/profile/:id/tag')
.put(function(req, res, next){                  // Sending information in BODY and then comparing tags
    var id = sanitize(req.params.id);
    
    User.findOne({_id: id}).sort({"profile.profile_content.keyword_id":1})
    .exec(function(err, user){
        if(err)
            next(err);
        
        var body = sanitize(req.body);
        var i=0,j=0,c=0, key2 = [];
        
        for(i=0; i < user.profile.profile_content.length; i++){
            for(j=0; j < user.profile.profile_content[i].mini_descriptions.length; j++)
                if(((user.profile.profile_content[i].mini_descriptions[j].tag.company == body.company)&&(body.company == true)) || ((user.profile.profile_content[i].mini_descriptions[j].tag.competency == body.competency)&&(body.competency == true)) ||((user.profile.profile_content[i].mini_descriptions[j].tag.personal == body.personal)&&(body.personal == true)) || ((user.profile.profile_content[i].mini_descriptions[j].tag.professional == body.professional)&&(body.professional == true))){
                    key2[c++] = user.profile.profile_content[i].mini_descriptions[j];                    
                }
        }
        res.status(200).json(key2);
    });
});

router.route('/profile/getProfile')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'firstname': true, 'lastname': true, 'profile': true, 'feedback': true})
    .exec(function(err, user){
        if(err)
            return next(err);
        res.status(200).json(user);
    });
});

//FINDING ON THE BASIS OF _id
router.route('/profile/getKeyword/:key_id')                         // will use req.decoded._id later
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    var key_id = sanitize(req.params.key_id);
    
    User.findOne({_id: id},{'profile': true}).sort({'profile.profile_content.keyword_id': 1})
    .exec(function(err, user){
        if(err)
            next(err);
        var data = user.profile.profile_content.id(key_id);
        
        res.status(200).json(data);
    });
});

router.route('/profile/getKeyword/:key_id/getMini/:mini_id')                         // will use req.decoded._id later
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    var key_id = sanitize(req.params.key_id);
    var mini_id = sanitize(req.params.mini_id);
    
    User.findOne({_id: id},{'profile': true}).sort({'profile.profile_content.keyword_id': 1})
    .exec(function(err, user){
        if(err)
            next(err);
        var data = user.profile.profile_content.id(key_id).mini_descriptions.id(mini_id);        
        res.status(200).json(data);
    });
});

//FINDING ON THE BASIS OF Section, Keyword or Mini-Description Number
router.route('/profile/:whole_id')                         // will use req.decoded._id later
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    var whole_id = sanitize(req.params.whole_id);
    
    if(whole_id.length != 6 && whole_id.length != 9 && whole_id.length != 12)
        return res.status(501).send({"message":"Invalid Request !"});
    
    User.findOne({_id: id},{'profile': true})
    .exec(function(err, user){
        if(err)
            next(err);
        
        var data = [], c=0, i=0, j=0;
        // searching for particular section's keywords
        if(whole_id.length == 6)
            for(i=0; i<user.profile.profile_content.length; i++){
                if(user.profile.profile_content[i].keyword_id.substr(0,6) == whole_id)
                    data[c++] = user.profile.profile_content[i];
            }
        // searching for section's particular keyword
        else if(whole_id.length == 9){
            for(i=0; i<user.profile.profile_content.length; i++){
                if(user.profile.profile_content[i].keyword_id == whole_id){
                    data = user.profile.profile_content[i];
                    break;
                }
            }
        }
        // searching for keyword's particular mini_desc
        else if(whole_id.length == 12){
            for(i=0; i<user.profile.profile_content.length; i++){
                if(user.profile.profile_content[i].keyword_id.substr(0,9) == whole_id.substr(0,9)){
                    data = user.profile.profile_content[i];
                    for(j=0; j<data.mini_descriptions.length; j++){
                        if(data.mini_descriptions[j].mini_description_id == whole_id){
                            data = data.mini_descriptions[j];
                            j=0;
                            break;
                        }
                    }
                    if(j != 0)
                        return res.status(501).send({"message":"Nothing Found !"});
                    break;
                }
            }
        }
        else
            return res.status(501).send({"message":"Invalid Request !"});
    
        res.status(200).json(data);        
    });
});

router.route('/fac_analysis')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var to_send = { dates: [],
				    analysis_for: 2,
                    user: [],
                    variant_profile_num: []
                  };
    var child = child_process.fork(__dirname + '/analysis.js', [], {});
	
	User.findOne({_id: req.decoded._id}, {firstname: true, lastname: true, 'are_you.admin': true})
		.exec(function(e, u){
			if(e)
				return next(e);

			to_send.fullAuth = u.are_you.admin;
		
			User.aggregate([{$match: {facilitator_name: u.firstname + ' ' + u.lastname}}, {$group : {_id : "$profile.profile_number", total : {$sum : 1}}}]).sort('_id')
				.exec(function(e, r){
					if(e)
						return next(e);
					//console.log(r);
					to_send.variant_profile_num = r;
					
					var d = new Date();
					d.setMonth(d.getMonth() - 12);
					d.setDate(0);
					d.setHours(23);
					d.setMinutes(59);
					d.setSeconds(59);
					//console.log(d.toLocaleString());
					User.find({facilitator_name: u.firstname + ' ' + u.lastname,'important_date.registration': {$gt: d}}, {'_id': false, 'important_date.registration': true}).sort('-important_date.registration')
						.exec(function(err, dates){
							if(err) return next(err);

							to_send.user = dates;
							to_send.dates = dates;
						
							child.send(to_send);

							child.on('message', message => {
								User.aggregate([{$match: {facilitator_name: u.firstname + ' ' + u.lastname}}, {$group : {_id : {$toUpper: "$work_details.current_company"}, total : {$sum : 1}}}]).sort('_id')
								.exec(function(er, re){
									message.comps = re;
									res.status(200).json(message);
								});
							});
						});
					
				});
		});
});

router.route('/analysis')
.get(Verify.verifyOrdinaryUser, Verify.verifyFacilitator, function(req, res, next){
    var to_send = { dates: [],
				    analysis_for: 1,
                    user: [],
                    variant_profile_num: []
                  };
    var child = child_process.fork(__dirname + '/analysis.js', [], {});
    
    User.aggregate([{$group : {_id : "$profile.profile_number", total : {$sum : 1}}}]).sort('_id')
        .exec(function(e, r){
            if(e)
                return next(e);
            //console.log(r);
            to_send.variant_profile_num = r;
            //console.log(sending);
			var d = new Date();
			d.setMonth(d.getMonth() - 12);
			d.setDate(0);
			d.setHours(23);
			d.setMinutes(59);
			d.setSeconds(59);
			//console.log(d.toLocaleString());
			User.find({'important_date.registration': {$gt: d}}, {'_id': false, 'important_date.registration': true}).sort('-important_date.registration')
				.exec(function(err, dates){
					if(err) return next(err);

					to_send.dates = dates;

					User.find({}, {'_id': true, 'are_you': true})
						.exec(function(err, user){
							if(err) return next(err);

							to_send.user = user;
							//console.log(to_send);
							child.send(to_send);

							child.on('message', message => {
								res.status(200).json(message);
							});
						});
				});
        });
    
    
});

router.route('/completion')
.get(Verify.verifyOrdinaryUser, function(req, res, next){
    var id = req.decoded._id;
    
    User.findOne({_id: id}, {'question': true, 'profile': true, 'are_you.facilitator': true, 'feedback': true})
    .exec(function(err, user){
        if(err)
            return next(err);
		else if(!user)
				return res.status(200).send({ success: false, message: 'Not Found !' });
        
        var per = 0;
        if(user.question.RQ1 != '' && user.question.RQ1 != undefined)
            per += 3;
        if(user.question.RQ2 != '' && user.question.RQ2 != undefined)
            per += 4;
        if(user.question.RQ3 != '' && user.question.RQ3 != undefined)
            per += 4;
        if(user.question.RQ4 != '' && user.question.RQ4 != undefined)
            per += 3;
        
        //console.log(user.question.RQ1 + ' | ' + user.question.RQ2 + ' | ' + user.question.RQ3 + ' | ' + user.feedback.submitted + ' = ' + per);
        
        // 14 % for questionnaire
		var que_filled = false;
		if(user.question.questionnaire.length != 0){
			for(var q = 0; q < 36; q++){
				//console.log(q);
				if(parseInt(user.question.questionnaire[q]) != 0){
					per += 14;
					que_filled = true;
					break;
				}
			}
		}
        //console.log(user.profile.beliefs);
        if(user.profile.beliefs.length){
			var sec0 = true;
			for(var k = 0; k < user.profile.beliefs.length; k++){
				//console.log(user.profile.beliefs[k].how_much);
				if(!user.profile.beliefs[k].how_much){
					sec0 = false;
					break;
				}
			}
			if(sec0)
                per += 14;
		}
		
        if(user.profile.profile_content.length){
            var sec1 = true, sec2 = true, sec3 = true, sec4 = true;
            for(var k = 0; k < user.profile.profile_content.length; k++){
                for(var p = 0; p < user.profile.profile_content[k].mini_descriptions.length; p++){
                    
                    if(user.profile.profile_content[k].keyword_id[5] == 1){
                        if(!user.profile.profile_content[k].mini_descriptions[p].relate)
                            sec1 = false;
                        continue;
                    }
                    else if(user.profile.profile_content[k].keyword_id[5] == 2){
                        if(!user.profile.profile_content[k].mini_descriptions[p].relate)
                            sec2 = false;
                        continue;
                    }
                    else if(user.profile.profile_content[k].keyword_id[5] == 3){
                        if(!user.profile.profile_content[k].mini_descriptions[p].relate)
                            sec3 = false;
                        continue;
                    }
                    else if(user.profile.profile_content[k].keyword_id[5] == 4){
                        if(!user.profile.profile_content[k].mini_descriptions[p].relate)
                            sec4 = false;
                        continue;
                    }
                }
            }
			if(sec1)
                per += 14;
            if(sec2)
                per += 15;
            if(sec3)
                per += 15;
        }
		
		var blocking = false;
		if(user.profile.eachSectionEditable.length)
		   blocking = user.profile.eachSectionEditable[0] && user.profile.eachSectionEditable[1] && user.profile.eachSectionEditable[2] && user.profile.eachSectionEditable[3] && user.profile.eachSectionEditable[4]
		
		//console.log(per);
		if(user.feedback.q1)
			per += 2;
		if(user.feedback.q2)
			per += 3;
		if(user.feedback.q3.a1 || user.feedback.q3.a2 || user.feedback.q3.a3 || user.feedback.q3.a4)
			per += 3;
		/*if(user.feedback.q4)
			per += 2;*/
		if(user.feedback.q5)
			per += 2;
		if(user.feedback.q6)
			per += 2;
		if(user.feedback.q7)
			per += 2;
		//console.log(per);
		
        var final_obj = {
            percentage: per,
            reflective_filled: user.question.RQ1!='' && user.question.RQ1 != undefined && user.question.RQ2!='' && user.question.RQ2 != undefined && user.question.RQ3!='' && user.question.RQ3 != undefined && user.question.RQ4!='' && user.question.RQ4 != undefined,
            questionnaire_filled: que_filled,
			selected_profile: user.profile.profile_number,
            profile_filled: sec1 && sec2 && sec3,// && sec4,
            profile_blocked: blocking,
			you_are_fac: user.are_you.facilitator
        };
        //console.log(sec1 + ' | ' + sec2 + ' | ' + sec3 + ' | ' + sec4 + ' = ' + per);
        return res.status(200).json(final_obj);
    });
})
;

router.route('/resetpsw/:email')                            // Client Side Needed
.get(function(req, res, next) {
	//console.log(req.params.email);
    User.findOne({ username: sanitize(req.params.email) })
        .exec(function(err, user) {
		if(err)
            return next(err);

        if(!user)
            return res.status(501).json({ success: false, message: 'Incorrect Email-ID !' });
        
		var token = Verify.getHourToken({"username":user.username, "_id":user._id, "admin":user.are_you.admin, "facilitator":user.are_you.facilitator});
        
		user.password_reset_token = token;
		
		user.save(function (err, user) {
            if(err)
                next(err);
			
			mailer.lost_details({username: user.username, token: token}, function(ret){
				var res_from_mailer = ret;
				//console.log(res_from_mailer);
			
				if(res_from_mailer == false){
					//console.log('Updated error!');
					return res.status(501).json({ success: false, message: 'Some Error Occured !' });
				}
				else if(res_from_mailer == true){
					//console.log('Updated token!');
					return res.status(200).json({ success: true, message: 'Mail Sent... Please Check Your Inbox !' });
				}
			});
			
        });
			
    });
});

router.route('/resetpsw/:email/:token')                            // Client Side Needed
.post(function(req, res, next) {
	//console.log(req.body);
	var body = sanitize(req.body);
    User.findOne({ username: sanitize(req.params.email) })
        .exec(function(err, user) {
            if(err)
				next(err);	// Throw err if cannot connect
			else if(!user){
				//console.log("NONONO");
				return res.status(200).send({ success: false, message: 'Error Occured !' });
			}
			else if(user.password_reset_token == false || user.password_reset_token == 'false'){
				//console.log("Yes");
				return res.status(200).send({ success: false, message: 'Password link has expired !' });
			}
            else{
				//console.log(user.password_reset_token);
				var token = sanitize(req.params.token); // Save user's token from parameters to variable
				
				// Function to verify token
				var config = require('../config.js');
				//console.log(config.development.secretKey+token);
				jwt.verify(token, config.development.secretKey, function(err, decoded) {
					//console.log('2 success');
					if (err) {
						//console.log(err);
						return res.status(200).send({ success: false, message: 'Password link has expired !' });
						next(err);
					}
					else {//PSW START
						user.password_reset_token = false;
						
						var scrt = 'portal\/\/\'*iD';
						var decrypted = CryptoJS.AES.decrypt(body.password, scrt);
						//console.log(decrypted.toString(CryptoJS.enc.Utf8));
						body.password = decrypted.toString(CryptoJS.enc.Utf8);
						
						user.password = body.password;
						user.save(function (err,user) {
							if (err) {
								next(err);
							}
							else{//console.log('4 success');
								//console.log('Updated psw!');
								return res.status(200).json({ success: true, message: 'Password Changed !' });
							}
						});
					}//PSW OVER
				  //console.log('5 success');
				});
			}
		});
});

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), function(err, res){
    //console.log(res);
	
	var tkn = authe.makeToken();
    //console.log("THIS IS TOKEN: "+tkn);
    res.redirect('http://app.idiscover.me/#/oauth/google/'+tkn);
});

router.route('/auth/register')
.post(function(req, res, next) {
    var body = sanitize(req.body);
    
    if(body.username.length==0)
        return res.status(501).json({message: 'Enter Valid Username!'});
    
    User.findOne({ username: body.username })
    .exec(function(err, user) {
        if (err)
            return res.status(500).send({"message": err});
        
        if(!user){
            body.firstname = body.firstname.toLowerCase();
            body.firstname = body.firstname.charAt(0).toUpperCase() + body.firstname.slice(1);
            body.lastname = body.lastname.toLowerCase();
            body.lastname = body.lastname.charAt(0).toUpperCase() + body.lastname.slice(1);
		
			//console.log(body);
			var scrt = 'portal\/\/\'*iD';
			var decrypted = CryptoJS.AES.decrypt(body.password, scrt);
			//console.log(decrypted.toString(CryptoJS.enc.Utf8));
			body.password = decrypted.toString(CryptoJS.enc.Utf8);
            
            var user = new User(body);

            user.save(function(err,user) {
                return res.status(200).json({message: 'Registration Successful!'});
            });   
        }        
        else
            return res.status(501).json({message: 'User Already Exists!'});
    });    
});

router.route('/auth/login')
.post(function(req, res, next) {
    var body = sanitize(req.body);
    
    User.findOne({ username: body.username }, function(err, user) {      
        if(err)
            return next(err);

        if(!user)
            return res.status(501).json({ message: 'Incorrect Email-ID !' });
		
		//console.log(body);
		var scrt = 'portal\/\/\'*iD';
		var decrypted = CryptoJS.AES.decrypt(body.password, scrt);
		//console.log(decrypted.toString(CryptoJS.enc.Utf8));
		body.password = decrypted.toString(CryptoJS.enc.Utf8);

        user.comparePassword(body.password, function(err, isMatch) {
            if (isMatch) {
                req.logIn(user, function(err) {
                    if (err)
                        return res.status(500).send({ "message": 'Could not log in user !'+err });
                    
                    var token = Verify.getToken({"username":user.username, "_id":user._id, "admin":user.are_you.admin, "facilitator":user.are_you.facilitator});
                    res.status(200).json({ "message": 'Login successful !', "success": true, "token": token });
                });
                  
                  
            }
            else
                return res.status(501).json({ "message": 'Incorrect password !' });              
        });
    });
});

router.get('/auth/logout', Verify.verifyOrdinaryUser, function(req, res) {
    req.logout();
    res.status(200).send({"message": 'Bye !', "success": true});
});

module.exports = router;
