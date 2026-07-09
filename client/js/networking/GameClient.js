import { io } from 'https://cdn.socket.io/4.8.1/socket.io.esm.min.js';

export class GameClient {
  constructor() {
    this.socket = null;
    this.onRoomCreated = null;
    this.onRoomJoined = null;
    this.onStateUpdate = null;
    this.onError = null;
  }

  connect() {
    // Calling io() with no arguments tells Socket.io to connect to the exact 
    // host and protocol currently serving the HTML page. Perfect for production!
    this.socket = io(); 

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    this.socket.on('room-created', (payload) => {
      if (this.onRoomCreated) this.onRoomCreated(payload);
    });
    this.socket.on('room-joined', (payload) => {
      if (this.onRoomJoined) this.onRoomJoined(payload);
    });
    this.socket.on('room-update', (payload) => {
      if (this.onStateUpdate) this.onStateUpdate(payload);
    });
    this.socket.on('state', (payload) => {
      if (this.onStateUpdate) this.onStateUpdate(payload);
    });
    this.socket.on('error', (payload) => {
      if (this.onError) this.onError(payload);
    });
  }

  createRoom(playerName) {
    this.socket.emit('create-room', { playerName });
  }

  joinRoom(code, playerName) {
    this.socket.emit('join-room', { code, playerName });
  }

  sendInput(code, input, playerId) {
    this.socket.emit('input', { code, input, playerId });
  }
}