'use strict';

module.exports = {
    "development":{
        'secretKey': '7HE91-QM30X-ZYKS5-8G8HA-BCW0J-PDN2C',       
        'mongoUrl' : 'mongodb://lavish:idiscoverdb@ds129143.mlab.com:29143/testing-new',
        'googleAuth' : {
            'clientID'      : '437438716282-4s1rmctjev4njem80m4a12j5fg47u850.apps.googleusercontent.com',
            'clientSecret'  : 'tPkCriCx-Q7hvS8DwauyutOT',
            'callbackURL'   : 'http://app.idiscover.me/user/auth/google/callback'
        }
    },
    "production":{
        'secretKey': '7HE91-QM30X-ZYKS5-8G8HA-BCW0J-PDN2C',
        'mongoUrl' : 'mongodb://lavish:idiscoverdb@ds129143.mlab.com:29143/testing-new',
        'googleAuth' : {
            'clientID'      : '437438716282-4s1rmctjev4njem80m4a12j5fg47u850.apps.googleusercontent.com',
            'clientSecret'  : 'tPkCriCx-Q7hvS8DwauyutOT',
            'callbackURL'   : 'http://app.idiscover.me/user/auth/google/callback'
        }
    }
};
