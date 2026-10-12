import { BASE_CAT_TIERS, getCatTier } from '../game/CatData';
import { CatRenderer } from '../game/CatRenderer';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class EvolutionCircle {
  public element: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private collectionId: string = 'classic';

  constructor(onClick: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'evolution-circle-widget';
    this.element.title = 'Круг Эволюции Котиков (нажмите для деталей)';
    this.element.innerHTML = `
      <div class="evo-title">Circle of Evolution</div>
      <div class="evo-canvas-box">
        <canvas class="evo-canvas" width="160" height="160"></canvas>
      </div>
    `;

    this.canvas = this.element.querySelector('.evo-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.element.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      onClick();
    });

    this.render();
  }

  public setCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.render();
  }

  public render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const trackRadius = 56;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw glowing circular track with arrow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, trackRadius, 0.4, Math.PI * 2 - 0.4);
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.stroke();

    // Inner track gradient
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255, 230, 160, 0.6)';
    ctx.stroke();
    ctx.restore();

    // 2. Draw 11 Cat Tiers around the ring clockwise
    const total = BASE_CAT_TIERS.length; // 11
    const startAngle = Math.PI * 0.65;
    const endAngle = Math.PI * 2.35;
    const angleRange = endAngle - startAngle;

    for (let i = 0; i < total; i++) {
      const tierNum = i + 1;
      const cat = getCatTier(tierNum, this.collectionId);
      const angle = startAngle + (i / (total - 1)) * angleRange;

      const px = cx + Math.cos(angle) * trackRadius;
      const py = cy + Math.sin(angle) * trackRadius;

      // Miniature cat preview
      const targetSize = 6 + i * 1.5; // grows from 6px to ~21px
      const scale = targetSize / cat.radius;

      ctx.save();
      ctx.translate(px, py);
      ctx.scale(scale, scale);

      CatRenderer.drawCat(ctx, {
        x: 0,
        y: 0,
        angle: 0,
        tier: cat,
      });

      ctx.restore();
    }
  }
}
