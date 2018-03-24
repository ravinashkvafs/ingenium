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
    },
    paei_tag: {
        p: {
            type: Boolean,
            default: false
        },
        a: {
            type: Boolean,
            default: false
        },
        e: {
            type: Boolean,
            default: false
        },
        i: {
            type: Boolean,
            default: false
        }
    },
	responsive_statement: String
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
    linked_keyword: {                           //linked to which keyword ?
        type: String,
        default: "P__S__K__"
    },
    belongs_to: {
        personal: {
            type: Boolean,
            default: false
        },
        professional: {
            type: Boolean,
            default: false
        }
    },
    balancing_description: [new Schema({desc: String})],
    comment_placeholder: [new Schema({question: String})],
	dummy_keyword: String,
	key_version: {
		type: String,
		default: 'v1.1'
	}
});

module.exports = mongoose.model('keywordSchema', keywordSchema);