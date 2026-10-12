import { BASE_CAT_TIERS, getCatTier } from '../game/CatData';
import { CatRenderer } from '../game/CatRenderer';
import { sound } from '../sound';

export class CollectionModal {
  public element: HTMLElement;
  private collectionId: string = 'classic';

  constructor(onClose: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="collection-modal-card">
        <div class="modal-header">
          <div class="modal-title">📖 Энциклопедия Кошек</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="collection-intro">
          Здесь собраны все 11 уровней эволюции кошек. Объединяй одинаковых котиков, чтобы добраться до вершины!
        </div>

        <div class="collection-grid">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    const closeBtn = this.element.querySelector('.modal-close-btn') as HTMLElement;
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      onClose();
    });

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        sound.playClick();
        onClose();
      }
    });

    this.render();
  }

  public setCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.render();
  }

  public render() {
    const grid = this.element.querySelector('.collection-grid') as HTMLElement;
    grid.innerHTML = '';

    BASE_CAT_TIERS.forEach((_, idx) => {
      const tierNum = idx + 1;
      const cat = getCatTier(tierNum, this.collectionId);

      const card = document.createElement('div');
      card.className = `cat-card-entry ${cat.isCrown ? 'king-tier' : ''}`;
      card.innerHTML = `
        <div class="cat-card-tier">Уровень ${cat.tier}</div>
        <div class="cat-card-preview-box">
          <canvas class="cat-thumb-canvas" width="64" height="64"></canvas>
        </div>
        <div class="cat-card-name">${cat.name}</div>
        <div class="cat-card-breed">${cat.breed}</div>
        <div class="cat-card-stats">
          <span>🎯 +${cat.points} очков</span>
          <span>🪙 +${cat.coins} монет</span>
        </div>
      `;

      grid.appendChild(card);

      // Render miniature on canvas
      const canvas = card.querySelector('.cat-thumb-canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scale = Math.min(22 / cat.radius, 0.95);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 + 2);
        ctx.scale(scale, scale);
        CatRenderer.drawCat(ctx, {
          x: 0,
          y: 0,
          angle: 0,
          tier: cat,
          squishX: 1,
          squishY: 1,
        });
        ctx.restore();
      }
    });
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
