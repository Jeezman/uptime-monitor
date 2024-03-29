/**
 * Request handlers
 */

var _data = require('./data');
var helpers = require('./helpers');
var config = require('../config');

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
    // get token from headers
    var token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // verify token
    handlers._tokens.verifyToken(token, phone, function(isTokenValid) {
      if (isTokenValid) {
        _data.read('users', phone, function(err, data) {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: 'Missing required token in header, or token is invalid'
        });
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
    var token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // verify token
    handlers._tokens.verifyToken(token, phone, function(isTokenValid) {
      if (isTokenValid) {
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
        callback(403, {
          Error: 'Missing required token in header, or token is invalid'
        });
      }
    });
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
    var token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    // verify token
    handlers._tokens.verifyToken(token, phone, function(isTokenValid) {
      if (isTokenValid) {
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
        callback(403, {
          Error: 'Missing required token in header, or token is invalid'
        });
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

handlers._tokens.get = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

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

handlers._tokens.delete = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read('tokens', id, function(err, data) {
      if (!err && data) {
        _data.delete('tokens', id, function(err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete the specified token' });
          }
        });
      } else {
        callback(404, { Error: 'Could not find the specified token' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

handlers._tokens.put = function(data, callback) {
  var id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == 'boolean' && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // check if token is already expired
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update('tokens', id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration"
              });
            }
          });
        } else {
          callback(400, {
            Error: 'Token has already expired, and cannot be extended'
          });
        }
      } else {
        callback(400, { Error: 'Specified token does not exist' });
      }
    });
  } else {
    callback(400, {
      Error: 'Missing required fields or required fields invalid'
    });
  }
};

handlers._tokens.verifyToken = function(id, phone, callback) {
  _data.read('tokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// check service
handlers.checks = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._checks = {};

// required data: protocol, url, method, successCodes
handlers._checks.post = function(data, callback) {
  var protocol =
    typeof data.payload.protocol == 'string' &&
    ['https', 'http'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  var url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  var method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  var successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    var token =
      typeof data.headers.token == 'string' ? data.headers.token : false;

    _data.read('tokens', token, function(err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;

        _data.read('users', userPhone, function(err, userData) {
          if (!err && userData) {
            var userChecks =
              typeof userData.checks == 'object' &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            if (userChecks.length < config.maxChecks) {
              var checkId = helpers.createRandomString(20);

              var checkObject = {
                id: checkId,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeoutSeconds: timeoutSeconds
              };

              _data.create('checks', checkId, checkObject, function(err) {
                if (!err) {
                  // add the check id to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // save new user data
                  _data.update('users', userPhone, userData, function(err) {
                    if (!err) {
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: 'Could not update the user with the new check'
                      });
                    }
                  });
                }
              });
            } else {
              callback(400, {
                Error: `The user already has the maximum number of checks ${
                  config.maxChecks
                } `
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: 'Missing required inputs, or inputs are invalid' });
  }
};

handlers._checks.get = function(data, callback) {
  var id =
    typeof data.queryStringObject.id == 'string' &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read('checks', id, function(err, checkData) {
      if (!err && checkData) {
        var token =
          typeof data.headers.token == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          isTokenValid
        ) {
          if (isTokenValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

handlers._checks.put = function(data, callback) {
  var id =
    typeof data.payload.id == 'string' && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  var protocol =
    typeof data.payload.protocol == 'string' &&
    ['https', 'http'].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  var url =
    typeof data.payload.url == 'string' && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  var method =
    typeof data.payload.method == 'string' &&
    ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  var successCodes =
    typeof data.payload.successCodes == 'object' &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  var timeoutSeconds =
    typeof data.payload.timeoutSeconds == 'number' &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read('checks', id, function(err, checkData) {
        if (!err && checkData) {
          var token =
            typeof data.headers.token == 'string' ? data.headers.token : false;
          handlers._tokens.verifyToken(token, checkData.userPhone, function(
            isTokenValid
          ) {
            if (isTokenValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              // store the new updates
              _data.update('checks', id, checkData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: 'Could not update the user' });
                }
              });
            } else {
              callback(403, {
                Error: 'Missing required token in header, or token is invalid'
              });
            }
          });
        } else {
          callback(400, { Error: 'Check ID did not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
  } else {
    callback(400, { Error: 'Missing required field(s)' });
  }
};

module.exports = handlers;
