/**
 * Request handlers
 */

var _data = require('./data');
var helpers = require('./helpers');

var handlers = {};

handlers.ping = function(data, callback) {
  callback(200);
};

// not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};

handlers._users.post = function(data, callback) {
  // console.log('data is ---> ', data);
  var firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  var phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 11
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  var tosAgreement =
    typeof data.payload.tosAgreement == 'boolean' &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, function(err, data) {
      // console.log('error is ', err);
      if (err) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };

          _data.create('users', phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: 'Could not create the new user' });
            }
          });
        } else {
          callback(500, { Error: 'Could not hash the users password' });
        }
      } else {
        callback(400, {
          Error: 'A user with that phone number already exists'
        });
      }
    });
  } else {
    // console.log({ firstName, lastName, phone, password, tosAgreement });
    callback(400, { Error: 'Missing required fields' });
  }
};

handlers._users.get = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 11
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    _data.read('users', phone, function(err, data) {
      if (!err && data) {
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

handlers._users.put = function(data, callback) {
  var phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 11
      ? data.payload.phone.trim()
      : false;

  var firstName =
    typeof data.payload.firstName == 'string' &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  var lastName =
    typeof data.payload.lastName == 'string' &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      _data.read('users', phone, function(err, userData) {
        console.log('user data is ', userData);
        if (!err && userData) {
          if (firstName) userData.firstName = firstName;
          if (lastName) userData.lastName = lastName;
          if (password) userData.hashedPassword = helpers.hash(password);

          _data.update('users', phone, userData, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: 'Could not update the user' });
            }
          });
        } else {
          callback(400, { Error: 'The specified user does not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Missing required fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

handlers._users.delete = function(data, callback) {
  var phone =
    typeof data.queryStringObject.phone == 'string' &&
    data.queryStringObject.phone.trim().length == 11
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    _data.read('users', phone, function(err, data) {
      if (!err && data) {
        _data.delete('users', phone, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified user' });
          }
        });
      } else {
        callback(404, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

handlers._tokens.get = function(err, data) {};

handlers._tokens.post = function(data, callback) {
  var phone =
    typeof data.payload.phone == 'string' &&
    data.payload.phone.trim().length == 11
      ? data.payload.phone.trim()
      : false;

  var password =
    typeof data.payload.password == 'string' &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    _data.read('users', phone, function(err, userData) {
      if (!err && userData) {
        // hash sent password, and compare to stored password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // create new token with random name, expiration data 1 hour in the future
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;

          var tokenObject = {
            phone: phone,
            id: tokenId,
            expires: expires
          };

          _data.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              500, { Error: 'Could not create the new token' };
            }
          });
        } else {
          callback(400, { Error: "Password did not match specified user's" });
        }
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

handlers._tokens.delete = function(data, callback) {};

handlers._tokens.put = function(data, callback) {};

module.exports = handlers;
