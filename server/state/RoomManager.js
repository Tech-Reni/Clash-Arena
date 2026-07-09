import {
  COUNTDOWN_SECONDS,
  GAME_HEIGHT,
  GAME_WIDTH,
  GRAVITY,
  JUMP_FORCE,
  PLAYER_HEIGHT,
  PLAYER_MAX_HEALTH,
  PLAYER_WIDTH,
  ROUND_LENGTH,
  TICK_RATE,
  ATTACK_COOLDOWN,
  PUNCH_DURATION,
  KICK_DURATION,
  PUNCH_DAMAGE,
  KICK_DAMAGE,
  ATTACK_RANGE,
  HIT_STUN_DURATION,
  KNOCKBACK_PUNCH,
  KNOCKBACK_KICK,
  DASH_FORCE,
  MAX_FALL_SPEED,
  ROOM_MAX_PLAYERS,
  AIR_CONTROL,
  GROUND_FRICTION,
  MAX_HORIZONTAL_SPEED,
  ARENA_PLATFORMS,
  GROUND_LEVEL,
  POWERUP_SPAWN_INTERVAL,
  POWERUP_BUFF_DURATION,
  POWERUP_RADIUS,
  POWERUP_TYPES
} from '../../shared/constants/game.js';
import { clamp, createRoomCode, createId } from '../../shared/utils/helpers.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(socketId, playerName) {
    const room = new GameRoom(socketId, playerName);
    this.rooms.set(room.code, room);
    return room;
  }

  joinRoom(code, socketId, playerName) {
    const room = this.getRoom(code);
    if (!room || room.players.length >= ROOM_MAX_PLAYERS) {
      return null;
    }
    const player = room.addPlayer(socketId, playerName);
    if (!player) {
      return null;
    }
    return room;
  }

  getRoom(code) {
    return this.rooms.get(code.toUpperCase());
  }

  handleDisconnect(socketId) {
    for (const room of this.rooms.values()) {
      const player = room.players.find((entry) => entry.socketId === socketId);
      if (player) {
        player.connected = false;
      }
    }
  }

  resetRoom(room) {
    room.reset();
  }

  tick() {
    for (const room of this.rooms.values()) {
      room.simulate();
    }
  }
}

class GameRoom {
  constructor(socketId, playerName) {
    this.code = createRoomCode();
    this.players = [];
    this.inputs = {};
    this.powerups = [];
    this.powerupSpawnTimer = POWERUP_SPAWN_INTERVAL;
    this.started = false;
    this.countdown = COUNTDOWN_SECONDS;
    this.timeLeft = ROUND_LENGTH;
    this.winner = null;
    this.addPlayer(socketId, playerName);
  }

  addPlayer(socketId, playerName) {
    if (this.players.length >= ROOM_MAX_PLAYERS) {
      return null;
    }
    const side = this.players.length === 0 ? -1 : 1;
    const player = {
      id: createId('player'),
      name: this.players.length === 0 ? 'LORD' : 'FROST',
      socketId,
      connected: true,
      side,
      x: side === -1 ? 220 : 700,
      y: 200,
      velocityX: 0,
      velocityY: 0,
      health: PLAYER_MAX_HEALTH,
      facing: side === 1 ? -1 : 1,
      jumping: false,
      doubleJumped: false,
      jumpPressedLastFrame: false,
      dashing: false,
      attacking: false,
      attackType: null,
      attackTimer: 0,
      attackCooldown: 0,
      hitstun: 0,
      dead: false,
      score: 0,
      action: 'idle',
      activeBuff: null,
      buffTimer: 0,
      energy: 2,
      isBot: false // Standard Human Player
    };
    this.players.push(player);
    return player;
  }

  // NEW: Add a Server-Authoritative AI Berserker Player
  addBotPlayer(botName) {
    if (this.players.length >= ROOM_MAX_PLAYERS) {
      return null;
    }
    const player = {
      id: createId('bot'),
      name: botName,
      socketId: null, // No client connection socket needed
      connected: true,
      side: 1,
      x: 700,
      y: 200,
      velocityX: 0,
      velocityY: 0,
      health: PLAYER_MAX_HEALTH,
      facing: -1,
      jumping: false,
      doubleJumped: false,
      jumpPressedLastFrame: false,
      dashing: false,
      attacking: false,
      attackType: null,
      attackTimer: 0,
      attackCooldown: 0,
      hitstun: 0,
      dead: false,
      score: 0,
      action: 'idle',
      activeBuff: null,
      buffTimer: 0,
      energy: 2,
      isBot: true // Flag to run behavior calculations
    };
    this.players.push(player);
    return player;
  }

  reset() {
    this.started = false;
    this.countdown = COUNTDOWN_SECONDS;
    this.timeLeft = ROUND_LENGTH;
    this.winner = null;
    this.powerups = [];
    this.powerupSpawnTimer = POWERUP_SPAWN_INTERVAL;
    this.players.forEach((player, index) => {
      const side = index === 0 ? -1 : 1;
      player.x = side === -1 ? 220 : 700;
      player.y = 200;
      player.velocityX = 0;
      player.velocityY = 0;
      player.health = PLAYER_MAX_HEALTH;
      player.facing = side === 1 ? -1 : 1;
      player.jumping = false;
      player.doubleJumped = false;
      player.jumpPressedLastFrame = false;
      player.dashing = false;
      player.attacking = false;
      player.attackType = null;
      player.attackTimer = 0;
      player.attackCooldown = 0;
      player.hitstun = 0;
      player.dead = false;
      player.activeBuff = null;
      player.buffTimer = 0;
      player.energy = 2;
      player.action = 'idle';
    });
  }

  snapshot() {
    return {
      code: this.code,
      started: this.started,
      countdown: this.countdown,
      timeLeft: this.timeLeft,
      winner: this.winner,
      players: this.players.map((p) => ({ ...p })),
      powerups: this.powerups.map((p) => ({ ...p }))
    };
  }

  simulate() {
    if (this.players.length < ROOM_MAX_PLAYERS) {
      this.countdown = COUNTDOWN_SECONDS;
      this.timeLeft = ROUND_LENGTH;
      this.started = false;
      return;
    }

    if (!this.started) {
      this.countdown = Math.max(0, this.countdown - 1 / TICK_RATE);
      if (this.countdown === 0) {
        this.started = true;
      }
      return;
    }

    this.timeLeft = Math.max(0, this.timeLeft - 1 / TICK_RATE);

    this.powerupSpawnTimer -= 1 / TICK_RATE;
    if (this.powerupSpawnTimer <= 0) {
      this.powerupSpawnTimer = POWERUP_SPAWN_INTERVAL;
      this.spawnPowerup();
    }

    this.players.forEach((player) => {
      if (player.dead) {
        return;
      }

      // NEW: Run Bot AI logic update before parsing inputs
      if (player.isBot) {
        this.thinkBotAI(player);
      }

      if (player.buffTimer > 0) {
        player.buffTimer = Math.max(0, player.buffTimer - 1 / TICK_RATE);
        if (player.buffTimer === 0) {
          player.activeBuff = null;
        }
      }

      this.applyInputs(player);
      this.applyPhysics(player);
      this.resolveAttacks(player);
      this.resolvePowerupCollisions(player);
      this.checkWinCondition();
      this.updateActionState(player);
    });
  }

  // NEW: Berserker AI state behavior logic
  thinkBotAI(bot) {
    const botInput = { left: false, right: false, jump: false, punch: false, kick: false, dash: false };

    const opponent = this.players.find((p) => p.id !== bot.id);
    if (!opponent || opponent.dead) {
      this.inputs[bot.id] = botInput;
      return;
    }

    const botCenterX = bot.x + PLAYER_WIDTH / 2;
    const opponentCenterX = opponent.x + PLAYER_WIDTH / 2;

    // Choose destination priority target: Diverts to grab powerups, otherwise chases player
    let targetX = opponentCenterX;
    if (this.powerups.length > 0 && Math.random() < 0.45) {
      const closestPowerup = this.powerups[0];
      targetX = closestPowerup.x;
    }

    const distanceX = targetX - botCenterX;
    const absDistX = Math.abs(distanceX);
    const absDistY = Math.abs(opponent.y - bot.y);

    // 1. Pathfinding toward target coordinate
    if (absDistX > 25) {
      if (distanceX > 0) {
        botInput.right = true;
      } else {
        botInput.left = true;
      }
    }

    // 2. Platform Navigation & Gaps Jump Controller
    const onFloor = bot.y + PLAYER_HEIGHT >= GROUND_LEVEL;
    let onPlatform = false;
    for (const plat of ARENA_PLATFORMS) {
      const footX = bot.x + PLAYER_WIDTH / 2;
      const footY = bot.y + PLAYER_HEIGHT;
      if (footX >= plat.x && footX <= plat.x + plat.width && Math.abs(footY - plat.y) < 4) {
        onPlatform = true;
        break;
      }
    }
    const grounded = onFloor || onPlatform;

    // Jump up to pursue opponent on higher platform levels
    if (grounded && (opponent.y < bot.y - 40 || (absDistX < 80 && opponent.y < bot.y - 10))) {
      if (Math.random() < 0.15) { // Frame threshold keeps movement smooth
        botInput.jump = true;
      }
    }

    // Double-Jump triggers
    if (bot.jumping && !bot.doubleJumped && opponent.y < bot.y - 30) {
      if (Math.random() < 0.08) {
        botInput.jump = true;
      }
    }

    // 3. Dash Rushes (Aggressive spacing)
    if (absDistX > 190 && bot.energy > 0 && Math.random() < 0.035) {
      botInput.dash = true;
    }

    // 4. Combat attack triggers (Punches and heavy kicks)
    if (absDistX <= ATTACK_RANGE + 10 && absDistY < 60) {
      if (Math.random() < 0.38) {
        if (Math.random() < 0.65) {
          botInput.punch = true; // 65% Punch
        } else {
          botInput.kick = true; // 35% Heavy Kick
        }
      }
    }

    // Inject simulated input to player registers
    this.inputs[bot.id] = botInput;
  }

  spawnPowerup() {
    if (this.powerups.length >= 2) return;

    const types = [POWERUP_TYPES.HEALTH, POWERUP_TYPES.RAGE, POWERUP_TYPES.SHIELD];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const platform = ARENA_PLATFORMS[Math.floor(Math.random() * ARENA_PLATFORMS.length)];
    const px = platform.x + Math.random() * (platform.width - 32) + 16;
    const py = platform.y - POWERUP_RADIUS - 8;

    this.powerups.push({
      id: createId('powerup'),
      type: chosenType,
      x: px,
      y: py
    });
  }

  resolvePowerupCollisions(player) {
    for (let index = this.powerups.length - 1; index >= 0; index -= 1) {
      const item = this.powerups[index];
      const px = player.x + PLAYER_WIDTH / 2;
      const py = player.y + PLAYER_HEIGHT / 2;

      const dx = px - item.x;
      const dy = py - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < POWERUP_RADIUS + 25) {
        this.applyBuff(player, item.type);
        this.powerups.splice(index, 1);
      }
    }
  }

  applyBuff(player, type) {
    player.activeBuff = type;
    player.buffTimer = POWERUP_BUFF_DURATION;

    if (type === POWERUP_TYPES.HEALTH) {
      player.health = Math.min(PLAYER_MAX_HEALTH, player.health + 30);
      player.activeBuff = null;
    }
  }

  applyInputs(player) {
    const input = this.inputs[player.id] || { left: false, right: false, jump: false, punch: false, kick: false, dash: false };
    const moveDirection = Number(input.right) - Number(input.left);

    const onFloor = player.y + PLAYER_HEIGHT >= GROUND_LEVEL;
    let onPlatform = false;
    for (const plat of ARENA_PLATFORMS) {
      const footX = player.x + PLAYER_WIDTH / 2;
      const footY = player.y + PLAYER_HEIGHT;
      if (footX >= plat.x && footX <= plat.x + plat.width && Math.abs(footY - plat.y) < 4) {
        onPlatform = true;
        break;
      }
    }
    const grounded = onFloor || onPlatform;

    if (moveDirection !== 0 && player.hitstun <= 0) {
      const accel = grounded ? 0.38 : AIR_CONTROL;
      player.velocityX += moveDirection * accel;
      player.velocityX = clamp(player.velocityX, -MAX_HORIZONTAL_SPEED, MAX_HORIZONTAL_SPEED);
      player.facing = moveDirection > 0 ? 1 : -1;
    } else {
      player.velocityX *= grounded ? GROUND_FRICTION : 0.94;
    }

    const jumpPressed = input.jump;
    if (jumpPressed && !player.jumpPressedLastFrame && player.hitstun <= 0) {
      if (grounded) {
        player.velocityY = JUMP_FORCE;
        player.jumping = true;
        player.doubleJumped = false;
      } else if (!player.doubleJumped) {
        player.velocityY = JUMP_FORCE * 0.88;
        player.doubleJumped = true;
      }
    }
    player.jumpPressedLastFrame = jumpPressed;

    if (input.dash && player.hitstun <= 0 && !player.dashing && player.energy > 0) {
      player.dashing = true;
      player.energy -= 1;
      player.velocityX = player.facing * DASH_FORCE;
      player.velocityY = -0.6;

      setTimeout(() => {
        if (player) player.energy = Math.min(2, player.energy + 1);
      }, 5000);
    }

    if (player.dashing && Math.abs(player.velocityX) < 1.5) {
      player.dashing = false;
    }

    if (player.attackCooldown <= 0 && player.attackTimer <= 0 && player.hitstun <= 0) {
      if (input.punch) {
        player.attacking = true;
        player.attackType = 'punch';
        player.attackTimer = PUNCH_DURATION;
        player.attackCooldown = ATTACK_COOLDOWN;
      } else if (input.kick) {
        player.attacking = true;
        player.attackType = 'kick';
        player.attackTimer = KICK_DURATION;
        player.attackCooldown = ATTACK_COOLDOWN;
      }
    }

    if (player.attackTimer > 0) {
      player.attackTimer = Math.max(0, player.attackTimer - 1 / TICK_RATE);
      if (player.attackTimer === 0) {
        player.attacking = false;
        player.attackType = null;
      }
    }

    if (player.attackCooldown > 0) {
      player.attackCooldown = Math.max(0, player.attackCooldown - 1 / TICK_RATE);
    }

    if (player.hitstun > 0) {
      player.hitstun = Math.max(0, player.hitstun - 1 / TICK_RATE);
    }
  }

  applyPhysics(player) {
    player.velocityY += GRAVITY;
    player.velocityY = clamp(player.velocityY, -MAX_FALL_SPEED, MAX_FALL_SPEED);

    const oldY = player.y;
    player.x += player.velocityX;
    player.y += player.velocityY;

    if (player.x < 30) {
      player.x = 30;
      player.velocityX = 0;
    }
    if (player.x + PLAYER_WIDTH > GAME_WIDTH - 30) {
      player.x = GAME_WIDTH - 30 - PLAYER_WIDTH;
      player.velocityX = 0;
    }

    if (player.y + PLAYER_HEIGHT > GROUND_LEVEL) {
      player.y = GROUND_LEVEL - PLAYER_HEIGHT;
      player.velocityY = 0;
      player.jumping = false;
      player.doubleJumped = false;
    }

    if (player.velocityY >= 0) {
      for (const plat of ARENA_PLATFORMS) {
        const footX = player.x + PLAYER_WIDTH / 2;
        const oldFootY = oldY + PLAYER_HEIGHT;
        const newFootY = player.y + PLAYER_HEIGHT;

        if (footX >= plat.x && footX <= plat.x + plat.width) {
          if (oldFootY <= plat.y && newFootY >= plat.y) {
            player.y = plat.y - PLAYER_HEIGHT;
            player.velocityY = 0;
            player.jumping = false;
            player.doubleJumped = false;
            break;
          }
        }
      }
    }
  }

  resolveAttacks(attacker) {
    if (!attacker.attacking || attacker.attackTimer <= 0) {
      return;
    }

    const target = this.players.find((p) => p.id !== attacker.id);
    if (!target || target.dead) {
      return;
    }

    if (target.activeBuff === POWERUP_TYPES.SHIELD) {
      attacker.attacking = false;
      attacker.attackType = null;
      attacker.attackTimer = 0;
      return;
    }

    const attackerCoreX = attacker.x + PLAYER_WIDTH / 2;
    const targetCoreX = target.x + PLAYER_WIDTH / 2;
    const distanceX = targetCoreX - attackerCoreX;

    const correctDirection = (attacker.facing === 1 && distanceX > 0) || (attacker.facing === -1 && distanceX < 0);
    const inRange = Math.abs(distanceX) <= ATTACK_RANGE && Math.abs(target.y - attacker.y) < 60;

    if (correctDirection && inRange) {
      let damage = attacker.attackType === 'kick' ? KICK_DAMAGE : PUNCH_DAMAGE;
      const knockback = attacker.attackType === 'kick' ? KNOCKBACK_KICK : KNOCKBACK_PUNCH;

      if (attacker.activeBuff === POWERUP_TYPES.RAGE) {
        damage = Math.floor(damage * 1.5);
      }

      target.health = Math.max(0, target.health - damage);
      target.hitstun = HIT_STUN_DURATION;
      target.velocityX = attacker.facing * knockback;
      target.velocityY = -3.5;

      if (target.health <= 0) {
        target.dead = true;
        attacker.score += 1;
        this.winner = attacker.name;
      }

      attacker.attacking = false;
      attacker.attackType = null;
      attacker.attackTimer = 0;
    }
  }

  updateActionState(player) {
    if (player.hitstun > 0) {
      player.action = 'hit';
      return;
    }
    if (player.attacking) {
      player.action = player.attackType || 'punch';
      return;
    }
    if (Math.abs(player.velocityY) > 0.3) {
      player.action = 'jump';
      return;
    }
    if (Math.abs(player.velocityX) > 0.5) {
      player.action = 'run';
      return;
    }
    player.action = 'idle';
  }

  checkWinCondition() {
    if (this.timeLeft <= 0) {
      const alivePlayers = this.players.filter((p) => !p.dead);
      if (alivePlayers.length === 1) {
        this.winner = alivePlayers[0].name;
      } else if (alivePlayers.length === 2) {
        this.winner = 'Draw';
      }
    }
  }
}