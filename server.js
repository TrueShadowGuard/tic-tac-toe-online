const express = require('express');
const path = require('path');
const {Server} = require('ws');
const isSolved = require('./utils/ticTacToeChecker');

const app = express();
const server = app.listen(process.env.PORT || 80, () => console.log('listening'));

app.use(express.static(path.join(__dirname, 'front', 'build')))
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'front', 'build', 'index.html'))
})

const wss = new Server({server});

const games = {};

wss.on('connection', connection => {
  initConnection(connection);
  connection.on('message', message => {
    message = JSON.parse(message);
    switch (message.event) {
      case 'createGame':
        createGame(connection);
        break;
      case 'joinGame':
        joinGame(connection, message);
        break;
      case 'gameTurn':
        gameTurn(connection, message);
        break;
    }
  });
  connection.on('close', () => {
    const gamesOfPlayer = Object.values(games).filter(game => game.players.some(players => players.id === connection.id));
    gamesOfPlayer.forEach(game => finishGame(game, 'error'))
  })
});

function initConnection(connection) {
  connection.id = Math.random();
  console.log('connected', connection.id)
  connection.send(JSON.stringify(
    {
      event: 'init',
      data: {id: connection.id}
    }
  ));
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
  connection.send(JSON.stringify({
    event: 'gameCreated',
    data: {gameId: game.id}
  }));
}

function startGame(game) {
  game.players.forEach(p => {
    p.connection.send(JSON.stringify({event: 'startGame', data: {role: p.role, gameId: game.id}}))
  })
}

function gameTurn(connection, message) {
  const x = message.data.x, y = message.data.y, role = message.data.role;
  const gameId = message.data.gameId;
  const game = games[gameId]
  if (role === games[gameId].turn) {
    game.field[y][x] = role;
    game.players.forEach(p => broadcastField(p.connection, game.field));
    game.turn = game.turn === 'x' ? 'o' : 'x';
    const result = isSolved(game.field);
    if (result === -1) return;
    finishGame(game, result)
  }
}

function broadcastField(connection, field) {
  connection.send(JSON.stringify({
    event: 'field',
    data: {field}
  }))
}

function broadcastGames(connection) {
  const gameList = Object.values(games).map(o => ({id: o.id, players: o.players.map(p => ({id: p.id}))}));
  if (!connection) {
    wss.clients.forEach(connection => connection.send(JSON.stringify({event: 'gameList', data: {gameList}})));
  } else {
    connection.send(JSON.stringify({event: 'gameList', data: {gameList}}));
  }
}

function joinGame(connection, message) {
  const gameId = message?.data?.gameId;
  const game = games[gameId];
  game.players.push({id: connection.id, role: 'o', connection});
  connection.send(JSON.stringify({event: 'joinedGame', data: {gameId}}));
  startGame(game);
  broadcastGames();
}

function finishGame(game, result) {
  game.players.forEach(p => p.connection.send(JSON.stringify({
    event: 'finishedGame',
    data: {result}
  })));
  delete games[game.id];
  broadcastGames();
}



