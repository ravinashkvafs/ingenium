'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var recommendSchema = new Schema({
    sID: {                           //tell you the parent section of a statement
        type: String,
        default: "P__N__"
    },
	statement: String
});

module.exports = mongoose.model('recommendSchema', recommendSchema);