'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var librarySchema = new Schema({
    sID: {                           //unique ID to distinguish keywords
        type: String,
        default: "P__N__"
    },
    statement: String                        //keyword name
});

module.exports = mongoose.model('librarySchema', librarySchema);