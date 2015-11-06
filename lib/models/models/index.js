var index = new (require('../base'))({
		render: 'views/index',
		viewOpts: {title: 'Colorcover', view: 'index'},
		perks: [
			'index.html.read'
		]
	});

module.exports = index;