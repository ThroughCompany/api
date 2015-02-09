'use strict';

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
var TOKENKEY = 'C0mp@nyFl00R';
var NAME = 'Through Company API';

/* =========================================================================
 * Defaults
 * ========================================================================= */
var defaults = {
  app: {
    name: NAME,
    systemEmail: SYSTEMEMAIL
  },
  port: PORT,
  apiVersion: packageConfig.version,
  tokenKey: TOKENKEY,
  smtp: {
    from: {
      email: SYSTEMEMAIL
    },
    credentials: {
      host: 'smtp.mailgun.org',
      port: '587',
      user: 'postmaster@sandbox75137.mailgun.org',
      password: '1f8pxsndgox2'
    }
  },
  aws: {
    s3: {
      accessKeyId: 'AKIAJGQFPLH32K7TGWHQ',
      secretAccessKey: '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',
      region: 'US Standard',
      maxRetries: 1,
      apiVersion: '',
      buckets: {
        profilePics: {
          name: 'Profile-Pictures'
        },
        companyDocuments: {
          name: 'Company-Documents'
        }
      }
    }
  },
  log: {
    level: 'debug',
    console: true
  }
};

/* =========================================================================
 * Production
 * ========================================================================= */
var productionConfig = _.extend(_.clone(defaults), {
  db: process.env.MONGOLAB_URI
});

/* =========================================================================
 * Development
 * ========================================================================= */
var developmentConfig = _.extend(_.clone(defaults), {
  db: 'mongodb://dev-readwrite:QUZAmaf4ehuj@ds041651.mongolab.com:41651/heroku_app33783922'
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
var env = process.env.NODE_ENV || process.argv[2] || 'development';

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
