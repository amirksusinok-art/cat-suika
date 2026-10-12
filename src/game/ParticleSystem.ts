export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  alpha: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface SparkleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  type: 'star' | 'circle' | 'heart' | 'ring';
}

export class ParticleSystem {
  private particles: SparkleParticle[] = [];
  private floatingTexts: FloatingText[] = [];

  public spawnMergeBurst(x: number, y: number, color: string, tier: number) {
    // 1. Expanding shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 15,
      color,
      alpha: 0.9,
      rotation: 0,
      vRot: 0,
      life: 0,
      maxLife: 22,
      type: 'ring',
    });

    // 2. Stars & Circles burst
    const count = Math.min(24, 10 + tier * 2);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.5 + Math.random() * 4.5 + tier * 0.3;
      const types: ('star' | 'circle' | 'heart')[] = ['star', 'circle', 'heart'];
      const type = types[Math.floor(Math.random() * types.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.4 ? color : '#FFE082',
        alpha: 1,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.2,
        life: 0,
        maxLife: 28 + Math.random() * 16,
        type,
      });
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string = '#E67E22', fontSize: number = 22) {
    this.floatingTexts.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1,
      vy: -2.2,
      life: 0,
      maxLife: 42,
    });
  }

  public update() {
    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      if (p.type === 'ring') {
        p.size += 4.5;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      } else {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // Gravity
        p.vx *= 0.96;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life++;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy;
      ft.vy *= 0.95;
      ft.alpha = Math.max(0, 1 - ft.life / ft.maxLife);
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    // Draw Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.type === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else if (p.type === 'star') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        this.drawStar(ctx, 0, 0, 4, p.size, p.size * 0.45);
        ctx.fill();
      } else if (p.type === 'heart') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        this.drawHeart(ctx, 0, 0, p.size);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${ft.fontSize}px 'Nunito', 'Comfortaa', sans-serif`;
      ctx.textAlign = 'center';

      // Outline
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#FFFFFF';
      ctx.strokeText(ft.text, ft.x, ft.y);

      // Text Fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    const s = size * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.4);
    ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.4);
    ctx.bezierCurveTo(x - s, y + s * 0.8, x, y + s * 1.2, x, y + s * 1.4);
    ctx.bezierCurveTo(x, y + s * 1.2, x + s, y + s * 0.8, x + s, y + s * 0.4);
    ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.4);
    ctx.closePath();
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
