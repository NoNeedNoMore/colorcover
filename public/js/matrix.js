var lib = lib || {};

lib.Matrix = function($wrapper) {
	if (!$wrapper) return this;
	this.init($wrapper);
};

lib.Matrix.prototype.init = function($wrapper) {
	var self = this,
		matrix = $wrapper.data('matrix');
	self.name = matrix;
	self.$wrapper = $wrapper;
	self.model = $wrapper.data('model');
	self.id = $wrapper.data('id');
	$.ajax({
		url: '/' + self.model + '.json/services/getMatrix',
		type: 'post',
		dataType: 'json',
		data: {matrix: matrix}
	}).done(function(data) {
		self.matrix = $.extend({}, data);
		self.buildMatrix();
		self.addEventListeners();
		self.addSocetEvetnListeners();
		self.addCustomEventListeners();
	});
	return self;
};

lib.Matrix.prototype.buildMatrix = function() {
	var self = this,
		str =
			(self.matrix.editFormOnTop ? self.getEditForm() : '') +
			self.getSettingsForm() +
			self.getPager() +
			self.getMatrix() +
			self.getPager() +
			(!self.matrix.editFormOnTop ? self.getEditForm() : '');	
	self.$wrapper.append(str);
	lib.initByClass(self.$wrapper.find('.form-edit'));
	self.afterBuildMatrix();
	self.loadMatrix();
	return self;
};

lib.Matrix.prototype.afterBuildMatrix = function() {
	return this;
};

lib.Matrix.prototype.getEditForm = function() {
	var self = this,
		str = '',
		requireMark = '<span><font color="#CC0000">*</font></span>',
		id = self.model;
	if (!self.matrix.editForm) return '';
	str += 
		'<form class="form-horizontal form-edit thumbnail panel-body">' +
		self.matrix.editForm.reduce(function(result, el) {
			if (!el.formClass) return result;
			if (el.formClass.indexOf('simpleInput') > -1 ) {
				result += 
					'<div class = "form-group">' +
					'<label class = "control-label col-sm-3" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<input type="text" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + ' form-control" value="' + (el.value || '') + '"/>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('remoteSelect') > -1 ) {
				result += 
					'<div class = "form-group">' +
					'<label class = "control-label col-sm-3" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<input type="hidden" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + '" data-model = "' + el.model + '"/>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('remoteMultiSelect') > -1 ) {
				result += 
					'<div class = "form-group ">' +
					'<label class = "control-label col-sm-3" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<input type="hidden" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + '" data-model = "' + el.model + '"/>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('localSelect') > -1 ) {
				result += 
					'<div class = "form-group">' +
					'<label class = "control-label col-sm-3" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<select id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + '">' +
						el.data.reduce(function(result, data) {
							return (
								result.push('<option value="' + data.id + '" ' + (el.value == data.id ? 'selected="selected"' : '') + '>' + (data.title || data.id) + '</option>'),
								result
							);
						}, []) +
					'</select>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('localMultiSelect') > -1 ) {
				result += 
					'<div class = "form-group">' +
					'<label class = "control-label col-sm-3" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<select multiple="multiple" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + '">' +
						el.data.reduce(function(result, data) {
							return (
								result.push('<option value="' + data.id + '" ' + (el.value && el.value.indexOf(data.id) > -1 ? 'selected="selected"' : '') + '>' + (data.title || data.id) + '</option>'),
								result
							);
						}, []) +
					'</select>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('datepicker') > -1 ) {
				result += 
					'<div class = "form-group">' +
					'<label class = "control-label col-sm-4" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>' +
					'<div class = "col-sm-8">' +
					'<input type="text" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + ' form-control"/>' +
					'</div></div>';
			};
			if (el.formClass.indexOf('simpleCheckBox') > -1 ) {
				result += 
					'<div class = "form-group">';
					'<label class = "control-label col-sm-4" for = "' + el.name + id + '">' + el.label + (el.formClass.indexOf('form-required-field') > -1 ? requireMark : '' ) + '</label>';
					'<div class = "col-sm-8">';
					'<input type="checkbox" id = "' + el.name + id + '" data-id = "' + el.name + '"class = "' + el.formClass + ' form-control"/>';
					'</div></div>';
			};
			return result;
		}, '') +
		self.getEditFormButtons() +
		'</form>';
	return str;
};

lib.Matrix.prototype.getEditFormButtons = function() {
	return '' +
		'<div class="form-group">' +
			'<div class="col-sm-offset-3 col-sm-9">' +
				'<button type="submit" class="btn btn-default">Сохранить</button>&nbsp;' +
				'<button type="button" class="btn btn-default btn-form-cancel">Отмена</button>' +
			'</div>' +
		'</div>';
};

lib.Matrix.prototype.clearForm = function() {
	var self = this;
	self.$wrapper.find('.form-edit')
		.find('input.remoteSelect').each(function(i,el) {$(this).select2('data', {id: '', text: ''}); }).end()
		.find('input.remoteMultiSelect').each(function(i,el) {$(this).select2('data', [] ); }).end()
		.find('input.datepicker, input.simpleInput, textarea.simpleTextArea').each(function(i,el) {$(this).val(''); }).end()
		.find('input.simpleCheckBox').each(function(i,el) {$(this).prop('checked', false); }).end()
		.find('input.simpleRadio').each(function(i,el) {$(this).prop('checked', true ).nextUntil('input:first').prop('checked', false ).trigger('change'); });
};

lib.Matrix.prototype.fillForm = function() {
	var self = this,
		$form = self.$wrapper.find('.form-edit'),
		row = self.data.rows[$form.data('i')];			
	$form.find('input.remoteSelect').each(function(i,el) {
		$(this).select2('data', {
			id: row[$(this).data('id')] || '',
			text: row[$(this).data('id') + 'name'] || ''
		}); 
	});
	$form.find('input.remoteMultiSelect').each(function(i,el) {
		if (!row[$(el).data('id')]) {
			$(this).select2('data', [] );
			return;
		};
		$(this).select2('data', 
			(function(len) {
				var arr = [],
					ids = row[$(el).data('id')].split(','),
					nms = row[$(el).data('id') + 'name'].split(',');
				if (!row[$(el).data('id')]) {return []; };
				for (var i = 0; i < len; i++) {
					arr.push({id: ids[i] || '', text: nms[i] || ''} );	
				};
				return arr;
			})(row[$(el).data('id')].split(',').length) 
		);
	});
	$form.find('input.datepicker, input.simpleInput, textarea.simpleTextArea').each(function(i,el) {$(this).val(row[$(this).data('id')] || ''); });
	$form.find('input.simpleCheckBox').each(function(i,el) {$(this).prop('checked', !!row[$(this).data('id')]); });
	$form.find('input.simpleRadio').each(function(i,el) {$(this).prop('checked', !!row[$(this).data('id')] ).nextUntil('input:first').prop('checked', !row[$(this).data('id')] ).trigger('change'); });				
};

lib.Matrix.prototype.getFormData = function() {
	var self = this,
		$form = self.$wrapper.find('.form-edit'),
		data = {};
	$form
		.find('input.remoteSelect, input.remoteMultiSelect, select.localSelect, select.localMultiSelect, input.datepicker, input.simpleInput, textarea.simpleTextArea')
			.each(function(i, el) {
				var $el = $(el);
				data[$el.data('id')] = $el.val(); 
			}).end()
		.find('input.simpleCheckBox, input.simpleRadio ')
			.each(function(i, el) {
				var $el = $(el);
				data[$el.data('id')] = $el.is(':checked');
			});
	return data;
};

lib.Matrix.prototype.getSettingsForm = function() {
	var self = this,
		str = 
		'<a name="settingsForm"></a>' +
		'<form class="form-horizontal form-settings thumbnail panel-body">' +
			'<div class="form-group">' +
				'<label for="rows" class="col-sm-3 control-label">Записей на странице</label>' +
				'<div class="col-sm-2">' +
					'<select class="form-control form-settings-rows" id="rows">' +
						self.matrix.rowList.reduce(function(result, el ) {
							return (result.push(
								'<option ' + (el.id == self.matrix.rows ? 'selected="selected"' : '') + 
								' value="' + el.id + '">' + el.text + '</option>'), result);
						}, []).join('') +
					'</select>' +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<label class="col-sm-3 control-label">Вид</label>' +
				'<div class="col-sm-9">' +
					'<div class="radio">' +
						'<label>' +
							'<input class="form-settings-tableview" type="radio" name="tableView" value="table" ' + 
							(self.matrix.tableView ? 'checked' : '') + '>' +
							'Таблица' +
						'</label>' +
					'</div>' +
					'<div class="radio">' +
						'<label>' +
							'<input class="form-settings-tableview" type="radio" name="tableView" value="tile" ' + 
							(!self.matrix.tableView ? 'checked' : '') + '>' +
							'Плитка' +
						'</label>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<div class="col-sm-offset-3 col-sm-9">' +
					'<div class="checkbox">' +
						'<label>' +
							'<input class="form-settings-filters" type="checkbox" ' + 
							(self.matrix.showFilters ? 'checked' : '') + '>&nbsp;Фильтры' +
						'</label>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<div class="col-sm-offset-3 col-sm-9">' +
					'<div class="checkbox">' +
						'<label>' +
							'<input class="form-settings-edit-buttons" type="checkbox" ' + 
							(self.matrix.editButtons ? 'checked' : '') + '>&nbsp;Кнопки редактирования' +
						'</label>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<label class="col-sm-3 control-label">Показать/скрыть колонки</label>' +
				'<div class="col-sm-9">' +
					self.matrix.columns.reduce(function(result, el, i ) {
							return (result.push(
								'<div class="checkbox"><label>' +
								'<input class="form-settings-hide-show-columns" data-i="' + i +
								'" type="checkbox" ' + (!el.hidden ? 'checked' : '') + 
								'>&nbsp;' + el.title + '</label></div>'), result);
						}, []).join('') +
				'</div>' +
			'</div>' +
			'<div class="form-group">' +
				'<div class="col-sm-offset-3 col-sm-9">' +
					'<button type="submit" class="btn btn-default">Готово</button>&nbsp;' +
				'</div>' +
			'</div>' +
		'</form>';
	return str;
};

lib.Matrix.prototype.getPager = function() {
	var str =
		'<div class="clearfix"><p class = "pull-left">' + 
		'<button class = "btn btn-default btn-sm btn-prev-page">' +
			'<span class = "glyphicon glyphicon-chevron-left"></span>' +
			'<span>&nbsp;Назад</span></button> ' +
		'<input class = "matrix-page"></input>' +
		'<span>&nbsp;из&nbsp;</span> ' +
		'<span class = "matrix-pages"></span> ' +
		'<button class = "btn btn-default btn-sm btn-next-page">' +
			'<span>Вперед&nbsp;</span>' +
			'<span class = "glyphicon glyphicon-chevron-right"></span></button> ' +
		'<span>&nbsp;Всего записей:&nbsp;</span> ' +
		'<span class = "matrix-records"></span> ' +
		'</p>' + this.getSettings() + '</div>';
	return str;
};

lib.Matrix.prototype.getSettings = function() {
	var str =
		'<p class = "pull-right">' +
		'<button class = "btn btn-default btn-sm btn-create">' +
			'<span class = "glyphicon glyphicon-plus"></span></button>&nbsp;' +
		'<button class = "btn btn-default btn-sm matrix-refresh">' +
			'<span class = "glyphicon glyphicon-refresh"></span>' +
		'</button> ' +
		'<a href="#settingsForm">' +
		'<button class = "btn btn-default btn-sm matrix-settings">' +
			'<span class = "glyphicon glyphicon-cog"></span>' +
		'</button></a></p>';
	return str;
};

lib.Matrix.prototype.getMatrix = function() {
	var str =
		'<div class="matrix">' + 
			(this.matrix.tableView ? this.getTableHead() : '<div class="matrix-tile"></div>') +
		'</div>';
	return str;
};

lib.Matrix.prototype.rebuildMatrix = function() {
	this.$wrapper.find('.matrix').html(this.matrix.tableView ? this.getTableHead() : '<div class="matrix-tile"></div>');
	this.loadMatrix();
};

lib.Matrix.prototype.getTableHead = function() {
	var self =this,
		str = 
			'<table class="matrix-table table table-bordered table-striped table-hover table-condensed"><thead><tr>' +
			self.matrix.columns.reduce(function(result, el) {
				return result += !el.hidden ?
					'<th><button class = "btn btn-default btn-block bold matrix-head" data-name = "' +
					el.name + '">' + el.title + '</button></th>' : '';
			}, '') + 
			//(self.matrix.editButtons ? '<th rowspan=' + (self.matrix.showFilters ? 2 : 1) + '></th>' : '') + 
			'</tr><tr>' +
			(self.matrix.showFilters ?
				self.matrix.columns.reduce(function(result, el) {
					return result += !el.hidden ?
						'<th><input class = "form-control matrix-filter" data-name = "' +
						el.name +'"></input></th>' : '';
				}, '') : ''
			) + '</tr></thead><tbody></tbody></table>';
	return str;
};
lib.Matrix.prototype.getEditButtons = function() {
	return '' +
		'<button class = "btn btn-default btn-sm btn-read">' +
			'<span class = "glyphicon glyphicon-eye-open"></span></button>&nbsp;' +
		'<button class = "btn btn-default btn-sm btn-update">' +
			'<span class = "glyphicon glyphicon-pencil"></span></button>&nbsp;' +
		'<button class = "btn btn-default btn-sm btn-delete">' +
			'<span class = "glyphicon glyphicon-remove"></span></button>';
};

lib.Matrix.prototype.getTable = function() {
	var self =this,
		str =
			self.data.rows.reduce(function(result, row, i) {
				return result += 
					'<tr data-id="' + row.id + '" data-i="' + i + '">' +					
					self.matrix.columns.reduce(function(result, el, i) {
						return result += !el.hidden ?
							'<td>' + (row[el.name] || '') + 
							(self.matrix.editButtons && !i ? '&nbsp;&nbsp;' + self.getEditButtons() : '') + '</td>' : ''
					}, '') + 
					//(self.matrix.editButtons ? '<td>' + self.getEditButtons() + '</td>' : '') + 
					'</tr>';
			}, '');
	return str;
};

lib.Matrix.prototype.getTile = function() {
	var self = this;
	return '' + 
		self.data.rows.reduce(function(result, row, i) {
			return result += 
				'<div class="thumbnail" data-id="' + row.id + '" data-i="' + i + '">' +
				(self.matrix.editButtons ? '<p>' + self.getEditButtons() + '</p>' : '') +
				self.matrix.columns.reduce(function(result, el) {
					return result += !el.hidden ?
						'<p>' + el.title + ':&nbsp' + (row[el.name] || '') + '</p>' : ''
				}, '') + '</div>';
		}, '');
};

lib.Matrix.prototype.showMatrix = function() {
	var self = this,
		data = self.data,
		str = self.matrix.tableView ? self.getTable() : self.getTile();	
	self.matrix.records = data.records;
	self.matrix.pages = data.pages;
	self.$wrapper
		.find('span.matrix-pages').html(self.matrix.pages).end()
		.find('span.matrix-records').html(self.matrix.records + '.').end()
		.find('input.matrix-page').val(data.page).end()
		.find('.matrix .matrix-table tbody').html(str).end()
		.find('.matrix .matrix-tile').html(str);
	return self;
};

lib.Matrix.prototype.loadMatrix = function() {
	var self = this,
		data = {
			page: this.matrix.page,
			rows: this.matrix.rows,
			order: this.matrix.order,
			filter: this.matrix.filter || {},
			fields: (function(){
				var data = [];
				for (var i = 0; i < self.matrix.columns.length; i++) {
					data.push(self.matrix.columns[i].name);
				};
				return data;
			})()
		};
	self.$wrapper.find('.table .matrix-filter').each(function(e, el) {
		var $el = $(el);
		if ($el.val()) {data.filter[$el.data('name')] = $el.val(); };
	});
	$.ajax({
		url: this.matrix.url,
		type: this.matrix.method,
		data: data,
		dataType: 'json'
	}).done(function(data) {
		var str = '';
		if (data && data.err) {
			alert(data.err);
			return console.log(data.err);
		};
		self.data = data;
		self.showMatrix();		
	});
	return this;
};

lib.Matrix.prototype.addEventListeners = function() {
	var self = this;
	self.$wrapper
		.on('click', '.btn-prev-page', function(e) {
			if (self.matrix.page > 1) {
				self.matrix.page--;
				self.loadMatrix();
			};
		})
		.on('click', '.btn-next-page', function(e) {
			if (self.matrix.page < self.matrix.pages) {
				self.matrix.page++;
				self.loadMatrix();
			};
		})
		.on('change', '.matrix-page', function(e) {
			self.matrix.page = +$(e.target).val() || 1;
			self.loadMatrix();
		})
		.on('click', '.matrix-head', function(e) {
			var $el = $(e.target),
				name = $el.data('name'),
				index = -1;
			if (!$el.data('order')) {
				$el
					.append('&nbsp;<span class = "glyphicon glyphicon-sort-by-attributes-alt"><span>')
					.data('order', 'desc');
			};
			if ($el.data('order') == 'desc') {
				$el.data('order', 'asc').find('span.glyphicon')
					.removeClass('glyphicon-sort-by-attributes-alt')
					.addClass('glyphicon-sort-by-attributes');
				for (var i = 0; i < self.matrix.order.length; i++ ) {
					if (self.matrix.order[i].name == name) {index = i; break; };
				};
				if (index != -1) {self.matrix.order.splice(index,1); };
				self.matrix.order = [{name: $el.data('name'), sort: 'asc'}].concat(self.matrix.order);
				self.loadMatrix();
			} else {
				$el.data('order', 'desc').find('span.glyphicon')
					.removeClass('glyphicon-sort-by-attributes')
					.addClass('glyphicon-sort-by-attributes-alt');
				for (var i = 0; i < self.matrix.order.length; i++ ) {
					if (self.matrix.order[i].name == name) {index = i; break; };
				};
				if (index != -1) {self.matrix.order.splice(index,1); };
				self.matrix.order = [{name: $el.data('name'), sort: 'desc'}].concat(self.matrix.order);
				self.loadMatrix();
			};
		})
		.on('keypress', '.matrix-filter', function(e) {
			var $el = $(e.target);
			if (e.keyCode == 13) {
				if ($el.val() != $el.data('val')) {
					$el.data('val', $el.val() );
					self.matrix.page = 1;
				};
				if ($el.val() === '') {delete self.matrix.filter[$el.data('name')];};
				self.loadMatrix();
			};
		})
		.on('change', '.form-settings-tableview', function(e) {
			self.matrix.tableView = $(e.target).val() == 'table' ? true : false;
			self.rebuildMatrix();
		})
		.on('change', '.form-settings-rows', function(e) {
			self.matrix.rows = +$(e.target).val();
			self.matrix.page = 1;
			self.loadMatrix();
		})
		.on('submit', '.form-settings', function(e) {
			$(e.target).hide();
			return false;
		})
		.on('submit', '.form-edit', function(e) {
			self.onSubmitFormEdit(e);
			return false;
		})
		.on('click', '.matrix-refresh', function(e) {
			self.loadMatrix();
		})
		.on('click', '.matrix-settings', function(e) {
			self.$wrapper.find('form.form-settings').is(':visible') ? 
				self.$wrapper.find('form.form-settings').hide() :
				(self.$wrapper.find('form.form-settings').show(), self.$wrapper.find('select.form-settings-rows').focus());				
		})
		.on('change', '.form-settings-filters', function(e) {
			self.matrix.showFilters = $(e.target).prop('checked');
			self.rebuildMatrix();
		})
		.on('change', '.form-settings-edit-buttons', function(e) {
			self.matrix.editButtons = $(e.target).prop('checked');
			self.rebuildMatrix();
		})
		.on('change', '.form-settings-hide-show-columns', function(e) {
			var $el = $(e.target);
			self.matrix.columns[+$el.data('i')].hidden = !$el.prop('checked');
			self.rebuildMatrix();
		})
		.on('click', '.btn-form-cancel', function(e) {
			$(e.target).parents('form:first').hide();
		})
		.on('click', '.btn-create', function(e) {
			self.onBtnCreate(e);
		})
		.on('click', '.btn-read', function(e) {
			window.location = '/' + self.model + '.html/' + $(e.target).parents('tr,div').filter(':first').data('id');
		})
		.on('click', '.btn-update', function(e) {
			self.clearForm();
			self.$wrapper
				.find('.form-edit')
					.data('action', 'update')
					.data('id', $(e.target).parents('tr,div').filter(':first').data('id'))
					.data('i', $(e.target).parents('tr,div').filter(':first').data('i'))
					.show()
					.find('input,textarea,select').filter(':visible:first').focus();
			self.fillForm();
		})
		.on('click', '.btn-delete', function(e) {
			$.ajax({
				url: '/' + self.model + '.json/del/' + $(e.target).parents('tr,div').filter(':first').data('id'),
				type: 'post',
				dataType: 'json'
			}).done(function(data) {
				self.loadMatrix();
			});			
		});
};

lib.Matrix.prototype.addSocetEvetnListeners = function() {
	var self = this;
	if (lib.socket.connected) {
		lib.socket.emit('join', {room: self.name});
	};
	lib.socket
		.on('connect', function() { lib.socket.emit('join', {room: self.name}); })
		.on('refresh', function() { self.loadMatrix(); });
};

lib.Matrix.prototype.addCustomEventListeners = function() {
	return this;
};

lib.Matrix.prototype.onBtnCreate = function(e) {
	var self = this;
	self.clearForm();
	self.$wrapper
		.find('.form-edit').data('action', 'create').show()
			.find('input,textarea,select').filter(':visible:first').focus();
};

lib.Matrix.prototype.onSubmitFormEdit = function(e) {
	var self = this,
		data = self.getFormData(),
		$form = $(e.target);
	$.ajax({
		url: '/' + self.model + '.json/' + ($form.data('action') == 'create' ? 'create' : 'update/' + $form.data('id')),
		type: 'post',
		dataType: 'json',
		data: data
	}).done(function(data){
		$form.hide();
		self.loadMatrix();
	});
};