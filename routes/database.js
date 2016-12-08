let db

exports.init = function(sdb) {
  db = sdb
}

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
