var config = require('../../config'),
	pg = require('pg'),
	opts = {};
opts.render = 'views/sql';
opts.viewOpts = {title: 'sql', view: 'sql'};
opts.perks = [
	/*'sql.html.read',
	'sql.json.services.executeRawSql'*/
];
opts.services = {
	executeRawSql: function(req, res, next ) {
		pg.connect(config.conString, function(err, client, done) {
			if (err) {return next(err); };
			client.query(req.param('sql', ''), function(err, result) {
				done(); 
				if(err) {return next(err); };
				res.status(200).json(result);
			});
		});
	}
};

module.exports = new (require('../base'))(opts);