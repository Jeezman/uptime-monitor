/**
 * Primary API file
 *
 */

var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// instantiate http server
var httpServer = http.createServer((req, res) => {
  unifiedServer(req, res);
});

// start the HTTP server
httpServer.listen(config.httpPort, function() {
  console.log('The server is listening on port ' + config.httpPort);
});

var httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};

// instantiate https server
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

// start the HTTPS server
httpsServer.listen(config.httpsPort, function() {
  console.log('The server is listening on port ' + config.httpsPort);
});

// server logic for http and https
var unifiedServer = function(req, res) {
  // get the url and parse it
  var parsedUrl = url.parse(req.url, true);

  // get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // get the query string as an object
  var queryStringObject = parsedUrl.query;

  // get HTTP method
  var method = req.method.toLowerCase();

  // get the headers as an object
  var headers = req.headers;

  // get the payload if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data) {
    buffer += decoder.write(data);
  });

  req.on('end', function() {
    buffer += decoder.end;

    // choose the handler this request should go to
    var chosenHandler =
      typeof router[trimmedPath] !== 'undefined'
        ? router[trimmedPath]
        : handlers.notFound;

    // construct the data to send to the handler
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    // route request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // use the status code called back by the handler or default to 200
      statusCode = typeof statusCode == 'number' ? statusCode : 200;

      // use the payload called back by the handler or default to an empty object
      payload = typeof payload == 'object' ? payload : {};

      // convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // log the request path
      console.log('Request this response: ', statusCode, payloadString);
    });
  });
};
// define the handlers
var handlers = {};

handlers.ping = function(data, callback) {
  callback(200);
};

// not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

var router = {
  ping: handlers.ping
};
