import { DAILY_STREAK_REWARDS } from '../game/CatData';
import { sound } from '../sound';
import { telegram } from '../telegram';
import confetti from 'canvas-confetti';

export class DailyBonusModal {
  public element: HTMLElement;
  private currentStreak: number = 1;
  private alreadyClaimedToday: boolean = false;
  private onClaim: (reward: number) => void;

  constructor(onClaim: (reward: number) => void, onClose: () => void) {
    this.onClaim = onClaim;

    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="daily-bonus-card">
        <div class="modal-header">
          <div class="modal-title">🎁 Ежедневный Бонус</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="bonus-intro">
          Заходи в игру каждый день, чтобы увеличивать серию и забирать всё больше монет!
        </div>

        <div class="streak-grid">
          <!-- 7 days dynamically rendered -->
        </div>

        <div class="bonus-action-box">
          <button class="claim-daily-btn">Забрать награду</button>
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

    const claimBtn = this.element.querySelector('.claim-daily-btn') as HTMLElement;
    claimBtn.addEventListener('click', () => {
      if (!this.alreadyClaimedToday) {
        sound.playCoin();
        telegram.haptic('success');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });

        const reward = DAILY_STREAK_REWARDS[Math.min(6, this.currentStreak - 1)];
        this.alreadyClaimedToday = true;
        this.onClaim(reward);
        this.renderStreak();
      }
    });
  }

  public setStreak(streak: number, claimedToday: boolean) {
    this.currentStreak = streak;
    this.alreadyClaimedToday = claimedToday;
    this.renderStreak();
  }

  private renderStreak() {
    const grid = this.element.querySelector('.streak-grid') as HTMLElement;
    grid.innerHTML = '';

    const claimBtn = this.element.querySelector('.claim-daily-btn') as HTMLButtonElement;
    if (this.alreadyClaimedToday) {
      claimBtn.disabled = true;
      claimBtn.textContent = '✓ Награда уже получена сегодня';
    } else {
      claimBtn.disabled = false;
      const todayReward = DAILY_STREAK_REWARDS[Math.min(6, this.currentStreak - 1)];
      claimBtn.textContent = `Забрать ${todayReward} 🪙`;
    }

    DAILY_STREAK_REWARDS.forEach((coins, idx) => {
      const dayNum = idx + 1;
      const isPast = dayNum < this.currentStreak;
      const isCurrent = dayNum === this.currentStreak;

      const item = document.createElement('div');
      item.className = `streak-day-item ${isPast ? 'claimed' : ''} ${isCurrent ? 'active' : ''} ${dayNum === 7 ? 'mega-day' : ''}`;
      item.innerHTML = `
        <div class="day-number">День ${dayNum}</div>
        <div class="day-icon">${dayNum === 7 ? '👑' : isPast ? '✅' : '🪙'}</div>
        <div class="day-reward">+${coins}</div>
      `;
      grid.appendChild(item);
    });
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
