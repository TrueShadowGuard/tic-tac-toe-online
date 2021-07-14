import React from 'react';
import ReactDOM from 'react-dom';
import {observer} from 'mobx-react';
import {makeObservable, observable, configure} from 'mobx';
import './style.css';

const {CLIENT_EVENTS, SERVER_EVENTS} = require('./consts');

configure({
  enforceActions: 'never'
});


const App = observer(class extends React.Component {
  field = undefined;
  gameList = [];
  role = undefined;
  id = undefined;
  isConnected = undefined;
  isGameOn = false;
  isWaitingForPlayer = false;
  isMyTurn = undefined;
  online = 0;
  gameId = undefined;

  socket = undefined;

  constructor(props) {
    super(props);
    makeObservable(this, {
      id: observable,
      field: observable,
      gameList: observable,
      isConnected: observable,
      isGameOn: observable,
      role: observable,
      isMyTurn: observable,
      isWaitingForPlayer: observable,
      gameId: observable,
      online: observable
    });
    this.connectToServer();
  }


  connectToServer = () => {
    //const HOST = window.location.origin.replace(/^http/, 'ws')
    const HOST = 'ws://localhost:80';
    const socket = new WebSocket(HOST);
    this.socket = socket;

    socket.onopen = () => {
      console.log('connected to server')
      this.isConnected = true;
    }

    socket.onmessage = message => {
      message = JSON.parse(message.data);
      console.log(message.event, message.data)

      switch (message.event) {
        case SERVER_EVENTS.INIT:
          this.id = message.data.id;
          break;

        case SERVER_EVENTS.ONLINE:
          this.online = message.data.online;
          break;

        case SERVER_EVENTS.FIELD:
          this.field = message.data.field;
          break;

        case SERVER_EVENTS.GAME_LIST:
          this.gameList = message.data.gameList;
          break;

        case SERVER_EVENTS.GAME_CREATED:
          this.isWaitingForPlayer = true;
          this.gameId = message.data.gameId;
          break;

        case SERVER_EVENTS.START_GAME:
          this.isGameOn = true;
          this.isWaitingForPlayer = false;
          this.role = message.data.role;
          this.isMyTurn = message.data.role === 'x';
          this.gameId = message.data.gameId;
          this.field = [[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']];
          break;
        case 'finishedGame':
          this.isGameOn = false;
          alert(`Игра окончена, ${
            message.data.result === 'draw' ? 'ничья' :
              message.data.result === 'error' ? 'ваш соперник вышел' :
                message.data.result + ' выграл'}`
          );
      }
    }

    socket.onclose = () => {
      this.isConnected = false;
      this.field = undefined;
      this.gameList = [];
      this.role = undefined;
      this.id = undefined;
      this.isConnected = false;
      this.isGameOn = false;
      this.isWaitingForPlayer = false;
      this.isMyTurn = undefined;

      setTimeout(() => {
        this.connectToServer();
      }, 1000);
    }
  }

  sendEventToServer(eventName, data) {
    const jsonObject = {event: eventName}
    if (data !== undefined) jsonObject.data = data;
    this.socket.send(JSON.stringify(jsonObject));
  }

  createGame = () => {
    this.sendEventToServer(CLIENT_EVENTS.CREATE_GAME);
  }

  joinGame = (gameId) => {
    this.sendEventToServer(CLIENT_EVENTS.JOIN_GAME, {gameId});
  }

  turn = (x, y) => {
    this.sendEventToServer(CLIENT_EVENTS.GAME_TURN, {gameId: this.gameId, role: this.role, x, y})
  }

  render() {
    return (
      <div className="wrapper">
        {GameInfo.call(this)}
        {GameList.call(this)}
        {this.isGameOn && (
          GameField.call(this)
        )}
      </div>
    )
  }
});

function GameField() {
  return (
    <div className="w-100">
      <div className="w-100">
        Вы играете за {this.role}
      </div>
      {
        this.field?.map((row, y) => (
          <div className="row" key={y}>
            {row.map((cell, x) => <div className="cell" key={x + '' + y}
                                       onClick={() => this.turn(x, y)}>{cell}</div>)}
          </div>
        ))}
    </div>
  );
}

function GameInfo() {
  return (
    <div className="game-info">
      <div>
        {this.isConnected ? 'Соединение с сервером установлено' : 'Соединение с сервером потеряно'} <br/>
        {'Текущий онлайн: ' + this.online} <br/>
        {this.gameId ? `Вы находитесь в лобби ${this.gameId}` : 'Вы не находитесь в лобби'}
      </div>
      <button className="button"
              disabled={this.isGameOn || this.isWaitingForPlayer}
              onClick={this.createGame}
      >Создать игру
      </button>
    </div>
  )
}

function GameList() {
  return (
    <div className="game-list">
      <div className="game-list__title">Список лобби:</div>
      <div className="overflow-y-auto h40vh">
        {this.gameList?.slice()?.reverse()?.map((game, i) => <div key={game.id} className="game-list__game">
          <div>id:{game.id}</div>
          <div>{game.players?.length}/2</div>
          <button onClick={() => this.joinGame(game.id)}
                  disabled={this.isWaitingForPlayer || game.players?.some(p => p.id === this.id) || game.players?.length === 2}
          >Войти в игру
          </button>
          {(this.gameList.length - 1) !== i && <hr className="mx-1"/>}
        </div>)}
      </div>
    </div>
  )
}

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);
