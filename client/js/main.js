import { GAME_HEIGHT, GAME_WIDTH } from '../../shared/constants/game.js';
import { AudioManager } from './audio/AudioManager.js';
import { createRenderer } from './engine/Renderer.js';
import { GameClient } from './networking/GameClient.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const renderer = createRenderer(ctx);
const client = new GameClient();
const audioManager = new AudioManager();

const state = {
  room: null,
  localPlayerId: null,
  inputs: { left: false, right: false, jump: false, punch: false, kick: false, dash: false }
};

const bloodParticles = [];
const floatingTexts = [];

function spawnBlood(x, y, facing) {
  for (let index = 0; index < 15; index += 1) {
    bloodParticles.push({
      x,
      y,
      vx: -facing * (Math.random() * 5 + 2),
      vy: Math.random() * -6 - 2,
      size: Math.random() * 5 + 2,
      alpha: 1.0
    });
  }
}

function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    vy: -1.5,
    alpha: 1.0,
    size: 20
  });
}

function updateBloodParticles() {
  for (let index = bloodParticles.length - 1; index >= 0; index -= 1) {
    const part = bloodParticles[index];
    part.x += part.vx;
    part.y += part.vy;
    part.vy += 0.25;
    part.alpha -= 0.035;

    ctx.save();
    ctx.globalAlpha = Math.max(0, part.alpha);
    ctx.fillStyle = '#990000';
    ctx.fillRect(part.x, part.y, part.size, part.size);
    ctx.restore();

    if (part.alpha <= 0) {
      bloodParticles.splice(index, 1);
    }
  }
}

function updateFloatingTexts() {
  for (let index = floatingTexts.length - 1; index >= 0; index -= 1) {
    const textObj = floatingTexts[index];
    textObj.y += textObj.vy;
    textObj.alpha -= 0.02;

    ctx.save();
    ctx.globalAlpha = Math.max(0, textObj.alpha);
    ctx.fillStyle = textObj.color;
    ctx.font = `italic bold ${textObj.size}px sans-serif`;
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(textObj.text, textObj.x, textObj.y);
    ctx.restore();

    if (textObj.alpha <= 0) {
      floatingTexts.splice(index, 1);
    }
  }
}

function updateHud() {
  const roomInfo = document.getElementById('room-info');
  const healthLeft = document.getElementById('health-left');
  const healthRight = document.getElementById('health-right');
  const timer = document.getElementById('timer');
  const statusPill = document.getElementById('status-pill');
  const rematchBtn = document.getElementById('rematch-button');

  if (!state.room) {
    roomInfo.textContent = 'Join an arena to begin the duel…';
    healthLeft.textContent = 'HP: --';
    healthRight.textContent = 'HP: --';
    timer.textContent = '--';
    statusPill.textContent = 'Disconnected';
    rematchBtn.style.display = 'none';
    return;
  }

  const players = state.room.players || [];
  const local = players.find((p) => p.id === state.localPlayerId) || players[0];
  const opponent = players.find((p) => p.id !== state.localPlayerId) || players[1];

  if (state.room.winner) {
    roomInfo.textContent = `FATALITY: ${state.room.winner.toUpperCase()} WINS`;
    rematchBtn.style.display = 'inline-block';
  } else {
    roomInfo.textContent = state.room.started ? 'ROUND 1 - FIGHT' : `ROOM CODE: ${state.room.code}`;
    rematchBtn.style.display = 'none';
  }

  healthLeft.textContent = `HP: ${local ? local.health : 100}`;
  healthRight.textContent = `HP: ${opponent ? opponent.health : 100}`;
  timer.textContent = Math.max(0, Math.floor(state.room.timeLeft || 90)).toString();
  statusPill.textContent = state.room.started ? 'In Match' : 'Lobby';
}

function triggerAudioForAction(type) {
  audioManager.ensureStarted();
  audioManager.playSfx(type);
}

// Helper to bind tactile mobile virtual touch triggers
function bindTouchButton(elementId, actionProp) {
  const btn = document.getElementById(elementId);
  if (!btn) return;

  btn.addEventListener('touchstart', (event) => {
    event.preventDefault(); // Prevents cursor tap emulation & page scaling
    state.inputs[actionProp] = true;

    // Trigger instant client-side sfx feedback
    if (actionProp === 'punch') triggerAudioForAction('punch');
    if (actionProp === 'kick') triggerAudioForAction('dash');
    if (actionProp === 'jump') triggerAudioForAction('jump');
    if (actionProp === 'dash') triggerAudioForAction('dash');
  }, { passive: false });

  btn.addEventListener('touchend', (event) => {
    event.preventDefault();
    state.inputs[actionProp] = false;
  }, { passive: false });
}

function attachInputHandlers() {
  // 1. DESKTOP KEYBOARD INPUT BINDINGS
  window.addEventListener('keydown', (event) => {
    audioManager.ensureStarted();

    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' || event.key === ' ') {
      triggerAudioForAction('jump');
      state.inputs.jump = true;
    }
    if (event.key.toLowerCase() === 'f') {
      state.inputs.punch = true;
    }
    if (event.key.toLowerCase() === 'g') {
      state.inputs.kick = true;
    }
    if (event.key === 'Shift') {
      state.inputs.dash = true;
    }
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      state.inputs.left = true;
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      state.inputs.right = true;
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      state.inputs.left = false;
    }
    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      state.inputs.right = false;
    }
    if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w' || event.key === ' ') {
      state.inputs.jump = false;
    }
    if (event.key.toLowerCase() === 'f') {
      state.inputs.punch = false;
    }
    if (event.key.toLowerCase() === 'g') {
      state.inputs.kick = false;
    }
    if (event.key === 'Shift') {
      state.inputs.dash = false;
    }
  });

  // 2. MOBILE GAMEPAD BUTTON BINDINGS (Shadow Fight 2 Styled Overlay)
  bindTouchButton('btn-left', 'left');
  bindTouchButton('btn-right', 'right');
  bindTouchButton('btn-jump', 'jump');
  bindTouchButton('btn-punch', 'punch');
  bindTouchButton('btn-kick', 'kick');
  bindTouchButton('btn-dash', 'dash');

  // 3. LOBBY INTERACTIVE ELEMENT ACTIONS
  document.getElementById('create-room').addEventListener('click', () => {
    triggerAudioForAction('menu');
    const name = document.getElementById('player-name').value || 'LORD';
    client.createRoom(name);
  });

  document.getElementById('create-ai-room').addEventListener('click', () => {
    triggerAudioForAction('menu');
    const name = document.getElementById('player-name').value || 'LORD';
    client.socket.emit('create-ai-room', { playerName: name });
  });

  document.getElementById('join-room').addEventListener('click', () => {
    triggerAudioForAction('menu');
    const code = document.getElementById('room-code').value.toUpperCase();
    const name = document.getElementById('player-name').value || 'FROST';
    client.joinRoom(code, name);
  });

  document.getElementById('copy-room').addEventListener('click', async () => {
    triggerAudioForAction('menu');
    const roomCode = document.getElementById('room-code').value;
    if (roomCode) {
      await navigator.clipboard.writeText(roomCode);
    }
  });

  document.getElementById('rematch-button').addEventListener('click', () => {
    triggerAudioForAction('menu');
    if (state.room) {
      client.socket.emit('rematch', { code: state.room.code });
    }
  });

  document.getElementById('mute-button').addEventListener('click', () => {
    audioManager.toggleMute();
    document.getElementById('mute-button').textContent = audioManager.muted ? 'Unmute' : 'Mute';
  });
}

function loop() {
  renderer.clear();
  renderer.drawBackground();

  if (state.room) {
    renderer.drawArena(state.room);
    renderer.drawPowerups(state.room.powerups || []);
    renderer.drawPlayers(state.room.players, state.localPlayerId);
    renderer.drawArcadeHUD(state.room, state.localPlayerId);
  }

  updateBloodParticles();
  updateFloatingTexts();
  updateHud();
  requestAnimationFrame(loop);
}

// Transition handlers from lobby to game stages
function transitionToStage() {
  document.getElementById('lobby-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');
}

client.onRoomCreated = ({ code, playerId }) => {
  state.localPlayerId = playerId;
  document.getElementById('room-code').value = code;
  document.getElementById('room-info').textContent = `Match Arena Ready: ${code}`;
  transitionToStage();
};

client.onRoomJoined = ({ room, playerId }) => {
  state.localPlayerId = playerId;
  state.room = room;
  transitionToStage();
};

client.onStateUpdate = (room) => {
  const previousRoom = state.room;
  state.room = room;

  if (!previousRoom || !room.players) {
    return;
  }

  room.players.forEach((player) => {
    const previousPlayer = previousRoom.players.find((entry) => entry.id === player.id);
    if (!previousPlayer) {
      return;
    }

    if (player.action === 'punch' && previousPlayer.action !== 'punch') {
      triggerAudioForAction('punch');
    }

    if (player.action === 'kick' && previousPlayer.action !== 'kick') {
      triggerAudioForAction('dash');
    }

    if (player.hitstun > 0 && previousPlayer.hitstun <= 0) {
      triggerAudioForAction('hit');
      spawnBlood(player.x + 20, player.y + 40, player.facing);

      const dmgDealt = previousPlayer.health - player.health;
      if (dmgDealt > 0) {
        spawnFloatingText(player.x + 10, player.y - 20, `-${dmgDealt} HP`, '#ff3366');
      }
    }

    if (player.activeBuff && player.activeBuff !== previousPlayer.activeBuff) {
      triggerAudioForAction('jump');
      spawnFloatingText(player.x + 10, player.y - 40, `${player.activeBuff} BUFF!`, '#00e1ff');
    }
  });
};

client.onError = (error) => {
  window.alert(error.message || 'Error occurred entering the arena.');
};

attachInputHandlers();
audioManager.playMusic();
client.connect();

setInterval(() => {
  if (state.room && state.localPlayerId) {
    client.sendInput(state.room.code, state.inputs, state.localPlayerId);
  }
}, 1000 / 60);

loop();