var lib = lib || {};

lib.Topics = function($wrapper) {
  if (!$wrapper) return this;
  this.init($wrapper);
};

lib.Topics.prototype.getTableHead = function() {
  var str = '', self = this;
  str += '<table class="matrix-table table table-striped table-hover"><thead><tr>';
  for (var i = 0; i < this.matrix.columns.length; i++) {
    if (this.matrix.columns[i].hidden) {continue; };
    str += '<th>' + this.matrix.columns[i].title + '</th>';
  };
  str += '</tr></thead><tbody></tbody></table>';
  return str;
};

lib.Topics.prototype.getTable = function() {
  return this.data.rows.reduce(function(result, el) {
    return result +=
      '<tr class="topic-row" data-id="' + el.id + '">' +
        '<td>' +
          '<b><a class="text-muted no-underscore" href="/topics.html/' +
            el.id + '">' + (el.name || '') + '</a></b>' +
          '&nbsp;<a class="no-underscore" href="/users.html/' +
            el.author + '">' + el.authorname + '</a>' +
          '&nbsp;<a class="text-muted no-underscore" href="/topics.html/' +
            el.id + '">' + (el.firstMsg || '') + '</a>' +
        '</td>' +
        '<td>' + (el.posts || '') + '</td>' +
        '<td>' +
          '<a class="no-underscore" href="/users.html/' +
            el.lastAuthor + '">' + el.lastAuthorname + '</a>' +
          '&nbsp;<nobr>' + (el.dateUpdate || '') + '</nobr></td>' +
      '</tr>';
  }, '' );
};

lib.Topics.prototype.getPager = function() {
  var str =
    '<div class = "clearfix">' +
    '<p class = "pull-left">' +
    '<button class = "btn btn-default btn-sm btn-create">Создать новую тему</button>&nbsp;' +
    '<span>&nbsp;Всего тем:&nbsp;</span> ' +
    '<span class = "matrix-records"></span> ' +
    '</p></div>';
  return str;
};

lib.Topics.prototype.getEditForm = function() {
  var str =
    '<form class="form-horizontal form-edit thumbnail panel-body">' +
      '<div class="form-group">' +
        '<label for="topicName" class="col-sm-2 control-label">Заголовок</label>' +
        '<div class="col-sm-10">' +
          '<input type="text" class="form-control" id="topicName" placeholder="Заголовок">' +
        '</div>' +
      '</div>' +
      '<div class="form-group">' +
        '<div class="col-sm-12">' +
          '<textarea class="form-control" rows="5" id="topicMessage"></textarea>' +
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

lib.Topics.prototype.onSubmitFormEdit = function(e) {
  var $el = $(e.target);
  $.ajax({
    url: '/topics.json/create',
    type: 'post',
    dataType: 'json',
    data: {
      name: $el.find('#topicName').val(),
      message: $el.find('#topicMessage').val()
    }
  }).done(function(data){
    location.href = '/topics.html/' + data.id;
  });
};