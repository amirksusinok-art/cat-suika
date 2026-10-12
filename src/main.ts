import { telegram } from './telegram';
import { Game } from './game/Game';
import { LoadingScreen } from './components/LoadingScreen';
import { TopBar } from './components/TopBar';
import { EvolutionCircle } from './components/EvolutionCircle';
import { DailyRankingModal } from './components/DailyRanking';
import { BottomNav, NavTab } from './components/BottomNav';
import { ShopModal } from './components/ShopModal';
import { CollectionModal } from './components/CollectionModal';
import { ProfileModal } from './components/ProfileModal';
import { DailyBonusModal } from './components/DailyBonusModal';
import { TutorialModal } from './components/TutorialModal';
import { GameOverModal } from './components/GameOverModal';
import { api } from './api/client';
import { GAME_THEMES, BASE_CAT_TIERS } from './game/CatData';
import { GameMode, UserProfile } from './game/Types';
import { sound } from './sound';

class App {
  private appRoot: HTMLElement;
  private game!: Game;
  private topBar!: TopBar;
  private evoCircle!: EvolutionCircle;
  private rankingModal!: DailyRankingModal;
  private bottomNav!: BottomNav;
  private shopModal!: ShopModal;
  private collectionModal!: CollectionModal;
  private profileModal!: ProfileModal;
  private dailyBonusModal!: DailyBonusModal;
  private tutorialModal!: TutorialModal;
  private gameOverModal!: GameOverModal;

  private userProfile!: UserProfile;
  private canvas!: HTMLCanvasElement;
  private sandboxControls!: HTMLElement;

  constructor() {
    this.appRoot = document.getElementById('app')!;
    telegram.init();
    this.boot();
  }

  private async boot() {
    // 1. Show Loading Screen
    new LoadingScreen(async () => {
      await this.initGameAndUI();
    });
  }

  private async initGameAndUI() {
    // 2. Fetch User Profile
    this.userProfile = await api.getProfile();

    // 3. Create Game Viewport & Canvas
    const viewport = document.createElement('div');
    viewport.className = 'game-viewport';

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'game-canvas';
    viewport.appendChild(this.canvas);
    this.appRoot.appendChild(viewport);

    this.game = new Game(this.canvas);

    // Apply saved preferences
    const activeTheme =
      GAME_THEMES.find((t) => t.id === this.userProfile.selectedTheme) ||
      GAME_THEMES[0];
    this.game.setTheme(activeTheme);
    this.game.setCollection(this.userProfile.selectedCollection);
    this.game.setHighScore(this.userProfile.highScore);
    this.game.setTotalCoins(this.userProfile.coins);

    // 4. Create Top Bar (suika.jpg bubbles)
    this.topBar = new TopBar(
      (newMode: GameMode) => this.handleModeChange(newMode),
      () => this.handlePauseToggle(),
      () => this.rankingModal.show()
    );
    this.appRoot.insertBefore(this.topBar.element, viewport);
    this.topBar.updateScore(0, this.userProfile.highScore);
    this.topBar.updateCoins(this.userProfile.coins);

    // 5. Create Evolution Circle Widget (suika.jpg right side)
    this.evoCircle = new EvolutionCircle(() => {
      this.collectionModal.show();
    });
    this.evoCircle.setCollection(this.userProfile.selectedCollection);
    viewport.appendChild(this.evoCircle.element);

    // 6. Create Daily Ranking Modal (suika.jpg left side)
    this.rankingModal = new DailyRankingModal(() => {
      this.rankingModal.hide();
    });
    this.appRoot.appendChild(this.rankingModal.element);

    // 7. Create Modals
    this.shopModal = new ShopModal(
      async (type, id, newCoins) => {
        await api.buyItem(type, id, newCoins);
        this.userProfile = await api.getProfile();
        this.syncAppState();
      },
      (type, id) => {
        if (type === 'skin') {
          this.userProfile.selectedCollection = id;
          this.game.setCollection(id);
          this.evoCircle.setCollection(id);
          this.collectionModal.setCollection(id);
        } else {
          this.userProfile.selectedTheme = id;
          const theme = GAME_THEMES.find((t) => t.id === id) || GAME_THEMES[0];
          this.game.setTheme(theme);
        }
      },
      () => this.shopModal.hide()
    );
    this.appRoot.appendChild(this.shopModal.element);

    this.collectionModal = new CollectionModal(() => {
      this.collectionModal.hide();
    });
    this.collectionModal.setCollection(this.userProfile.selectedCollection);
    this.appRoot.appendChild(this.collectionModal.element);

    this.profileModal = new ProfileModal(
      async (questId, reward) => {
        this.userProfile = await api.claimQuest(questId, reward);
        this.syncAppState();
      },
      () => {
        this.profileModal.hide();
        this.dailyBonusModal.show();
      },
      () => this.profileModal.hide()
    );
    this.appRoot.appendChild(this.profileModal.element);

    this.dailyBonusModal = new DailyBonusModal(
      async (reward) => {
        this.userProfile = await api.claimDailyBonus(reward);
        this.syncAppState();
      },
      () => this.dailyBonusModal.hide()
    );
    this.appRoot.appendChild(this.dailyBonusModal.element);

    this.tutorialModal = new TutorialModal(() => {
      this.userProfile.tutorialCompleted = true;
      localStorage.setItem('tutorial_done', 'true');
    });
    this.appRoot.appendChild(this.tutorialModal.element);

    this.gameOverModal = new GameOverModal(
      () => {
        this.game.restartGame();
      },
      () => {
        this.bottomNav.setActiveTab('game');
      }
    );
    this.appRoot.appendChild(this.gameOverModal.element);

    // 8. Create Sandbox Floating Controls
    this.createSandboxControls(viewport);

    // 9. Bottom Navigation Bar (4 tabs)
    this.bottomNav = new BottomNav((tab: NavTab) => this.handleTabChange(tab));
    this.appRoot.appendChild(this.bottomNav.element);

    // 10. Hook Game Callbacks
    this.game.onScoreChange = (score, high) => {
      this.topBar.updateScore(score, high);
    };

    this.game.onCoinsChange = () => {
      this.topBar.updateCoins(this.game.totalCoins);
    };

    this.game.onNextCatChange = (nextCat) => {
      this.topBar.updateNextCat(nextCat);
    };

    this.game.onGameOver = async (score, sessionCoins, isNewRecord) => {
      this.gameOverModal.showResults(
        score,
        this.game.highScore,
        sessionCoins,
        isNewRecord
      );
      this.userProfile = await api.saveGameSession(
        score,
        sessionCoins,
        this.game.physics.getCatBodies().length
      );
      this.syncAppState();
    };

    // 11. Start Game Engine
    this.game.start();
    this.syncAppState();

    // 12. Check First-Time Tutorial
    const tutorialDone = localStorage.getItem('tutorial_done');
    if (!tutorialDone && !this.userProfile.tutorialCompleted) {
      setTimeout(() => {
        this.tutorialModal.show();
      }, 400);
    } else {
      // Check Daily Bonus Popup if not claimed today (Section 12)
      this.checkDailyStreak();
    }
  }

  private checkDailyStreak() {
    const today = new Date().toISOString().split('T')[0];
    const claimedToday = this.userProfile.lastDailyClaim === today;
    this.dailyBonusModal.setStreak(this.userProfile.dailyStreak, claimedToday);

    if (!claimedToday) {
      setTimeout(() => {
        this.dailyBonusModal.show();
      }, 600);
    }
  }

  private handleModeChange(mode: GameMode) {
    this.game.mode = mode;
    this.game.restartGame();

    if (mode === 'sandbox') {
      this.sandboxControls.style.display = 'flex';
      this.evoCircle.element.style.display = 'none';
    } else {
      this.sandboxControls.style.display = 'none';
      this.evoCircle.element.style.display = 'flex';
    }
  }

  private handlePauseToggle() {
    this.game.isPaused = !this.game.isPaused;
    if (this.game.isPaused) {
      telegram.haptic('light');
    }
  }

  private handleTabChange(tab: NavTab) {
    // Hide all modal views first
    this.shopModal.hide();
    this.collectionModal.hide();
    this.profileModal.hide();

    switch (tab) {
      case 'game':
        // Return to game view
        break;
      case 'collection':
        this.collectionModal.show();
        break;
      case 'shop':
        this.shopModal.show();
        break;
      case 'profile':
        this.profileModal.setProfile(this.userProfile);
        this.profileModal.show();
        break;
    }
  }

  private createSandboxControls(parent: HTMLElement) {
    this.sandboxControls = document.createElement('div');
    this.sandboxControls.className = 'sandbox-drawer';
    this.sandboxControls.style.display = 'none';
    this.sandboxControls.innerHTML = `
      <div class="sandbox-title">🧪 Спавн котиков:</div>
      <div class="sandbox-buttons-row">
        ${BASE_CAT_TIERS.map(
          (c) => `<button class="sb-spawn-btn" data-tier="${c.tier}" title="${c.name}">${c.tier}</button>`
        ).join('')}
      </div>
      <button class="sb-clear-btn">🧹 Очистить поле</button>
    `;

    this.sandboxControls.querySelectorAll('.sb-spawn-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = parseInt((btn as HTMLElement).dataset.tier || '1');
        this.game.spawnSandboxCat(tier);
      });
    });

    const clearBtn = this.sandboxControls.querySelector('.sb-clear-btn') as HTMLElement;
    clearBtn.addEventListener('click', () => {
      this.game.clearSandbox();
    });

    parent.appendChild(this.sandboxControls);
  }

  private syncAppState() {
    this.topBar.updateCoins(this.userProfile.coins);
    this.topBar.updateScore(this.game.score, this.userProfile.highScore);
    this.shopModal.updateState(
      this.userProfile.coins,
      this.userProfile.unlockedCollections,
      this.userProfile.unlockedThemes,
      this.userProfile.selectedCollection,
      this.userProfile.selectedTheme
    );
    this.profileModal.setProfile(this.userProfile);
  }
}

// Sandbox Drawer Styles
const style = document.createElement('style');
style.textContent = `
.sandbox-drawer {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #B0BEC5;
  border-radius: 20px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 45;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.sandbox-title { font-size: 11px; font-weight: 800; color: #546E7A; }
.sandbox-buttons-row { display: flex; gap: 4px; overflow-x: auto; padding-bottom: 2px; }
.sb-spawn-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 8px;
  border: 1px solid #CFD8DC;
  background: #ECEFF1;
  font-weight: 800;
  font-size: 11px;
  cursor: pointer;
}
.sb-clear-btn {
  background: #FFEBEE;
  border: 1px solid #FFCDD2;
  color: #C62828;
  border-radius: 10px;
  padding: 4px;
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}
`;
document.head.appendChild(style);

new App();
