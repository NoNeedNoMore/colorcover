var config = require('../../config'),
  Base = require('../base'),
  scheme = config.defaultScheme,
  pg = require('pg'),
  opts = {};
opts.render = 'views/roles';
opts.viewOpts = {title: 'Roles', view: 'roles'};
opts.perks = [
  /*'roles.html.read',
  'roles.json.create',
  'roles.json.read',
  'roles.json.update',
  'roles.json.del',
  'roles.json.services.getMatrix',
  'roles.json.services.select2'*/
];
opts.sql = {
  scheme: scheme,
  table: 'roles',
  columns: [
    { type: 'id' },
    { type: 'text', name: 'name' },
    { type: 'm2m', name: 'perks', field: 'id', m2m: 'perks.perk.perksToRoles."role"' },
    { type: 'm2m', name: 'perksname', field: 'name', m2m: 'perks.perk.perksToRoles."role"' }
  ]
};
opts.matrix = {
  roles: {
    name: 'roles',
    url: '/roles.json/read',
    method: 'post',
    page: 1,
    rows: 10,
    showFilters: true,
    showOrder: true,
    tableView: true,
    editButtons: true,
    rowList: [{id:10, text: '10'},{id:20, text: '20'},{id:30, text: '30'},{id:40, text: '40'},{id:50, text: '50'}],
    order: [{name: 'id', sort: 'asc'}],
    filter: {},
    columns: [
      { name: 'id', title: '#' },
      { name: 'name', title: 'Role' },
      { name: 'perks', title: 'Perks', hidden: true },
      { name: 'perksname', title: 'Perksname', hidden: true },
    ],
    editForm: [
      {name:'name',label:'Роль', formClass: 'simpleInput form-required-field' },
      {name:'perks',label:'Перки', formClass: 'remoteMultiSelect', model: 'perks' },
    ]
  }
};
module.exports = new Base(opts);