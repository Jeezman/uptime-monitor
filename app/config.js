var environments = {};

environments.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  env: 'staging',
  hashingSecret: 'thisIsAWillyMightySecret'
};

environments.production = {
  httpPort: 5000,
  httpsPort: 5001,
  env: 'production',
  hashingSecret: 'thisIsAWillyMightySecret'
};

var currentEnvironment =
  typeof process.env.NODE_ENV == 'string'
    ? process.env.NODE_ENV.toLowerCase()
    : '';

// check that current env is one of env above, else default to string
var environmentToExport =
  typeof environments[currentEnvironment] == 'object'
    ? environments[currentEnvironment]
    : environments.staging;

module.exports = environmentToExport;
