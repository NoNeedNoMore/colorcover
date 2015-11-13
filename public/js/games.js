var lib = lib || {};

lib.Games = function($wrapper) {
  if (!$wrapper) return this;
  this.init($wrapper);
};

lib.Games.prototype.getPager = function() {
  var str =
    '<div class="clearfix"><p class = "pull-left">' +
    '<span>&nbsp;Всего записей:&nbsp;</span> ' +
    '<span class = "matrix-records"></span> ' +
    '</p>' + this.getSettings() + '</div>';
  return str;
};

lib.Games.prototype.getSettings = function() {
  var str =
    '<p class = "pull-right">' +
    '<button class = "btn btn-default btn-sm btn-create">' +
      '<span class = "glyphicon glyphicon-plus"></span>&nbsp;Добавить новую игру</button>&nbsp;' +
    '</p>';
  return str;
};

lib.Games.prototype.getEditFormButtons = function() {
  return '' +
    '<div class="form-group">' +
      '<div class="col-sm-offset-3 col-sm-9">' +
        '<button type="submit" class="btn btn-default">Добавить игру</button>&nbsp;' +
        '<button type="button" class="btn btn-default btn-form-cancel">Отмена</button>' +
      '</div>' +
    '</div>';
};

lib.Games.prototype.getTile = function() {
  var self = this;
  return '' +
    self.data.rows.reduce(function(result, row, i) {
      return result +=
        '<div class="thumbnail" data-id="' + row.id + '" data-i="' + i + '">' +
        '<p>' +
          '<a href="/users.html/' + row.game.players[0].name + '">' + row.game.players[0].name + '</a>' +
        '<p>Размер: ' + row.game.map.x + ' на ' + row.game.map.y + '</p>' +
        '<p>Цвета(' + row.game.colors.length + '): ' + row.game.colors.join(', ') + '</p>' +
        '<p>' +
        (row.game.players[0].name == lib.username ?
          '<button type="button" class="btn btn-default btn-cancel-call-game">' +
          '<span class = "glyphicon glyphicon-remove"></span>&nbsp;Отменить</button>' :
          '<button type="button" class="btn btn-default btn-play">' +
          '<span class = "glyphicon glyphicon-fire"></span>&nbsp;Играть!</button>'
        ) + '</p></div>';
    }, '');
};

lib.Games.prototype.addCustomEventListeners = function() {
  var self = this;
  self.$wrapper
    .on('click', '.btn-play', function(e) {
      $.ajax({
        url: '/games.json/services/joingame',
        type: 'post',
        dataType: 'json',
        data: {id: $(e.target).parents('tr,div').filter(':first').data('id')}
      }).done(function(data) {
        $('#games').append(
          '<div class="container" id="game' + data.id + '">' +
            '<div class="colorcover" data-model="games" data-matrix="activeGames" data-id="' + data.id + '"></div>' +
          '</div></br>'
        );
        lib.socket.emit('join', {room: 'game' + data.id});
        lib.initByClass($('#game' + data.id));
      });
    })
    .on('click', '.btn-cancel-call-game', function(e) {
      $.ajax({
        url: '/games.json/del/' + $(e.target).parents('tr,div').filter(':first').data('id'),
        type: 'post',
        dataType: 'json'
      }).done(function(data) {
        self.loadMatrix();
      });
    });
  return self;
};

lib.Games.prototype.onBtnCreate = function(e) {
  var self = this;
  self.$wrapper
    .find('.form-edit').data('action', 'create').show()
      .find('input,textarea,select').filter(':visible:first').focus();
};

lib.Games.prototype.onSubmitFormEdit = function(e) {
  var self = this,
    data = self.getFormData(),
    $form = $(e.target);
  $.ajax({
    url: '/' + self.model + '.json/' + ($form.data('action') == 'create' ? 'create' : 'update/' + $form.data('id')),
    type: 'post',
    dataType: 'json',
    data: data
  }).done(function(data){
    var id = data.id;
    $form.hide();
    lib.socket.emit('join', {room: 'game' + id});
    lib.socket.on('start', function(data) {
      $('#games').append(
        '<div class="container" id="game' + id + '">' +
          '<div class="colorcover" data-model="games" data-matrix="activeGames" data-id="' + id + '"></div>' +
        '</div></br>'
      );
      lib.initByClass($('#game' + id));
    });
    self.loadMatrix();
  });
};