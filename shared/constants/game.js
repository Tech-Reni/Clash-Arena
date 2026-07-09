export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const TICK_RATE = 60;
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 90;
export const PLAYER_MAX_HEALTH = 100;
export const ROOM_MAX_PLAYERS = 2;

// Core Physics
export const GRAVITY = 0.55;
export const MOVE_SPEED = 4.2;
export const JUMP_FORCE = -12.5;
export const DASH_FORCE = 10.5;
export const MAX_FALL_SPEED = 14;
export const AIR_CONTROL = 0.3;
export const GROUND_FRICTION = 0.80;
export const MAX_HORIZONTAL_SPEED = 6.0;

// Dual Fighter Attack Parameters
export const ATTACK_COOLDOWN = 0.22;
export const PUNCH_DURATION = 0.12;
export const KICK_DURATION = 0.16;
export const ATTACK_RANGE = 75;
export const PUNCH_DAMAGE = 8;
export const KICK_DAMAGE = 14;
export const HIT_STUN_DURATION = 0.25;
export const KNOCKBACK_PUNCH = 4.5;
export const KNOCKBACK_KICK = 7.5;

export const COUNTDOWN_SECONDS = 3;
export const ROUND_LENGTH = 90;

// Structural Platforms
export const ARENA_PLATFORMS = [
  { x: 140, y: 310, width: 220, height: 16 }, // Left platform
  { x: 600, y: 310, width: 220, height: 16 }, // Right platform
  { x: 340, y: 200, width: 280, height: 16 }  // Center high ledge
];

export const GROUND_LEVEL = GAME_HEIGHT - 60; // 480px

// Server-Authoritative Power-Up drops
export const POWERUP_SPAWN_INTERVAL = 10; // Try spawning an item drop every 10s
export const POWERUP_BUFF_DURATION = 6.0; // Duration of power buffs (seconds)
export const POWERUP_RADIUS = 16;
export const POWERUP_TYPES = {
  HEALTH: 'HEALTH',
  RAGE: 'RAGE',
  SHIELD: 'SHIELD'
};