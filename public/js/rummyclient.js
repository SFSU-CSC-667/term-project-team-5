jQuery(function($){

  let socket;
  let socketId;
  let gameId;

  let playerId;

  function init(){
    initializeVariables();
    displayInitScreen();
    initEvents();
    initSocketEvents();
  };

  function initializeVariables(){
    socket = io.connect();

    $doc = $(document);
    $gameArea = $('#gameArea');
    $templateInitRoom = $('#init-screen-template').html();
    $templateNewRoom = $('#new-room-template').html();
    $templateGameRoom = $('#game-room-template').html();

    $templateTest = $('#test-template');

  };

  function displayInitScreen() {
    $gameArea.html($templateInitRoom);
  };

  function initEvents(){
    $doc.on('click', '#new-room-btn', createRoom);
    $doc.on('click', 'button[name=joinGameButton]', joinRoom);
  };

  function initSocketEvents(){
    socket.on('connected', onConnected);
    socket.on('new room created', newRoomCreated);
    socket.on('update game list', updateGameList);
    socket.on('player joined room', joinedRoom);
    socket.on('room full', startGame);

    socket.on('test event', testEvent);

  };
  function onConnected(data) {
    socketId = socket.id;
    playerId = data.playerId;
    console.log(socketId);
  }

  function createRoom() {
    socket.emit('create new room', {playerId: playerId});
    console.log(playerId+' create the room');
  };

  //Change this to use append method of jQuery
  function newRoomCreated(data){
    gameId = data.gameId;
    $gameArea.html($templateNewRoom);
    $('#availableGames').hide();
    $('#gameId').text(data.gameId);
    $('#socketId').text(data.socketId);
  };

  function updateGameList(gameIds){
    console.log('in udpateGameList()');
    let html ='';
    for(i=0; i<gameIds.length; i++){
      html = html + '<li class="list-group-item"><button class="btn btn-default" name="joinGameButton" value="'+gameIds[i]+'">' + gameIds[i] + '</button></li>';
    }
    $('#gameList').html(html);
  }

  function joinRoom(){
    gameId = $(this).attr("value");
    socket.emit('join room', {gameId: gameId, playerId: playerId});
  }

  function joinedRoom(data){
    $('#gameRoom').append('<p>Socket '+data.socketId+' joined this room');
  }

  function testEvent(data){
    console.log('in testEvent()');
    $templateTest.append('<p>Test event succes wth socket id= '+data.socketId+' and game id= </p>'+data.gameId);
    $gameArea.html($templateNewRoom);
  }

  function startGame(gameId){

    //Include loading image here!
    setTimeout(function(){
      $('#availableGames').hide();
      $gameArea.html($templateGameRoom);
    }
    , 5000);

  }

  init();

}($));
