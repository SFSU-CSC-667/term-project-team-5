module.exports = function(db, io) {

  const express = require('express')
  const router = express.Router()

  const path = require('path')
  const shuffle = require('knuth-shuffle').knuthShuffle
  const dbjs = require('./database')
  const database = new dbjs(db)

  const { PLAYER_JOINED, WELCOME, WITHDRAW_CARD, TRANSFER_TO_HAND, WAIT, STARTGAME, UPDATEGAMELIST, UPDATE_SERVER, UPDATE_CLIENT, CARDS_MELDED , SUCCESS, DISCARD_CARD, SUCCESSFUL_MELD, FAILED_MELD, PICKED_MELD_CARD, PICKED_MELD_SUCCESS, CARDS_LAYOFF, WIN, TIE, GAME_MESSAGE }
    = require('../constants/events')

  const gameMessages = require('../constants/gameMessages')
  const MAX_PLAYERS = 2;
  const NUM_CARDS_IN_SUIT = 13;

  let playerId;
  let username;
  let session;

  /* Route for create Game */
  router.get( '/createGame', ( request, response ) => {
    const gameId = generateRandomGameId()
    database.createGame(gameId)
    .then ((result) => {
      database.createGamePlayer(gameId, request.session.player_id)
      .then (() => {
        broadcastGameList()
        response.redirect('/game/' + gameId)
      })
    })
  })

  /* Route for game room */
  router.get('/:gameId', (req, resp) => {
    const gameId = req.params.gameId
    session = req.session;
    playerId = session.player_id
    username = session.user;
    database.verifyPlayer(gameId, playerId)
    .then ( (result) => {
      if(!result) {
        resp.redirect('/lobby')
      }
      else {
        resp.render('game', { USERNAME:username, name:req.session.user, playerId: req.session.player_id, gameId: gameId})
      }
    })

  })

  /* Route for join Game */
  router.get('/joinGame/:gameId', (req, resp) => {

    database.createGamePlayer(req.params.gameId, req.session.player_id)
    .then( () => {
      resp.redirect('/game/' + req.params.gameId)
    })

  })

  /* Helper Functions */

  const generateRandomGameId = () => {
    return ( Math.random() * 100000 ) | 0
  }

  const broadcastGameList = () => {
    database.getAvailableGames()
    .then ( (listGameIds) => {
      io.of('/lobby').emit( UPDATEGAMELIST, listGameIds )
    })
  }

  const increasingSort = (a, b) => {
    return a-b;
  }

  function isLegalMeld(tempMeldCards) {
    var sortedMeldCards = tempMeldCards.sort(increasingSort);
    var length = sortedMeldCards.length;
    var isOrdered = true;
    var isRanked = true;

    if(length > 2) {
      if((sortedMeldCards[length-1]%NUM_CARDS_IN_SUIT != sortedMeldCards[0]%NUM_CARDS_IN_SUIT))
      {
        if(sortedMeldCards[length-1] >= sortedMeldCards[0]+NUM_CARDS_IN_SUIT) {
          return false;
        }
      }

      for(let i = 0; i<length-1; i++) {
        if(!isInOrderAndSameSuit(sortedMeldCards[i], sortedMeldCards[i+1])) {
          isOrdered = false;
          break;
        }
      }

      for(let j = 0; j<length-1; j++) {
        if(!isSameRank(sortedMeldCards[j], sortedMeldCards[j+1])) {
          isRanked = false;
          break;
        }
      }

      if(isOrdered == false && isRanked == false) {
        return false;
      }

      return true;
    }
    return false;
  }

  function isInOrderAndSameSuit(card1, card2) {
    if(isSameSuit(card1, card2)) {
      if((card1 == card2+1) || (card1 == card2-1)) {
        return true;
      }
    }

    return false;
  }

  function isSameRank(card1, card2) {
    if((card1 % NUM_CARDS_IN_SUIT) == (card2 % NUM_CARDS_IN_SUIT)) {
      return true;
    }

    return false;
  }

  function isSameSuit(card1, card2) {
    if(Math.floor((card1-1)/NUM_CARDS_IN_SUIT) == Math.floor((card2-1)/NUM_CARDS_IN_SUIT)) {
      return true;
    }

    return false;
  }

  /* Socket Operations */
  const game_io = io.of('/game')
  game_io.on('connection', function(socket) {
    let gameId

    socket.emit(WELCOME, {playerId: playerId})

    /* Game Functions */
    const playerJoined = (data) => {
      gameId = data.gameId

      socket.join(data.gameId.toString())
      game_io.to(data.gameId.toString()).emit("user_entered_chat", "User " + username + " has entered the room...");
      io.of('/lobby').emit('chat_received', "User " + username + " has entered game " + data.gameId);

      /* Check if game state is present in DB, ie, the player has rejoined */
      database.getGameState_JSON(data.gameId)
      .then((result) => {
        if(!result) {
          database.verifyPlayer(data.gameId, playerId)
          .then ((resultVerification) => {
            if(!resultVerification) {
              socket.emit( WAIT, {msg : gameMessages.MSG_UNAUTHORIZED} )
            }
            else {
              let playerCount = io.nsps['/game'].adapter.rooms[gameId.toString()].length

              if(playerCount == MAX_PLAYERS) {
                initialiseCardsJSON(gameId)
                .then ((gameJSON) => {
                  game_io.to(data.gameId.toString()).emit( STARTGAME, gameJSON )
                })
                database.updateAvailableGames(gameId)
                .then (() => {
                  broadcastGameList()
                })
              }
              else {
                game_io.to(data.gameId.toString()).emit( WAIT, {msg : gameMessages.MSG_WAIT} )
              }
            }

          })

        }
        else {
          let updatedJSON = result.gamejson;
          if(result.gamejson.turn == playerId) {
            updatedJSON = switchPlayers(result.gamejson);
          }

          updateGame(updatedJSON);
        }
      })
    }

    const initialiseCardsJSON = (gameId) => {

      return database.getGamePlayer(gameId)
      .then((players) => {

        cards = [ 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
          24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,
          47,48,49,50,51,52]

          cardsShuffled = shuffle(cards.slice(0))
          deckArray = cardsShuffled.slice(0,31)
          dicardPileArray = cardsShuffled.slice(31,32)
          player1HandArray = cardsShuffled.slice(32,42)
          player2HandArray = cardsShuffled.slice(42,52)

          json = {
            gameId : gameId,
            meldId : 0,
            layoffId : 0,
            deck : deckArray,
            discard_pile : dicardPileArray,
            playerHands : {
              [players[0].player_id]  : player1HandArray,
              [players[1].player_id]  : player2HandArray
            },
            turn : players[0].player_id,

            melds : {}
          }
          database.addGameState_JSON(gameId, json)

          return json
        });
      }

    const updateGame = (json) => {
      database.updateGameState_JSON(json.gameId, json)
      game_io.to(json.gameId.toString()).emit( UPDATE_SERVER, json )

      checkPlayerWonTie(json)
    }

    const checkPlayerWonTie = (json) => {

      if (json.deck.length == 0) {
        game_io.to(json.gameId.toString()).emit( TIE, { msg: gameMessages.MSG_TIE } )
        return
      }

      Object.keys(json.playerHands).forEach( (player) => {
        if(json.playerHands[player].length == 0) {
          game_io.to(json.gameId.toString()).emit( WIN, { playerId: player } )
          database.updateScoreboard(Object.keys(json.playerHands), player)
        }
      })

    }

    const withdrawCard = (json) => {
      updateGame(json);
      game_io.to(json.gameId.toString()).emit(SUCCESS, json)
      game_io.to(json.gameId.toString()).emit(GAME_MESSAGE, {msg: gameMessages.MSG_WITHDRAW_CARD, turn : json.turn.toString()})

    }

    const switchPlayers = (json) => {
      let players = Object.keys(json.playerHands)

      if(players[0].localeCompare(json.turn)==0){
        json.turn = players[1]
      }
      else {
        json.turn = players[0]
      }
      return json
    }

    const cardDiscarded = (json) => {

      let updatedJson = switchPlayers(json)

      updateGame(updatedJson)
    }

    const cardsLayoff = (data) => {
      let meldJSON = data.meldJSON;
      let gameJSON = data.gameJSON;
      let layoffLength = data.layoffLength;

      if(isLegalMeld(meldJSON.melds[meldJSON.layoffId])) {
        database.updateGameState_JSON(meldJSON.gameId, meldJSON)
        game_io.to(meldJSON.gameId.toString()).emit(SUCCESSFUL_MELD, meldJSON);
        game_io.to(json.gameId.toString()).emit(GAME_MESSAGE, {msg: gameMessages.MSG_CARDS_LAYOFF_SUCCESS, turn : gameJSON.turn.toString()})
      }
      else {
        gameJSON.melds[gameJSON.layoffId].splice(layoffLength*-1, layoffLength);

        game_io.to(gameJSON.gameId.toString()).emit(FAILED_MELD, gameJSON);
        game_io.to(json.gameId.toString()).emit(GAME_MESSAGE, {msg: gameMessages.MSG_CARDS_LAYOFF_FAIL, turn : gameJSON.turn.toString()})
      }

    }

    const cardsMelded = (gameJSON, meldJSON) => {
      if(isLegalMeld(meldJSON.melds[meldJSON.meldId])) {
        database.updateGameState_JSON(meldJSON.gameId, meldJSON)
        meldJSON.meldId++;
        game_io.to(meldJSON.gameId.toString()).emit(SUCCESSFUL_MELD, meldJSON);
        game_io.to(json.gameId.toString()).emit(GAME_MESSAGE, {msg: gameMessages.MSG_SUCCESSFUL_MELD, turn : meldJSON.turn.toString()})
      }
      else {
        gameJSON.melds[gameJSON.meldId].length = 0;
        game_io.to(gameJSON.gameId.toString()).emit(FAILED_MELD, gameJSON);
        game_io.to(json.gameId.toString()).emit(GAME_MESSAGE, {msg: gameMessages.MSG_FAILED_MELD, turn : gameJSON.turn.toString()})
      }

    }

    const pickedMeldCard = (json) => {
      game_io.to(json.gameId.toString()).emit(PICKED_MELD_SUCCESS, json);
    }

    /* End Game Functions */

    /*New player joined /game */
    socket.on(PLAYER_JOINED, playerJoined)
    socket.on(UPDATE_CLIENT, updateGame)
    socket.on(DISCARD_CARD, cardDiscarded)
    socket.on(WITHDRAW_CARD, withdrawCard)
    socket.on(CARDS_MELDED, cardsMelded)
    socket.on(PICKED_MELD_CARD, pickedMeldCard)
    socket.on(CARDS_LAYOFF, cardsLayoff)

    socket.on('disconnect', () => {

      if(typeof gameId != 'undefined') {
        game_io.to(gameId).emit("user_left_chat", "User " + session.user + " has left the room...");

        database.updateAvailableGames(gameId)
        .then (() => {
          broadcastGameList()
        })

        game_io.to(gameId).emit( WAIT, {msg : gameMessages.MSG_DISCONNECT} )

        if( typeof io.nsps['/game'].adapter.rooms[gameId.toString()] == 'undefined'){
          database.deleteGamePlayer(gameId)
          database.deleteGameState_JSON(gameId)
        }
      }
    });

    socket.on('chat_sent', function(message) {
      user = message.substr(0, message.indexOf(' '));
      msg = message.substr(message.indexOf(' ')+1);

      if(typeof gameId != 'undefined') {
        game_io.to(gameId).emit('chat_received', user + ": " + msg);
      }
    });
  });


return router
}
