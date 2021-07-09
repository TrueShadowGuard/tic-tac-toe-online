import React from 'react';
import ReactDOM from 'react-dom';
import {observer} from 'mobx-react';
import {makeObservable, observable, configure} from 'mobx';
import './style.css';

configure({
  enforceActions: 'never'
})


const App = observer(class extends React.Component {
  field = undefined;
  gameList = [];
  role = undefined;
  id = undefined;
  isConnected = undefined;
  isGameOn = false;
  isWaitingForPlayer = false;
  isMyTurn = undefined;

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
      gameId: observable
    })
    const HOST = window.location.origin.replace(/^http/, 'ws')
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
        case 'init':
          this.id = message.data.id;
          break;
        case 'field':
          this.field = message.data.field;
          break;
        case 'gameList':
          this.gameList = message.data.gameList;
          break;
        case 'gameCreated':
          this.isWaitingForPlayer = true;
          this.gameId = message.data.gameId;
          break;
        case 'startGame':
          this.isGameOn = true;
          this.isWaitingForPlayer = false;
          this.role = message.data.role;
          this.isMyTurn = message.data.role === 'x';
          this.gameId = message.data.gameId;
          this.field = [[' ', ' ', ' '], [' ', ' ', ' '], [' ', ' ', ' ']];
          break;
          case 'finishedGame':
            this.isGameOn = false;
            alert(`Игра окончена, ${message.data.result === 'draw' ? 'ничья' : message.data.result+' выграл'}`);
      }
    }

    socket.onclose = () => {
      this.isConnected = false;
    }
  }

  createGame = () => {
    this.socket.send(JSON.stringify({
      event: 'createGame',
    }));
  }

  joinGame = (gameId) => {
    this.socket.send(JSON.stringify({event: 'joinGame', data: {gameId}}))
  }

  turn = (x, y) => {
    this.socket.send(JSON.stringify({event: 'gameTurn', data: {gameId: this.gameId, role: this.role, x, y}}))
  }

  render() {
    console.log('gameList', this.gameList)
    return (
      <div style={{fontSize: 32}}>
        <div className="d-flex justify-content-between">
          <div>
            <div>Ваш id: {this.id}</div>
            <div>{this.isConnected ? 'Соединение с сервером установлено' : 'Соединение с сервером потеряно'}</div>
            <button disabled={this.isGameOn || this.isWaitingForPlayer} onClick={this.createGame}>Создать игру</button>
            {this.isWaitingForPlayer && <div>id лобби: {this.gameId}</div>}
            {this.isGameOn && (
              <div>
                <div>Вы играете за {this.role}</div>
                {
                  this.field?.map((row, y) => (
                    <div className="row" key={y}>
                      {row.map((cell, x) => <div className="cell" key={x + '' + y}
                                                 onClick={() => this.turn(x, y)}>{cell}</div>)}
                    </div>
                  ))}
              </div>
            )}
          </div>
          <div>
            {this.gameList?.map(game => <div key={game.id}>
              <h1>id:{game.id}</h1>
              <div>{game.players?.length}/2</div>
              <button onClick={() => this.joinGame(game.id)}
                      disabled={game.players?.some(p => p.id === this.id) || game.players?.length === 2}
              >Войти в игру
              </button>
            </div>)}
          </div>
        </div>
      </div>
    )
  }
});

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);
