var config = config || {};

config.defOpts = {
	map: {
		x: 23,
		y: 23,
		initAlgorithm: 'initMapRandom'
	},
	//colors: ['Yellow','BurlyWood'],
	colors: ['Yellow', 'BurlyWood', 'Green', 'MediumBlue', 'Red', 'Pink', 'Purple' ],
	blocks: ['Black'],
	players: [
		{nm: 'player1', x: 1, y: 23, color: 'Gray', isAi: true, score: 1},
		{nm: 'player2', x: 23, y: 1, color: 'White', isAi: true, score: 1},
		{nm: 'player3', x: 23, y: 23, color: 'GreenYellow', isAi: true, score: 1},
		{nm: 'player4', x: 1, y: 1, color: 'Gainsboro', isAi: true, score: 1},
	],
	playersColors: ['Gray', 'White', 'GreenYellow', 'Gainsboro' ],
	activePlayer: 0,
	moves: []
};

config.select2Opts = {
	minimumInputLength: 0,
	width: '100%',
	ajax: {
		url: '',
		dataType: 'json',
		type: 'post',
		quietMillis: 100,
		multiple: false,
		data: function (term, page) {
			return {
				q: term, 
				page_limit: 10, 
				page: page
			};
		},
		results: function (data, page) {
			var more = (page * 10) < data.total; 
			return {results: data.opts, more: more};
		}
	},
	formatResult: function(data) {return data.title;}, 
	formatSelection: function(data) {return data.text;}, 
	dropdownCssClass: 'remoteSelect'
};