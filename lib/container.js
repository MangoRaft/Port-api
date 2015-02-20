var Port = require('../../Port/lib/port');
var path = require('path');
var fs = require('fs');
var async = require('async');

var Docker = require('dockerode');
var Container = module.exports;

Container.start = function(options) {

	Container.port = new Port({
		name : options.name,
		environment : options.environment,
		maxMemory : 2222222,
		multiTenant : options.multiTenant,
		docker : {
			socket : '/var/run/docker.sock'
			//host : '192.168.1.139',
			//port : 5001,
		}
	});
	Container.port.run()
};

Container.get = function(req, res, next) {
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
	console.log(req.body)
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
	Container.port.once('destroyed', function(result) {
		res.status(200).json({
			result : result
		});
	});
	Container.port.destroy();
};

Container.del = function(req, res, next) {
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
		res.status(200).json({
			result : result
		});
	}


	container.on('wait', wait);
	res.once('end', clean).once('error', clean);
};
Container.version = function(req, res, next) {

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
