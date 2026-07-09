import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { RoomManager } from './state/RoomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const port = process.env.PORT || 3000;
const roomManager = new RoomManager();

app.use(express.static(path.join(__dirname, '..', 'client')));
app.use('/shared', express.static(path.join(__dirname, '..', 'shared')));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', game: 'Code Clash Arena' });
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  socket.on('create-room', ({ playerName }) => {
    const room = roomManager.createRoom(socket.id, playerName || 'Player');
    socket.join(room.code);
    socket.emit('room-created', { code: room.code, playerId: room.players[0].id });
  });

  // NEW: Single-Player Berserker Bot Room Trigger
  socket.on('create-ai-room', ({ playerName }) => {
    const room = roomManager.createRoom(socket.id, playerName || 'Player');
    room.addBotPlayer('BERSERKER'); // Insert bot player as competitor
    socket.join(room.code);
    socket.emit('room-created', { code: room.code, playerId: room.players[0].id });
    
    // Broadcast initial state so client renders Bot immediately
    io.to(room.code).emit('room-update', room.snapshot());
  });

  socket.on('join-room', ({ code, playerName }) => {
    const room = roomManager.getRoom(code);
    if (room && room.players.length === 1) {
      const joinedRoom = roomManager.joinRoom(code, socket.id, playerName || 'Player');
      socket.join(room.code);
      socket.emit('room-joined', {
        code: room.code,
        playerId: room.players[room.players.length - 1].id,
        room: room.snapshot()
      });
      io.to(room.code).emit('room-update', room.snapshot());
    } else {
      socket.emit('error', { message: 'Unable to join room.' });
    }
  });

  socket.on('reconnect-room', ({ code, playerId }) => {
    const room = roomManager.getRoom(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }
    const player = room.players.find((entry) => entry.id === playerId);
    if (player) {
      player.connected = true;
      player.socketId = socket.id;
      socket.join(room.code);
      socket.emit('room-joined', { code: room.code, playerId, room: room.snapshot() });
      io.to(room.code).emit('room-update', room.snapshot());
    }
  });

  socket.on('input', ({ code, input, playerId }) => {
    const room = roomManager.getRoom(code);
    if (!room) {
      return;
    }
    const player = room.players.find((entry) => entry.id === playerId);
    if (player) {
      room.inputs[playerId] = input;
    }
  });

  socket.on('rematch', ({ code }) => {
    const room = roomManager.getRoom(code);
    if (room) {
      roomManager.resetRoom(room);
      io.to(room.code).emit('room-update', room.snapshot());
    }
  });

  socket.on('disconnect', () => {
    roomManager.handleDisconnect(socket.id);
  });
});

setInterval(() => {
  roomManager.tick();
  for (const room of roomManager.rooms.values()) {
    io.to(room.code).emit('state', room.snapshot());
  }
}, 1000 / 60);

server.listen(port, () => {
  console.log(`Code Clash Arena server listening on port ${port}`);
});