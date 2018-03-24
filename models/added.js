'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var descriptionSchema = new Schema({
    mini_description_id: {                           //tells you the parent keyword and helps to distinguish mini-descriptions
        type: String,
        default: "P__S__K__M__"
    },
    mini_description: String,
    tag: {
        personal: {
            type: Boolean,
            default: false
        },
        professional: {
            type: Boolean,
            default: false
        },
        company: {
            type: Boolean,
            default: false
        },
        competency: {
            type: Boolean,
            default: false
        }
    }
});

var keywordSchema = new Schema({
    section_id: {                           //tell you the parent section of a keyword
        type: String,
        default: "P__S__"
    },
    keyword_id: {                           //unique ID to distinguish keywords
        type: String,
        default: "P__S__K__"
    },
    keyword: String,                        //keyword name
    mini_descriptions: [descriptionSchema],     //keyword's different meanings/statements or say mini-descriptions
	profile_version: String,
	who_added: String,
	who_added_id: String,
	when_added: Date
});

module.exports = mongoose.model('addedKeywordSchema', keywordSchema);