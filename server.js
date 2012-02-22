/**
 * Load all dependencies, install them via npm
 */ 
var express = require('express');
var http = require('http');
var sys = require('util');
var exec = require('child_process').exec;
var url = require("url");
var conf = require('./conf.js');

/***************************************************************************************
 * Global variables for our server
 ***************************************************************************************/
/*
var server_name = 'local.host';
var port_id = '8042';
var full_server_name = 'http://' + server_name + ':' + port_id;
*/


/***************************************************************************************
 * Database management
 ***************************************************************************************/

/**
 * We need a database to store information about our users. We use a mongodb.
 */
var mongoose = require('mongoose')
, Schema = mongoose.Schema
, mongooseAuth = require('mongoose-auth');

var UserSchema = new Schema({})
  , User;

/*
 * User schema augmentation
 */

// STEP 1: Schema Decoration and Configuration for the Routing
UserSchema.plugin(mongooseAuth, {
    // Here, we attach your User model to every module
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          }
      }
    }

  , facebook: {
	  everyauth: {
          myHostname: conf.server.full_server_name
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/gui'
        , findOrCreateUser: function (sess, accessTok, accessTokExtra, fbUser) {
        	var promise = this.Promise()
                , User = this.User()();
             // TODO Check user in session or request helper first
             //      e.g., req.user or sess.auth.userId
        	User.findOne({'fb.id': fbUser.id}, function (err, foundUser) {
        		if (foundUser) {
        			console.log("Yes, we found you; your gender is:"+foundUser.fb.gender);
        			return promise.fulfill(foundUser);
        			}

        		console.log("We didn't find the user, so we are CREATING your profile...");
        		User.createWithFB(fbUser, accessTok, accessTokExtra.expires, function (err, createdUser) {
        			if (err) return promise.fail(err);
        			return promise.fulfill(createdUser);
        			}
        		);
        		}
        	);
        	return promise;
        	}
          
      }

    }
  , twitter: {
      everyauth: {
          myHostname: conf.server.full_server_name
        , consumerKey: conf.twit.consumerKey
        , consumerSecret: conf.twit.consumerSecret
        , redirectPath: '/gui'
        , findOrCreateUser: function (sess, accessTok, accessTokSecret, twitterUser) {
            var promise = this.Promise()
            , self = this;
          this.User()().findOne({'twit.id': twitterUser.id}, function (err, foundUser) {
            if (err) return promise.fail(err);
            if (foundUser) {
            	console.log("Yes, we found you");
            	return promise.fulfill(foundUser);
            }
            console.log("We didn't find the user, so we are CREATING your profile...");
            self.User()().createWithTwitter(twitterUser, accessTok, accessTokSecret, function (err, createdUser) {
              if (err) return promise.fail(err);
              return promise.fulfill(createdUser);
            });
          });
          return promise;
        }
      }
    }
});

UserSchema.add(
		{
			token: String
		  , secret: String
		}
		);


// create the UserSchema Model of mongodb
mongoose.model('User', UserSchema);

mongoose.connect('mongodb://' + conf.server.server_name + '/example');

User = mongoose.model('User');

/***************************************************************************************
 * Main routing function
 ***************************************************************************************/

/**
 * The router function. This needs to be "upgraded"... Things to do:
 * 1.) make it an actual router file!!!
 * 2.) update it to coffeescript
 * Remark: if you add things here to the if-else statements, make sure you also add them
 * as app.get() targets, or you won't be able to "GET" them.
 */
function respondFunction(req,res){
	var query = url.parse(req.url).query;
	var pathname = url.parse(req.url).pathname;
	console.log("Request for " + pathname + " " + query + " received.");

	if (query == "List") {
		
		if (req.user.token){
			User.findOne({'token': req.user.token},function (err, token) {
				if (token){
					console.log('MongoDB detects you and lists your available CS modules here');
					mode = 1;
					exec("aimlist "+mode, function (error, stdout, stderr) { 
						res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
						res.write(stdout);
						res.end();
					});
					console.log(mode);
					console.log(token.secret);
					}
					
				else{
					console.log('MongoDB does not detect you and only lists your available AI modules here');
				    mode = 0;
				    exec("aimlist "+mode, function (error, stdout, stderr) { 
						res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
						res.write(stdout);
						res.end();
					});
				}
				}
			)
		}
		else{
			console.log('Please log in via Edit-> CommonSense Login');
			mode = 0;
			exec("aimlist "+mode, function (error, stdout, stderr) { 
				res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
				res.write(stdout);
				res.end();
			});
		}
		
	}
	else if (pathname == "/aimports") {
		console.log("I am in aimports")
		exec("aimports " + query, function (error, stdout, stderr) { 
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		});
	}
	else if (pathname == "/cslogin2") {
		var oauth_symbols = query.split("&");
		var token = ''; var verifier = '';
		for (var i = 0; i < oauth_symbols.length; i++) {
			var str = oauth_symbols[i].split("=");
			// get second part of string after the = sign and sanitize it
			if (i == 0) token = str[1].replace(/[^a-z 0-9]+/gi,'');
			if (i == 1) verifier = str[1].replace(/[^a-z 0-9]+/gi,'');
		}
		// warning: this secret can be temporarily stored, but subsequent token and secret need to go in user db
		var secret = req.session.oauthsecret.replace(/[^a-z 0-9]+/gi,'');
		if ((token == "") || (secret == "")) {
			console.log("Not successful login for CommonSense");
			res.render('gui', {title: 'AIM GUI', layout: false });
		} 
		console.log("aimlogin oauth1 " + token + " " + secret + " " + verifier);
		exec("aimlogin oauth1 " + token + " " + secret + " " + verifier, function (error, stdout, stderr) {
			var vars = stdout.split("\n");
			
			//var instance = new User();
			for (var i = 0; i < vars.length-1; i++) { 
				console.log("t:" + vars[i]);
				// store oauthtoken and oauthsecret
				if (i == 0) req.user.token = vars[i]; 
				if (i == 1) req.user.secret = vars[i];
				
			}
			req.user.save(function (err) { } );

			res.render('gui', {title: 'AIM GUI', layout: false });
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		});
	}
	// the /cslogin command comes from CSLoginCommand
	else if (pathname == "/cslogin") {
		var param = 'id=123'
		// this will return a oauth token but should also return a secret
		console.log("I am in cslogin and will execute 'aimlogin oauth0 " + param + "'");
		
		exec("aimlogin oauth0 " + param, function (error, stdout, stderr) { 
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			var vars = stdout.split("\n");
			for (var i = 0; i < vars.length-1; i++) { 
				console.log("t:" + vars[i]);
				if (i == 0) var token = vars[i]; 
				if (i == 1) req.session.oauthsecret = vars[i]; 
			}
			res.write(token);
			res.end();
		});
	} 
	else {
		console.log("Very dangerous code... we can run anything we want...");
		var body = '';
		req.on('data', function (data) {
			body += data;
			console.log(data.toString());
		});
		console.log("body"+body);
		req.on('end', function () {

			var body_split=body.split("\n");
			//console.log(body_split[0]);
			for (var i = 0; i<body_split.length-1;i++){
				console.log(body_split[i]);
				// sanitizing
				// first check if it starts with "aim"...
				// aimrun arg0 arg1
				// aimconnect arg0 arg1 arg2 arg3
				
				// execute aimrun, aimconnect etc. 
				exec(body_split[i], function (error, stdout, stderr) {
					console.log(stdout);
				});
			}
		});
	}
}

/***************************************************************************************
 * Create expressjs server
 ***************************************************************************************/

/**
 * Standard server started. It starts the mongoose-auth middleware with many many other configurations such as routing (very important). 
 */
var app = express.createServer();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.configure(function(){
	console.log('Configuring the express server');
	app.use(express.bodyParser());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.use(express.cookieParser());
	
	app.use(express.session({secret:'whodunnit'}));
	// STEP 2: Add in the Routing: the use of mongoose-auth middleware
    app.use(mongooseAuth.middleware());
	app.use(express.methodOverride());
	app.use(app.router);	
	app.use(express['static'](__dirname + '/public'));
});


/**
 * all the the below functions are for different server responses according to different "PATH"
 */


/**
 * The root response: the entry point for the routing, we just render view/home.jade which shows a 
 * login window for OpenID via Facebook/Google.
 */
app.get('/', function (req, res) {
	res.render('home', { layout: false} );
});

/**
 * We reached the GUI. We have to check if the login procedure was actually successful.
 * Notice that rendering the GUI is separated from listing the CommonSense modules. We
 * have a two-stage process. The first time we only list the modules the user has access
 * to by default. After login via oauth the user can also see CommonSense modules. 
 */
app.get('/gui',function(req,res){
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('Rendering gui');
		res.render('gui', {title: 'AIM GUI', layout: false });
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

/**
 * This is the first login step if people want to log in to CommonSense. This is not
 * mandatory, we might provide other ways of having data input (for example from the web).
 * This route is initiated when the user manualyl clicks on Login for CommonSense in
 * the menu bar. 
 */
app.get('/cslogin',function(req,res) {
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('Logging in');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

/**
 * The second step of logging in. This is when the CommonSense server returns a URL
 * with temporary key and secret tokens which subsequently needs to be used by the modules
 * started by the user to access the data from that user.
 */
app.get('/cslogin2',function(req,res) {
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('Logging in, 2nd stage');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});


/**
 * Let's for now redirect to aimlist.
 */
app.get('/aimlist',function(req,res){
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('I am in /aimlist');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

app.get('/aimports',function(req,res){
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('I am in /aimports');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

/**
 * Captures GET and POST requests (because of app.all).
 */
app.all('/aimrun',function(req,res){
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('I am in /aimrun');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

/**
 * Only capture GET requests, else way the GUI is not rendered. :-)
 */


app.get('/:id?', function(req,res) {
	if(req.session.auth && req.session.auth.loggedIn){
		res.redirect('/');
	} else{
		//console.log("The user is NOT logged in!!!");
		res.redirect('/');
	}
});




//STEP 3: Add in Dynamic View Helpers (only if you are using express)
mongooseAuth.helpExpress(app);

app.listen(conf.server.port_id);
//console.log(conf.server.server_name);
console.log("ready: http://%s:%d/", conf.server.server_name, app.address().port);
