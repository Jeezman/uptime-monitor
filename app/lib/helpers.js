/**
 * helpers for various tasks
 */
var crypto = require('crypto');
var config = require('../config');

var helpers = {};

helpers.hash = function(str) {
  if (typeof str == 'string' && str.length > 0) {
    var hash = crypto
      .createHmac('sha256', config.hashingSecret)
      .update(str)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return `error is ${e}`;
  }
};

helpers.createRandomString = function(length) {
  length = typeof length == 'number' && length > 0 ? length : false;
  if (length) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    var str = '';
    for (var i = 1; i <= length; i++) {
      // get random character from possible characters string
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      // append character to final string
      str += randomCharacter;
    }

    return str;
  } else {
    return false;
  }
};

module.exports = helpers;
