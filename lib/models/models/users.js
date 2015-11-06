var config = require('../../config'),
	scheme = config.defaultScheme,
	Base = require('../base'),
	async = require('async'),
	pg = require('pg'),
	crypto = require('crypto'),
	opts = {},
	users;
opts.render = 'views/users';
opts.viewOpts = {title: 'Users', view: 'users'};
opts.perks = [
	'users.html.read',
	'users.json.create',
	//'users.json.read',
	//'users.json.update',
	//'users.json.del',
	//'users.json.services.getMatrix',
	'users.json.services.login',
	'users.json.services.logout',
	'users.html.services.login'
];
opts.sql = {
	scheme: scheme,
	table: 'users',
	columns: [
		{ type: 'id' },
		{ type: 'text', name: 'username' },
		{ type: 'text', name: 'email' },
		{ type: 'm2m', name: 'roles', field: 'id', m2m: 'roles.role.rolesToUsers."user"' },
		{ type: 'm2m', name: 'rolesname', field: 'name', m2m: 'roles.role.rolesToUsers."user"' },
		{ type: 'm2m', name: 'perks', field: 'id', m2m: 'perks.perk.perksToUsers."user"' },
		{ type: 'm2m', name: 'perksname', field: 'name', m2m: 'perks.perk.perksToUsers."user"' }
	]
};

opts.matrix = {
	users: {
		name: 'users',
		url: '/users.json/read',
		method: 'post',
		showFilters: true, showOrder: true, tableView: true, editButtons: true, editFormOnTop: true,
		page: 1, rows: 10,
		rowList: [{id:10, text: '10'},{id:20, text: '20'},{id:30, text: '30'},{id:40, text: '40'},{id:50, text: '50'}],
		order: [{name: 'id', sort: 'asc'}],
		filter: {tagsname: 'activegame'},
		columns: [
			{ name: 'id', title: '#' },
			{ name: 'username', title: 'Имя' },
			{ name: 'email', title: 'Мыло' },
			{ name: 'roles', title: 'Roles', hidden: true },
			{ name: 'rolesname', title: 'Rolesname', hidden: true },
			{ name: 'perks', title: 'Perks', hidden: true },
			{ name: 'perksname', title: 'Perksname', hidden: true },
		],
		editForm: [
			{name:'username',label:'Логин', formClass: 'simpleInput form-required-field' },
			{name:'email',label:'Мыло', formClass: 'simpleInput form-required-field' },
			{name:'roles',label:'Роли', formClass: 'remoteMultiSelect', model: 'roles' },
			{name:'perks',label:'Перки', formClass: 'remoteMultiSelect', model: 'perks' },
		]
	}
};

opts.services = {
	login: function(req, res, next ) {
		if (req.params.format == 'html') {
			return res.render('views/login',{title: 'Регистрация/логин', session: req.session});
		};
		async.waterfall([
			function(cb) { req.session.regenerate(cb); },
			function(cb) { pg.connect(config.conString, cb); },
			function(client, done, cb) {
				var sql = {
						name: 'login',
						text: 
							' Select id, username, salt, hash, ' + 
							' (Select array_agg(name) From ' + scheme + '.roles ' +
								' Where id In(Select role From ' + scheme + '.rolesToUsers ' +
									' Where "user" = ' + scheme + '.users.id)) As roles, ' +
							' (Select array_agg(Distinct name) From ' + scheme + '.perks ' +
								' Where id In(Select perk From ' + scheme + '.perksToUsers ' +
									' Where "user" = ' + scheme + '.users.id ' +
							' Union Select perk From ' + scheme + '.perksToRoles ' +
								' Where role In (Select role From ' + scheme + '.rolesToUsers ' +
									' Where "user" = ' + scheme + '.users.id))) As perks ' + 
							' From ' + scheme + '.users ' +
							' Where Lower(username) = Lower($1) Or Lower(email) = Lower($1) ',
						values: [req.param('username')]
					};
				client.query(sql, function(err, result) {done(); cb(err, result); });
			},
			function(result, cb) {
				if (!result.rows.length) {
					return cb(new Error('Пользователь не найден'));
				};
				crypto.pbkdf2(
					req.param('password'),
					result.rows[0].salt + config.dbSalt,
					config.pbkdf2Iterations,
					config.pbkdf2Keylen,
					function(err, key) {cb(err, key, result); });
			},
			function(key, result, cb) {
				if (result.rows[0].hash == key.toString('base64')) {
					req.session.user = result.rows[0].id;
					req.session.username = result.rows[0].username;
					req.session.roles = result.rows[0].roles;
					req.session.perks = result.rows[0].perks;
					res.status(200).json({
						username: req.session.username,
						roles: req.session.roles
					});
					cb(null);
				} else {
					cb(new Error('Неверный логин/мыло или пароль'));
				};
			}
		], function(err) { if (err) next(err); });
	},
	logout: function(req, res, next ) {
		req.session.destroy(function(err) {
			err ? next(err) : res.status(200).json('ok');
		});
	}
};

users = new Base(opts);

users.createJson = function(req, next ) {
	async.waterfall([
		function(cb) {crypto.randomBytes(config.randomBytesSize, cb )},
		function(buf, cb) {
			var salt = buf.toString('base64');
			crypto.pbkdf2(
				req.param('password'),
				salt + config.dbSalt,
				config.pbkdf2Iterations,
				config.pbkdf2Keylen,
				function(err, key) {cb(err, key, salt); });
		},
		function(key, salt, cb) {
			var sql = {
					name: 'createNewUser',
					text: 
						' Insert Into ' + scheme + '.users (username, email, hash, salt) ' +
						' Values ($1, $2, $3, $4 ) Returning id ',
					values: [req.param('username'), req.param('email'), key.toString('base64'), salt ]
				};
			pg.connect(config.conString, function(err, client, done) { cb(err, client, done, sql); });
		},
		function(client, done, sql, cb) {
			client.query(sql, function(err, result) {cb(err, client, done, result); });
		},
		function(client, done, result, cb) {
			var sql = {
					text: 
						' Insert Into ' + scheme + '.rolesToUsers (role, "user") ' +
						' Values ( (Select id From ' + scheme + '.roles Where name = \'user\'), $1)',
					values: [result.rows[0].id]
				};
			client.query(sql, function(err) {cb(err, client, done, result); });
		},
		function(client, done, result, cb) {
			var sql = {
					name: 'login',
					text: 
						' Select id, username, salt, hash, ' + 
						' (Select array_agg(name) From ' + scheme + '.roles ' +
							' Where id In(Select role From ' + scheme + '.rolesToUsers ' +
								' Where "user" = ' + scheme + '.users.id)) As roles, ' +
						' (Select array_agg(Distinct name) From ' + scheme + '.perks ' +
							' Where id In(Select perk From ' + scheme + '.perksToUsers ' +
								' Where "user" = ' + scheme + '.users.id ' +
						' Union Select perk From ' + scheme + '.perksToRoles ' +
							' Where role In (Select role From ' + scheme + '.rolesToUsers ' +
								' Where "user" = ' + scheme + '.users.id))) As perks ' + 
						' From ' + scheme + '.users ' +
						' Where Lower(username) = Lower($1) Or Lower(email) = Lower($1) ',
					values: [req.param('username')]
				};
			client.query(sql, function(err, result) {cb(err, client, done, result); });
		},
	], function(err, client, done, result) {
		done && done();
		if (err) return next(err);
		if (result.rows.length) {
			req.session.user = result.rows[0].id;
			req.session.username = result.rows[0].username;
			req.session.roles = result.rows[0].roles;
			req.session.perks = result.rows[0].perks;
			next(null, result.rows[0].id);	
		} else {
			next(new Error('Не удалось создать нового пользователя'));
		};
	});
};

module.exports = users;