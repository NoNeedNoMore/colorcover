var models = {
		index: require('./models/index'),
		users: require('./models/users'),
		games: require('./models/games'),
		topics: require('./models/topics'),
		posts: require('./models/posts'),
		roles: require('./models/roles'),
		perks: require('./models/perks'),
		sql: require('./models/sql'),
	};
for (var i in models) {
	models[i].models = models;
};
models.read = function(req, res, next) {
	req.action = 'read';
	req.format = req.params.format;
	models[req.params.model] ? models[req.params.model].read(req, res, next) : next();
};
models.create = function(req, res, next) {
	req.action = 'create';
	req.format = req.params.format;
	models[req.params.model] ? models[req.params.model].create(req, res, next) : next();
};
models.update = function(req, res, next) {
	req.action = 'update';
	req.format = req.params.format;
	models[req.params.model] ? models[req.params.model].update(req, res, next) : next();
};
models.del = function(req, res, next) {
	req.action = 'del';
	req.format = req.params.format;
	models[req.params.model] ? models[req.params.model].del(req, res, next) : next();
};
models.services = function(req, res, next) {
	req.action = 'services.' + req.params.id;
	req.format = req.params.format;
	models[req.params.model] ? models[req.params.model].services(req, res, next) : next();
};
models.error = function(err, req, res, next) {
	console.log(req.originalUrl, err );
	req.format == 'html' ? 
		err.message == '403' ?
			res.status(403).render('403') : res.status(404).render('404') : 
		res.status(200).json({err: err.message});
}
module.exports = models;