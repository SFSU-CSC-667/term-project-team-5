/**
 * Module dependencies.
 */
const config = require('./config')
const express = require('express')
const http = require('http')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const io = require('socket.io')()
const pgp = require('pg-promise')()

const app = express()
const server = http.createServer(app)

/**
 * Listen on provided port, on all network interfaces.
 */
app.io = io
io.listen(server)
server.listen(config.PORT)

/**
 * Initialise pg promise
 */
const connection = {
  host: config.db_host_local,
  port: config.db_port_local,
  database: config.db_name_local ,
  user: config.db_user_local,
  password: config.db_pass_local
}

const db = pgp(process.env.DATABASE_URL || connection)

//routes
const index = require('./routes/index')(db,io)
const lobby = require('./routes/lobby')(db, io)
const game = require('./routes/game')(db, io)

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
// app.use(express.static('public', {'root': './'}))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, '/public')))

app.use('/', index)
app.use('/login', index)
app.use('/logout', index)
app.use('/content', index)
app.use('/game', game)
app.use('/lobby', lobby)
app.use('/rule', index)
app.use('/about', index)


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})
