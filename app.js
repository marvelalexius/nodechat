const express = require('express');
const app = express();
const session = require('express-session');
// const bodyParser = require('body-parser');
// const cookie_parser = require('cookie-parser');
// const bodyParser = body_parser();
// const cookieParser = cookie_parser();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const passport = require('passport');
const facebookStrategy = require('passport-facebook');

// Middleware Init
// app.use(express.static('public'));
// app.use(cookieParser);
// app.use(bodyParser());
let sessionMid = session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: false }
});

io.use(function(socket, next) {
	sessionMid(socket.request, socket.request.res, next);
});

app.use(sessionMid);
app.use(passport.initialize());
app.use(passport.session());

// app.use(app.router);
// app.use(passport.initialize());
// app.use(passport.session());
passport.use(new facebookStrategy({
		clientID: '1924942854416036',
		clientSecret: '7346a27c8f704508c2802de652f9067a',
		callbackURL: "http://localhost:3000/auth/facebook/callback"

	},

	function(accessToken, refreshToken, profile, cb) {
		// User.findOrCreate({ facebookId: profile.id }, function(err, user) {
		// 	if (err) { return done(err); }
		// 	done(null, user);
		// });
		console.log(profile);
		return cb(null, profile);
	}
	));

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(user, done) {
	done(null, user);
});
// Middleware End

function checkAuthenticate(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.send('<a href="/auth/facebook">login</a>')
	}
}

app.get('/', checkAuthenticate, function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/logout', function(req, res) {
	req.session.destroy();
});

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate(
	'facebook', { 
		successRedirect: '/', failureRedirect: '/login'
	}), function(req, res) {
		res.redirect('/');
	}
);

io.on('connection', function(socket) {
	console.log('A User Connected');
	// socket.on('disconnect', function() {
	// 	console.log('A User Disconnected');
	// });
	socket.on('chat message', function(msg) {
		let sess = socket.request.session.passport;
		let newmsg = sess.user.displayName + " : " + msg;
		io.emit('chat message', newmsg);
	});
});

http.listen('3000', function() {
	console.log('App Starting At Port 3000');
});