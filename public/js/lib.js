var lib = lib || {};

lib.getSelect2Opts = function(model, multiple) {
  if (!model) {
    return {
      width: '100%',
      allowClear: true
    };
  }
  var opts = $.extend({}, config.select2Opts);
  opts.multiple = !!multiple;
  opts.ajax.url = '/' + model + '.json/services/select2';
  return opts;
};

lib.initByClass = function($wrapper) {
  if (!lib.isInit) {
    lib.isInit = true;
    lib.username = localStorage.username;
    lib.roles = localStorage.roles && localStorage.roles.split(',') || [];
    lib.rooms = localStorage.rooms && localStorage.rooms.split(',') || [];
    lib.inherit
      (lib.Topics, lib.Matrix)
      (lib.Posts, lib.Matrix)
      (lib.Colorcover, lib.Matrix)
      (lib.Games, lib.Matrix);
    lib.socketInit();
  }
  $wrapper
    .find('.matrix').each(function(e, el) {new lib.Matrix( $(el) ); } ).end()
    .find('.topics').each(function(e, el) {new lib.Topics( $(el) ); } ).end()
    .find('.posts').each(function(e, el) {new lib.Posts( $(el) ); } ).end()
    .find('.games').each(function(e, el) {new lib.Games( $(el) ); } ).end()
    .find('.colorcover').each(function(e, el) {new lib.Colorcover( $(el) ); } ).end()
    .find('.remoteSelect').each(function(e, el) {$(el).select2(lib.getSelect2Opts($(el).data('model'))); } ).end()
    .find('.localSelect').each(function(e, el) {$(el).select2(lib.getSelect2Opts($(el).data('model'))); } ).end()
    .find('.localMultiSelect').each(function(e, el) {$(el).select2(lib.getSelect2Opts($(el).data('model'))); } ).end()
    .find('.remoteMultiSelect').each(function(e, el) {$(el).select2(lib.getSelect2Opts($(el).data('model'), true)); } ).end();
  return lib;
};

lib.inherit = function(Child, Parent) {
  if (!Child || !Parent) return lib.inherit;
  for (var foo in Parent.prototype) {
    !Child.prototype[foo] ? Child.prototype[foo] = Parent.prototype[foo] : null;
  }
  Child.super = Parent.prototype;
  return lib.inherit;
};

lib.socketInit = function() {
  lib.socket = io();
  if (lib.socket.connected) {
    lib.rooms.every(function(el){lib.socket.emit('join', {room: el}); return true; });
  }
  lib.socket
    .on('connect', function () {
      lib.rooms.every(function(el){lib.socket.emit('join', {room: el}); return true; });
    });
};