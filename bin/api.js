#!/usr/bin/env node

var program = require('commander');
var Server = require('../');

program.version(require('../package.json').version);

program.description('View logs in teal-time.');

program.option('-a, --addr [HOST]', 'Seaport HOST (default: 127.0.0.1)', '127.0.0.1');
program.option('-p, --port [PORT]', 'Seaport  PORT (default: 9090)', 9090);
program.option('-r, --region [REGION]', 'Region located in (us)');
program.option('-e, --environment [ENVIROMENT]', 'environment to use (services)');
program.option('-n, --name [NAME]', 'name to use (port)');
program.option('-m, --multi-tenant [MULTITENANT]', 'multiTenant (default: true)', true);
program.option('-s, --secret [SECRET]', 'secret');

program.parse(process.argv);

var config = {
	seaport : {
		host : program.addr,
		port : program.port
	},
	multiTenant : program.multiTenant,
	region : program.region,
	environment : program.environment,
	name : program.name,
	secret : program.secret
};
var s = Server.createServer(config);
s.listen(program.region + '-' + program.environment + '-' + program.name);
