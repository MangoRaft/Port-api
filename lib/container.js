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
			//socket : '/var/run/docker.sock'
			host : '127.0.0.1',
			port : 5000,
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

	container.info(function(err, result) {
		if (err) {
			return res.status(500).json({
				error : err
			});
		}
		res.status(200).json({
			container : result
		});
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
				error : err
			});
		}
		container.info(function(err, result) {
			if (err) {
				container.stop(true);
				return res.status(500).json({
					error : err
				});
			}
			res.status(200).json({
				container : result
			});
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
			return res.status(500).json({
				error : err
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
		return res.status(400).json({
			error : 'No container found'
		});
	}
	var container = Container.port.containers[id];

	function clean() {
		res.removeListener('end', clean);
		res.removeListener('error', clean);
		container.removeListener('wait', wait);
	}

	function wait(result) {
		console.log('wait', result)
		container._info.state = container.state;

		res.writeHead(200, {
			'Content-Type' : 'application/stream+json'
		});

		res.end(JSON.stringify({
			result : result,
			info : container._info
		}) + '\n');
	}


	container.on('wait', wait);
	res.once('end', clean).once('error', clean);
};
Container.waitAll = function(req, res, next) {
	debug('Container.waitAll');

	function clean() {
		res.removeListener('end', clean);
		res.removeListener('error', clean);
		Container.port.removeListener('wait', wait);
	}

	function wait(container, result) {
		console.log('waitAll', result)

		process.nextTick(function() {

			container._info.state = container.state;
			res.write(JSON.stringify({
				result : result,
				info : container._info
			}) + '\n');
		});
	}


	Container.port.on('wait', wait);
	res.once('end', clean).once('error', clean);

	res.writeHead(200, {
		'Content-Type' : 'application/stream+json'
	});
};
Container.version = function(req, res, next) {
	debug('Container.version');

	Container.port.docker.version(function(err, version) {
		if (err) {
			return res.status(500).json({
				error : err
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
				error : err
			});
		}
		res.status(200).json({
			info : version
		});
	});

};
