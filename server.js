//Load all dependencies, install them via npm 
var express = require('express');
var http = require('http');
var sys = require('sys');
var exec = require('child_process').exec;
var watch = require('watch');
var url = require("url");
var everyauth = require('everyauth');
var conf = require('./conf.js');

var first_pass_sass = false;

/***************************************************************************************
 * Just monitoring and printing stuff
 ***************************************************************************************/

function puts(error, stdout, stderr) { 
	console.log(stdout);
	console.log("Entered!");
}

function compile_sass() {
	console.log("sass");
	exec("compass compile", puts);
}

function compile_haml() {
	exec("haml src/haml/index.haml public/index.html", puts);
	console.log("haml");
	exec("haml src/haml/test.haml public/test.html", puts);
}

function compile_coffee() {
	console.log("coffee_script");
	exec("cake build", puts);
}

function watchDirectoryAndRecompile(dir, callback) {
	//console.log("watch:"+dir+" "+callback);
	watch.watchTree(dir, {'ignoreDotFiles' : true}, function (f, curr, prev) {
		//console.log("what is it? f:"+f+" curr:"+curr+" prev:"+prev);
		if (typeof f == "object" && prev === null && curr === null) {
			// Finished walking the tree
			//callback();
		} else if (prev === null) {
			// f is a new file
			callback();
		} else if (curr.nlink === 0) {
			// f was removed
			callback();
		} else {
			// f was changed
			callback();
		}
	});
}

/***************************************************************************************
 * Main routing function
 ***************************************************************************************/

/**
 * The router function. This needs to be "upgraded"... Things to do:
 * 1.) make it an actual router file
 * 2.) update it to coffeescript
 * 3.) remove all references to directory management (watching etc.) 
 * Remark: if you add things here to the if-else statements, make sure you also add them
 * as app.get() targets, or you won't be able to "GET" them.
 */
function respondFunction(req,res){
	var query = url.parse(req.url).query;
	var pathname = url.parse(req.url).pathname;
	console.log("Request for " + pathname + " " + query + " received.");

	if (query == "List") {
		exec("aimlist ", function (error, stdout, stderr) { 
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		});
	}
	else if (pathname == "/aimports") {
		console.log("I am in aimports")
		exec("aimports " + query, function (error, stdout, stderr) { 
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		});
	}
	else if (pathname == "/addsensor") {
		var secret = req.session.oauthsecret;
		var token = req.session.oauthtoken;
		if ((token == "") || (secret == "")) {
			console.log("Not successful login for CommonSense");
			res.render('gui', {title: 'AIM GUI', layout: false });
		} 
		var fakeid = 1;
		console.log("aimrun CSCreateSensorModule " + fakeid + " " + token + " " + secret);
		exec("aimrun CSCreateSensorModule " + fakeid + " " + token + " " + secret, function (error, stdout, stderr) {
			res.render('gui', {title: 'AIM GUI', layout: false });
		});
	}
	else if (pathname == "/cslogin2") {
		var oauth_symbols = query.split("&");
		var token = ''; var verifier = '';
		for (var i = 0; i < oauth_symbols.length; i++) {
			var str = oauth_symbols[i].split("=");
			if (i == 0) token = str[1];
			if (i == 1) verifier = str[1];
		}
		// warning: this secret can be temporarily stored, but subsequent token and secret need to go in user db
		var secret = req.session.oauthsecret;
		if ((token == "") || (secret == "")) {
			console.log("Not successful login for CommonSense");
			res.render('gui', {title: 'AIM GUI', layout: false });
		} 
		console.log("aimlogin oauth1 " + token + " " + secret + " " + verifier);
		exec("aimlogin oauth1 " + token + " " + secret + " " + verifier, function (error, stdout, stderr) {
			var vars = stdout.split("\n");
			for (var i = 0; i < vars.length-1; i++) { 
				console.log("t:" + vars[i]);
				if (i == 0) req.session.oauthtoken = vars[i]; 
				if (i == 1) req.session.oauthsecret = vars[i]; 
			}
			res.redirect("/addsensor");
//			res.render('gui', {title: 'AIM GUI', layout: false });
//			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
//			res.write(stdout);
//			res.end();
		});
	}
	else if (pathname == "/cslogin") {
		// this will return a oauth token but should also return a secret
		console.log("I am in cslogin and will execute 'aimlogin oauth0 " + query + "'");
		
		exec("aimlogin oauth0 " + query, function (error, stdout, stderr) { 
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
				// execute aimrun, aimconnect etc. 
				exec(body_split[i], function (error, stdout, stderr) { 
					/*
            		res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
            		res.write(stdout);
            		res.end();
					 */
					//console.log(body_split[i]);
					console.log(stdout);
				});
			}
		});
	}
}

/***************************************************************************************
 * Everyauth
 ***************************************************************************************/

/*
 * General settings
 */
everyauth.debug = true;

/*
 * An array of users and an index 
 */
var usersById = {};
var nextUserId = 0;

function addUser (source, sourceUser) {
	var user;
	if (arguments.length === 1) { // password-based
		user = sourceUser = source;
		user.id = ++nextUserId;
		return usersById[nextUserId] = user;
	} else { // non-password-based
		user = usersById[++nextUserId] = {id: nextUserId};
		user[source] = sourceUser;
	}
	return user;
}

var usersByFbId = {};
var usersByGoogleId = {};

// Function everymodule.findUserById needs to be implemented to be able to use req.user 
everyauth.everymodule.findUserById( function (id, callback) {
	callback(null, usersById[id]);
});

everyauth.facebook
.appId(conf.fb.appId)
.appSecret(conf.fb.appSecret)
.findOrCreateUser( function (session, accessToken, accessTokenExtra, fbUserMetadata) {
	return usersByFbId[fbUserMetadata.id] ||
	(usersByFbId[fbUserMetadata.id] = addUser('facebook', fbUserMetadata));
})
.redirectPath('/gui');

everyauth.google
.appId(conf.google.clientId)
.appSecret(conf.google.clientSecret)
.scope('https://www.google.com/m8/feeds/')
.findOrCreateUser( function (sess, accessToken, extra, googleUser) {
	googleUser.refreshToken = extra.refresh_token;
	googleUser.expiresIn = extra.expires_in;
	return usersByGoogleId[googleUser.id] || 
	(usersByGoogleId[googleUser.id] = addUser('google', googleUser));
})
.redirectPath('/gui');

/***************************************************************************************
 * Create expressjs server
 ***************************************************************************************/

/**
 * Standard server started. It starts the everyauth middleware. 
 */
var app = express.createServer();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.configure(function(){
	console.log('Configure nodejs');
	app.use(express.bodyParser());
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.use(express.cookieParser());
	app.use(express.session({secret:'whodunnit'}));
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(everyauth.middleware());
	app.use(express['static'](__dirname + '/public'));
});

//"mount" the static middleware so we can preface static files with /public   ?? Do we need to mount again??  Scott doesn't think so, remove it temporarily.
//app.use("/public", express.static(__dirname + '/public'));

/**
 * The entry point for the routing, we just render view/home.jade which shows a 
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
		console.log('Render gui');
		res.render('gui', {title: 'AIM GUI', layout: false });
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

app.get('/cslogin',function(req,res) {
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('Logging in');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

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
 * Temporary test
 */
app.get('/addsensor',function(req,res) {
	if(req.session.auth && req.session.auth.loggedIn){
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});

/**
 * Let's for now redirect to aimlist upon a "Connect" click in a menu.
 */
app.get('/aimlist',function(req,res){

	console.log('I am in /aimlist');


	//res.render('gui', {title: 'AIM GUI', layout: false });
	//console.log('I am here in aimlist')
	respondFunction(req,res);
});

app.get('/aimports',function(req,res){

	console.log('I am in /aimports');
	respondFunction(req,res);
});

app.all('/aimrun',function(req,res){

	console.log('I am in /aimrun');
	respondFunction(req,res);
});

//We use helper functions from the everyauth framework
everyauth.helpExpress(app);

app.listen(8042);

watchDirectoryAndRecompile("src/sass", compile_sass);
watchDirectoryAndRecompile("src/haml", compile_haml);
watchDirectoryAndRecompile("src/coffee", compile_coffee);

console.log("ready: http://local.host:%d/", app.address().port);
