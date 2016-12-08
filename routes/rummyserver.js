let io
let socket
let db

//This will be fetched form the DB
gameIds = []
const shuffle = require('knuth-shuffle').knuthShuffle

//Change this froom DB
let player = 1

const database = require('./database');

exports.initGame = function(sio, gameSocket, sdb) {

  io = sio
  socket = gameSocket
  db = sdb

  database.init(db);

  gameSocket.emit('connected', {msg: 'Connected', playerId: player})
  //Remove this after integrating registration

  console.log(player+' joined the game')
  player = player + 1
  io.sockets.emit('update game list', gameIds)

  socket.on('create new room', createNewRoom)
  socket.on('join room', joinRoom)

}

function createNewRoom(data) {
  let gameId = ( Math.random() * 100000 ) | 0

  let promise = new Promise(function(resolve, reject){

    if(1<2) {
      resolve("true")
    }
    else {
      reject(Error("false"))
    }
  })

  promise.then(function(result){
    console.log(result);
  }, function(err){
    console.log('error');
  })

  database.createGame(gameId)
  database.createPlayer(data.playerId)
  //database.createGamePlayer(gameId, data.playerId)
  gameIds.push(gameId)
  this.join(gameId.toString())
  io.to(gameId.toString()).emit('new room created', {gameId: gameId, socketId: this.id})
  io.sockets.emit('update game list', gameIds)
  console.log('Snap1');
  console.log(io.sockets.adapter.rooms[gameId.toString()]);
}

function joinRoom(data) {
  socket.emit('new room created', {gameId: data.gameId, socketId: this.id})
  io.to(data.gameId.toString()).emit('player joined room', {gameId: data.gameId, socketId: this.id})
  this.join(data.gameId.toString())
  database.createPlayer(data.playerId)
  // database.createGamePlayer(data.gameId, data.playerId)

  let playerCount = io.sockets.adapter.rooms[data.gameId.toString()].length
  console.log('Snap2');
  console.log(Object.keys(io.sockets.adapter.rooms[data.gameId.toString()].sockets));

  //Change here to add more players
  if(playerCount==1){
    io.to(data.gameId.toString()).emit('room full', data.gameId)
    startgame(data.gameId);
  }
}

function startgame(gameId){
  json = initialiseCardsJSON(gameId);
  json.gameId = gameId
  io.to(gameId.toString()).emit('start game', json)
}

function initialiseCardsJSON(gameId){
  cards = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52]
  // cardsShuffled = shuffle(cards.slice(0))
  cardsShuffled = cards
  deckArray = cardsShuffled.slice(0,30)
  player1Hand = cardsShuffled.slice(31,41)
  player2Hand = cardsShuffled.slice(42,52)
  console.log(deckArray+'**'+player1Hand+'**'+player2Hand)
  json = {
    // deck = deckArray

  }

  return json
}
