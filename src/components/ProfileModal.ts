import { UserProfile, DailyQuest } from '../game/Types';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class ProfileModal {
  public element: HTMLElement;
  private userProfile: UserProfile | null = null;
  private onClaimQuest: (questId: string, reward: number) => void;
  private onOpenDailyBonus: () => void;

  constructor(
    onClaimQuest: (questId: string, reward: number) => void,
    onOpenDailyBonus: () => void,
    onClose: () => void
  ) {
    this.onClaimQuest = onClaimQuest;
    this.onOpenDailyBonus = onOpenDailyBonus;

    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="profile-modal-card">
        <div class="modal-header">
          <div class="modal-title">👤 Профиль Игрока</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <!-- User Identity Banner -->
        <div class="user-hero-card">
          <div class="user-avatar-circle">🐱</div>
          <div class="user-details">
            <div class="user-display-name">Любитель Котиков</div>
            <div class="user-handle">@cat_master</div>
          </div>
          <button class="daily-streak-badge-btn" title="Ежедневный бонус">
            <span>🔥 Серия</span>
            <b class="streak-days">1 день</b>
          </button>
        </div>

        <!-- Key Stats Grid -->
        <div class="profile-stats-grid">
          <div class="stat-pill">
            <div class="stat-label">🏆 Рекорд</div>
            <div class="stat-value val-highscore">0</div>
          </div>
          <div class="stat-pill">
            <div class="stat-label">🪙 Монеты</div>
            <div class="stat-value val-coins">0</div>
          </div>
          <div class="stat-pill">
            <div class="stat-label">✨ Слияний</div>
            <div class="stat-value val-merges">0</div>
          </div>
          <div class="stat-pill">
            <div class="stat-label">🎮 Партий</div>
            <div class="stat-value val-games">0</div>
          </div>
        </div>

        <!-- Daily Quests Section -->
        <div class="quests-section">
          <div class="quests-section-header">
            <span>🎯 Ежедневные задания</span>
            <span class="quest-refresh-hint">Обновляются каждые 24ч</span>
          </div>
          <div class="quests-list">
            <!-- Dynamically populated -->
          </div>
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

    const streakBtn = this.element.querySelector('.daily-streak-badge-btn') as HTMLElement;
    streakBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      this.onOpenDailyBonus();
    });
  }

  public setProfile(profile: UserProfile) {
    this.userProfile = profile;

    const nameEl = this.element.querySelector('.user-display-name');
    if (nameEl) nameEl.textContent = profile.firstName || 'Любитель Котиков';

    const handleEl = this.element.querySelector('.user-handle');
    if (handleEl) handleEl.textContent = profile.username ? `@${profile.username}` : `ID: ${profile.id}`;

    const streakEl = this.element.querySelector('.streak-days');
    if (streakEl) streakEl.textContent = `${profile.dailyStreak} дн.`;

    const highEl = this.element.querySelector('.val-highscore');
    if (highEl) highEl.textContent = profile.highScore.toLocaleString();

    const coinsEl = this.element.querySelector('.val-coins');
    if (coinsEl) coinsEl.textContent = profile.coins.toLocaleString();

    const mergeEl = this.element.querySelector('.val-merges');
    if (mergeEl) mergeEl.textContent = profile.totalMerges.toLocaleString();

    const gamesEl = this.element.querySelector('.val-games');
    if (gamesEl) gamesEl.textContent = profile.totalGames.toLocaleString();

    this.renderQuests(profile.quests);
  }

  private renderQuests(quests: DailyQuest[]) {
    const list = this.element.querySelector('.quests-list') as HTMLElement;
    list.innerHTML = '';

    quests.forEach((q) => {
      const isDone = q.currentProgress >= q.targetProgress;
      const pct = Math.min(100, Math.floor((q.currentProgress / q.targetProgress) * 100));

      const card = document.createElement('div');
      card.className = `quest-card ${q.claimed ? 'claimed' : isDone ? 'completed' : ''}`;
      card.innerHTML = `
        <div class="quest-info">
          <div class="quest-title">${q.title}</div>
          <div class="quest-desc">${q.description}</div>
          <div class="quest-progress-track">
            <div class="quest-progress-bar" style="width: ${pct}%"></div>
          </div>
          <div class="quest-progress-text">${q.currentProgress} / ${q.targetProgress}</div>
        </div>
        <div class="quest-action">
          <div class="quest-reward">🪙 +${q.rewardCoins}</div>
          ${
            q.claimed
              ? '<span class="claimed-badge">Получено</span>'
              : isDone
              ? '<button class="claim-quest-btn">Забрать</button>'
              : '<button class="claim-quest-btn" disabled>В процессе</button>'
          }
        </div>
      `;

      if (isDone && !q.claimed) {
        const btn = card.querySelector('.claim-quest-btn') as HTMLElement;
        btn.addEventListener('click', () => {
          sound.playCoin();
          telegram.haptic('success');
          q.claimed = true;
          this.onClaimQuest(q.id, q.rewardCoins);
          this.renderQuests(quests);
        });
      }

      list.appendChild(card);
    });
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
