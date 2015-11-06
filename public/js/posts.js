var lib = lib || {};

lib.Posts = function($wrapper) {
	if (!$wrapper) return this;
	this.init($wrapper);
};

lib.Posts.prototype.afterBuildMatrix = function() {
	var self = this;
	self.matrix.filter.topic = self.id;
	return self;
};

lib.Posts.prototype.getEditForm = function() {
	var str = 
		'<form class="form-horizontal form-edit thumbnail panel-body">' +
			'<div class="form-group">' +
				'<div class="col-sm-12">' +
					'<textarea class="form-control" rows="5" id="postMessage"></textarea>' +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<div class="col-sm-12">' +
					'<button type="submit" class="btn btn-default">Отправить</button>&nbsp;' +
					'<button type="button" class="btn btn-default btn-form-cancel">Скрыть</button>' +
				'</div>' +
			'</div>' +
		'</form>';
	return str;
};

lib.Posts.prototype.getPager = function() {
	var str = 
		'<div class = "clearfix">' +
		'<p class = "pull-left">' + 
		'<button class = "btn btn-default btn-sm btn-create">Новое сообщение</button>&nbsp;' +		
		'<span>&nbsp;Всего сообщений:&nbsp;</span> ' +
		'<span class = "matrix-records"></span> ' +		
		'</p></div>';
	return str;
};

lib.Posts.prototype.getTile = function() {
	var self = this;
	return '' + 
		self.data.rows.reduce(function(result, row) {
			return result += 
				'<div class="thumbnail">' +
				'<a href="/users.html/' + row.author + '">' +
				(row.authorname || '') + '</a>&nbsp;' +
				(row.dateUpdate || '') +
				'<div class="panel-body">' + (row.message || '') + '</div>' +
				'</div>';
		}, '');
};

lib.Posts.prototype.addEventListeners1 = function() {
	var self = this;
	self.$wrapper
		.on('click', '.btn-new-post', function(e){
			$('.form-new-post').show();
			$('#postMessage').focus();
		})
		.on('click', '.btn-form-new-post-hide', function(e){
			$('.form-new-post').hide();
		})
		.on('submit', function(e){
			
			return false;
		})
		.on('click', '.btn-prev-page', function(e) {
			if (self.matrix.page > 1) {
				self.matrix.page--;
				self.loadPosts();
			};
		})
		.on('click', '.btn-next-page', function(e) {
			if (self.matrix.page < self.matrix.pages) {
				self.matrix.page++;
				self.loadPosts();
			};
		})
		.on('change', '.matrix-page', function(e) {
			var page = $(e.target).select2('val');
			self.matrix.page = page;
			self.loadPosts();
		});
};

lib.Posts.prototype.onSubmitFormEdit = function(e) {
	var $el = $(e.target), 
		self = this;
	$.ajax({
		url: '/posts.json/create',
		type: 'post',
		dataType: 'json',
		data: {
			topic: self.id,
			message: $el.find('#postMessage').val()
		}
	}).done(function(data){
		$el.find('#postMessage').val('');
		self.loadMatrix();
	});
};