//Load all dependencies, install them via npm 
var express = require('express');
var http = require('http');
var sys = require('sys');
var exec = require('child_process').exec;
var watch = require('watch');
var url = require("url");
//var everyauth = require('everyauth');
var conf = require('./conf.js');






// a first pass sass parameter for  ??
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


/*
 * requirements for session data storage
 */


var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , mongooseAuth = require('mongoose-auth');

var UserSchema = new Schema(
		{
		})
  , User
  , Token
  , uuid;


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
          myHostname: 'http://local.host:8042'
        , appId: conf.fb.appId
        , appSecret: conf.fb.appSecret
        , redirectPath: '/gui'
        , findOrCreateUser: function (sess, accessTok, accessTokExtra, fbUser) {
        	
        	// test creation of uuid on Feb 18th
        	uuid = fbUser.id;
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
});

UserSchema.add(
		{
			token: String
		  , secret: String
		}
		);



var TokenSchema = new Schema(
		  {
			  userSchema   :  [UserSchema]
		    , token        :  { type: String}
		    , secret       :  { type: String }
		  }
);


// create the UserSchema, and TokenSchema Model
mongoose.model('User', UserSchema);
mongoose.model('Token', TokenSchema);

mongoose.connect('mongodb://localhost/example');

User = mongoose.model('User');
Token = mongoose.model('Token');


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
					
				    //console.log(user.fb.id);
				}
			)
		}
		else{
			console.log('I suspect that you even did not log in to the open session id (facebook, google, twitter)');
			mode = 0;
			exec("aimlist "+mode, function (error, stdout, stderr) { 
				res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
				res.write(stdout);
				res.end();
			});
		}
		
		/*
		if (Token.findbyID())
			mode = ..
		else
		*/	
		
		/*
		var first_user;
		User.findById(100000534972653, function(user){
			  first_user = user;
			});
		console.log(first_user._id);
		*/
		
		/*
		User.findOne({id: '100000534972653'}, function (err, user) {
			  console.log(user);
			});
		*/
		
		/*
		User.find({}, function (err, user) {
			if (user){
				//console.log(user.fb.id);
				console.log('success');
				}
				
			else
				console.log('fail');
			    //console.log(user.fb.id);
			});
		*/
		
		/*
		Token.findOne({'userSchema.fb.id': uuid}, function (err, token) {
			if (token){
				console.log(token.userSchema.fb.gender);
				console.log('success');
				}
				
			else
				console.log('fail');
			    //console.log(user.fb.id);
			});
		*/
		
		//console.log(req.user+"Wow!!");
		
		
			
		
		
		/*
		Token
		.findOne({'token': 'YmY3NDM3NWYyNjJjODg0M2RmNzA'})
		.populate('userSchema')
		.run(function (err, token) {
			if (token){
				setTimeout(console.log('success'),100);
				
				console.log(token.userSchema.fb.gender);
				}
				
			else
				console.log('fail');
			    //console.log(user.fb.id);
			}
		)
		*/
		
		
		/*
		User.findOne({'fb.id': uuid}, function (err, user) {
			if (user){
				console.log(user.fb.gender);
				console.log('success');
				}
				
			else
				console.log('fail');
			    //console.log(user.fb.id);
			});
		*/
		
		/*
		 * workable search!!! But far from being enough
		 */
		
		/*
		User.findOne({_id: '4f3f9eccaebd5c2e1b000057'}, function (err, user) {
			if (user){
				console.log(user.fb.email);
				console.log('success');
				}
				
			else
				console.log('fail');
			    //console.log(user.fb.id);
			});
		*/
		
		
		
		/*
		exec(setMode(req),exec("aimlist "+mode, function (error, stdout, stderr) { 
			console.log("aimlist "+mode);
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		}));
		*/
		
		
		
		/*
		console.log("mode:"+mode);
		exec("aimlist "+mode, function (error, stdout, stderr) { 
			res.writeHead(200, {"Content-Type": "text/plain", "Access-Control-Allow-Origin": "*"});
			res.write(stdout);
			res.end();
		});
		*/
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
		
		//var secret = Token.findbyID();
		//var token = mongodb.oauthtoken;
		
		var secret = req.session.oauthsecret;
		var token = req.session.oauthtoken;
		console.log("aimrun CSCreateSensorModule " + token + " " + secret);
		exec("aimrun CSCreateSensorModule " + token + " " + secret, function (error, stdout, stderr) {
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
		console.log("aimlogin oauth1 " + token + " " + secret + " " + verifier);
		exec("aimlogin oauth1 " + token + " " + secret + " " + verifier, function (error, stdout, stderr) {
			var vars = stdout.split("\n");
			
			//var instance = new User();
			for (var i = 0; i < vars.length-1; i++) { 
				console.log("t:" + vars[i]);
				
				// store oauthtoken and oauthsecret
				
				
				//if (i == 0) instance.token = vars[i]; 
				//if (i == 1) instance.secret = vars[i];
				if (i == 0) req.user.token = vars[i]; 
				if (i == 1) req.user.secret = vars[i];
				
			}
			/*
			 * error!!!
			 */
			//instance.userSchema=User;
			//Token.userSchema=User;
			
			
			//console.log(req.user.token+":...BE ALERGIC:"+req.user.secret);
			
			
			req.user.save(
					function (err)
					{
					}
			);
			
			
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

//"mount" the static middleware so we can preface static files with /public   ?? Do we need to mount again??  Scott doesn't think so, remove it temporarily.
//app.use("/public", express.static(__dirname + '/public'));

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
		console.log(":..."+req.session.auth.loggedIn);
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
		//if (loggedInCS())
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
	if(req.session.auth && req.session.auth.loggedIn){
	// don't forget openid
	//	if (Token.find == '' )
			// show non-cs only
	//	else 
			// show all modules, also cs
		
		
    // if logged in through cs
	// display common sense module too
	
	// else
	// display all modules except cs
		console.log('I am in /aimlist');
	


	//res.render('gui', {title: 'AIM GUI', layout: false });
	//console.log('I am here in aimlist')
	
	
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

app.all('/aimrun',function(req,res){
	if(req.session.auth && req.session.auth.loggedIn){
		console.log('I am in /aimrun');
		respondFunction(req,res);
	} else{
		console.log("The user is NOT logged in");
		res.redirect('/');
	}
});




//STEP 3: Add in Dynamic View Helpers (only if you are using express)
mongooseAuth.helpExpress(app);

app.listen(8042);
console.log("ready: http://local.host:%d/", app.address().port);

watchDirectoryAndRecompile("src/sass", compile_sass);
watchDirectoryAndRecompile("src/haml", compile_haml);
watchDirectoryAndRecompile("src/coffee", compile_coffee);


