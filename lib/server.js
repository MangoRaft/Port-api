var express = require('express');
var seaport = require('seaport');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');

function Server(options) {

	this.options = options;

	this.secret = options.secret;

	this.seaport = seaport.connect(options.seaport.host, options.seaport.port);
	this.app = express();
	this.app.use(bodyParser.json());
	this.app.use(bodyParser.urlencoded({
		extended : true
	}));
	this.routes();
}

Server.prototype.routes = function() {
	var secret = this.secret;
	var container = require('./container');

	this.app.use(function(req, res, next) {
		if (!secret) {
			return next();
		}

		if (req.headers.secret == secret) {
			next();
		} else {
			res.status(403).json({
				error : 'Wrong auth token'
			});
		}
	});

	this.app.get('/container', timeout('15m'), container.all);
	this.app.post('/container', timeout('15m'), container.post);

	this.app['delete']('/container', container.distroy);

	this.app.get('/container/:id', timeout('15m'), container.get);
	this.app.get('/container/:id/wait', timeout('7d'), container.wait);
	this.app['delete']('/container/:id', timeout('15m'), container.del);

	this.app.get('/version', container.version);
	this.app.get('/info', container.info);

	container.start(this.options);
};

Server.prototype.listen = function(name) {
	var s = this.seaport.register(name, this.options)

	this.app.listen(s);
};

module.exports = Server;
