var config = require('../../config'),
	scheme = config.defaultScheme,
	Base = require('../base'),
	async = require('async'),
	pg = require('pg'),
	opts = {};
opts.render = 'views/perks';
opts.viewOpts = {title: 'Perks', view: 'perks'};
opts.perks = [
	/*'perks.html.read',
	'perks.json.create',
	'perks.json.read',
	'perks.json.update',
	'perks.json.del',
	'perks.json.services.getMatrix',
	'perks.json.services.select2'*/
];
opts.sql = {
	scheme: scheme,
	table: 'perks',
	columns: [
		{ type: 'id' },
		{ type: 'text', name: 'name' }
	]
};
opts.matrix = {
	perks: {
		name: 'perks',
		url: '/perks.json/read',
		method: 'post',
		page: 1,
		rows: 10,
		showFilters: true,
		showOrder: true,
		tableView: true,
		editButtons: true,
		rowList: [{id:10, text: '10'},{id:20, text: '20'},{id:30, text: '30'},{id:40, text: '40'},{id:50, text: '50'}],
		order: [{name: 'id', sort: 'asc'}],
		filter: {},
		columns: [
			{ name: 'id', title: '#' },
			{ name: 'name', title: 'Perk' }
		],
		editForm: [
			{name:'name',label:'Perk', formClass: 'simpleInput form-required-field' }
		]
	}
};
opts.services = {
	refresh: function(req, res, next ) {
		var self = this,
			arr = [];
		for (var model in self.models) {
			if (typeof(self.models[model]) == 'function') continue;
			arr.splice(arr.length, 0, 
				model + '.html.read',
				model + '.json.create',
				model + '.json.read',
				model + '.json.update',
				model + '.json.del'					
			);
			if (!self.models[model].opts.services) continue;
			for (var service in self.models[model].opts.services) {
				arr.push(model + '.json.services.' + service);
			};
		};
		async.waterfall([
			function(cb) { pg.connect(config.conString, cb); },
			function(client, done, cb) {
				client.query('Delete From ' + scheme + '.perks', function(err, result) {
					cb(err, client, done, result);
				});
			},
			function(client, done, result, cb) {
				var sql = {
						text:
							' Insert Into ' + scheme + '.perks (name) Values ' + 
							arr.reduce(function(result, el, i) {
								return (result.push( '($' + (i+1) + ')' ), result);
							}, ['(\'all\')']) +
							' Returning id ',
						values: arr
					};
				client.query(sql, function(err, result) {
					cb(err, client, done, result);
				});
			},
			function(client, done, result, cb) {
				var perks = [
						'topics.json.create',
						'posts.json.create',
						'posts.json.update',
						'games.json.create',
						'games.json.update',
						'games.json.del',
						'games.json.services.joingame',
						'games.json.services.doMove',
						'users.json.update'
					],
					sql = {
						text: 
							' Insert Into ' + scheme + '.perksToRoles (role, perk) Values ' +
							perks.reduce(function(result, el, i) {
								return (
									result.push(
										' ( (Select id From ' + scheme + '.roles Where name Like \'user\'), ' +
										' (Select id From ' + scheme + '.perks Where name Like $' + (i+1) + ' ) ) '
									),
									result
								);
							}, []),
						values: perks
					};
				client.query(sql, function(err, result) {
					cb(err, client, done, result);
				});
			},
			function(client, done, result, cb) {
				var perks = [
						'all'
					],
					sql = {
						text: 
							' Insert Into ' + scheme + '.perksToRoles (role, perk) Values ' +
							perks.reduce(function(result, el, i) {
								return (
									result.push(
										' ( (Select id From ' + scheme + '.roles Where name Like \'admin\'), ' +
										' (Select id From ' + scheme + '.perks Where name Like $' + (i+1) + ' ) ) '
									),
									result
								);
							}, []),
						values: perks
					};
				client.query(sql, function(err, result) {
					cb(err, client, done, result);
				});
			}
		], function(err, client, done, result) {
			done && done();
			if (err) return next(err);
			res.status(200).send( 'ok' );
		});	
	}
};

module.exports = new Base(opts);