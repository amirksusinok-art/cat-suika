import { sound } from '../sound';
import { telegram } from '../telegram';
import confetti from 'canvas-confetti';

export class GameOverModal {
  public element: HTMLElement;
  private onRestart: () => void;
  private onMenu: () => void;

  constructor(onRestart: () => void, onMenu: () => void) {
    this.onRestart = onRestart;
    this.onMenu = onMenu;

    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="game-over-card">
        <div class="game-over-header">
          <div class="game-over-icon">📦🐾</div>
          <div class="game-over-title">Коробка заполнена!</div>
          <div class="new-record-pill" style="display: none;">🎉 НОВЫЙ РЕКОРД!</div>
        </div>

        <div class="game-over-results-box">
          <div class="result-row">
            <span class="result-label">Набрано очков:</span>
            <span class="result-value final-score-val">0</span>
          </div>
          <div class="result-row">
            <span class="result-label">Лучший счёт:</span>
            <span class="result-value final-best-val">0</span>
          </div>
          <div class="result-row coins-highlight">
            <span class="result-label">Заработано монет:</span>
            <span class="result-value final-coins-val">🪙 +0</span>
          </div>
        </div>

        <div class="game-over-buttons-row">
          <button class="primary-game-btn play-again-btn">
            🔄 Играть снова
          </button>
          <button class="secondary-game-btn menu-btn">
            🏠 В меню
          </button>
        </div>
      </div>
    `;

    const playBtn = this.element.querySelector('.play-again-btn') as HTMLElement;
    playBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('medium');
      this.hide();
      this.onRestart();
    });

    const menuBtn = this.element.querySelector('.menu-btn') as HTMLElement;
    menuBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      this.hide();
      this.onMenu();
    });
  }

  public showResults(
    score: number,
    bestScore: number,
    coinsEarned: number,
    isNewRecord: boolean
  ) {
    const scoreEl = this.element.querySelector('.final-score-val') as HTMLElement;
    const bestEl = this.element.querySelector('.final-best-val') as HTMLElement;
    const coinsEl = this.element.querySelector('.final-coins-val') as HTMLElement;
    const recordPill = this.element.querySelector('.new-record-pill') as HTMLElement;

    scoreEl.textContent = score.toLocaleString();
    bestEl.textContent = bestScore.toLocaleString();
    coinsEl.textContent = `🪙 +${coinsEarned}`;

    if (isNewRecord) {
      recordPill.style.display = 'inline-block';
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.5 },
      });
    } else {
      recordPill.style.display = 'none';
    }

    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
