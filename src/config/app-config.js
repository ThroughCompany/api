/* =========================================================================
 * Dependencies
 * ========================================================================= */
var _ = require('underscore');
var packageConfig = require('../../package');

/* =========================================================================
 * Force UTC timezone
 * ========================================================================= */
process.env.TZ = 'UTC';

/* =========================================================================
 * Constants
 * ========================================================================= */
var PORT = process.env.PORT || 3001;
var SYSTEMEMAIL = 'support@throughcompany.com';
var NAME = 'Through Company API';

/* =========================================================================
 * Defaults
 * ========================================================================= */
var defaults = {
  app: {
    name: NAME,
    systemEmail: SYSTEMEMAIL
  },
  auth: {
    jsonWebToken: '!Thr0ugh*C0mp@any!'
  },
  mailgun: {
    api: 'api.mailgun.net',
    key: 'key-3wk0o8uzj8ojudi9vql1hre3z2z3l060',
    domain: 'sandbox75137.mailgun.org'
  },
  mailchimp: {
    api: 'us10.api.mailchimp.com',
    key: '758742a3dd8f60d35e2d71d1bbb9ded7-us10'
  },
  newrelic: {
    name: 'xxxxxxxxxx',
    key: 'xxxxxxxxxx'
  },
  blitline: {
    api: 'api.blitline.com',
    version: '1.21',
    key: '4Q3VLBn5cU01BUgROW2X9Yw'
  },
  port: PORT,
  apiVersion: packageConfig.version,
  aws: {
    accessKeyId: 'AKIAJSU5WNPJZHCJD2XA',
    secretAccessKey: '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',
    region: 'US Standard',
    s3: {
      buckets: {
        api: {
          name: 'throughcompany-api'
        }
      }
    }
  },
  log: {
    level: 'debug',
    console: true
  },
  ssl: process.env.SSL
};

/* =========================================================================
 * Production
 * ========================================================================= */
var productionConfig = _.extend(_.clone(defaults), {
  db: 'mongodb://prod-readwrite:K3prutHu2waw@ds037407.mongolab.com:37407/heroku_app35223430',
  newrelic: {
    name: 'throughcompany-api-prod',
    key: 'e7c5a21591fb5d706825572ef8cde21bb7cde86c'
  },
  mailgun: {
    api: 'api.mailgun.net/v2',
    key: 'key-3wk0o8uzj8ojudi9vql1hre3z2z3l060',
    domain: 'throughcompany.com'
  }
});

/* =========================================================================
 * Development
 * ========================================================================= */
var developmentConfig = _.extend(_.clone(defaults), {
  db: 'mongodb://dev-readwrite:QUZAmaf4ehuj@ds041651.mongolab.com:41651/heroku_app33783922',
  newrelic: {
    name: 'throughcompany-api-dev',
    key: 'e7c5a21591fb5d706825572ef8cde21bb7cde86c'
  },
  mailgun: {
    api: 'api.mailgun.net',
    key: 'key-3wk0o8uzj8ojudi9vql1hre3z2z3l060',
    domain: 'throughcompany.com'
  }
});

/* =========================================================================
 * Local
 * ========================================================================= */
var localConfig = _.extend(_.clone(defaults), {
  db: 'mongodb://localhost:27017/throughcompany'
});

/* =========================================================================
 * Test
 * ========================================================================= */
var testConfig = _.extend(_.clone(defaults), {
  db: 'mongodb://localhost:27017/throughcompany-test'
});

/* ========================================================================= */
var env = process.env.NODE_ENV || 'development';

var envs = {
  production: productionConfig,
  development: developmentConfig,
  local: localConfig,
  test: testConfig
};

var envConfig = null;

if (env === 'dev' || env === 'development' || env === 'DEV' || env === 'DEVELOPMENT') {
  envConfig = envs.development;
  envConfig.ENV_DEV = true;
} else if (env === 'prod' || env === 'production' || env === 'PROD' || env === 'PRODUCTION') {
  envConfig = envs.production;
  envConfig.ENV_PROD = true;
} else if (env === 'local') {
  envConfig = envs.local;
  envConfig.ENV_TEST = true;
} else if (env === 'test') {
  envConfig = envs.test;
  envConfig.ENV_TEST = true;
} else {
  throw new Error(env + ' is not a valid env');
}

envConfig.ENV = env;

if (envConfig.ENV_PROD) {
  // Handle uncaught exceptions so the server doesn't crash
  process.on('uncaughtException', function(err) {
    console.error('\n\n**UNCAUGHT EXCEPTION**\n\n');
    console.error(err);

    if (err.stack) console.error(err.stack);
  });
}

if (process.env.WERCKER_MONGODB_URL) {
  envConfig.db = process.env.WERCKER_MONGODB_URL;
}

/* =========================================================================
 * Expose
 * ========================================================================= */
module.exports = envConfig;
