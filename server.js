const express = require('express');
const path = require('path');
const {Server} = require('ws');
const isSolved = require('./utils/ticTacToeChecker');
const {SERVER_EVENTS, CLIENT_EVENTS} = require('./front/src/consts');

const app = express();
const server = app.listen(process.env.PORT || 80, () => console.log('listening'));

app.use(express.static(path.join(__dirname, 'front', 'build')))
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'front', 'build', 'index.html'));
});

const wss = new Server({server});

const games = {};

wss.on('connection', connection => {
  initConnection(connection);
  broadcastOnline();
  connection.on('message', message => {
    message = JSON.parse(message);

    switch (message.event) {
      case CLIENT_EVENTS.CREATE_GAME:
        createGame(connection);
        break;

      case CLIENT_EVENTS.JOIN_GAME:
        joinGame(connection, message);
        break;

      case CLIENT_EVENTS.GAME_TURN:
        gameTurn(connection, message);
        break;
    }
  });
  connection.on('close', () => {
    const gamesOfPlayer = Object.values(games).filter(game => game.players.some(p => p.id === connection.id));
    gamesOfPlayer.forEach(game => finishGame(game, 'error'));
    broadcastOnline();
  })
});

function sendEventToClient(connection, eventName, data) {
  connection.send(JSON.stringify({event: eventName, data: data}));
}

function initConnection(connection) {
  connection.id = Math.random();
  console.log('connected', connection.id);
  sendEventToClient(connection, SERVER_EVENTS.INIT, {id: connection.id})
  broadcastGames(connection);
}

function createGame(connection) {
  const game = {
    id: Math.random(),
    field: [[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']],
    players: [{id: connection.id, role: 'x', connection}],
    turn: 'x',
  };
  games[game.id] = game;
  broadcastGames();
  sendEventToClient(connection, SERVER_EVENTS.GAME_CREATED, {gameId: game.id});
}

function startGame(game) {
  game.players.forEach(p => {
    sendEventToClient(p.connection, SERVER_EVENTS.START_GAME, {role: p.role, gameId: game.id});
  });
}

function gameTurn(connection, message) {
  const x = message.data.x, y = message.data.y, role = message.data.role;
  const gameId = message.data.gameId;
  const game = games[gameId]
  if (role === game.turn && game.field[y][x] === ' ') {
    game.field[y][x] = role;
    game.players.forEach(p => broadcastField(p.connection, game.field));
    game.turn = game.turn === 'x' ? 'o' : 'x';

    const result = isSolved(game.field);
    if (result === -1) return;

    finishGame(game, result)
  }
}

function broadcastField(connection, field) {
  sendEventToClient(connection, SERVER_EVENTS.FIELD, {field});
}

function broadcastGames(connection) {
  const gameList = Object.values(games).map(o => ({id: o.id, players: o.players.map(p => ({id: p.id}))}));
  if (!connection) {
    wss.clients.forEach(connection => sendEventToClient(connection, SERVER_EVENTS.GAME_LIST, {gameList}));
  } else {
    sendEventToClient(connection, SERVER_EVENTS.GAME_LIST, {gameList})
  }
}

function broadcastOnline() {
  wss.clients.forEach(connection => sendEventToClient(connection, SERVER_EVENTS.ONLINE, {online: wss.clients.size}))
}

function joinGame(connection, message) {
  const gameId = message?.data?.gameId;
  const game = games[gameId];
  game.players.push({id: connection.id, role: 'o', connection});
  sendEventToClient(connection, SERVER_EVENTS.JOINED_GAME, {gameId});
  startGame(game);
  broadcastGames();
}

function finishGame(game, result) {
  game.players.forEach(p => sendEventToClient(p.connection, SERVER_EVENTS.FINISHED_GAME, {result}));
  delete games[game.id];
  broadcastGames();
}


