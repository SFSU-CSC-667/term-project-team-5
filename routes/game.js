module.exports = function(db, io) {

  const express = require('express');
  const router = express.Router();
  const path = require('path');
  const rummy = require('./rummyserver');
  
  let gameId;
  let session;
  let username;

  router.get('/', function(request, response){
    session = request.session;
    username = session.user;
    gameId = request.query.gameId;
    
    response.render('game', { USERNAME: username });
  })

  const game_io = io.of('/game');
  game_io.on('connection', function(socket) {
    socket.join(gameId); //check for undefined
    console.log("A user connected to /game namespace, room " + gameId);
    
    socket.on('chat_sent', function(message){
      username = message.substr(0, message.indexOf(' '));
      message = message.substr(message.indexOf(' ')+1);
      
      game_io.to(gameId).emit('chat_received', username + ": " + message);
    });
    
    socket.on('disconnect', function() {
      console.log("user disconnected from /game namespace");
    });

  });
  
  /*
  io.on('connection', function(socket){
    rummy.initGame (io, socket, db)
  })
  */

  return router
}
