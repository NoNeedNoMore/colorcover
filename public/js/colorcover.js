var lib = lib || {};

lib.Colorcover = function($wrapper) {
  if (!$wrapper) return this;
  this.init($wrapper);
};

lib.Colorcover.prototype.buildMatrix = function() {
  var self = this;
  if (self.id == 'single') {
    self.$wrapper.append(self.getEditForm()).find('.form-edit').show();
    lib.initByClass(self.$wrapper.find('.form-edit'));
    return self;
  }
  if (lib.socket.connected) {
    lib.socket.emit('join', {room: 'game' + self.id});
  } else {
    lib.socket.on('connect', function () {
      lib.socket.emit('join', {room: 'game' + self.id});
    });
  }
  $.ajax({
    url: '/games.json/read/' + self.id,
    type: 'post',
    dataType: 'json',
    data: {fields: ['game']}
  }).done(function(data){
    self = $.extend(true, self, data.rows[0].game );
    self.draw();
  });
  return self;
};

lib.Colorcover.prototype.getEditFormButtons = function() {
  return '' +
    '<div class="form-group">' +
      '<div class="col-sm-offset-3 col-sm-9">' +
        '<button type="submit" class="btn btn-default">Играть!</button>&nbsp;' +
      '</div>' +
    '</div>';
};

lib.Colorcover.prototype.addEventListeners = function() {
  var self = this;
  self.$wrapper
    .on('click', '.table-colorcover td', function(e) {
      var xy = $(e.target).data('xy');
      if (self.id == 'single') {
        return self.checkMove(xy) ? self.draw().doAiMove() : self.doAiMove();
      }
      $.ajax({
        url: '/games.json/services/doMove',
        type: 'post',
        dataType: 'json',
        data: {id: self.id, xy: xy }
      }).done(function(data){
        if (!data.error) {
          self.map = data.map;
          self.draw();
        }
      });
      //self.checkMove( $(e.target).data('xy') ) ? self.draw().doAiMove() : self.doAiMove();
    }).
    on('submit', '.form-edit', function(e) {
      self.startNewGame();
      return false;
    });
  lib.socket.on('move', function(data){
    if (data.room == 'game' + self.id) {
      self = $.extend(true, self, data.game );
      self.draw();
    }
  });
  lib.socket.on('end', function(data){
    if (data.room == 'game' + self.id) {
      var delta = data.game.players[0].score - data.game.players[1].score;
      self = $.extend(true, self, data.game );
      self.draw();
      alert(
        delta == 0 ? 'Ничья' :
          delta > 0 ?
            ('Победил ' + data.game.players[0].name + ' +' + delta) :
            ('Победил ' + data.game.players[1].name + ' +' + Math.abs(delta))
      );
    }
  });
  return self;
};

lib.Colorcover.prototype.startNewGame = function() {
  var self = this,
    data = self.getFormData(),
    game = {
      map: {
        x: data.width || 13,
        y: data.height || 13
      },
      colors: data.colors || ['yellow', 'green', 'mediumblue' ],
      players: [],
      playersColors: [],
      activePlayer: 0,
      moves: []
    };
  for (var y = 1; y <= game.map.y; y++ ){
    for (var x = 1; x <= game.map.x; x++ ){
      game.map[x + '_' + y] = game.colors[Math.floor(Math.random() * game.colors.length)];
    }
  }
  if (data.player1 != 'empty') {
    var isAi = data.player1 == 'bot' ? true : false,
      name = isAi ? 'bot (1)' : (localStorage.username || 'Player') + ' (1)';
    game.players.push({name: name, x: 1, y: game.map.y, color: 'gray', isAi: isAi, score: 1});
    game.playersColors.push('gray');
  }
  if (data.player2 != 'empty') {
    var isAi = data.player2 == 'bot' ? true : false,
      name = isAi ? 'bot (2)' : (localStorage.username || 'Player') + ' (2)';
    game.players.push({name: name, x: game.map.x, y: 1, color: 'white', isAi: isAi, score: 1});
    game.playersColors.push('white');
  }
  if (data.player3 != 'empty') {
    var isAi = data.player3 == 'bot' ? true : false,
      name = isAi ? 'bot (3)' : (localStorage.username || 'Player') + ' (3)';
    game.players.push({name: name, x: 1, y: 1, color: 'greenyellow', isAi: isAi, score: 1});
    game.playersColors.push('greenyellow');
  }
  if (data.player4 != 'empty') {
    var isAi = data.player4 == 'bot' ? true : false,
      name = isAi ? 'bot (4)' : (localStorage.username || 'Player') + ' (4)';
    game.players.push({name: name, x: game.map.x, y: game.map.y, color: 'gainsboro', isAi: isAi, score: 1});
    game.playersColors.push('gainsboro');
  }
  game.players.every(function(el) {game.map[el.x + '_' + el.y] = el.color; return true; });
  self = $.extend(true, self, game );
  self.draw();
  if (self.players[0].isAi) self.doAiMove();
};

lib.Colorcover.prototype.check = function(xy, colors) {
  var self = this,
    arr = [xy],
    arrOfNeighbors = [],
    color = self.map[xy],
    x = 0,
    y = 0,
    hasNeighbors = false,
    check = function(xy) {
      self.map[xy] == color && arr.indexOf(xy) == -1 ? arr.push(xy) : null;
      colors.indexOf(self.map[xy]) != -1 ?
        (hasNeighbors = true, arrOfNeighbors.push(xy)) : null;
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
  }
  return {arr: arr, hasNeighbors: hasNeighbors, arrOfNeighbors: arrOfNeighbors};
};

lib.Colorcover.prototype.checkMove = function(xy) {
  var self = this,
    color = self.map[xy],
    player = self.players[self.activePlayer].color,
    check = self.check(xy, [player]);
  if (self.playersColors.indexOf(color) != -1) {return false; }
  if (check.hasNeighbors) {
    check.arr.forEach(function(val) {self.map[val] = player; });
    self.players[self.activePlayer].score += check.arr.length;
    self.activePlayer = self.activePlayer < (self.players.length - 1) ? self.activePlayer + 1 : 0;
  }
  self.diff = check.arr;
  return check.hasNeighbors;
};

lib.Colorcover.prototype.doAiMove = function() {
  var self = this,
    xy = self.players[self.activePlayer].x + '_' + self.players[self.activePlayer].y,
    check = self.check(xy, self.colors);
  if (!check.hasNeighbors) {alert('Game Over'); return location.reload();	}
  if (!self.players[self.activePlayer].isAi) {return self; }
  setTimeout(function() {
    self.$wrapper.find(
      '.table-colorcover td[data-xy=' +
      check.arrOfNeighbors[Math.floor(Math.random() * check.arrOfNeighbors.length)] +
      ']').click();
    }, 0 );
  return self;
};

lib.Colorcover.prototype.draw = function() {
  var self = this;
  //if (!self.diff) {return self.drawAll(); };
  return self.drawAll();
  self.diff.forEach(function(val) {
    document.querySelector('td[data-xy="' + val + '"]').style.background = self.map[val];
  });
  return self;
};

lib.Colorcover.prototype.drawAll = function() {
  var self = this,
    str =
      '<div><h2>' +
        self.players.reduce(function(result, el, i ) {
          return (
            result.push(
              '<span style="color:' + (self.activePlayer == i ? 'darkgreen' : 'black') + '">' +
              el.name + ' - ' + el.score + '</span>'
            ),
            result
          );
        }, []).join(' vs ') + '</h2></div><br>';
  str += '<table class = "table-colorcover">';
  for (var y = 1; y <= self.map.y; y++){
      str += '<tr>';
      for (var x = 1; x <= self.map.x; x++){
        str += '<td data-xy = "' + x + '_' + y + '" style = "background: ' + self.map[x + '_' + y] + ';"></td>';
      }
      str += '</tr>';
    }
  str += '</table>';
  self.$wrapper.html(str);
  return self;
};