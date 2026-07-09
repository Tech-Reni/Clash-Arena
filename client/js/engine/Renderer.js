import { GAME_HEIGHT, GAME_WIDTH, ARENA_PLATFORMS, GROUND_LEVEL } from '../../../shared/constants/game.js';
import { PlayerSprite } from '../entities/PlayerSprite.js';

export function createRenderer(context) {
  const spriteCache = new Map();
  let animFrame = 0;
  const stars = [];
  
  // Generate background stars once
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * (GROUND_LEVEL - 50),
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.1,
      alpha: Math.random() * 0.6 + 0.2
    });
  }

  function clear() {
    context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  function drawBackground() {
    animFrame += 1;

    // Dark atmospheric gradient
    const bgGrad = context.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    bgGrad.addColorStop(0, '#05080f');
    bgGrad.addColorStop(0.4, '#0a0e1a');
    bgGrad.addColorStop(0.7, '#0f1424');
    bgGrad.addColorStop(1, '#151c2e');
    context.fillStyle = bgGrad;
    context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Twinkling stars
    stars.forEach((star) => {
      const twinkle = Math.sin(animFrame * star.speed) * 0.3 + 0.7;
      context.save();
      context.globalAlpha = star.alpha * twinkle;
      context.fillStyle = '#ffffff';
      context.beginPath();
      context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    });

    // Colosseum-style pillars
    const pillarColors = ['#111522', '#13172a', '#111522', '#0f1325', '#13172a', '#111522'];
    for (let index = 0; index < 6; index += 1) {
      const colX = index * 180 + 40;
      const gradient = context.createLinearGradient(colX, 0, colX + 50, 0);
      gradient.addColorStop(0, '#0d1120');
      gradient.addColorStop(0.3, pillarColors[index]);
      gradient.addColorStop(0.7, pillarColors[index]);
      gradient.addColorStop(1, '#0d1120');
      context.fillStyle = gradient;
      context.fillRect(colX, 0, 50, GAME_HEIGHT);
      
      // Pillar horizontal accents
      context.fillStyle = 'rgba(255, 51, 102, 0.08)';
      for (let tile = 0; tile < GAME_HEIGHT; tile += 80) {
        context.fillRect(colX, tile, 50, 3);
      }
      
      // Pillar glow edges
      context.fillStyle = 'rgba(0, 225, 255, 0.04)';
      context.fillRect(colX, 0, 2, GAME_HEIGHT);
      context.fillRect(colX + 48, 0, 2, GAME_HEIGHT);
    }

    // Decorative glowing orbs
    context.save();
    for (let orb = 0; orb < 5; orb++) {
      const ox = 80 + orb * 200;
      const oy = 100 + Math.sin(animFrame * 0.02 + orb) * 20;
      const orbGrad = context.createRadialGradient(ox, oy, 0, ox, oy, 15);
      orbGrad.addColorStop(0, 'rgba(255, 51, 102, 0.15)');
      orbGrad.addColorStop(1, 'rgba(255, 51, 102, 0)');
      context.fillStyle = orbGrad;
      context.beginPath();
      context.arc(ox, oy, 15, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    drawTorch(80, 220);
    drawTorch(GAME_WIDTH - 110, 220);

    // Floor foundation with gradient
    const floorGrad = context.createLinearGradient(0, GROUND_LEVEL, 0, GAME_HEIGHT);
    floorGrad.addColorStop(0, '#1e2538');
    floorGrad.addColorStop(0.3, '#1a2133');
    floorGrad.addColorStop(0.7, '#141a2a');
    floorGrad.addColorStop(1, '#0f1420');
    context.fillStyle = floorGrad;
    context.fillRect(0, GROUND_LEVEL, GAME_WIDTH, GAME_HEIGHT - GROUND_LEVEL);
    
    // Floor edge glow
    const edgeGrad = context.createLinearGradient(0, GROUND_LEVEL, 0, GROUND_LEVEL + 8);
    edgeGrad.addColorStop(0, '#2c354f');
    edgeGrad.addColorStop(0.5, '#3a4668');
    edgeGrad.addColorStop(1, '#2c354f');
    context.fillStyle = edgeGrad;
    context.fillRect(0, GROUND_LEVEL, GAME_WIDTH, 6);
    
    // Floor accent line
    context.fillStyle = 'rgba(255, 51, 102, 0.2)';
    context.fillRect(0, GROUND_LEVEL, GAME_WIDTH, 1);
    context.fillStyle = 'rgba(0, 225, 255, 0.15)';
    context.fillRect(0, GROUND_LEVEL + 3, GAME_WIDTH, 1);
  }

  function drawTorch(tx, ty) {
    // Torch pole
    const poleGrad = context.createLinearGradient(tx, 0, tx + 8, 0);
    poleGrad.addColorStop(0, '#1a2133');
    poleGrad.addColorStop(0.5, '#2c354f');
    poleGrad.addColorStop(1, '#1a2133');
    context.fillStyle = poleGrad;
    context.fillRect(tx, ty, 8, 25);
    
    // Torch bracket
    context.fillStyle = '#22293d';
    context.fillRect(tx - 6, ty, 20, 5);
    context.fillStyle = '#2c354f';
    context.fillRect(tx - 6, ty, 20, 2);

    // Fire glow
    const glowGrad = context.createRadialGradient(tx + 4, ty - 4, 0, tx + 4, ty - 4, 30);
    glowGrad.addColorStop(0, 'rgba(255, 140, 0, 0.3)');
    glowGrad.addColorStop(0.5, 'rgba(255, 69, 0, 0.1)');
    glowGrad.addColorStop(1, 'rgba(255, 69, 0, 0)');
    context.fillStyle = glowGrad;
    context.beginPath();
    context.arc(tx + 4, ty - 4, 30, 0, Math.PI * 2);
    context.fill();

    // Animated flame
    const flameSize = 10 + Math.sin(animFrame * 0.2) * 3;
    const flameSkew = Math.sin(animFrame * 0.15) * 2;
    
    // Outer flame (orange)
    context.fillStyle = '#ff4500';
    context.beginPath();
    context.ellipse(tx + 4 + flameSkew, ty - 6, flameSize, flameSize * 1.2, 0, 0, Math.PI * 2);
    context.fill();

    // Middle flame (light orange)
    context.fillStyle = '#ff8c00';
    context.beginPath();
    context.ellipse(tx + 4 + flameSkew * 0.7, ty - 4, flameSize * 0.65, flameSize * 0.8, 0, 0, Math.PI * 2);
    context.fill();

    // Inner flame (yellow)
    context.fillStyle = '#ffea00';
    context.beginPath();
    context.ellipse(tx + 4 + flameSkew * 0.4, ty - 2, flameSize * 0.3, flameSize * 0.35, 0, 0, Math.PI * 2);
    context.fill();
    
    // Core (white)
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.beginPath();
    context.arc(tx + 4 + flameSkew * 0.2, ty - 1, flameSize * 0.12, 0, Math.PI * 2);
    context.fill();
  }

  function drawArena(room) {
    ARENA_PLATFORMS.forEach((plat) => {
      // Platform body with gradient
      const platGrad = context.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
      platGrad.addColorStop(0, '#2c354f');
      platGrad.addColorStop(0.3, '#22293d');
      platGrad.addColorStop(1, '#1a2133');
      context.fillStyle = platGrad;
      context.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Top edge glow
      const topGrad = context.createLinearGradient(plat.x, plat.y, plat.x, plat.y + 4);
      topGrad.addColorStop(0, '#5a6b9a');
      topGrad.addColorStop(0.5, '#445175');
      topGrad.addColorStop(1, '#2c354f');
      context.fillStyle = topGrad;
      context.fillRect(plat.x, plat.y, plat.width, 4);

      // Support pillars
      context.fillStyle = '#141824';
      context.fillRect(plat.x + 10, plat.y + plat.height, 14, 10);
      context.fillRect(plat.x + plat.width - 24, plat.y + plat.height, 14, 10);
      
      // Pillar highlights
      context.fillStyle = '#1e2538';
      context.fillRect(plat.x + 10, plat.y + plat.height, 3, 10);
      context.fillRect(plat.x + plat.width - 24, plat.y + plat.height, 3, 10);
      
      // Platform accent line
      context.fillStyle = 'rgba(255, 51, 102, 0.15)';
      context.fillRect(plat.x, plat.y + plat.height - 1, plat.width, 1);
    });

    if (room && room.countdown > 0 && room.players.length === 2) {
      context.save();
      // Countdown shadow
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.font = 'bold 90px Orbitron, sans-serif';
      context.textAlign = 'center';
      context.fillText(Math.ceil(room.countdown).toString(), GAME_WIDTH / 2 + 4, GAME_HEIGHT / 2 - 16);
      
      // Countdown glow
      context.shadowColor = '#ff3366';
      context.shadowBlur = 30;
      context.fillStyle = '#ff3366';
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