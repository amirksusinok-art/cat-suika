import { CatTier, GameMode } from '../game/Types';
import { CatRenderer } from '../game/CatRenderer';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class TopBar {
  public element: HTMLElement;
  private scoreEl!: HTMLElement;
  private bestScoreEl!: HTMLElement;
  private coinsEl!: HTMLElement;
  private nextCanvas!: HTMLCanvasElement;
  private nextCtx!: CanvasRenderingContext2D;
  private nextCat: CatTier | null = null;
  private modeBtn!: HTMLElement;

  constructor(
    onModeToggle: (newMode: GameMode) => void,
    onPauseToggle: () => void,
    onLeaderboardOpen: () => void
  ) {
    this.element = document.createElement('div');
    this.element.className = 'top-bar-container';
    this.element.innerHTML = `
      <!-- Top Left: Score Bubble (Exact match to Suika Game) -->
      <div class="score-bubble-card" title="Нажмите для открытия рейтинга">
        <div class="bubble-title">Score</div>
        <div class="bubble-score">0</div>
        <div class="bubble-best-label">BEST SCORE</div>
        <div class="bubble-best-val">0</div>
      </div>

      <!-- Top Center: Controls & Coins -->
      <div class="top-center-cluster">
        <div class="coin-badge-pill">
          <span class="coin-icon">🪙</span>
          <span class="coin-amount">0</span>
        </div>
        
        <div class="header-action-row">
          <button class="mode-toggle-btn" title="Сменить режим">
            <span class="mode-icon">🎮</span>
            <span class="mode-name">Классика</span>
          </button>
          <button class="icon-ctrl-btn sound-btn" title="Звук">🔊</button>
          <button class="icon-ctrl-btn rank-btn" title="Таблица лидеров">🏆</button>
          <button class="icon-ctrl-btn pause-btn" title="Пауза">⏸️</button>
        </div>
      </div>

      <!-- Top Right: Next Cat Bubble (Exact match to Suika Game) -->
      <div class="next-bubble-card">
        <div class="bubble-title">Next</div>
        <div class="next-canvas-wrapper">
          <canvas class="next-cat-canvas" width="60" height="60"></canvas>
        </div>
      </div>
    `;

    this.scoreEl = this.element.querySelector('.bubble-score') as HTMLElement;
    this.bestScoreEl = this.element.querySelector('.bubble-best-val') as HTMLElement;
    this.coinsEl = this.element.querySelector('.coin-amount') as HTMLElement;
    this.nextCanvas = this.element.querySelector('.next-cat-canvas') as HTMLCanvasElement;
    this.nextCtx = this.nextCanvas.getContext('2d')!;
    this.modeBtn = this.element.querySelector('.mode-toggle-btn') as HTMLElement;

    // Listeners
    let currentMode: GameMode = 'classic';
    this.modeBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      currentMode = currentMode === 'classic' ? 'sandbox' : 'classic';
      this.modeBtn.querySelector('.mode-name')!.textContent =
        currentMode === 'classic' ? 'Классика' : 'Песочница';
      this.modeBtn.querySelector('.mode-icon')!.textContent =
        currentMode === 'classic' ? '🎮' : '🧪';
      onModeToggle(currentMode);
    });

    const soundBtn = this.element.querySelector('.sound-btn') as HTMLElement;
    soundBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      const isMuted = sound.isSoundEnabled();
      sound.setSoundEnabled(!isMuted);
      soundBtn.textContent = !isMuted ? '🔊' : '🔇';
    });

    const pauseBtn = this.element.querySelector('.pause-btn') as HTMLElement;
    pauseBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      onPauseToggle();
    });

    const rankBtn = this.element.querySelector('.rank-btn') as HTMLElement;
    rankBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      onLeaderboardOpen();
    });

    const scoreCard = this.element.querySelector('.score-bubble-card') as HTMLElement;
    scoreCard.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      onLeaderboardOpen();
    });
  }

  public updateScore(score: number, bestScore: number) {
    this.scoreEl.textContent = score.toString();
    this.bestScoreEl.textContent = bestScore.toString();
  }

  public updateCoins(coins: number) {
    this.coinsEl.textContent = coins.toString();
  }

  public updateNextCat(cat: CatTier) {
    this.nextCat = cat;
    this.renderNextCat();
  }

  private renderNextCat() {
    if (!this.nextCat) return;
    const ctx = this.nextCtx;
    const w = this.nextCanvas.width;
    const h = this.nextCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Scale so next cat fits nicely in preview
    const scale = Math.min(22 / this.nextCat.radius, 1);
    ctx.save();
    ctx.translate(w / 2, h / 2 + 3);
    ctx.scale(scale, scale);

    CatRenderer.drawCat(ctx, {
      x: 0,
      y: 0,
      angle: 0,
      tier: this.nextCat,
      squishX: 1,
      squishY: 1,
    });
    ctx.restore();
  }
}
