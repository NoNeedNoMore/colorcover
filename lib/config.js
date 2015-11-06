var config = {};

config.homePage = '/index.html';
config.maxAge = 31557600000; // One year
config.conString =
	process.env.HEROKU_POSTGRESQL_OLIVE_URL || 
		'postgres://hyafojdamgyhzw:Tw8ngqpb1laQQvPAiIfhHAOm2Q@' + 
		'ec2-54-217-238-93.eu-west-1.compute.amazonaws.com:5432/d5ia072r81l4sc' + '?ssl=true';
config.defaultScheme = 'colorcover';
config.dbSalt = '9YDyVCX9b9bdxrYzjOQM1IQA6bAhZctZvwRlSaVPYYs';
config.sessionSecret = 'hZ9QaSs6tYMXZzN6MOWbX1dOGWFY2ftj41hjg9fTOPs';
config.session = {
	secret: config.sessionSecret,
	resave: true,
	saveUninitialized: true
};
config.randomBytesSize = 32;
config.pbkdf2Keylen = 256;
config.pbkdf2Iterations = 10000;
config.port = process.env.PORT || 1337;
config.maxRows = 100;
config.jadePretty = true;
config.dateFormat = 'dd.mm.yyyy hh24:mi:ss';
config.selfUrl = {
	hostname: 'colorcover.herokuapp.com',
	port: '80',
	path: config.homePage,
	method: 'GET'
};

module.exports = config;