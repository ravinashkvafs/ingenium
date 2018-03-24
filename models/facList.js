'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var facListSchema = new Schema({
    facID: String,
	facName: String,
	date: Date
});

module.exports = mongoose.model('facListSchema', facListSchema);