module.exports = function(db, io) {
  let express = require('express');
  let router = express.Router();
  var session;
  const dbjs = require('./database')
  const database = new dbjs(db)
  const { UPDATEGAMELIST } = require('../constants/events')
  router.use(express.static('public', {'root': './'}))

  /* GET home page. */
  router.get('/', function(request, response, next) {
    session = request.session;

    if(session.user) {
      let username = session.user;
      database.getTopPlayers(10)
      .then((playerList) => {
        database.getPlayerStats(request.session.player_id)
        .then((playerStats) => {
          response.render('lobby', { USERNAME: username, topPlayers: playerList, playerStats: playerStats });
        })

      })
    }
    else {
      response.redirect('/login');
    }
  });

  router.post('/', function(request, response, next) {
    let username  = request.body.username;

    response.render('lobby', { USERNAME: username });
  });

  io.on('connection', function(socket) {

    socket.on('disconnect', function() {
    });
  });

  var lobby_io = io.of('/lobby');
  lobby_io.on('connection', function(socket) {
    var username;
    if(session != null) {
      username = session.user;
      broadcastGameList(lobby_io);
    }

    lobby_io.emit("user_entered_chat", "User " + username + " has entered the room...");

    socket.on('chat_sent', function(message) {
      msg = message.substr(message.indexOf(' ')+1);

      lobby_io.emit('chat_received', username + ": " + msg);
    });

    socket.on('disconnect', function() {
      lobby_io.emit("user_left_chat", "User " + username + " has left the room...");
    });
  });

  const broadcastGameList = (socket) => {
    database.getAvailableGames()
    .then ( (listGameIds) => {
      socket.emit( UPDATEGAMELIST, listGameIds )
    })
  }

  return router;
}
