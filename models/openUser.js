var mongoose = require('mongoose')
var Schema = mongoose.Schema

var openUser = new Schema({
	fullname: String,
	emailID: String,
	questionnaire: Array,
	date: Date
});

module.exports = mongoose.model('openUser', openUser);