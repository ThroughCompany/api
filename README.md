Company Floor Api
======================

##AWS Account Id
851189543225

##Setup

1) Install dependencies

``` shell
npm install
```

2) You need to have mongo db running

3) You need to load some intial seed data

``` shell
grunt db-seed
```
4) start node in the root directory of the project

``` shell
node app.js
```

5) the app will startup on port 3000, you will need to register and create an account to login

##Grunt Tasks

####Misc Tasks
---

JShint for linting
``` javascript
grunt run-jshint
```

####Testing Tasks
---

Run Mocha tests
``` javascript
grunt run-tests
```

####Database Tasks
---

Seed the database with lookup data, seed data, etc...
``` javascript
grunt db-seed
```

Cleanup all database collections
``` javascript
grunt db-clean
```
####Deployment Tasks
---

Deploy the app to Heroku
``` javascript
grunt deploy-app
```

##Code Style Rules

javascript : https://github.com/felixge/node-style-guide
