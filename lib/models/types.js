var config = require('../config'),
  types = {
    id: id,
    text: text,
    int: int,
    bool: bool,
    date: date,
    m2m: m2m,
    fk: fk,
    fkInt: fkInt,
    fkText: fkText,
    fkDate: fkDate
  };

function init(sql) {
  sql.columns.reduce(function(result, el, i, arr) {
    if (el.type) arr[i] = types[el.type](el, sql);
  }, '');
}

function id(el) {
  return {
    alias: 'id',
    read: 'id',
    search: ' id::text Like {$num} ',
    order: 'id::int'
  };
}

function text(el) {
  return {
    alias: el.alias || el.name,
    field: el.field || el.name,
    read: el.opts && el.opts.forbidRead ? null : el.read || el.name,
    create: el.opts && el.opts.forbidCreate ? null : el.create || '{$num}',
    update: el.opts && el.opts.forbidUpdate ? null : el.update || '{$num}',
    search: el.opts && el.opts.forbidSearch ? null : el.search || `Lower(${el.name}) Like '%' || Lower({$num}) || '%' `,
    order: el.opts && el.opts.forbidOrder ? null : el.order || el.name
  };
}

function int(el) {

}

function bool(el) {
  return {
    alias: el.alias || el.name,
    field: el.field || el.name,
    read: el.opts && el.opts.forbidRead ? null : el.read || el.name,
    create: el.opts && el.opts.forbidCreate ? null : el.create || '{$num}',
    update: el.opts && el.opts.forbidUpdate ? null : el.update || '{$num}',
    search: el.opts && el.opts.forbidSearch ? null : el.search || el.name + ' = {$num} ',
    order: el.opts && el.opts.forbidOrder ? null : el.order || el.name
  };
}

function date(el) {
  return {
    alias: el.alias || el.name,
    field: el.field || el.name,
    read: el.opts && el.opts.forbidRead ? null : el.read || `to_char(${el.name}, '${config.dateFormat}')`,
    create: el.opts && el.opts.forbidCreate ? null : el.create || `to_date({$num}, '${config.dateFormat}')`,
    update: el.opts && el.opts.forbidUpdate ? null : el.update || `to_date({$num}, '${config.dateFormat}')`,
    search: el.opts && el.opts.forbidSearch ? null : el.search || `to_char(${el.name}, '${config.dateFormat}') Like '%' || {$num} || '%' `,
    order: el.opts && el.opts.forbidOrder ? null : el.order || el.name
  };
}

function m2m(el, sql) {
  var tableTo = sql.scheme + '.' + sql.table,
    tableFrom = sql.scheme + '.' + el.m2m.split('.')[0],
    tablem2m = sql.scheme + '.' + el.m2m.split('.')[2],
    from = el.m2m.split('.')[1],
    to = el.m2m.split('.')[3];
  return {
    alias: el.alias || el.name,
    createm2m: el.create || ( el.field == 'id' ? true : false ),
    updatem2m: el.create || ( el.field == 'id' ? true : false ),
    tablem2m: tablem2m,
    from: from,
    to: to,
    read:
      el.opts && el.opts.forbidRead ? null : el.read ||
        ` (Select array_to_string(array_agg(${el.field}), ',')
          From ${tableFrom}
          Where id In(Select ${from} From ${tablem2m}
            Where ${to} = ${tableTo}.id Order By ${from} ))`,
    search:
      el.opts && el.opts.forbidSearch ? null : el.search ||
        ` Lower( (Select array_to_string(array_agg(Distinct(${el.field})), ',')
          From ${tableFrom}
          Where id In(Select ${from} From ${tablem2m}
            Where ${to} = ${tableTo}.id )) ) Like '%' || Lower({$num}) || '%' `
  };
}

function fk(el) {
  return {
    alias: el.alias || el.name,
    field: el.field || el.name,
    read: el.opts && el.opts.forbidRead ? null : el.read || el.name,
    create: el.opts && el.opts.forbidCreate ? null : el.create || '{$num}',
    update: el.opts && el.opts.forbidUpdate ? null : el.update || '{$num}',
    search: el.opts && el.opts.forbidSearch ? null : el.search || el.name + ' = {$num}',
    order: el.opts && el.opts.forbidOrder ? null : el.order || el.name
  };
}

function fkInt(el) {

}

function fkText(el, sql) {
  var key = el.key.split('.')[0],
    tableTo = sql.scheme + '.' + sql.table,
    table = sql.scheme + '.' + el.key.split('.')[1],
    field = el.key.split('.')[2];
  return {
    alias: el.alias || el.name,
    read: el.read || `(Select ${field} From ${table} Where id = ${tableTo}.${key})`,
    search: el.search || `(Select Lower(${field}) From ${table} Where id = ${tableTo}.${key}) Like '%' || Lower({$num}) || '%' `,
    order: el.order || `(Select ${field} From ${table} Where id = ${tableTo}.${key})`
  };
}

function fkDate(el) {

}

module.exports = init;