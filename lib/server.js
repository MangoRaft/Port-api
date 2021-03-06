var express = require('express');
var bodyParser = require('body-parser');
var timeout = require('connect-timeout');
var os = require('os');

function Server(options) {

	this.options = options;

	this.secret = options.secret;

	this.app = express();
	this.app.use(function(req, res, next) {
		res.setTimeout(0);
		res.on('timeout', function() {

		});
		next();
	});
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

	this.app.get('/container', container.all);
	this.app.post('/container', container.post);

	this.app['delete']('/container', container.distroy);

	this.app.get('/container/:id', container.get);
	this.app.get('/container/:id/wait', container.wait);
	this.app.get('/wait', container.waitAll);
	this.app['delete']('/container/:id', container.del);

	this.app.get('/version', container.version);
	this.app.get('/info', container.info);
	this.app.get('/health', function(req, res) {
		res.status(200).json({
			memoryUsage : process.memoryUsage(),
			uptime : os.uptime(),
			loadavg : os.loadavg(),
			totalmem : os.totalmem(),
			freemem : os.freemem()
		});
	});

	container.start(this.options);
};

Server.prototype.listen = function() {

	this.app.listen(this.options.port, this.options.host);
};

module.exports = Server;
