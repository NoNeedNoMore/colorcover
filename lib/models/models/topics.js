var config = require('../../config'),
  scheme = config.defaultScheme,
  Base = require('../base'),
  async = require('async'),
  pg = require('pg'),
  opts = {},
  topics;
opts.render = 'views/topics';
opts.viewOpts = {title: 'Forum', view: 'topics'};
opts.perks = [
  'topics.html.read',
  //'topics.json.create',
  'topics.json.read',
  //'topics.json.update',
  //'topics.json.del',
  'topics.json.services.getMatrix'
];
opts.sql = {
  scheme: scheme,
  table: 'topics',
  columns: [
    { type: 'id' },
    { type: 'text', name: 'name' },
    { type: 'fk', name: 'author' },
    { type: 'fkText', name: 'authorname', key: 'author.users.username' },
    {
      alias: 'firstMsg',
      read: '(Select Left(message, 111) From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id Order By id Limit 1) '
    },
    {
      alias: 'posts',
      read: '(Select Count(1) From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id) '
    },
    {
      alias: 'lastAuthor',
      read: '(Select author From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id Order By id desc Limit 1)'
    },
    {
      alias: 'lastAuthorname',
      read: '(Select (Select username From ' + scheme + '.users Where id = ' + scheme + '.posts.author) From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id Order By id desc Limit 1)'
    },
    {
      alias: 'dateUpdate',
      read: '(Select to_char(dateUpdate ,\'' + config.dateFormat + '\') From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id Order By id desc Limit 1)',
      order: '(Select to_char(dateUpdate ,\'' + config.dateFormat + '\') From ' + scheme + '.posts Where topic = ' + scheme + '.topics.id Order By id desc Limit 1)'
    }
  ]
};

opts.matrix = {
  topics: {
    url: '/topics.json/read',
    method: 'post',
    page: 1,
    rows: 10000,
    showFilters: false,
    showOrder: false,
    tableView: true,
    editFormOnTop: true,
    rowList: [{id:1000, text: '1000'}],
    order: [{name: 'dateUpdate', sort: 'desc'}],
    filter: {tagsname: 'activegame'},
    columns: [
      { name: 'id', hidden: true },
      { name: 'name', title: 'Тема' },
      { name: 'author', hidden: true },
      { name: 'authorname', hidden: true },
      { name: 'firstMsg', hidden: true },
      { name: 'posts', title: 'Ответов' },
      { name: 'lastAuthor', hidden: true },
      { name: 'lastAuthorname', hidden: true },
      { name: 'dateUpdate', title: 'Последний' }
    ]
  }
};

topics = new Base(opts);

topics.createJson = function(req, cb ) {
  req.body.author = req.session.user;
  var self = this,
    data = req.body,
    sql = self.getSqlCreate(data)[0];
  pg.connect(config.conString, function(err, client, done) {
    if (err) {return cb(err);};
    client.query('Begin', function(err) {
      if(err) return self.rollback(err, client, done, cb);
      client.query(sql, function(err, result) {
        if(err) return self.rollback(err, client, done, cb);
        var id = result.rows[0].id,
          sql = self.models.posts.getSqlCreate({
            message: data.message,
            topic: id,
            author: data.author
          })[0];
        client.query(sql, function(err, result){
          if(err) return self.rollback(err, client, done, cb);
          client.query('Commit', done);
          cb(null, id);
        });
      });
    });
  });
};

module.exports = topics;