const SERVER_EVENTS = {
  INIT: "init",
  GAME_CREATED: "gameCreated",
  START_GAME: "startGame",
  FIELD: "field",
  GAME_LIST: "gameList",
  ONLINE: "online",
  JOINED_GAME: "joinedGame",
  FINISHED_GAME: "finishedGame",
}

const CLIENT_EVENTS = {
  CREATE_GAME: "createGame",
  JOIN_GAME: "joinGame",
  GAME_TURN: "gameTurn",
}

const consts = {
  SERVER_EVENTS,
  CLIENT_EVENTS,
}

module.exports = consts;
