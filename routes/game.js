module.exports = function(db, io) {

  const express = require('express')
  const router = express.Router()

  const path = require('path')
  const shuffle = require('knuth-shuffle').knuthShuffle
  const dbjs = require('./database')
  const database = new dbjs(db)

  const { PLAYER_JOINED, WELCOME, WITHDRAW_CARD, TRANSFER_TO_HAND, WAIT, STARTGAME, UPDATEGAMELIST, UPDATE_SERVER, UPDATE_CLIENT, CARDS_MELDED , SUCCESS, DISCARD_CARD, SUCCESSFUL_MELD, FAILED_MELD, PICKED_MELD_CARD, PICKED_MELD_SUCCESS, CARDS_LAYOFF, WIN, TIE }
    = require('../constants/events')

  const MAX_PLAYERS = 2;
  const NUM_CARDS_IN_SUIT = 13;

  let playerId;
  let username;
  let session;

  /* Route for create Game */
  router.get( '/createGame', ( request, response ) => {
    console.log(request.session.player_id + ' requested new game')

    gameId = generateRandomGameId()
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
    gameId = req.params.gameId
    session = req.session;
    playerId = session.player_id
    username = session.user;

    database.verifyPlayer(gameId, playerId)
    .then ( (result) => {
      if(!result) {
        console.log('player doesnt exist');
        resp.redirect('/lobby')
      }
      else {
        console.log('player exists');
        //todo: remove the unnecessary arguments
        resp.render('game_rajat', { USERNAME:username, name:req.session.user, playerId: req.session.player_id, gameId: gameId})
      }
    })

  })

  /* Route for join Game */
  router.get('/joinGame/:gameId', (req, resp) => {

    //note: gameId is global because of no var/let/anything keyword
    //gameId = req.params.gameId
    database.createGamePlayer(req.params.gameId, req.session.player_id)
    .then( () => {
      resp.redirect('/game/' + gameId)
    })

  })

  /* Helper Functions */

  const generateRandomGameId = () => {
    return ( Math.random() * 100000 ) | 0
  }

  const broadcastGameList = () => {
    database.getAvailableGames()
    .then ( (listGameIds) => {
      console.log(listGameIds);
      io.of('/lobby').emit( UPDATEGAMELIST, listGameIds )
    })
  }

  function isLegalMeld(tempMeldCards) {
    console.log("TEMP: " + tempMeldCards.toString());
    var sortedMeldCards = tempMeldCards.sort();
    var length = sortedMeldCards.length;
    var isOrdered = true;
    var isRanked = true;

    if(length > 2) {
    //check if in range
    //checks that it is not a legal same suit meld
      if((sortedMeldCards[length-1]%NUM_CARDS_IN_SUIT != sortedMeldCards[0]%NUM_CARDS_IN_SUIT))
    {
      if(sortedMeldCards[length-1] >= sortedMeldCards[0]+NUM_CARDS_IN_SUIT) {
        console.log("Checking Legal Meld: NOT IN RANGE");
        return false;
      }
    }

    //if length is greater than 2 then do these two checks, else check layoff
    //check if in order: 1s,2s,3s,4s..etc
    for(let i = 0; i<length-1; i++) {
      if(!isInOrderAndSameSuit(sortedMeldCards[i], sortedMeldCards[i+1])) {
        console.log("NOT IN ORDER");
        isOrdered = false;
        break;
      }
    }

    //if not in order, check if same rank
    for(let j = 0; j<length-1; j++) {
      if(!isSameRank(sortedMeldCards[j], sortedMeldCards[j+1])) {
        console.log("NOT SAME RANK");
        isRanked = false;
        break;
      }
    }

    if(isOrdered == false && isRanked == false) {
      return false;
    }

    console.log("Checking Legal Meld: IS LEGAL");
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

  //edge cases: 11, 12, 13... 24,25,26 ...
  function isSameSuit(card1, card2) {
    //card1-1 to convert from 1-13 to 0-12 scale so that the edge cards (13) will 
    //be in the same group as 1-12
    if(Math.floor((card1-1)/NUM_CARDS_IN_SUIT) == Math.floor((card2-1)/NUM_CARDS_IN_SUIT)) {
      return true;
    }

    return false;
  }

  /* Socket Operations */
  const game_io = io.of('/game')
  game_io.on('connection', function(socket) {
    console.log(username + " connected to /game namespace");

    //Used to pass playerId to client
    socket.emit(WELCOME, {playerId: playerId})

    /* Game Functions */
    const playerJoined = (data) => {
      socket.join(data.gameId.toString())
      game_io.to(data.gameId.toString()).emit("user_entered_chat", "User " + username + " has entered the room...");
      io.of('/lobby').emit('chat_received', "User " + username + " has entered game " + data.gameId);

      /* Check if game state is present in DB, ie, the player has rejoined */
      database.getGameState_JSON(data.gameId)
      .then((result) => {
        if(!result) {
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
            game_io.to(data.gameId.toString()).emit( WAIT, {msg : 'Welcome !\n Waiting for other player to join.'} )
          }
        }
        else {
          console.log('player rejoined');
          let updatedJson = switchPlayers(result.gamejson)
          updateGame(updatedJson)
        }
      })

    }

    const initialiseCardsJSON = (gameId) => {

      return database.getGamePlayer(gameId)
      .then((players) => {

        console.log("Players: " + players[0] + " " + players[1]);

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
        //rajat
        //database.addGameStateToDb(json)
        database.addGameState_JSON(gameId, json)

        return json
      });
    }

    const updateGame = (json) => {
      //rajat
      // database.addGameStateToDb(json);
      database.updateGameState_JSON(json.gameId, json)
      game_io.to(json.gameId.toString()).emit( UPDATE_SERVER, json )

      checkPlayerWonTie(json)
    }

    const checkPlayerWonTie = (json) => {

      Object.keys(json.playerHands).forEach( (player) => {
        if(json.playerHands[player].length == 0) {
          console.log('WIN');
          game_io.to(json.gameId.toString()).emit( WIN, { playerId: player } )
          return
        }
      })

      if (json.deck.length == 0) {
        console.log('TIE');
        game_io.to(json.gameId.toString()).emit( TIE, { msg : "Game is a Tie" } )
      }

    }

    const withdrawCard = (json) => {
      updateGame(json);
      game_io.to(json.gameId.toString()).emit(SUCCESS, json)

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

      console.log('server got discard request');
      updateGame(updatedJson)
    }

    const cardsLayoff = (data) => {
      let meldJSON = data.meldJSON;
      let gameJSON = data.gameJSON;
      let layoffLength = data.layoffLength;

      if(isLegalMeld(meldJSON.melds[meldJSON.layoffId])) {
        console.log("IS LEGAL LAYOFF");
        //update to db
        game_io.to(meldJSON.gameId.toString()).emit(SUCCESSFUL_MELD, meldJSON);
      }
      else {
        //why does gameJSON have the melded cards? shouldn't onlymeldJSON have it?
        console.log("IS NOT LEGAL LAYOFF");
        //remove the pushed cards
        gameJSON.melds[gameJSON.layoffId].splice(layoffLength*-1, layoffLength);

        console.log(gameJSON.melds[gameJSON.layoffId].toString());
        game_io.to(gameJSON.gameId.toString()).emit(FAILED_MELD, gameJSON);
      }

    }

    const cardsMelded = (gameJSON, meldJSON) => {
      if(isLegalMeld(meldJSON.melds[meldJSON.meldId])) {
        console.log("IS LEGAL MELD");
        //update to db
        //increment meldId
        meldJSON.meldId++;
        game_io.to(meldJSON.gameId.toString()).emit(SUCCESSFUL_MELD, meldJSON);
      }
      else {
        //why does gameJSON have the melded cards? shouldn't onlymeldJSON have it?
        console.log("IS NOT LEGAL MELD");
        gameJSON.melds[gameJSON.meldId].length = 0; //clear last meld
        console.log(gameJSON.melds[gameJSON.meldId].toString());
        game_io.to(gameJSON.gameId.toString()).emit(FAILED_MELD, gameJSON);
      }

    }

    const pickedMeldCard = (json) => {
      //when should i call this database call?
      //database.addGameStateToDb(json);
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
      console.log("user disconnected from /game namespace");

      if(typeof gameId != 'undefined') {
        game_io.to(gameId).emit("user_left_chat", "User " + session.user + " has left the room...");

        // database.updateAvailableGames(gameId)
        // .then (() => {
        //   broadcastGameList()
        // })
        
         game_io.to(gameId).emit( WAIT, {msg : 'Other Player got disconnected! Wait or return to lobby.'} )
      }
    });

    socket.on('chat_sent', function(message) {
      user = message.substr(0, message.indexOf(' '));
      msg = message.substr(message.indexOf(' ')+1);

      console.log("CHAT:" + message)
      if(typeof gameId != 'undefined') {
        game_io.to(gameId).emit('chat_received', user + ": " + msg);
      }
    });
});


return router
}
