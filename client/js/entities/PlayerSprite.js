export class PlayerSprite {
  constructor(player, isLocal) {
    this.player = player;
    this.isLocal = isLocal;
    this.animTime = 0;
    this.ghosts = []; // Store past frames during active dashes
  }

  update() {
    this.animTime += 0.15;

    // Track coordinates for trail generation
    if (this.player.dashing && !this.player.dead) {
      this.ghosts.push({ x: this.player.x, y: this.player.y, alpha: 0.6 });
      if (this.ghosts.length > 3) this.ghosts.shift();
    } else {
      if (this.ghosts.length > 0) this.ghosts.shift();
    }
  }

  draw(context) {
    const { x, y, facing, action, hitstun, dead, activeBuff } = this.player;

    // Render motion ghost afterimages
    this.ghosts.forEach((ghost, idx) => {
      context.save();
      context.globalAlpha = ghost.alpha * (idx / this.ghosts.length);
    this.drawFighterStructure(context, ghost.x, ghost.y, facing, action, hitstun, dead, true);
      context.restore();
    });

    // Draw core player
    this.drawFighterStructure(context, x, y, facing, action, hitstun, dead, false);

    // Render active Rage power buff visual effect
    if (activeBuff === 'RAGE' && !dead) {
      context.save();
      context.beginPath();
      context.arc(x + 20, y + 45, 45, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(255, 69, 0, 0.4)';
      context.lineWidth = 4;
      context.stroke();
      context.restore();
    }

    // Render active Shield power buff visual effect
    if (activeBuff === 'SHIELD' && !dead) {
      context.save();
      context.beginPath();
      context.arc(x + 20, y + 45, 48, 0, Math.PI * 2);
      context.strokeStyle = 'rgba(0, 225, 255, 0.6)';
      context.lineWidth = 3;
      context.stroke();
      context.restore();
    }
  }

  drawFighterStructure(context, x, y, facing, action, hitstun, dead, isGhost) {
    context.save();
    const cx = x + 20;
    const cy = y + 50;

    context.lineWidth = 5;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const colorTheme = this.isLocal ? '#00e1ff' : '#ff3366';
    const hitColor = '#ffffff';

    if (isGhost) {
      context.strokeStyle = 'rgba(0, 225, 255, 0.25)';
      context.fillStyle = 'rgba(0, 225, 255, 0.25)';
    } else {
      context.strokeStyle = hitstun > 0 ? hitColor : colorTheme;
      context.fillStyle = hitstun > 0 ? hitColor : colorTheme;
    }

    if (dead) {
      context.translate(cx, cy + 30);
      context.rotate((facing * Math.PI) / 2);
      context.translate(-cx, -(cy + 30));
    }

    const headRadius = 11;
    let spineAngle = 0;
    let lShoulderAngle = Math.PI / 1.5;
    let rShoulderAngle = Math.PI / 3;
    let lHipAngle = Math.PI / 1.5;
    let rHipAngle = Math.PI / 3;
    let lElbowAngle = Math.PI / 6;
    let rElbowAngle = -Math.PI / 6;
    let lKneeAngle = Math.PI / 4;
    let rKneeAngle = Math.PI / 4;

    if (action === 'run') {
      const cycle = Math.sin(this.animTime);
      lHipAngle = Math.PI / 2 + cycle * 0.7;
      rHipAngle = Math.PI / 2 - cycle * 0.7;
      lKneeAngle = lHipAngle + 0.3;
      rKneeAngle = rHipAngle + 0.3;
      lShoulderAngle = Math.PI / 2 - cycle * 0.6;
      rShoulderAngle = Math.PI / 2 + cycle * 0.6;
    } else if (action === 'jump') {
      lHipAngle = Math.PI / 2.5;
      rHipAngle = Math.PI / 1.8;
      lKneeAngle = Math.PI / 2;
      rKneeAngle = Math.PI / 2.2;
      lShoulderAngle = -Math.PI / 4;
      rShoulderAngle = -Math.PI / 3;
    } else if (action === 'punch') {
      spineAngle = facing * 0.15;
      if (facing === 1) {
        rShoulderAngle = 0;
        rElbowAngle = 0;
        lShoulderAngle = Math.PI / 1.2;
      } else {
        lShoulderAngle = Math.PI;
        lElbowAngle = 0;
        rShoulderAngle = Math.PI / 6;
      }
    } else if (action === 'kick') {
      spineAngle = -facing * 0.25;
      if (facing === 1) {
        rHipAngle = -Math.PI / 6;
        rKneeAngle = 0;
        lHipAngle = Math.PI / 1.8;
      } else {
        lHipAngle = Math.PI * 1.15;
        lKneeAngle = 0;
        rHipAngle = Math.PI / 2.2;
      }
    } else if (action === 'hit') {
      spineAngle = -facing * 0.4;
      lShoulderAngle = -Math.PI / 1.5;
      rShoulderAngle = -Math.PI / 1.5;
      lHipAngle = Math.PI / 2.5;
      rHipAngle = Math.PI / 2;
    } else if (dead) {
      spineAngle = 0.2;
      lShoulderAngle = Math.PI / 1.2;
      rShoulderAngle = Math.PI / 6;
      lHipAngle = Math.PI / 2;
      rHipAngle = Math.PI / 2;
    }

    const pelvis = { x: cx, y: cy };
    const neck = {
      x: cx + Math.sin(spineAngle) * 35,
      y: cy - Math.cos(spineAngle) * 35
    };
    const head = {
      x: neck.x + Math.sin(spineAngle) * 15,
      y: neck.y - Math.cos(spineAngle) * 15
    };

    // Draw Head
    context.beginPath();
    context.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
    context.fill();

    // Eye masks
    context.strokeStyle = '#050b14';
    context.lineWidth = 2.5;
    context.beginPath();
    if (facing === 1) {
      context.moveTo(head.x - 3, head.y - 2);
      context.lineTo(head.x + 8, head.y - 1);
    } else {
      context.moveTo(head.x + 3, head.y - 2);
      context.lineTo(head.x - 8, head.y - 1);
    }
    context.stroke();

    context.strokeStyle = isGhost ? 'rgba(0, 225, 255, 0.2)' : (hitstun > 0 ? hitColor : colorTheme);
    context.lineWidth = 5;

    // Draw Spine
    context.beginPath();
    context.moveTo(neck.x, neck.y);
    context.lineTo(pelvis.x, pelvis.y);
    context.stroke();

    // Draw Left Arm
    const lElbow = {
      x: neck.x + Math.cos(lShoulderAngle) * 18,
      y: neck.y + Math.sin(lShoulderAngle) * 18
    };
    const lHand = {
      x: lElbow.x + Math.cos(lShoulderAngle + lElbowAngle) * 16,
      y: lElbow.y + Math.sin(lShoulderAngle + lElbowAngle) * 16
    };
    context.beginPath();
    context.moveTo(neck.x, neck.y);
    context.lineTo(lElbow.x, lElbow.y);
    context.lineTo(lHand.x, lHand.y);
    context.stroke();

    // Draw Right Arm
    const rElbow = {
      x: neck.x + Math.cos(rShoulderAngle) * 18,
      y: neck.y + Math.sin(rShoulderAngle) * 18
    };
    const rHand = {
      x: rElbow.x + Math.cos(rShoulderAngle + rElbowAngle) * 16,
      y: rElbow.y + Math.sin(rShoulderAngle + rElbowAngle) * 16
    };
    context.beginPath();
    context.moveTo(neck.x, neck.y);
    context.lineTo(rElbow.x, rElbow.y);
    context.lineTo(rHand.x, rHand.y);
    context.stroke();

    // Draw Left Leg
    const lKnee = {
      x: pelvis.x + Math.cos(lHipAngle) * 22,
      y: pelvis.y + Math.sin(lHipAngle) * 22
    };
    const lFoot = {
      x: lKnee.x + Math.cos(lKneeAngle) * 20,
      y: lKnee.y + Math.sin(lKneeAngle) * 20
    };
    context.beginPath();
    context.moveTo(pelvis.x, pelvis.y);
    context.lineTo(lKnee.x, lKnee.y);
    context.lineTo(lFoot.x, lFoot.y);
    context.stroke();

    // Draw Right Leg
    const rKnee = {
      x: pelvis.x + Math.cos(rHipAngle) * 22,
      y: pelvis.y + Math.sin(rHipAngle) * 22
    };
    const rFoot = {
      x: rKnee.x + Math.cos(rKneeAngle) * 20,
      y: rKnee.y + Math.sin(rKneeAngle) * 20
    };
    context.beginPath();
    context.moveTo(pelvis.x, pelvis.y);
    context.lineTo(rKnee.x, rKnee.y);
    context.lineTo(rFoot.x, rFoot.y);
    context.stroke();

    context.restore();
  }
}