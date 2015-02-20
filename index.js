var Server = require('./lib/server');

exports.createServer = function(options) {
	return new Server(options);
};
