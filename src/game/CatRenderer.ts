import { CatTier } from './Types';

export interface RenderCatState {
  x: number;
  y: number;
  angle: number;
  tier: CatTier;
  squishX?: number; // 0.8 - 1.2
  squishY?: number;
  blinkProgress?: number; // 0 = open, 1 = closed
  wobble?: number;
}

export class CatRenderer {
  // Render a complete kawaii cat onto a canvas context
  public static drawCat(
    ctx: CanvasRenderingContext2D,
    cat: RenderCatState,
    time: number = 0
  ) {
    const { x, y, angle, tier } = cat;
    const r = tier.radius;
    const squishX = cat.squishX ?? 1;
    const squishY = cat.squishY ?? 1;
    const blink = cat.blinkProgress ?? 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(squishX, squishY);

    // 1. Cat Body Drop Shadow
    ctx.beginPath();
    ctx.arc(0, 3, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fill();

    // 2. Cat Ears (Drawn behind or atop body)
    this.drawEars(ctx, tier, r, time);

    // 3. Cat Main Body (Soft 3D sphere gradient)
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);

    const grad = ctx.createRadialGradient(
      -r * 0.28,
      -r * 0.28,
      r * 0.1,
      0,
      0,
      r
    );
    grad.addColorStop(0, '#FFFFFF'); // Top-left specular highlight
    grad.addColorStop(0.3, tier.color);
    grad.addColorStop(1, this.darkenColor(tier.color, 0.18));

    ctx.fillStyle = grad;
    ctx.fill();

    // Body Outline (Soft dark stroke)
    ctx.lineWidth = Math.max(2, r * 0.04);
    ctx.strokeStyle = this.darkenColor(tier.color, 0.4);
    ctx.stroke();

    // 4. Spots & Markings
    if (tier.spotColor) {
      this.drawSpots(ctx, tier, r);
    }

    // 5. Kawaii Face Elements
    this.drawFace(ctx, tier, r, blink, time);

    // 6. King Crown (Tier 11)
    if (tier.isCrown) {
      this.drawCrown(ctx, r, time);
    }

    ctx.restore();
  }

  // Draw Cute Pointy Ears with Pink Inner Details
  private static drawEars(
    ctx: CanvasRenderingContext2D,
    tier: CatTier,
    r: number,
    time: number
  ) {
    const earH = r * 0.48;
    const earW = r * 0.38;
    const earY = -r * 0.82;
    const earTilt = 0.25;

    // Slight organic ear twitch
    const twitchL = Math.sin(time * 0.003 + tier.tier) * 0.04;
    const twitchR = Math.cos(time * 0.0035 + tier.tier) * 0.04;

    // Left Ear
    ctx.save();
    ctx.translate(-r * 0.5, earY);
    ctx.rotate(-earTilt + twitchL);

    ctx.beginPath();
    ctx.moveTo(-earW * 0.5, 0);
    ctx.quadraticCurveTo(-earW * 0.1, -earH, 0, -earH);
    ctx.quadraticCurveTo(earW * 0.3, -earH * 0.5, earW * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = tier.earColor;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    ctx.strokeStyle = this.darkenColor(tier.color, 0.4);
    ctx.stroke();

    // Inner pink ear
    ctx.beginPath();
    ctx.moveTo(-earW * 0.28, -earH * 0.1);
    ctx.quadraticCurveTo(0, -earH * 0.85, 0, -earH * 0.85);
    ctx.quadraticCurveTo(earW * 0.2, -earH * 0.4, earW * 0.28, -earH * 0.1);
    ctx.closePath();
    ctx.fillStyle = tier.innerEarColor;
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(r * 0.5, earY);
    ctx.rotate(earTilt + twitchR);

    ctx.beginPath();
    ctx.moveTo(-earW * 0.5, 0);
    ctx.quadraticCurveTo(-earW * 0.3, -earH * 0.5, 0, -earH);
    ctx.quadraticCurveTo(earW * 0.1, -earH, earW * 0.5, 0);
    ctx.closePath();
    ctx.fillStyle = tier.earColor;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.035);
    ctx.strokeStyle = this.darkenColor(tier.color, 0.4);
    ctx.stroke();

    // Inner pink ear
    ctx.beginPath();
    ctx.moveTo(-earW * 0.28, -earH * 0.1);
    ctx.quadraticCurveTo(-earW * 0.2, -earH * 0.4, 0, -earH * 0.85);
    ctx.quadraticCurveTo(0, -earH * 0.85, earW * 0.28, -earH * 0.1);
    ctx.closePath();
    ctx.fillStyle = tier.innerEarColor;
    ctx.fill();
    ctx.restore();
  }

  // Draw Coat Spots & Calico Patches
  private static drawSpots(
    ctx: CanvasRenderingContext2D,
    tier: CatTier,
    r: number
  ) {
    if (!tier.spotColor) return;
    ctx.save();
    ctx.fillStyle = tier.spotColor;

    // Forehead soft tabby stripes or spots
    if (tier.tier === 2 || tier.tier === 8) {
      // Tabby forehead stripes
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * (r * 0.22), -r * 0.48, r * 0.05, r * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (tier.tier === 4 || tier.tier === 6) {
      // Siamese dark muzzle / calico patch
      ctx.beginPath();
      ctx.ellipse(0, r * 0.05, r * 0.45, r * 0.35, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (tier.tier === 9) {
      // Snow leopard rosettes
      [-0.45, 0.45].forEach((offset) => {
        ctx.beginPath();
        ctx.arc(r * offset, -r * 0.2, r * 0.12, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  // Draw Expressive Kawaii Eyes, Blush, Muzzle & Whiskers
  private static drawFace(
    ctx: CanvasRenderingContext2D,
    tier: CatTier,
    r: number,
    blink: number,
    _time: number
  ) {
    const eyeSpacing = r * 0.34;
    const eyeY = -r * 0.05;
    const eyeR = Math.max(2.5, r * 0.11);

    // 1. Blush Cheeks
    const blushR = Math.max(3, r * 0.15);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 130, 160, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing - eyeR * 0.6, eyeY + eyeR * 1.4, blushR, blushR * 0.65, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeSpacing + eyeR * 0.6, eyeY + eyeR * 1.4, blushR, blushR * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Eyes (Animated with Blinking!)
    if (blink > 0.6) {
      // Happy Closed Eye Arcs (^ ^)
      ctx.strokeStyle = tier.eyeColor;
      ctx.lineWidth = Math.max(2, r * 0.055);
      ctx.lineCap = 'round';

      // Left eye closed
      ctx.beginPath();
      ctx.arc(-eyeSpacing, eyeY + eyeR * 0.2, eyeR, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Right eye closed
      ctx.beginPath();
      ctx.arc(eyeSpacing, eyeY + eyeR * 0.2, eyeR, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      // Open Big Glossy Eyes
      [-eyeSpacing, eyeSpacing].forEach((ex) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = tier.eyeColor;
        ctx.fill();

        // Main pupil sparkle shine
        ctx.beginPath();
        ctx.arc(ex - eyeR * 0.32, eyeY - eyeR * 0.32, eyeR * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Minor reflection sparkle
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.3, eyeY + eyeR * 0.25, eyeR * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.restore();
      });
    }

    // 3. Cute Pink Nose
    const noseY = eyeY + eyeR * 0.95;
    const noseW = Math.max(2.5, r * 0.07);
    ctx.beginPath();
    ctx.moveTo(-noseW, noseY);
    ctx.lineTo(noseW, noseY);
    ctx.lineTo(0, noseY + noseW * 0.7);
    ctx.closePath();
    ctx.fillStyle = '#FF94AA';
    ctx.fill();

    // 4. Cat Mouth (^w^)
    ctx.strokeStyle = '#4A2E18';
    ctx.lineWidth = Math.max(1.6, r * 0.04);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const mouthY = noseY + noseW * 0.7;
    const mouthW = Math.max(3, r * 0.1);
    const mouthH = Math.max(2, r * 0.07);

    // Left curve
    ctx.beginPath();
    ctx.moveTo(0, mouthY);
    ctx.quadraticCurveTo(-mouthW * 0.5, mouthY + mouthH, -mouthW, mouthY + mouthH * 0.4);
    ctx.stroke();

    // Right curve
    ctx.beginPath();
    ctx.moveTo(0, mouthY);
    ctx.quadraticCurveTo(mouthW * 0.5, mouthY + mouthH, mouthW, mouthY + mouthH * 0.4);
    ctx.stroke();

    // 5. Whiskers (2 left, 2 right)
    ctx.strokeStyle = 'rgba(74, 46, 24, 0.45)';
    ctx.lineWidth = Math.max(1.2, r * 0.025);
    const whiskerLen = r * 0.42;

    // Left whiskers
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - eyeR, mouthY - 2);
    ctx.lineTo(-eyeSpacing - eyeR - whiskerLen, mouthY - 6);
    ctx.moveTo(-eyeSpacing - eyeR, mouthY + 3);
    ctx.lineTo(-eyeSpacing - eyeR - whiskerLen, mouthY + 5);
    ctx.stroke();

    // Right whiskers
    ctx.beginPath();
    ctx.moveTo(eyeSpacing + eyeR, mouthY - 2);
    ctx.lineTo(eyeSpacing + eyeR + whiskerLen, mouthY - 6);
    ctx.moveTo(eyeSpacing + eyeR, mouthY + 3);
    ctx.lineTo(eyeSpacing + eyeR + whiskerLen, mouthY + 5);
    ctx.stroke();
  }

  // Draw Majestic Crown for King Cat (Tier 11)
  private static drawCrown(
    ctx: CanvasRenderingContext2D,
    r: number,
    time: number
  ) {
    ctx.save();
    const crownW = r * 0.65;
    const crownH = r * 0.42;
    const crownY = -r * 0.88;

    ctx.translate(0, crownY);

    // Sparkle bounce
    const float = Math.sin(time * 0.005) * 2;
    ctx.translate(0, float);

    // Crown Path
    ctx.beginPath();
    ctx.moveTo(-crownW * 0.5, 0);
    ctx.lineTo(-crownW * 0.55, -crownH * 0.8);
    ctx.lineTo(-crownW * 0.25, -crownH * 0.35);
    ctx.lineTo(0, -crownH);
    ctx.lineTo(crownW * 0.25, -crownH * 0.35);
    ctx.lineTo(crownW * 0.55, -crownH * 0.8);
    ctx.lineTo(crownW * 0.5, 0);
    ctx.closePath();

    const goldGrad = ctx.createLinearGradient(0, -crownH, 0, 0);
    goldGrad.addColorStop(0, '#FFF176');
    goldGrad.addColorStop(0.5, '#FBC02D');
    goldGrad.addColorStop(1, '#F57F17');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#B7950B';
    ctx.stroke();

    // Crown Jewels (Emerald and Rubies)
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(0, -crownH * 0.4, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2ECC71';
    ctx.beginPath();
    ctx.arc(-crownW * 0.32, -crownH * 0.25, 3.5, 0, Math.PI * 2);
    ctx.arc(crownW * 0.32, -crownH * 0.25, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw the Adorable Dropper Cloud (matches `suika.jpg` top cloud dropper)
  public static drawDropperCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    time: number
  ) {
    ctx.save();
    ctx.translate(x, y);

    // Gentle floating breathing animation
    const floatY = Math.sin(time * 0.004) * 2.5;
    ctx.translate(0, floatY);

    // Cloud Body (Fluffy puffs)
    const cw = 70;
    const ch = 42;

    // Cloud Drop Shadow
    ctx.beginPath();
    ctx.ellipse(0, ch * 0.35 + 4, cw * 0.52, ch * 0.35, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fill();

    // Fluffy cloud circles
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2); // Center
    ctx.arc(-22, 4, 18, 0, Math.PI * 2); // Left
    ctx.arc(22, 4, 18, 0, Math.PI * 2); // Right
    ctx.arc(-10, -10, 16, 0, Math.PI * 2); // Top left
    ctx.arc(10, -10, 16, 0, Math.PI * 2); // Top right

    // Warm soft glowing cloud gradient
    const grad = ctx.createLinearGradient(0, -25, 0, 25);
    grad.addColorStop(0, '#FFFDE7'); // Soft sunlit cream
    grad.addColorStop(1, '#FFF9C4'); // Pastel yellow
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#F9E79F';
    ctx.stroke();

    // Cute Kawaii Smiling Face on Cloud (^.^)
    ctx.fillStyle = '#795548';
    // Eyes
    ctx.beginPath();
    ctx.arc(-11, 2, 2.5, 0, Math.PI * 2);
    ctx.arc(11, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle in eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-12, 1, 1, 0, Math.PI * 2);
    ctx.arc(10, 1, 1, 0, Math.PI * 2);
    ctx.fill();

    // Smiling mouth
    ctx.beginPath();
    ctx.arc(0, 6, 3.5, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#795548';
    ctx.stroke();

    // Blush
    ctx.fillStyle = 'rgba(255, 138, 128, 0.55)';
    ctx.beginPath();
    ctx.arc(-18, 5, 4, 0, Math.PI * 2);
    ctx.arc(18, 5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Helper color adjuster
  private static darkenColor(hex: string, amount: number): string {
    if (!hex.startsWith('#')) return hex;
    const clean = hex.slice(1);
    let r = parseInt(clean.substring(0, 2), 16);
    let g = parseInt(clean.substring(2, 4), 16);
    let b = parseInt(clean.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, Math.floor(r * (1 - amount))));
    g = Math.max(0, Math.min(255, Math.floor(g * (1 - amount))));
    b = Math.max(0, Math.min(255, Math.floor(b * (1 - amount))));

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
