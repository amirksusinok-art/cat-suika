import { PhysicsEngine, CatBodyData } from './Physics';
import { CatRenderer } from './CatRenderer';
import { ParticleSystem } from './ParticleSystem';
import { getCatTier, GAME_THEMES } from './CatData';
import { CatTier, GameMode, GameTheme } from './Types';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class Game {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public physics: PhysicsEngine;
  public particles: ParticleSystem;

  public mode: GameMode = 'classic';
  public currentTheme: GameTheme = GAME_THEMES[0];
  public collectionId: string = 'classic';

  // Game Stats
  public score: number = 0;
  public coinsEarnedThisSession: number = 0;
  public totalCoins: number = 0;
  public highScore: number = 0;
  public isGameOver: boolean = false;
  public isPaused: boolean = false;

  // Dropper State
  public currentTier: number = 1;
  public nextTier: number = 1;
  public dropperX: number = 0;
  public dropperY: number = 0;
  public isAiming: boolean = false;
  public canDrop: boolean = true;
  public dropCooldown: number = 550; // ms

  // Combo system
  public comboCount: number = 0;
  public lastMergeTime: number = 0;

  // Animation Loop
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private dangerPulseAlpha: number = 0;
  private isDangerWarning: boolean = false;

  // Callbacks
  public onScoreChange?: (score: number, highScore: number) => void;
  public onCoinsChange?: (coinsSession: number) => void;
  public onNextCatChange?: (nextCat: CatTier) => void;
  public onGameOver?: (finalScore: number, coinsEarned: number, isNewRecord: boolean) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context not supported');
    this.ctx = ctx;

    this.particles = new ParticleSystem();
    this.resizeCanvas();

    this.physics = new PhysicsEngine(
      this.canvas.width / window.devicePixelRatio,
      this.canvas.height / window.devicePixelRatio,
      this.collectionId
    );

    this.setupPhysicsCallbacks();
    this.setupInputListeners();
    this.rollNextCats();

    window.addEventListener('resize', () => this.handleResize());
  }

  private resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || (window.innerHeight - 70);

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private handleResize() {
    this.resizeCanvas();
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    this.physics = new PhysicsEngine(w, h, this.collectionId);
    this.setupPhysicsCallbacks();
  }

  public setTheme(theme: GameTheme) {
    this.currentTheme = theme;
  }

  public setCollection(collectionId: string) {
    this.collectionId = collectionId;
    this.physics.setCollection(collectionId);
  }

  public setHighScore(score: number) {
    this.highScore = score;
  }

  public setTotalCoins(coins: number) {
    this.totalCoins = coins;
  }

  private rollNextCats() {
    // Current drops are only small cats (Tier 1 to 3, occasionally 4)
    this.currentTier = this.getRandomDropTier();
    this.nextTier = this.getRandomDropTier();

    const box = this.physics.boxBounds;
    this.dropperX = box.left + box.width / 2;
    this.dropperY = box.top - 20;

    if (this.onNextCatChange) {
      this.onNextCatChange(getCatTier(this.nextTier, this.collectionId));
    }
  }

  private getRandomDropTier(): number {
    const r = Math.random();
    if (r < 0.5) return 1;
    if (r < 0.82) return 2;
    if (r < 0.96) return 3;
    return 4;
  }

  private setupPhysicsCallbacks() {
    this.physics.setOnMerge((newTier, x, y) => {
      this.handleCatMerge(newTier, x, y);
    });

    this.physics.setOnDangerAlert((isAlert) => {
      this.isDangerWarning = isAlert;
      if (isAlert) {
        telegram.haptic('warning');
      }
    });

    this.physics.setOnGameOver(() => {
      if (this.mode === 'classic' && !this.isGameOver) {
        this.triggerGameOver();
      }
    });
  }

  private handleCatMerge(newTier: number, x: number, y: number) {
    const tierData = getCatTier(newTier, this.collectionId);
    const now = performance.now();

    // 1. Combo detection (merges within 1.8 seconds)
    if (now - this.lastMergeTime < 1800) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastMergeTime = now;

    // 2. Score Calculation
    let earnedPoints = tierData.points;
    if (this.comboCount > 1) {
      earnedPoints = Math.round(earnedPoints * (1 + this.comboCount * 0.35));
    }
    this.score += earnedPoints;

    // 3. Coin Reward Calculation (based on exact defined rules)
    let earnedCoins = tierData.coins;
    let comboBonus = 0;
    if (this.comboCount === 2) comboBonus = 2;
    else if (this.comboCount === 3) comboBonus = 5;
    else if (this.comboCount === 4) comboBonus = 10;
    else if (this.comboCount >= 5) comboBonus = 20;

    earnedCoins += comboBonus;
    this.coinsEarnedThisSession += earnedCoins;
    this.totalCoins += earnedCoins;

    // Update High Score
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    // 4. Sound & Haptics
    sound.playPop(newTier);
    sound.playMeow(newTier);

    if (this.comboCount > 1) {
      sound.playCombo(this.comboCount);
      telegram.haptic('medium');
    } else {
      telegram.haptic('light');
    }

    // 5. Particles & Visual Text
    this.particles.spawnMergeBurst(x, y, tierData.color, newTier);
    this.particles.spawnFloatingText(
      x,
      y - 15,
      `+${earnedPoints}`,
      tierData.color,
      22 + Math.min(10, newTier)
    );

    if (comboBonus > 0) {
      this.particles.spawnFloatingText(
        x,
        y - 42,
        `x${this.comboCount} COMBO! +${comboBonus}🪙`,
        '#F39C12',
        24
      );
    }

    if (this.onScoreChange) {
      this.onScoreChange(this.score, this.highScore);
    }
    if (this.onCoinsChange) {
      this.onCoinsChange(this.coinsEarnedThisSession);
    }
  }

  private setupInputListeners() {
    const getPointerX = (e: MouseEvent | TouchEvent): number => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      return clientX - rect.left;
    };

    const handleStart = (e: MouseEvent | TouchEvent) => {
      if (this.isGameOver || this.isPaused) return;
      this.isAiming = true;
      this.updateDropperPos(getPointerX(e));
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!this.isAiming || this.isGameOver || this.isPaused) return;
      this.updateDropperPos(getPointerX(e));
    };

    const handleEnd = () => {
      if (!this.isAiming || this.isGameOver || this.isPaused) return;
      this.isAiming = false;
      this.dropCurrentCat();
    };

    // Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleStart(e);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleMove(e);
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleEnd();
    }, { passive: false });

    // Mouse
    this.canvas.addEventListener('mousedown', handleStart);
    this.canvas.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
  }

  private updateDropperPos(rawX: number) {
    const box = this.physics.boxBounds;
    const cat = getCatTier(this.currentTier, this.collectionId);
    const minX = box.left + cat.radius + 6;
    const maxX = box.right - cat.radius - 6;

    this.dropperX = Math.max(minX, Math.min(maxX, rawX));
  }

  public dropCurrentCat() {
    if (!this.canDrop || this.isGameOver || this.isPaused) return;
    this.canDrop = false;

    // 1. Spawn cat at dropper position
    const catTier = getCatTier(this.currentTier, this.collectionId);
    const spawnY = this.physics.boxBounds.top + catTier.radius + 10;
    this.physics.spawnCat(this.dropperX, spawnY, this.currentTier);

    // 2. Sound & Haptics
    sound.playDrop();
    telegram.haptic('light');

    // 3. Roll next cat
    this.currentTier = this.nextTier;
    this.nextTier = this.getRandomDropTier();

    if (this.onNextCatChange) {
      this.onNextCatChange(getCatTier(this.nextTier, this.collectionId));
    }

    // 4. Cooldown before next drop allowed
    setTimeout(() => {
      this.canDrop = true;
    }, this.dropCooldown);
  }

  // Sandbox Mode: Spawn any tier cat directly
  public spawnSandboxCat(tier: number) {
    const box = this.physics.boxBounds;
    const spawnX = box.left + box.width / 2 + (Math.random() - 0.5) * 80;
    const spawnY = box.top + 50;
    this.physics.spawnCat(spawnX, spawnY, tier);
    sound.playDrop();
    telegram.haptic('medium');
  }

  public clearSandbox() {
    this.physics.clearCats();
    this.particles.clear();
    sound.playPop(1);
    telegram.haptic('rigid');
  }

  public restartGame() {
    this.isGameOver = false;
    this.isPaused = false;
    this.score = 0;
    this.coinsEarnedThisSession = 0;
    this.comboCount = 0;
    this.physics.clearCats();
    this.particles.clear();
    this.rollNextCats();

    if (this.onScoreChange) {
      this.onScoreChange(this.score, this.highScore);
    }
    if (this.onCoinsChange) {
      this.onCoinsChange(0);
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    sound.playGameOver();
    telegram.haptic('error');

    // End-of-game coins: +1 coin per 100 points
    const pointCoins = Math.floor(this.score / 100);
    let recordBonus = 0;
    const isNewRecord = this.score >= this.highScore && this.score > 0;
    if (isNewRecord) {
      recordBonus = 50;
    }

    const totalSessionCoins = this.coinsEarnedThisSession + pointCoins + recordBonus;
    this.totalCoins += pointCoins + recordBonus;

    if (this.onGameOver) {
      this.onGameOver(this.score, totalSessionCoins, isNewRecord);
    }
  }

  // Main Game Loop
  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const delta = Math.min(32, time - this.lastTime);
      this.lastTime = time;

      if (!this.isPaused) {
        this.update(delta, time);
      }
      this.render(time);

      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private update(delta: number, _time: number) {
    this.physics.update(delta);
    this.particles.update();

    // Pulse danger line warning
    if (this.isDangerWarning) {
      this.dangerPulseAlpha = 0.4 + Math.sin(performance.now() * 0.008) * 0.35;
    } else {
      this.dangerPulseAlpha = 0;
    }
  }

  private render(time: number) {
    const ctx = this.ctx;
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background
    this.drawBackground(ctx, w, h);

    // 2. Draw Glass Container Box
    this.drawBox(ctx);

    // 3. Draw Danger Line
    this.drawDangerLine(ctx, time);

    // 4. Draw Physics Cats
    const bodies = this.physics.getCatBodies();
    for (const body of bodies) {
      const data = (body as unknown as { customData: CatBodyData }).customData;
      if (!data) continue;

      CatRenderer.drawCat(
        ctx,
        {
          x: body.position.x,
          y: body.position.y,
          angle: body.angle,
          tier: data.catTier,
          squishX: data.squishX,
          squishY: data.squishY,
          blinkProgress: data.blinkProgress,
        },
        time
      );
    }

    // 5. Draw Dropper Guide Line & Current Cat on Cloud
    if (!this.isGameOver) {
      this.drawDropper(ctx, time);
    }

    // 6. Draw Particles and Floating Texts
    this.particles.draw(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const [c1, c2] = this.currentTheme.backgroundGradient;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle decorative cute paw prints in background
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    this.drawDecorativePaw(ctx, 40, 80, 18, 0.2);
    this.drawDecorativePaw(ctx, w - 50, 140, 22, -0.3);
    this.drawDecorativePaw(ctx, 60, h - 120, 24, 0.4);
    this.drawDecorativePaw(ctx, w - 60, h - 90, 20, -0.2);
    ctx.restore();
  }

  private drawDecorativePaw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    rot: number
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    // Main pad
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.45, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 toe pads
    const toeR = size * 0.14;
    [-0.32, -0.1, 0.1, 0.32].forEach((offset, idx) => {
      const toeY = -size * (0.35 + (idx === 1 || idx === 2 ? 0.08 : 0));
      ctx.beginPath();
      ctx.arc(offset * size, toeY, toeR, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw Rounded Glass Container with Glowing Wooden/Pastel Border (matches `suika.jpg` box)
  private drawBox(ctx: CanvasRenderingContext2D) {
    const { left, top, width, height } = this.physics.boxBounds;
    const radius = 18;

    ctx.save();

    // Box Glass Background
    ctx.beginPath();
    ctx.roundRect(left, top, width, height, [0, 0, radius, radius]);
    ctx.fillStyle = this.currentTheme.boxBgColor;
    ctx.fill();

    // Outer Glass Glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.06)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Box Borders (thick, rounded, golden/pastel)
    ctx.lineWidth = 9;
    ctx.strokeStyle = this.currentTheme.boxBorderColor;
    ctx.stroke();

    // Inner subtle highlight line
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.roundRect(
      left + 5,
      top + 5,
      width - 10,
      height - 10,
      [0, 0, radius - 4, radius - 4]
    );
    ctx.stroke();

    ctx.restore();
  }

  // Draw Upper Danger Line
  private drawDangerLine(ctx: CanvasRenderingContext2D, time: number) {
    const { left, right } = this.physics.boxBounds;
    const y = this.physics.dangerLineY;

    ctx.save();
    ctx.setLineDash([8, 6]);

    if (this.isDangerWarning) {
      ctx.strokeStyle = `rgba(231, 76, 60, ${this.dangerPulseAlpha})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#E74C3C';
      ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = 'rgba(230, 126, 34, 0.35)';
      ctx.lineWidth = 2;
    }

    ctx.beginPath();
    ctx.moveTo(left + 6, y);
    ctx.lineTo(right - 6, y);
    ctx.stroke();

    // Warning Badge if alerting
    if (this.isDangerWarning) {
      ctx.setLineDash([]);
      ctx.font = 'bold 13px Nunito, sans-serif';
      ctx.fillStyle = '#E74C3C';
      ctx.textAlign = 'center';
      const bounce = Math.sin(time * 0.01) * 2;
      ctx.fillText('⚠️ ВНИМАНИЕ! ОПАСНАЯ ЛИНИЯ!', (left + right) / 2, y - 8 + bounce);
    }
    ctx.restore();
  }

  // Draw Dropper Cloud and Next Cat Held Below
  private drawDropper(ctx: CanvasRenderingContext2D, time: number) {
    const currentCat = getCatTier(this.currentTier, this.collectionId);

    // 1. Vertical White Drop Guide Line (Dashed)
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.dropperX, this.physics.boxBounds.top - 10);
    ctx.lineTo(this.dropperX, this.physics.boxBounds.bottom - 10);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Held Current Cat Hanging Below Cloud
    if (this.canDrop) {
      const catY = this.physics.boxBounds.top + currentCat.radius + 8;
      CatRenderer.drawCat(
        ctx,
        {
          x: this.dropperX,
          y: catY,
          angle: 0,
          tier: currentCat,
          squishX: 1,
          squishY: 1,
        },
        time
      );
    }

    // 3. Draw Kawaii Cloud Dropper at the Top
    CatRenderer.drawDropperCloud(
      ctx,
      this.dropperX,
      this.physics.boxBounds.top - 18,
      time
    );
  }
}
