var Port = require('port-docker');
var path = require('path');
var fs = require('fs');
var async = require('async');

var Docker = require('dockerode');
var Container = module.exports;
var debug = require('debug')('Port-api');

Container.start = function(options) {
	debug('Container._start');

	Container.port = new Port({
		name : options.name,
		environment : options.environment,
		maxMemory : 2222222,
		multiTenant : options.multiTenant,
		docker : {
			socket : '/var/run/docker.sock',
			//host : '127.0.0.1',
			//port : 4243,
		}
	});
	Container.port.on('error', function(err) {
		console.log(err);
	});
	Container.port.run();
};

Container.get = function(req, res, next) {
	debug('Container.get');
	var id = req.params.id;

	if (!Container.port.containers[id]) {
		return res.status(400).json({
			error : 'No container found'
		});
	}
	var container = Container.port.containers[id];

	res.status(200).json({
		container : container.info
	});
};
Container.all = function(req, res, next) {
	debug('Container.all');

	var containers = {};

	async.parallelLimit(Object.keys(Container.port.containers).map(function(id) {
		return function(next) {
			Container.port.containers[id].info(function(err, result) {
				if (err) {
					return next(err);
				}
				next(null, result);
			});
		};
	}), 5, function(errors, results) {
		res.status(200).json({
			errors : errors,
			containers : results
		});
	});

};

Container.post = function(req, res, next) {
	debug('Container.post');
	Container.port.start(req.body, function(err, container) {
		if (err) {
			return res.status(500).json({
				stack : err.stack,
				arguments : err.arguments,
				type : err.type,
				message : err.message,
				status : err.status
			});
		}
		res.status(200).json({
			container : container.info
		});
	});
};

Container.distroy = function(req, res, next) {
	debug('Container.distroy');
	Container.port.destroy(function(result) {
		res.status(200).json({
			result : result
		});
	});
};

Container.del = function(req, res, next) {
	debug('Container.del');
	var id = req.params.id;

	if (!Container.port.containers[id]) {
		return res.status(400).json({
			error : 'No container found'
		});
	}
	var container = Container.port.containers[id];

	Container.port.stop(id, function(err) {
		if (err) {
			return res.status(400).json({
				stack : err.stack,
				arguments : err.arguments,
				type : err.type,
				message : err.message,
				status : err.status
			});
		}
		res.status(200).json({

		});
	});

};
Container.wait = function(req, res, next) {
	debug('Container.wait');
	var id = req.params.id;

	if (!Container.port.containers[id]) {

		var err = new Error('No contaner found by ID: ' + id)
		return res.status(500).json({
			stack : err.stack,
			arguments : err.arguments,
			type : err.type,
			message : err.message,
			status : err.status
		});
	}
	var container = Container.port.containers[id];

	res.writeHead(200, {
		'Content-Type' : 'application/stream+json'
	});

	var timmer = setInterval(function() {
		res.write('');
	}, 1000);

	function clean() {
		clearInterval(timmer);
		res.removeListener('end', clean);
		res.removeListener('error', clean);
		container.removeListener('wait', wait);
	}

	function wait(result) {
		res.end(JSON.stringify({
			result : result,
			info : container.info
		}) + '\n');
	}


	container.on('wait', wait);
	res.once('end', clean).once('error', clean);
};
Container.waitAll = function(req, res, next) {
	debug('Container.waitAll');

	req.setTimeout(120 * 60 * 60 * 100, clean);
	res.writeHead(200, {
		'Content-Type' : 'application/stream+json'
	});

	var timmer = setInterval(function() {
		res.write('');
	}, 5000);

	function clean() {
		clearInterval(timmer);
		res.removeListener('end', clean);
		res.removeListener('error', clean);
		Container.port.removeListener('wait', wait);
	}

	function wait(container, result) {

		process.nextTick(function() {

			res.write(JSON.stringify({
				result : result,
				info : container.info
			}) + '\n');
		});
	}


	Container.port.on('wait', wait);
	res.once('end', clean).once('error', clean);

};
Container.version = function(req, res, next) {
	debug('Container.version');

	Container.port.docker.version(function(err, version) {
		if (err) {
			return res.status(500).json({
				stack : err.stack,
				arguments : err.arguments,
				type : err.type,
				message : err.message,
				status : err.status
			});
		}
		res.status(200).json({
			version : version
		});
	});

};
Container.info = function(req, res, next) {
	debug('Container.info');

	Container.port.docker.info(function(err, version) {
		if (err) {
			return res.status(500).json({
				stack : err.stack,
				arguments : err.arguments,
				type : err.type,
				message : err.message,
				status : err.status
			});
		}
		res.status(200).json({
			info : version
		});
	});

};
