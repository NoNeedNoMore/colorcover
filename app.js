var config = require('./lib/config'),
  lib = require('./lib/lib'),
  models = require('./lib/models/models'),
  express = require('express'),
  app = express(),
  compression = require('compression'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  pgSessionStore = lib.pgSessionStore(session),
  expressSession = session({
    store: new pgSessionStore(),
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: config.maxAge }
  }),
  multer = require('multer'),
  http = require('http'),
  server = http.createServer(app).listen(config.port, () => {console.log(`${new Date()} Listening at ${config.port}`); } ),
  io = require('socket.io').listen(server);

app
  .use ( compression() )
  .set ( 'views', __dirname + '/lib/views')
  .set ( 'view engine', 'jade')
  .use ( bodyParser.urlencoded({extended: true }) )
  .use ( bodyParser.json() )
  .use ( cookieParser() )
  .use ( expressSession )
  .use ( (req, res, next) => {req.io = io; next(); } )
  .use ( express.static(__dirname + '/public', { maxAge: config.maxAge }) )
  .use ( multer({dest: __dirname + '/temp/', inMemory: true }) )
  .get ( '/', (req, res) => {res.redirect(config.homePage); })
  .get ( '/:model.:format/:id?', models.read )
  .post( '/:model.:format/create', models.create )
  .post( '/:model.:format/read/:id?', models.read )
  .post( '/:model.:format/update/:id', models.update )
  .post( '/:model.:format/del/:id', models.del )
  .all ( '/:model.:format/services/:id', models.services )
  .all ( '*', (req, res) => {res.status(404).render('404'); })
  .use ( models.error );

io.on( 'connection', socket => {
  socket
    .on('join', data => {socket.join(data.room); })
    .on('disconnect', () => {});
});

process.on('uncaughtException', err => {console.log('uncaughtException: ', err); });