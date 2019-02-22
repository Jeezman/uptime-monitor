var environments = {};

environments.staging = {
  port: 3000,
  env: 'staging'
};

environments.production = {
  port: 5000,
  env: 'production'
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
