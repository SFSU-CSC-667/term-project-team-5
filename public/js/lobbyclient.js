// var chat = require('chat');
var socket = io('/lobby');
initChat(socket);

$(document).ready(function() {

  initVariables();
  initBindEvents();
  listenSocketEvents();

})

function initVariables() {

  $doc = $(document);
  $gameList = $('#gameList');
}

function initBindEvents() {
  $doc.on('click', '#new-game-btn', createNewGame);
  $doc.on('click', 'button[name=joinGameButton]', joinGame);
};

function listenSocketEvents() {
  socket.on('update game list', updateGameList);
};

function createNewGame() {
  var pathname = window.location.origin + "/game/createGame";
  console.log(pathname);
  window.location.replace(pathname);
};

function joinGame(){
  console.log('in joingame');
  gameId = $(this).attr("value");
  var pathname = window.location.origin + "/game/joinGame/" + gameId;
  window.location.replace(pathname);
}

function updateGameList(gameIds){
  console.log('in udpateGameList()');
  console.log(gameIds);
  let html ='';
  for(i=0; i<gameIds.length; i++){
    html = html + '<li class="list-group-item"><button class="btn btn-default" name="joinGameButton" value="'+gameIds[i]+'">' + gameIds[i] + '</button></li>';
  }
  $gameList.html(html);
}
