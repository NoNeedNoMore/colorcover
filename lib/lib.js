var config = require('./config'),
	pg = require('pg'),
	lib = {};

lib.pgSessionStore = function(session) {
	var Store = session.Store,
		pgStore = function() {
			return this;
		},
		scheme = config.defaultScheme;

	pgStore.prototype.__proto__ = Store.prototype;

	pgStore.prototype.get = function(sid, cb) {
		pg.connect(config.conString, function(err, client, done) {
			if (err) {return cb(err); };
			client.query({
				name: 'getSession',
				text: 'Select session From ' + scheme + '.sessions Where id = $1',
				values: [sid]
			}, function(err, result) {
				done();
				if (err) {return cb(err); };
				if (!result.rows.length) {return cb(); };
				return cb(null, result.rows[0].session);
			})
		});
	};

	pgStore.prototype.set = function(sid, sess, cb) {
		pg.connect(config.conString, function(err, client, done) {
			if (err) {return cb(err); };
			client.query({
				name: 'insertOrUpdateSession',
				text: 
					' With a As (Update ' + scheme + '.sessions Set session = $2 Where id = $1) ' +
					' Insert Into ' + scheme + '.sessions (id,session) ' + 
					' (Select * From (Values ($1, $2) ) b ' +
					' Where Not Exists (Select * From ' + scheme + '.sessions Where id = $1)) ',
				values: [sid, sess]
			}, function(err, result) {
				done();
				if (err) {return cb(err); };
				return cb(null, sid);
			});
		});
	};

	pgStore.prototype.destroy = function(sid, cb) {
		pg.connect(config.conString, function(err, client, done) {
			if (err) return cb && cb(err);
			client.query({
				name: 'destroySession',
				text: 'Delete From ' + scheme + '.sessions Where id = $1 Returning id',
				values: [sid]
			}, function(err, result){
				done();
				if (err) {return cb && cb(err); };
				return cb && cb(null, result.rows.length && result.rows[0].id);
			});
 		});
	};
	return pgStore;
};

module.exports = lib;