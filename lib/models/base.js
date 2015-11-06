var config = require('../config'),
	initTypes = require('./types'),
	async = require('async'),
	pg = require('pg');

function Base(opts) {
	var self = this;
	opts = opts || {};
	opts.services = opts.services || {};
	opts.services.getMatrix = function(req, res, next ) {
		res.status(200).json(opts.matrix[req.body.matrix]);
	};
	opts.services.select2 = function(req, res, next ) {
		pg.connect(config.conString, function(err, client, done) {
			if (err) return next(err);
			var sql = {
					text: 
						' Select Count(*) Over() As ct, id, name As title, name As "text" ' +
						' From ' + opts.sql.scheme + '.' + opts.sql.table + 
						' Where name Like \'%\' || $1 || \'%\' ' + ' Limit $2 Offset $3 ',
					values: [req.body.q, req.body.page_limit, req.body.page_limit * (req.body.page - 1)]
				};
			client.query(sql, function(err, result) {
				done();
				if (err) return next(err);
				res.status(200).json({total: result.rows.length ? result.rows[0].ct : 0, opts: result.rows });
			});
		});
	};
	if (opts.sql) {
		initTypes(opts.sql);
		opts.sql.order = opts.sql.columns.reduce(function(result, el, i){
			return (result[el.alias] = i, result);}, {});
	};
	self.opts = opts;
	for (var i in self) {
		if (typeof(self[i]) == 'function') {self[i].bind(self);};
	};
	return self;
};

module.exports = Base;

// **********************************************************************************************

Base.prototype.isAccessDenied = function(req) {
	var perk = req.params.model + '.' + req.params.format + '.' + req.action;
	if (req.session.perks && req.session.perks.indexOf('all') > -1) return false;	
	return ((req.session.perks && req.session.perks.indexOf(perk) > -1) || (this.opts.perks && this.opts.perks.indexOf(perk) > -1) ) ? false : perk;
};

Base.prototype.expandReq = function(req) {
	req.body.user = req.session.user;
};

// **********************************************************************************************

Base.prototype.read = function(req, res, next ) {
	if (this.isAccessDenied(req)) return next(new Error('403'));
	this.expandReq(req);
	if (req.params.format == 'html' && this.opts.render) {
		return this.readHtml(req, res, next );
	};
	if (req.params.format == 'json'){
		return this.readJson(req, function(err, result) { err ? next(err) : res.status(200).json(result); });
	};
	next();
};

Base.prototype.readHtml = function(req, res, next ) {
	var render = this.opts.render,
		viewOpts = this.opts.viewOpts;
	viewOpts.id = req.params.id;
	viewOpts.session = req.session;
	viewOpts.pretty = config.jadePretty;
	res.render(render, viewOpts );
};

Base.prototype.readJson = function(req, cb ) {
	var sql = this.getSqlRead(req.body, req.params.id);
	pg.connect(config.conString, function(err, client, done) {
		if (err) {return cb(err);};
		client.query(sql, function(err, result) {
			done();
			if (err) {return cb(err); };
			cb( null, {
				page: sql.page,
				pages: result.rows.length ? Math.ceil(result.rows[0].ct/sql.rows) : 0,
				records: result.rows.length ? result.rows[0].ct : 0,
				rows: result.rows
			});
		})
	});
};

Base.prototype.getSqlRead = function(body, id) {
	var select = this.getSelect(body.fields),
		table = (this.opts.sql.scheme ? this.opts.sql.scheme + '.' : '') + this.opts.sql.table,
		where = this.getWhere(body.filter || {}, id ),
		order = this.getOrder(body.order),
		rows = (+body.rows > 0) ? +body.rows : config.maxRows,
		page = (+body.page > 0) ? +body.page : 1,
		sql = {
			text: 
				' With a As ( Select Count(1) Over() As ct, id ' +
				' From ' + table + ' ' +
				(where.text ? (' Where 1=1 ' + where.text) : ' ') +	order +
				' Limit $' + (where.ct + 1) + ' Offset $' + (where.ct + 2) + ' ) ' +
				' Select ' + select +
				' From ' + table + ' ' + 
				' Where id In( Select id from a) ' + order,
			values: where.values.concat(rows, rows * (page - 1) ),
			page: page,
			rows: rows
		};
	return sql;
};

Base.prototype.getSelect = function(fields ) {
	 return (
	 	this.opts.sql.columns.reduce(function(result, el) {
			return (fields.indexOf(el.alias) > -1 && el.read) ? 
				(result.push(el.read + ' As "' + el.alias + '"'), result) : result;
		}, [' ( Select ct From a Limit 1 ) As ct '] )
	);
};

Base.prototype.getWhere = function(filter, id ) {
	return id ?
		{text: ' And id = $1', values: [id], ct: 1 } :
		this.opts.sql.columns.reduce(function(result, el) {
			return (filter[el.alias] !== undefined && el.search) ? 
				(
					result.ct++,
					result.text += ' And ' + el.search.replace('{$num}', '$' + result.ct),
					result.values.push(filter[el.alias]),
					result
				) : result;
		}, {text: '', values: [], ct: 0 });
};

Base.prototype.getOrder = function(order ) {	
	if (!order || !order.length) return '';
	var sql = this.opts.sql;
	order = order.reduce(function(result, el){
		var field = sql.columns[ sql.order[el.name] ];
		return (field && field.order) ? 
			(result.push(field.order + (el.sort == 'asc' ? ' asc ' : ' desc ') ), result) : result;
	}, [] );
	return order ? ' Order By ' + order : '';
};

// **********************************************************************************************

Base.prototype.create = function(req, res, next ) {
	if (this.isAccessDenied(req)) return next(new Error('403'));
	this.expandReq(req);
	if (req.params.format == 'json'){
		this.createJson(req, function(err, result) {
			if (err) next(err);
			res.status(200).json({id: result});
		});
	} else {
		next();
	};
};

Base.prototype.createJson = function(req, next ) {
	var self = this;
	pg.connect(config.conString, function(err, client, done) {
		if (err) {return next(err);};
		async.waterfall(
			[async.constant(client)].concat(self.getCreateWaterfall(req.body)),
			function(err, client, id) {
				if (err) {
					client.query('RollBack', function(err) {done(err);});
					return next(err);
				};
				client.query('Commit', done);
				next(null, id);
			}
		);
	});
};

Base.prototype.getCreateWaterfall = function(data) {
	var sql = this.getSqlCreate(data),
		waterfall = [ 
			function(client, cb) {
				client.query('Begin', function(err) { cb(err, client); });
			},
			function(client, cb) { client.query(sql[0], function(err, result) {
				var id = result.rows && result.rows[0].id;
				if (!id) return cb(new Error('Не удалось добавить запсиь'));
				cb(err, client, id ); 
			});}
		 ];
	if (sql.length > 1) {
		for (var i = 1; i < sql.length; i++) {
			(function(i) {
				waterfall.push(function(client, id, cb) {
					sql[i].values = (id + ',' + sql[i].values).split(',');
					client.query(sql[i], function(err, result) {cb(err, client, id); });
				});
			})(i);
		};
	};
	return waterfall;
};

Base.prototype.getCreate = function(data) {
	return (
		this.opts.sql.columns.reduce(function(result, el) {
			return (data[el.alias] && el.create) ? 
				(
					result.ct++,
					result.fields.push(el.field),
					result.create.push(el.create.replace('{$num}', '$' + result.ct)),
					result.values.push(data[el.alias]),
					result
				) : result;
		}, {fields: [], create: [], values: [], ct: 0 })
	);
};

Base.prototype.getCreatem2m = function(data) {
	return (
		this.opts.sql.columns.reduce(function(result, el) {
			return (data[el.alias] && el.createm2m) ? 
				(
					result.push({
						text: 
							'Insert Into ' + el.tablem2m + ' (' + el.to + ', '+ el.from + ') Values ' +
							data[el.alias].split(',').reduce(function(result, el, i) {
								return (result.push('($1,$' + (i+2) + ')'), result);
							}, [] ),
						values: data[el.alias]
					}),
					result
				) : result;
		}, [])
	);
};

Base.prototype.getSqlCreate = function(data) {
	var create = this.getCreate(data),
		table = (this.opts.sql.scheme ? this.opts.sql.scheme + '.' : '') + this.opts.sql.table,
		sql = [{
			text:
				' Insert Into ' + table +
				' ( ' + create.fields + ' ) ' +
				' Values (' + create.create + ' ) ' +
				' Returning id ',
			values: create.values
		}].concat(this.getCreatem2m(data));
	return sql;
};

// **********************************************************************************************

Base.prototype.update = function(req, res, next ) {
	if (this.isAccessDenied(req)) return next(new Error('403'));
	this.expandReq(req);
	if (req.params.format == 'json'){
		this.updateJson(req, function(err, result) {
			if (err) next(err);
			res.status(200).json({id: result});
		});
	} else {
		next();
	};
};

Base.prototype.updateJson = function(req, next ) {
	var self = this;
	pg.connect(config.conString, function(err, client, done) {
		if (err) {return next(err);};
		async.waterfall(
			[async.constant(client)].concat(self.getUpdateWaterfall(req.body, req.params.id)),
			function(err, client) {
				if (err) {
					client.query('RollBack', function(err) {done(err);});
					return next(err);
				};
				client.query('Commit', done);
				next(null, req.params.id);
			}
		);
	});
};

Base.prototype.getUpdateWaterfall = function(data, id) {
	var sql = this.getSqlUpdate(data, id),
		waterfall = [ 
			function(client, cb) {
				client.query('Begin', function(err) { cb(err, client); });
			},
			function(client, cb) { client.query(sql[0], function(err, result) {
				cb(err, client); 
			});}
		 ];
	if (sql.length > 1) {
		for (var i = 1; i < sql.length; i++) {
			(function(i) {
				waterfall.push(function(client, cb) {
					client.query(sql[i], function(err, result) {cb(err, client); });
				});
			})(i);
		};
	};
	return waterfall;
};

Base.prototype.getUpdatem2m = function(data, id) {
	var sqldel = [],
		sql = 
			this.opts.sql.columns.reduce(function(result, el) {
				if (el.updatem2m) {
					sqldel.push({
						text: 'Delete From ' + el.tablem2m + ' Where ' + el.to + ' = $1',
						values: [id]
					});
				};
				return (data[el.alias] && el.updatem2m) ? 
					(
						result.push({
							text: 
								'Insert Into ' + el.tablem2m + ' (' + el.to + ', '+ el.from + ') Values ' +
								data[el.alias].split(',').reduce(function(result, el, i) {
									return (result.push('($1,$' + (i+2) + ')'), result);
								}, [] ),
							values: (id + ',' + data[el.alias]).split(',')
						}),
						result
					) : result;
			}, []);
	return sqldel.concat(sql);
};

Base.prototype.getUpdate = function(data) {
	return (
		this.opts.sql.columns.reduce(function(result, el) {
			return (data[el.alias] && el.update) ? 
				(
					result.ct++,
					result.update.push(el.field + ' = ' + el.update.replace('{$num}', '$' + result.ct)),
					result.values.push(data[el.alias]),
					result
				) : result;
		}, {update: [], values: [], ct: 0 })
	);
};

Base.prototype.getSqlUpdate = function(data, id) {
	var update = this.getUpdate(data),
		table = (this.opts.sql.scheme ? this.opts.sql.scheme + '.' : '') + this.opts.sql.table,
		sql = [{
			text: 
				' Update ' + table +
				' Set ' + update.update +
				' Where id = $' + (update.ct + 1) + ' Returning id ',
			values: (update.values.push(id), update.values)
		}].concat(this.getUpdatem2m(data, id));
	return sql;
};

// **********************************************************************************************

Base.prototype.del = function(req, res, next ) {
	if (this.isAccessDenied(req)) return next(new Error('403'));
	this.expandReq(req);
	if (req.params.format == 'json'){
		this.delJson(req, res, next );
	} else {
		next();
	};
};

Base.prototype.delJson = function(req, res, next ) {
	var sql = {
			text: 
				' Delete From ' + (this.opts.sql.scheme ? this.opts.sql.scheme + '.' : '') + this.opts.sql.table + 
				' Where id = $1 Returning id ',
			values: [req.params.id]
		};	
	pg.connect(config.conString, function(err, client, done) {
		if (err) {res.end(); return console.error('error fetching client from pool', err);};
		client.query(sql, function(err, result) {
			done();
			if (err) {return next(err); };
			res.status(200).json([true, 'Успешно удалено', result.rows[0].id ]);
		})
	});
};

// **********************************************************************************************

Base.prototype.services = function(req, res, next ) {
	if (this.isAccessDenied(req)) return next(new Error('403'));
	this.expandReq(req);
	this.opts.services[req.params.id] ? this.opts.services[req.params.id].call(this, req, res, next) : next( new Error('Нет такого сервиса') );
};

// **********************************************************************************************

Base.prototype.rollback = function(err, client, done, cb) {
	client.query('RollBack', function(err) {done(err);});
	cb(err);
};