/**
 * library for storing and editing data
 */

var fs = require('fs');
var path = require('path');

var lib = {};

lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function(dir, file, data, callback) {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback(false); // a false error is a good thing
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      });
    } else {
      callback('could not create a new file, it may already exist');
    }
  });
};

lib.read = function(dir, file, callback) {
  fs.readFile(`${lib.baseDir}${dir}/${file}.json`, 'utf8', function(err, data) {
    callback(err, data);
  });
};

lib.update = function(dir, file, data, callback) {
  fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', function(
    err,
    fileDescriptor
  ) {
    if (!err && fileDescriptor) {
      var stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor, function(err) {
        if (!err) {
          fs.writeFile(fileDescriptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              });
            } else {
              callback('Error writing to existing file');
            }
          });
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open the file for updating, it may not exist yet');
    }
  });
};

lib.delete = function(dir, file, callback) {
  fs.unlink(`${lib.baseDir}${dir}/${file}.json`, function(err) {
    if (!err) {
      callback('false');
    } else {
      callback('Error deleting the file');
    }
  });
};

module.exports = lib;
