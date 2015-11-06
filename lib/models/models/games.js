var config = require('../../config'),
	Base = require('../base'),
	scheme = config.defaultScheme,
	async = require('async'),
	pg = require('pg'),
	opts = {},
	games;
opts.render = 'views/games';
opts.viewOpts = {title: 'Games', view: 'games'};
opts.perks = [
	'games.html.read',
	//'games.json.create',
	'games.json.read',
	//'games.json.update',
	//'games.json.del',
	'games.json.services.getMatrix',
	//'games.json.services.fastgame',
	//'games.json.services.doMove',
	'games.html.services.single',
	'games.html.services.multi'
];
opts.sql = {
	scheme: scheme,
	table: 'games',
	columns: [
		{ type: 'id' },
		{ type: 'date', name: 'dateCreate' },
		{ type: 'bool', name: 'isNew' },
		{ type: 'bool', name: 'isActive' },
		{ alias: 'game', read: 'game' },
		{
			alias: 'player1',
			search: ' Lower(game->\'players\'->0->>\'name\') Like \'%\' || Lower({$num}) || \'%\' ',
			read: ' game->\'players\'->0->>\'name\' ',
			order: ' game->\'players\'->0->>\'name\' '
		},
		{
			alias: 'player2',
			search: ' Lower(game->\'players\'->1->>\'name\') Like \'%\' || Lower({$num}) || \'%\' ',
			read: ' game->\'players\'->1->>\'name\' ',
			order: ' game->\'players\'->1->>\'name\' '
		},
		//{ type: 'm2m', name: 'tags', field: 'id', m2m: 'tags.tag.tagsToGames.game' },
		//{ type: 'm2m', name: 'tagsname', field: 'name', m2m: 'tags.tag.tagsToGames.game' }
	]
};
opts.matrix = {};
opts.matrix.callGames = {
	version: 1,
	url: '/games.json/read',
	method: 'post',
	page: 1,
	rows: 1000,
	editFormOnTop: true,
	rowList: [],
	order: [{name: 'id', sort: 'asc'}],
	filter: {isNew: true},
	columns: [
		{ name: 'id', title: '#' },
		{ name: 'player1', title: 'Первый игрок' },
		{ name: 'player2', title: 'Второй игрок' },
		{ name: 'game', title: 'game', hidden: true, hide: true }
	],
	editForm: [
		{name:'width',label:'Ширина', formClass: 'simpleInput', value: 13 },
		{name:'height',label:'Высота', formClass: 'simpleInput', value: 13 },
		{name:'colors',label:'Цвета', formClass: 'localMultiSelect', value: ['yellow', 'burlywood', 'green', 'mediumblue', 'red', 'pink', 'purple' ], data: [{id: 'yellow'},{id: 'burlywood'},{id: 'green'},{id: 'mediumblue'},{id: 'red'},{id: 'pink'},{id: 'purple'}] },
		{name:'seconds',label:'Секунд на ход', formClass: 'localSelect', data: [{id: 1},{id: 2},{id: 5},{id: 10},{id: 'endless', title: 'неограниченно'}] },
	]
};
opts.matrix.activeGames = {
	version: 1,
	url: '/games.json/read',
	method: 'post',
	page: 1,
	rows: 10,
	showFilters: true,
	showOrder: true,
	tableView: true,
	editButtons: true,
	rowList: [{id:10, text: '10'},{id:20, text: '20'},{id:30, text: '30'},{id:40, text: '40'},{id:50, text: '50'}],
	order: [{name: 'id', sort: 'asc'}],
	filter: {isActive: true},
	columns: [
		{ name: 'id', title: '#' },
		{ name: 'player1', title: 'Первый игрок' },
		{ name: 'player2', title: 'Второй игрок' },
		{ name: 'game', title: 'game', hidden: true, hide: true }
	]
};
opts.matrix.games = {
	version: 1,
	url: '/games.json/read',
	method: 'post',
	page: 1,
	rows: 10,
	showFilters: true,
	showOrder: true,
	tableView: true,
	editButtons: true,
	rowList: [{id:10, text: '10'},{id:20, text: '20'},{id:30, text: '30'},{id:40, text: '40'},{id:50, text: '50'}],
	order: [{name: 'id', sort: 'asc'}],
	filter: {isActive: false, isNew: false},
	columns: [
		{ name: 'id', title: '#' },
		{ name: 'player1', title: 'Первый игрок' },
		{ name: 'player2', title: 'Второй игрок' },
		{ name: 'game', title: 'game', hidden: true, hide: true }
	]
};
opts.matrix.single = {
	name: 'singleGame',
	editForm: [
		{name:'width',label:'Ширина', formClass: 'simpleInput', value: 13 },
		{name:'height',label:'Высота', formClass: 'simpleInput', value: 13 },
		{name:'colors',label:'Цвета', formClass: 'localMultiSelect', value: ['yellow', 'burlywood', 'green', 'mediumblue', 'red', 'pink', 'purple' ], data: [{id: 'yellow'},{id: 'burlywood'},{id: 'green'},{id: 'mediumblue'},{id: 'red'},{id: 'pink'},{id: 'purple'}] },
		{name:'player1',label:'Игрок №1', formClass: 'localSelect', value: 'human', data: [{id: 'empty', title: 'Пусто'}, {id: 'human', title: 'Человек'}, {id: 'bot', title: 'Бот'}] },
		{name:'player2',label:'Игрок №2', formClass: 'localSelect', value: 'bot', data: [{id: 'empty', title: 'Пусто'}, {id: 'human', title: 'Человек'}, {id: 'bot', title: 'Бот'}] },
		{name:'player3',label:'Игрок №3', formClass: 'localSelect', value: 'empty', data: [{id: 'empty', title: 'Пусто'}, {id: 'human', title: 'Человек'}, {id: 'bot', title: 'Бот'}] },
		{name:'player4',label:'Игрок №4', formClass: 'localSelect', value: 'empty', data: [{id: 'empty', title: 'Пусто'}, {id: 'human', title: 'Человек'}, {id: 'bot', title: 'Бот'}] },
		{name:'seconds',label:'Секунд на ход', formClass: 'localSelect', data: [{id: 1},{id: 2},{id: 5},{id: 10},{id: 'endless', title: 'неограниченно'}] },
	]
};
opts.services = {
	single: function(req, res, next ) {
		if (req.params.format == 'html') {
			return res.render('views/single',{title: 'Single', session: req.session, view: 'single'});
		};
	},
	multi: function(req, res, next ) {
		if (req.params.format == 'html') {
			return res.render('views/multi',{title: 'Multi', session: req.session, view: 'multi'});
		};
	},
	joingame: function(req, res, next) {
		var self = this,
			id = req.body.id,
			sql = {
				text: 
					' Select id, game From ' + scheme + '.games a ' + 
					' Where ' + 
						' Not Exists( Select * From ' + scheme + '.usersToGames Where "user" = $1 And game = a.id ) ' +
						' And isNew And id = $2 ' + 
					' For Update Limit 1 ',
				values: [req.session.user, id]
			};
		pg.connect(config.conString, function(err, client, done) {
			if (err) return next(err);
			client.query(sql, function(err, result) {				
				if (err) { done(); return next(err); };
				if (result.rows.length) {
					var gameid = result.rows[0].id,
						sql = {
							text: ' Insert Into ' + scheme + '.usersToGames (game, "user", sequence ) Values ($1, $2, $3 ) ',
							values: [gameid, req.session.user, 1 ]
						},
						game = result.rows[0].game;
					game.players.push({
						name: req.session.username,
						x: game.map.x,
						y: 1,
						color: 'white',
						score: 1
					});
					game.map[game.players[0].x + '_' + game.players[0].y] = game.players[0].color;
					game.map[game.players[1].x + '_' + game.players[1].y] = game.players[1].color;
					client.query(sql, function(err, result){
						if (err) {done(); return next(); };
						var sql = {
							text: ' Update ' + scheme + '.games Set game = $1, isNew = false, isActive = true Where id = $2 ',
							values: [game, gameid]
						};
						client.query(sql, function(err, result){
							done();
							if (err) { return next(err); };
							req.io.sockets.in('game' + gameid).emit('start', {room: 'game' + gameid});
							req.io.sockets.in('callGames').emit('refresh');
							req.io.sockets.in('activeGames').emit('refresh');
							res.status(200).json({id: gameid, isReady: true });
						});
					});												
				} else {
					done();
					next(new Error('Не удалось присоединиться к игре'));
				};
			});
		});
	},
	doMove: function(req, res, next ) {
		var id = req.body.id,
			xy = req.body.xy,
			self = this,
			sql = {
				text: ' Select game From ' + scheme + '.games Where id = $1 For Update ',
				values: [id]
			};
		pg.connect(config.conString, function(err, client, done){
			if (err) {return next(err); };
			client.query(sql, function(err, result){
				if (err) {done(); return next(err); };
				var game = result.rows[0].game;
				if (game.players[game.activePlayer].name != req.session.username) {
					done();
					return res.status(200).json({error: {msg: 'Not you turn'} });
				};				
				if (!self.checkMove(game, xy)) {
					done();
					return res.status(200).json({error: {msg: 'Bad move'} });
				} else {
					var isEnd = self.checkEnd(game),
						sql = {
							text: ' Update ' + scheme + '.games Set game = $1, isActive = $3 Where id = $2 ',
							values: [game, id, !isEnd]
						};
					client.query(sql, function(err, result){
						done();
						if (err) {return next(err); };
						isEnd ? 
							(
								req.io.sockets.in('game' + id).emit('end', {room: 'game' + id, game: game}),
								req.io.sockets.in('activeGames').emit('refresh'),
								req.io.sockets.in('games').emit('refresh')
							) :
							req.io.sockets.in('game' + id).emit('move', {room: 'game' + id, game: game});
						res.status(200).json(game);
					});
				};
			});
		});
	}
};

games = new Base(opts);

games.check = function(game, xy, colors) {
	var self = game,
		arr = [xy],
		arrOfNeighbors = [],
		color = self.map[xy],
		x = 0,
		y = 0,
		hasNeighbors = false,
		check = function(xy) {
			self.map[xy] == color && arr.indexOf(xy) == -1 ? arr.push(xy) : null;
			colors.indexOf(self.map[xy]) != -1 ? 
				(hasNeighbors = true, arrOfNeighbors.indexOf(xy) == -1 ? arrOfNeighbors.push(xy): null) : null;
			return check;
		};
	for (var i = 0; i < arr.length; i++ ) {
		x = +arr[i].split('_')[0];
		y = +arr[i].split('_')[1];
		check
			( (x + 1) + '_' + y )
			( (x - 1) + '_' + y )
			( x + '_' + (y + 1) )
			( x + '_' + (y - 1) );
	};
	return {arr: arr, hasNeighbors: hasNeighbors, arrOfNeighbors: arrOfNeighbors};
};

games.checkMove = function(game, xy) {
	var self = game,
		color = self.map[xy],
		player = self.players[self.activePlayer].color,
		check = this.check(game, xy, [player]);
	if (self.playersColors.indexOf(color) != -1) {return false; };
	if (check.hasNeighbors) {
		self.players[self.activePlayer].score += check.arr.length;
		check.arr.forEach(function(val) {self.map[val] = player; });
		self.activePlayer = self.activePlayer < (self.players.length - 1) ? self.activePlayer + 1 : 0;
	};
	self.diff = check.arr;
	return check.hasNeighbors;
};

games.checkEnd = function(game) {
	var self = game,
		xy = self.players[self.activePlayer].x + '_' + self.players[self.activePlayer].y,
		check = this.check(game, xy, self.colors),
		player = self.activePlayer < (self.players.length - 1) ? self.activePlayer + 1 : 0;
	if (!check.hasNeighbors) {
		xy = self.players[player].x + '_' + self.players[player].y;
		check = this.check(game, xy, self.colors);
		while (check.hasNeighbors) {
			self.players[player].score += check.arrOfNeighbors.length;
			check.arrOfNeighbors.forEach(function(val) {self.map[val] = self.players[player].color; });
			check = this.check(game, xy, self.colors);
		};
		return true;
	};
	return false;
};

games.createJson = function(req, next ) {
	var game = {
			map: {
				x: +req.body.width || 13,
				y: +req.body.height || 13
			},
			colors: req.body.colors,
			players: [],
			playersColors: ['gray', 'white'],
			activePlayer: 0,
			moves: []
		};
	for (var y = 1; y <= game.map.y; y++ ){
		for (var x = 1; x <= game.map.x; x++ ){
			game.map[x + '_' + y] = game.colors[Math.floor(Math.random() * game.colors.length)];
		};
	};
	game.players.push({
		name: req.session.username,
		x: 1,
		y: game.map.y,
		color: 'gray',
		score: 1
	});
	async.waterfall([
		function(cb) {pg.connect(config.conString, cb); },
		function(client, done, cb) {
			var sql = {
				name: 'createNewGame',
				text: 
					' Insert Into ' + scheme + '.games (author, game, isNew ) ' +
					' Values ($1, $2, $3 ) Returning id ',
				values: [req.session.user, game, true ]
			};
			client.query(sql, function(err, result) {				
				cb(err, client, done, result.rows[0].id);
			});
		},
		function(client, done, id, cb) {
			var sql = {
					text:
						' Insert Into ' + scheme + '.usersToGames (game, "user", sequence ) ' +
						' Values ($1, $2, $3 ) ',
					values: [id, req.session.user, 0]
				};
			client.query(sql, function(err, result) {
				cb(err, client, done, id);
			});
		}
	], function(err, client, done, id) {
		done && done();
		req.io.sockets.in('callGames').emit('refresh');
		req.io.sockets.in('activeGames').emit('refresh');
		next(err, id);
	});
};
games.delJson = function(req, res, next ) {
	var sql = {
			text: 
				' Delete From ' + (this.opts.sql.scheme ? this.opts.sql.scheme + '.' : '') + this.opts.sql.table + 
				' Where id = $1 Returning id ',
			values: [req.params.id]
		};	
	pg.connect(config.conString, function(err, client, done) {
		if (err) {return next(err);};
		client.query(sql, function(err, result) {
			done();
			if (err) {return next(err); };
			req.io.sockets.in('callGames').emit('refresh');
			res.status(200).json({id: result.rows[0].id});
		})
	});
};
module.exports = games;