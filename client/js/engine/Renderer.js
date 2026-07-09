import { GAME_HEIGHT, GAME_WIDTH, ARENA_PLATFORMS, GROUND_LEVEL } from '../../../shared/constants/game.js';
import { PlayerSprite } from '../entities/PlayerSprite.js';

export function createRenderer(context) {
  const spriteCache = new Map();
  let animFrame = 0;

  function clear() {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  function drawBackground() {
    animFrame += 1;

    context.fillStyle = '#0a0d16';
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Columns
    context.fillStyle = '#111522';
    for (let index = 0; index < 6; index += 1) {
      const colX = index * 180 + 40;
      context.fillRect(colX, 0, 50, GAME_HEIGHT);
      
      context.fillStyle = '#070a10';
      for (let tile = 0; tile < GAME_HEIGHT; tile += 80) {
        context.fillRect(colX, tile, 50, 4);
      }
      context.fillStyle = '#111522';
    }

    // Metal chains
    context.strokeStyle = '#181e30';
    context.lineWidth = 3;
    for (let chain = 0; chain < 4; chain += 1) {
      const cx = 100 + chain * 240;
      context.beginPath();
      for (let segment = 0; segment < 180; segment += 15) {
        context.arc(cx, segment, 5, 0, Math.PI * 2);
      }
      context.stroke();
    }

    drawTorch(80, 220);
    drawTorch(GAME_WIDTH - 110, 220);

    // Floor foundation
    context.fillStyle = '#1e2538';
    context.fillRect(0, GROUND_LEVEL, GAME_WIDTH, GAME_HEIGHT - GROUND_LEVEL);
    
    context.fillStyle = '#2c354f';
    context.fillRect(0, GROUND_LEVEL, GAME_WIDTH, 6);
  }

  function drawTorch(tx, ty) {
    context.fillStyle = '#22293d';
    context.fillRect(tx, ty, 8, 25);
    context.fillRect(tx - 6, ty, 20, 5);

    const flameSize = 10 + Math.sin(animFrame * 0.2) * 3;
    context.fillStyle = '#ff4500';
    context.beginPath();
    context.arc(tx + 4, ty - 6, flameSize, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ff8c00';
    context.beginPath();
    context.arc(tx + 4, ty - 4, flameSize * 0.65, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#ffea00';
    context.beginPath();
    context.arc(tx + 4, ty - 2, flameSize * 0.3, 0, Math.PI * 2);
    context.fill();
  }

  function drawArena(room) {
    ARENA_PLATFORMS.forEach((plat) => {
      context.fillStyle = '#22293d';
      context.fillRect(plat.x, plat.y, plat.width, plat.height);

      context.fillStyle = '#445175';
      context.fillRect(plat.x, plat.y, plat.width, 3);

      context.fillStyle = '#141824';
      context.fillRect(plat.x + 10, plat.y + plat.height, 14, 10);
      context.fillRect(plat.x + plat.width - 24, plat.y + plat.height, 14, 10);
    });

    if (room && room.countdown > 0 && room.players.length === 2) {
      context.save();
      context.fillStyle = '#ff3366';
      context.font = 'bold 90px sans-serif';
      context.textAlign = 'center';
      context.fillText(Math.ceil(room.countdown).toString(), GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      context.restore();
    }
  }

  // Draw dropping collectible Power-Ups
  function drawPowerups(powerups) {
    powerups.forEach((item) => {
      const floatOffset = Math.sin(animFrame * 0.1) * 4;
      const iy = item.y + floatOffset;

      context.save();
      // Draw spinning gem shape
      context.translate(item.x, iy);
      context.rotate(animFrame * 0.03);

      context.beginPath();
      context.moveTo(0, -12);
      context.lineTo(10, 0);
      context.lineTo(0, 12);
      context.lineTo(-10, 0);
      context.closePath();

      if (item.type === 'HEALTH') {
        context.fillStyle = '#33ff33';
        context.strokeStyle = '#a6ffa6';
      } else if (item.type === 'RAGE') {
        context.fillStyle = '#ff4500';
        context.strokeStyle = '#ffa68a';
      } else {
        context.fillStyle = '#00e1ff';
        context.strokeStyle = '#b3f7ff';
      }

      context.lineWidth = 2;
      context.fill();
      context.stroke();
      context.restore();
    });
  }

  // STATIONARY Arcade Fighter HUD (Matches Lord vs Frost layout exactly)
  function drawArcadeHUD(room, localPlayerId) {
    if (!room || room.players.length < 2) return;

    const p1 = room.players[0];
    const p2 = room.players[1];

    // Left/Right aligned HUD styling configs
    const hudY = 24;
    const hpWidth = 260;
    const hpHeight = 22;

    // --- LEFT FIGHTER HUD ("LORD" - P1) ---
    context.save();
    
    // Slanted back frame
    context.fillStyle = '#141824';
    context.beginPath();
    context.moveTo(110, hudY);
    context.lineTo(110 + hpWidth + 25, hudY);
    context.lineTo(110 + hpWidth, hudY + hpHeight + 14);
    context.lineTo(110 - 25, hudY + hpHeight + 14);
    context.closePath();
    context.fill();

    // Health Green bar (LORD)
    const p1Fill = (p1.health / 100) * hpWidth;
    context.fillStyle = '#33ff33';
    context.beginPath();
    context.moveTo(110, hudY + 4);
    context.lineTo(110 + p1Fill + 15, hudY + 4);
    context.lineTo(110 + p1Fill, hudY + hpHeight + 4);
    context.lineTo(110 - 15, hudY + hpHeight + 4);
    context.closePath();
    context.fill();

    // slanting border highlight
    context.strokeStyle = '#445175';
    context.lineWidth = 3;
    context.stroke();

    // Name slant text
    context.fillStyle = '#ffffff';
    context.font = 'italic bold 20px sans-serif';
    context.fillText(p1.name, 110, hudY - 6);

    // HP metrics numeric values
    context.fillStyle = '#c9d1d9';
    context.font = 'bold 12px monospace';
    context.fillText(`${p1.health}/100`, 110 + hpWidth - 65, hudY - 6);

    // Small glowing energy lightning bolts (Lord)
    drawEnergyLightning(context, 110, hudY + hpHeight + 8, p1.energy);

    // Avatar Circle (LORD - skull drawing)
    drawAvatarCircle(context, 60, hudY + 16, true);

    context.restore();

    // --- RIGHT FIGHTER HUD ("FROST" - P2) ---
    context.save();

    // Slanted frame (mirrored angle layout)
    context.fillStyle = '#141824';
    context.beginPath();
    context.moveTo(GAME_WIDTH - 110, hudY);
    context.lineTo(GAME_WIDTH - 110 - hpWidth - 25, hudY);
    context.lineTo(GAME_WIDTH - 110 - hpWidth, hudY + hpHeight + 14);
    context.lineTo(GAME_WIDTH - 110 + 25, hudY + hpHeight + 14);
    context.closePath();
    context.fill();

    // Health Green bar (FROST)
    const p2Fill = (p2.health / 100) * hpWidth;
    context.fillStyle = '#ff3366'; // mirrored red bar matching images
    context.beginPath();
    context.moveTo(GAME_WIDTH - 110, hudY + 4);
    context.lineTo(GAME_WIDTH - 110 - p2Fill - 15, hudY + 4);
    context.lineTo(GAME_WIDTH - 110 - p2Fill, hudY + hpHeight + 4);
    context.lineTo(GAME_WIDTH - 110 + 15, hudY + hpHeight + 4);
    context.closePath();
    context.fill();

    context.strokeStyle = '#445175';
    context.lineWidth = 3;
    context.stroke();

    // Slanted Name
    context.fillStyle = '#ffffff';
    context.font = 'italic bold 20px sans-serif';
    context.textAlign = 'right';
    context.fillText(p2.name, GAME_WIDTH - 110, hudY - 6);

    // Numeric metrics
    context.fillStyle = '#c9d1d9';
    context.font = 'bold 12px monospace';
    context.fillText(`${p2.health}/100`, GAME_WIDTH - 110 - hpWidth + 10, hudY - 6);

    // Small glowing energy lightning bolts (Frost)
    drawEnergyLightning(context, GAME_WIDTH - 110 - 25, hudY + hpHeight + 8, p2.energy, true);

    // Avatar Circle (FROST - ninja vector mask)
    drawAvatarCircle(context, GAME_WIDTH - 60, hudY + 16, false);

    context.restore();

    // --- CENTER STAGE TIMER ---
    context.save();
    context.fillStyle = '#ffffff';
    context.font = 'italic bold 44px sans-serif';
    context.textAlign = 'center';
    const cleanSeconds = Math.max(0, Math.floor(room.timeLeft)).toString();
    context.fillText(cleanSeconds, GAME_WIDTH / 2, hudY + 28);
    context.restore();
  }

  // Draw energy bolts indicating dash capability
  function drawEnergyLightning(ctx, x, y, charges, rightSide = false) {
    ctx.save();
    ctx.strokeStyle = '#00e1ff';
    ctx.fillStyle = '#00e1ff';
    ctx.lineWidth = 2;

    const gap = rightSide ? -16 : 16;
    for (let c = 0; c < 2; c += 1) {
      const lx = x + c * gap;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx - 4, y + 8);
      ctx.lineTo(lx + 2, y + 8);
      ctx.lineTo(lx - 2, y + 15);
      ctx.lineTo(lx + 4, y + 6);
      ctx.lineTo(lx - 2, y + 6);
      ctx.closePath();
      
      if (c < charges) {
        ctx.fill();
      } else {
        ctx.stroke(); // empty charge slot
      }
    }
    ctx.restore();
  }

  // Procedural vector avatar drawing inside circles (No external assets required!)
  function drawAvatarCircle(ctx, x, y, isLord) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#111522';
    ctx.strokeStyle = '#445175';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();

    // Vector Demon/Skull drawings
    if (isLord) {
      ctx.fillStyle = '#eaeaea';
      ctx.beginPath();
      ctx.arc(x, y + 4, 14, 0, Math.PI, true);
      ctx.lineTo(x + 14, y + 16);
      ctx.lineTo(x - 14, y + 16);
      ctx.closePath();
      ctx.fill();

      // Demon horns
      ctx.fillStyle = '#1c212c';
      ctx.beginPath();
      ctx.moveTo(x - 10, y - 4);
      ctx.quadraticCurveTo(x - 18, y - 18, x - 22, y - 10);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 10, y - 4);
      ctx.quadraticCurveTo(x + 18, y - 18, x + 22, y - 10);
      ctx.closePath();
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#ff3366';
      ctx.beginPath();
      ctx.arc(x - 5, y + 4, 3, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Vector Frost ninja mask
      ctx.fillStyle = '#1c2b42';
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();

      // Head band wrap
      ctx.fillStyle = '#00e1ff';
      ctx.fillRect(x - 15, y - 8, 30, 6);

      // Glowing Cyan Eye slots
      ctx.fillStyle = '#00e1ff';
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 2);
      ctx.lineTo(x - 2, y + 4);
      ctx.lineTo(x - 8, y + 5);
      ctx.moveTo(x + 8, y + 2);
      ctx.lineTo(x + 2, y + 4);
      ctx.lineTo(x + 8, y + 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawPlayers(players, localPlayerId) {
    players.forEach((player) => {
      const isLocal = player.id === localPlayerId;
      let sprite = spriteCache.get(player.id);
      if (!sprite) {
        sprite = new PlayerSprite(player, isLocal);
        spriteCache.set(player.id, sprite);
      }

      sprite.player = player;
      sprite.isLocal = isLocal;
      sprite.update();
      sprite.draw(context);
    });
  }

  return { clear, drawBackground, drawArena, drawPowerups, drawArcadeHUD, drawPlayers };
}