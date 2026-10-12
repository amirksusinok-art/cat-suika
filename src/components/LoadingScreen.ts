export class LoadingScreen {
  private container: HTMLElement;
  private progressBar!: HTMLElement;
  private progressText!: HTMLElement;
  private tipText!: HTMLElement;
  private currentProgress: number = 0;
  private targetProgress: number = 0;
  private intervalId: number | null = null;

  private tips: string[] = [
    'Совет: Две одинаковые кошки объединяются в кошку следующего уровня!',
    'Совет: Крупные кошки имеют большую массу и толкают маленьких котят.',
    'Совет: Делай серии объединений подряд, чтобы получать комбо-монеты!',
    'Совет: Следи за верхней пунктирной линией, не давай коробке переполниться!',
    'Совет: Вырасти легендарного Короля Котов с золотой короной!',
  ];

  constructor(onComplete: () => void) {
    this.container = document.createElement('div');
    this.container.className = 'loading-screen';
    this.container.innerHTML = `
      <div class="loading-content">
        <!-- Floating Animated Mascot Kitten -->
        <div class="mascot-wrapper">
          <div class="mascot-cat">
            <div class="mascot-ear left"></div>
            <div class="mascot-ear right"></div>
            <div class="mascot-body">
              <div class="mascot-blush left"></div>
              <div class="mascot-blush right"></div>
              <div class="mascot-eye left"></div>
              <div class="mascot-eye right"></div>
              <div class="mascot-nose"></div>
              <div class="mascot-mouth"></div>
            </div>
            <div class="mascot-paws">
              <div class="paw left"></div>
              <div class="paw right"></div>
            </div>
          </div>
          <div class="mascot-shadow"></div>
        </div>

        <!-- Logo -->
        <div class="loading-title">
          <span class="title-cat">Cat</span>
          <span class="title-suika">Suika</span>
        </div>
        <div class="loading-subtitle">Мурчащая головоломка с физикой</div>

        <!-- Progress Bar -->
        <div class="progress-box">
          <div class="progress-bar-track">
            <div class="progress-bar-fill"></div>
          </div>
          <div class="progress-label">0%</div>
        </div>

        <!-- Tips -->
        <div class="loading-tip">Загрузка уютного мира котиков...</div>
      </div>
    `;

    document.body.appendChild(this.container);

    this.progressBar = this.container.querySelector('.progress-bar-fill') as HTMLElement;
    this.progressText = this.container.querySelector('.progress-label') as HTMLElement;
    this.tipText = this.container.querySelector('.loading-tip') as HTMLElement;

    this.startLoading(onComplete);
  }

  private startLoading(onComplete: () => void) {
    let tipIdx = 0;
    this.tipText.textContent = this.tips[tipIdx];

    const tipInterval = setInterval(() => {
      tipIdx = (tipIdx + 1) % this.tips.length;
      if (this.tipText) {
        this.tipText.textContent = this.tips[tipIdx];
      }
    }, 2000);

    // Smooth real resource loading simulation
    this.intervalId = window.setInterval(() => {
      this.targetProgress += Math.floor(Math.random() * 20) + 18;
      if (this.targetProgress >= 100) {
        this.targetProgress = 100;
        this.currentProgress = 100;
      } else {
        this.currentProgress += (this.targetProgress - this.currentProgress) * 0.5;
      }

      const displayVal = Math.min(100, Math.floor(this.currentProgress));

      this.progressBar.style.width = `${displayVal}%`;
      this.progressText.textContent = `${displayVal}%`;

      if (displayVal >= 100) {
        if (this.intervalId) clearInterval(this.intervalId);
        clearInterval(tipInterval);

        setTimeout(() => {
          this.container.classList.add('fade-out');
          setTimeout(() => {
            this.container.remove();
            onComplete();
          }, 450);
        }, 300);
      }
    }, 120);
  }
}
