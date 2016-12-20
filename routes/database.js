let database = function (db) {

  this.createGame = (gameId) => {
    return db.one("insert into games(game_id, game_date, card_id_discarded, is_available) values($1, $2, $3, $4) returning game_id ",
    [gameId, new Date(), 1, true])
    .then((data) => {
      console.log('gameId= '+data.game_id+' inserted to Games table')
      return data
    })
    .catch(function(err) {
      console.log(err)
    })
  }


  this.createGamePlayer = (gameId, playerId) => {
    return db.none("INSERT INTO gameplayers(game_id, player_id) VALUES ($1, $2);", [gameId, playerId])
    .then(() => {
      console.log('playerId= '+playerId+' and gameId= '+gameId+' inserted to Players table')
    })
    .catch((err) => {
      console.log(err)
    })
  }

  this.deleteGamePlayer = (gameId) => {
    return db.none("DELETE FROM gameplayers where game_id = $1", [gameId])
    .then (() => {
      console.log('gameId= ' + gameId + ' removed from gameplayers')
    })
    .catch ((err) => {
      console.log(err)
    })
  }

  this.deleteGamePlayerByPlayerId = (player_id) => {
    return db.none("Delete from gameplayers where player_id = $1", [player_id])
    .then (() => {
      console.log('playerId= ' + player_id + ' removed from gameplayers')
    })
    .catch((err) => {
      console.log(err);
    })
  }

  this.getGamePlayer = (gameId) => {
    return db.any("Select player_id from gameplayers where game_id = $1", [gameId])
    .then( (result) => {
      return result
    })
    .catch(function(err) {
      console.log(err)
    })
  }

   this.checkPlayerExists = (request, response) =>{
    return db.one("select * from players where username like $1 and passwrd like $2 ", [request.body.username, request.body.password])
    .then((data) => {
        return data
    })
    .catch(function (error) {
      response.render('login', {errormsg: true} );
    });
   }

   this.registerNewUser = (request, response) => {
       return db.one("INSERT INTO players(first_name,last_name,e_mail,username,passwrd) VALUES($1, $2, $3, $4, $5) returning player_id",   [request.body.firstname, request.body.lastname, request.body.email, request.body.username, request.body.password])
    .then( (result) => {
      // response.redirect('/login');
      return result
    })
    .catch(function (error) {
      console.log(error);
    });
   }

   /* SCOREBOARD Operations */
   this.createScoreboard = (playerId) => {
     return db.none("Insert into scoreboard(player_id, games_won, total_games) values($1, 0, 0)", [playerId])
     .then ( () => {
       // response.redirect('/login');
     })
   }

   this.updateScoreboard = (playersInGame, playerWon) => {
     playersInGame.forEach((player) => {
       if(player == playerWon){
         db.none("Update scoreboard set games_won = games_won + 1, total_games = total_games + 1 where player_id = $1 ", [player])
         .then (() => {

         })
         .catch ((err) => {
           console.log(err);
         })

       }
       else {
         db.none("Update scoreboard set total_games = total_games + 1 where player_id = $1 ", [player])
         .then (() => {

         })
         .catch ((err) => {
           console.log(err);
         })

       }
     })

   }

   this.getTopPlayers = (noOfPlayers) => {
     return db.any("Select p.username, s.games_won from scoreboard s, players p where s.player_id = p.player_id order by s.games_won DESC limit $1 ", [noOfPlayers])
     .then ((result) => {
       return result
     })
     .catch((err) => {
       console.log(err);
     })
   }

   this.getPlayerStats = (playerId) => {
     return db.one("Select games_won, total_games from scoreboard where player_id = $1 ", [playerId])
     .then ((result) => {
       return result
     })
     .catch((err) => {
       console.log(err);
     })

   }

   this.getAvailableGames = () => {
     return db.any("Select game_id from games where is_available = true ")
     .then ( (result) => {
       let listGameIds = []

       result.forEach( (value) => {
         listGameIds.push(value.game_id)
       })

       return listGameIds
     })
     .catch(function(err) {
       console.log(err)
     })
   }

   this.updateAvailableGames = (gameId) => {
     return db.none("update games set is_available = false where game_id = $1", [gameId])
     .then (() => {
       console.log('Removed game ' + gameId + ' from available games');
     })
     .catch(function(err) {
       console.log(err)
     })
   }


  this.getAvailableGames = () => {
    return db.any("Select game_id from games where is_available = true ")
    .then ( (result) => {
      let listGameIds = []

      result.forEach( (value) => {
        listGameIds.push(value.game_id)
      })

      return listGameIds
    })
    .catch(function(err) {
      console.log(err)
    })
  }

  this.updateAvailableGames = (gameId) => {
    return db.none("update games set is_available = false where game_id = $1", [gameId])
    .then (() => {
      console.log('Removed game ' + gameId + ' from available games');
    })
    .catch(function(err) {
      console.log(err)
    })
  }

  this.addGameStateToDb = (json) => {

      const gameid = json.gameId.toString()
      this.deletePreviousGameState(gameid)
      .then ((gameid) => {
          const players = Object.keys(json.playerHands)
          players.forEach((p) => {
            let playerId = p.toString()
            json.playerHands[p].forEach((value) => {
              let cardid = value
              db.none("INSERT INTO gameplayercards VALUES($1, $2, $3, $4)",   [json.gameId.toString(), cardid, playerId, false])
              .then (() => {
                // console.log('Initial state added ' + json.gameId.toString());
              })
              .catch(function(err) {
                console.log(err)
              })
            })
          })
    })
    .catch(function (err) {
      console.log(err)
    })

  }

  this.deletePreviousGameState = (gameId) => {

     return db.none("DELETE FROM gameplayercards where game_id  = $1", [gameId])
       .then (() => {
                console.log('previous game state deleted ' + gameId);
              })
              .catch(function(err) {
                console.log(err)
              })
  }

  //rajat
  this.verifyPlayer = (gameId, playerId) => {
    return db.oneOrNone("Select * from gameplayers where game_id = $1 and player_id = $2", [gameId, playerId])
    .then( (result) => {
      return result
    })
    .catch( (err) => {
      console.log(err)
    })
  }

  this.addGameState_JSON = (gameId, json) => {

    return db.none("INSERT INTO gamestate(game_id, gamejson) values ($1, $2)", [gameId, json])
    .then( () => {
    })
    .catch( (err) => {
      console.log(err);
    })
  }

  this.updateGameState_JSON = (gameId, json) => {

    return db.none("UPDATE gamestate set gamejson = $2 where game_id = $1", [gameId, json])
    .then( () => {
    })
    .catch( (err) => {
      console.log(err);
    })
  }

  this.getGameState_JSON = (gameId) => {

    return db.oneOrNone("Select * from gamestate where game_id = $1", [gameId])
    .then( (result) => {
      return result
    })
    .catch( (err) => {
      console.log(err)
    })
  }

  this.deleteGameState_JSON = (gameId) => {
    return db.none("Delete from gamestate where game_id = $1", [gameId])
    .then( () => {
      console.log('gameId= ' + gameId + ' removed from gameState')
    })
    .catch( (err) => {
      console.log(err)
    })
  }
}

module.exports = database;

/*
exports.resetDB = function() {
db.none("delete from players")
.then(function() {
console.log('Players table cleared')
})
.catch(function(err) {
console.log(err)
})

db.none("delete from games")
.then(function() {
console.log('Games table cleared')
})
.catch(function(err) {
console.log(err)
})

db.none("delete from gameplayers")
.then(function() {
console.log('Gameplayers table cleared')
})
.catch(function(err) {
console.log(err)
})

}

exports.createGame = function(gameId) {
db.none("insert into games(game_id, game_date, card_id_discarded) values($1, $2, $3)", [gameId, new Date(), 1])
.then(function() {
console.log('gameId= '+gameId+' inserted to Games table')
})
.catch(function(err) {
console.log(err)
})
}
//All values are hardcoded. Change after integration
exports.createPlayer = function(playerId) {
db.none("INSERT INTO players(player_id, first_name, last_name, e_mail, username, passwrd)"+
"values($1, $2, $3, $4, $5, $6)", [playerId, 'abc', 'xyz', 'abc@xyz.com', playerId, 'abc789'])
.then(function() {
console.log('playerId= '+playerId+' inserted to Players table')
})
.catch(function(err) {
console.log(err)
})
}

exports.createGamePlayer = function(gameId, playerId) {
db.none("INSERT INTO gameplayers(game_id, player_id) VALUES ($1, $2);", [gameId, playerId])
.then(function() {
console.log('playerId= '+playerId+' inserted to Players table')
})
.catch(function(err) {
console.log(err)
})
}
*/
