import { LeaderboardEntry } from '../game/Types';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class DailyRankingModal {
  public element: HTMLElement;
  private listContainer!: HTMLElement;

  constructor(onClose: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="ranking-card-modal">
        <div class="ranking-header">
          <div class="ranking-title">Daily Ranking 🏆</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="ranking-body">
          <div class="ranking-list">
            <!-- Ranks rendered dynamically -->
          </div>
        </div>

        <div class="ranking-footer">
          <button class="rank-refresh-btn">🔄 Обновить результаты</button>
        </div>
      </div>
    `;

    this.listContainer = this.element.querySelector('.ranking-list') as HTMLElement;

    const closeBtn = this.element.querySelector('.modal-close-btn') as HTMLElement;
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('selection');
      onClose();
    });

    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        sound.playClick();
        onClose();
      }
    });

    const refreshBtn = this.element.querySelector('.rank-refresh-btn') as HTMLElement;
    refreshBtn.addEventListener('click', () => {
      sound.playClick();
      telegram.haptic('light');
      this.loadLeaderboard();
    });

    this.loadLeaderboard();
  }

  public setScores(entries: LeaderboardEntry[]) {
    this.listContainer.innerHTML = '';

    entries.forEach((entry) => {
      const row = document.createElement('div');
      row.className = `ranking-row rank-${entry.rank} ${entry.isCurrentPlayer ? 'is-current' : ''}`;

      let badgeIcon = `${entry.rank}`;
      if (entry.rank === 1) badgeIcon = '🥇 1';
      else if (entry.rank === 2) badgeIcon = '🥈 2';
      else if (entry.rank === 3) badgeIcon = '🥉 3';

      row.innerHTML = `
        <div class="rank-badge-ribbon">${badgeIcon}</div>
        <div class="rank-player-info">
          <div class="rank-player-name">${entry.name}</div>
          ${entry.isCurrentPlayer ? '<span class="now-pill">NOW</span>' : ''}
        </div>
        <div class="rank-score-val">${entry.score.toLocaleString()}</div>
      `;

      this.listContainer.appendChild(row);
    });
  }

  public async loadLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.setScores(data);
          return;
        }
      }
    } catch {
      // Fallback local mock leaderboard
    }

    // Default matching suika.jpg
    const mockScores: LeaderboardEntry[] = [
      { rank: 1, id: 101, name: 'Кот Борис', score: 2139 },
      { rank: 2, id: 102, name: 'Мурка Снайпер', score: 1963 },
      { rank: 3, id: 103, name: 'Барсик Великий', score: 1884 },
      { rank: 4, id: 104, name: 'Пушок', score: 1420 },
      { rank: 5, id: telegram.user.id, name: telegram.user.first_name, score: 1969, isCurrentPlayer: true },
    ];
    this.setScores(mockScores);
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
