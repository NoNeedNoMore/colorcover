var config = require('../../config'),
	scheme = config.defaultScheme,
	Base = require('../base'),
	pg = require('pg'),
	opts = {},
	posts;
opts.render = 'views/topics';
opts.viewOpts = {title: 'Forum', view: 'topics'};
opts.perks = [
	'posts.html.read',
	//'posts.json.create',
	'posts.json.read',
	//'posts.json.update',
	//'posts.json.del',
	'posts.json.services.getMatrix'
];
opts.sql = {
	scheme: scheme,
	table: 'posts',
	columns: [
		{ type: 'id' },
		{ type: 'fk', name: 'topic' },
		{ type: 'fk', name: 'author' },
		{ type: 'fkText', name: 'authorname', key: 'author.users.username' },
		{ type: 'date', name: 'dateUpdate' },
		{ type: 'text', name: 'message' }
	]
};
opts.matrix = {
	posts: {
		url: '/posts.json/read',
		method: 'post',
		page: 1,
		rows: 10000,
		showFilters: false,
		showOrder: false,
		tableView: false,
		rowList: [{id:1000, text: '1000'}],		
		order: [{name: 'id', sort: 'asc'}],
		filter: {tagsname: 'activegame'},
		columns: [
			{ name: 'id', title: '#' },
			{ name: 'message', title: 'Сообщение' },
			{ name: 'author', title: 'Автор' },
			{ name: 'authorname', title: 'Автор' },
			{ name: 'dateUpdate', title: 'Обновлено' }
		]
	}
};
posts = new Base(opts);

posts.expandReq = function(req) {
	req.body.author = req.session.user;
};

module.exports = posts;