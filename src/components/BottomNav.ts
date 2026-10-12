import { sound } from '../sound';
import { telegram } from '../telegram';

export type NavTab = 'game' | 'collection' | 'shop' | 'profile';

export class BottomNav {
  public element: HTMLElement;
  private currentTab: NavTab = 'game';
  private onTabChange: (tab: NavTab) => void;

  constructor(onTabChange: (tab: NavTab) => void) {
    this.onTabChange = onTabChange;
    this.element = document.createElement('nav');
    this.element.className = 'bottom-nav-bar';
    this.element.innerHTML = `
      <button class="nav-tab-btn active" data-tab="game">
        <span class="nav-icon">🎮</span>
        <span class="nav-label">Игра</span>
      </button>

      <button class="nav-tab-btn" data-tab="collection">
        <span class="nav-icon">📖</span>
        <span class="nav-label">Коллекция</span>
      </button>

      <button class="nav-tab-btn" data-tab="shop">
        <span class="nav-icon">🛍️</span>
        <span class="nav-label">Магазин</span>
      </button>

      <button class="nav-tab-btn" data-tab="profile">
        <span class="nav-icon">👤</span>
        <span class="nav-label">Профиль</span>
      </button>
    `;

    const buttons = this.element.querySelectorAll('.nav-tab-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as NavTab;
        if (tab && tab !== this.currentTab) {
          sound.playClick();
          telegram.haptic('selection');
          this.setActiveTab(tab);
          this.onTabChange(tab);
        }
      });
    });
  }

  public setActiveTab(tab: NavTab) {
    this.currentTab = tab;
    const buttons = this.element.querySelectorAll('.nav-tab-btn');
    buttons.forEach((btn) => {
      if ((btn as HTMLElement).dataset.tab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  public getActiveTab(): NavTab {
    return this.currentTab;
  }
}
