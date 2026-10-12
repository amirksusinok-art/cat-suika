import { SKIN_COLLECTIONS, GAME_THEMES } from '../game/CatData';
import { SkinCollection, GameTheme } from '../game/Types';
import { sound } from '../sound';
import { telegram } from '../telegram';

export class ShopModal {
  public element: HTMLElement;
  private currentCoins: number = 0;
  private unlockedCollections: string[] = ['classic'];
  private unlockedThemes: string[] = ['room'];
  private selectedCollection: string = 'classic';
  private selectedTheme: string = 'room';

  private onBuySuccess: (type: 'skin' | 'theme', id: string, newCoins: number) => void;
  private onEquip: (type: 'skin' | 'theme', id: string) => void;

  constructor(
    onBuySuccess: (type: 'skin' | 'theme', id: string, newCoins: number) => void,
    onEquip: (type: 'skin' | 'theme', id: string) => void,
    onClose: () => void
  ) {
    this.onBuySuccess = onBuySuccess;
    this.onEquip = onEquip;

    this.element = document.createElement('div');
    this.element.className = 'modal-backdrop';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="shop-modal-card">
        <div class="modal-header">
          <div class="modal-title">🛍️ Магазин Котиков</div>
          <button class="modal-close-btn">&times;</button>
        </div>

        <div class="shop-balance-banner">
          <span>Твой баланс:</span>
          <span class="shop-balance-coins">🪙 <b class="coin-num">0</b></span>
        </div>

        <!-- Shop Tabs -->
        <div class="shop-tab-switches">
          <button class="shop-subtab active" data-subtab="skins">🐾 Породы кошек</button>
          <button class="shop-subtab" data-subtab="themes">🎨 Темы поля</button>
        </div>

        <div class="shop-items-container">
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

    // Subtab switching
    const subtabs = this.element.querySelectorAll('.shop-subtab');
    subtabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        sound.playClick();
        telegram.haptic('selection');
        subtabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const target = (tab as HTMLElement).dataset.subtab;
        this.renderItems(target === 'themes' ? 'themes' : 'skins');
      });
    });
  }

  public updateState(
    coins: number,
    unlockedSkins: string[],
    unlockedThemes: string[],
    activeSkin: string,
    activeTheme: string
  ) {
    this.currentCoins = coins;
    this.unlockedCollections = unlockedSkins;
    this.unlockedThemes = unlockedThemes;
    this.selectedCollection = activeSkin;
    this.selectedTheme = activeTheme;

    const coinEl = this.element.querySelector('.coin-num');
    if (coinEl) coinEl.textContent = coins.toString();

    const activeSubtab = this.element.querySelector('.shop-subtab.active') as HTMLElement;
    const isThemes = activeSubtab?.dataset.subtab === 'themes';
    this.renderItems(isThemes ? 'themes' : 'skins');
  }

  private renderItems(category: 'skins' | 'themes') {
    const container = this.element.querySelector('.shop-items-container') as HTMLElement;
    container.innerHTML = '';

    if (category === 'skins') {
      SKIN_COLLECTIONS.forEach((col: SkinCollection) => {
        const isUnlocked = this.unlockedCollections.includes(col.id);
        const isSelected = this.selectedCollection === col.id;

        const card = document.createElement('div');
        card.className = `shop-item-card ${isUnlocked ? 'unlocked' : ''} ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="item-badge-corner">${isUnlocked ? (isSelected ? 'Используется' : 'Куплено') : '🪙 ' + col.price}</div>
          <div class="item-name">${col.name}</div>
          <div class="item-desc">${col.description}</div>
          <div class="item-action-area">
            ${
              isUnlocked
                ? `<button class="equip-btn ${isSelected ? 'active' : ''}">${isSelected ? '✓ Выбрано' : 'Выбрать'}</button>`
                : `<button class="buy-btn" ${this.currentCoins < col.price ? 'disabled' : ''}>Купить за ${col.price} 🪙</button>`
            }
          </div>
        `;

        if (isUnlocked) {
          const equipBtn = card.querySelector('.equip-btn') as HTMLElement;
          equipBtn.addEventListener('click', () => {
            sound.playClick();
            telegram.haptic('selection');
            this.selectedCollection = col.id;
            this.onEquip('skin', col.id);
            this.renderItems('skins');
          });
        } else {
          const buyBtn = card.querySelector('.buy-btn') as HTMLElement;
          buyBtn.addEventListener('click', () => {
            if (this.currentCoins >= col.price) {
              sound.playCoin();
              telegram.haptic('success');
              this.currentCoins -= col.price;
              this.unlockedCollections.push(col.id);
              this.selectedCollection = col.id;
              this.onBuySuccess('skin', col.id, this.currentCoins);
              this.updateState(
                this.currentCoins,
                this.unlockedCollections,
                this.unlockedThemes,
                this.selectedCollection,
                this.selectedTheme
              );
            } else {
              sound.playGameOver();
              telegram.haptic('error');
            }
          });
        }

        container.appendChild(card);
      });
    } else {
      GAME_THEMES.forEach((theme: GameTheme) => {
        const isUnlocked = this.unlockedThemes.includes(theme.id);
        const isSelected = this.selectedTheme === theme.id;

        const card = document.createElement('div');
        card.className = `shop-item-card ${isUnlocked ? 'unlocked' : ''} ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
          <div class="item-badge-corner">${isUnlocked ? (isSelected ? 'Используется' : 'Куплено') : '🪙 ' + theme.price}</div>
          <div class="item-name">${theme.decorIcon} ${theme.name}</div>
          <div class="item-desc">${theme.description}</div>
          <div class="item-action-area">
            ${
              isUnlocked
                ? `<button class="equip-btn ${isSelected ? 'active' : ''}">${isSelected ? '✓ Выбрано' : 'Выбрать'}</button>`
                : `<button class="buy-btn" ${this.currentCoins < theme.price ? 'disabled' : ''}>Купить за ${theme.price} 🪙</button>`
            }
          </div>
        `;

        if (isUnlocked) {
          const equipBtn = card.querySelector('.equip-btn') as HTMLElement;
          equipBtn.addEventListener('click', () => {
            sound.playClick();
            telegram.haptic('selection');
            this.selectedTheme = theme.id;
            this.onEquip('theme', theme.id);
            this.renderItems('themes');
          });
        } else {
          const buyBtn = card.querySelector('.buy-btn') as HTMLElement;
          buyBtn.addEventListener('click', () => {
            if (this.currentCoins >= theme.price) {
              sound.playCoin();
              telegram.haptic('success');
              this.currentCoins -= theme.price;
              this.unlockedThemes.push(theme.id);
              this.selectedTheme = theme.id;
              this.onBuySuccess('theme', theme.id, this.currentCoins);
              this.updateState(
                this.currentCoins,
                this.unlockedCollections,
                this.unlockedThemes,
                this.selectedCollection,
                this.selectedTheme
              );
            } else {
              sound.playGameOver();
              telegram.haptic('error');
            }
          });
        }

        container.appendChild(card);
      });
    }
  }

  public show() {
    this.element.style.display = 'flex';
  }

  public hide() {
    this.element.style.display = 'none';
  }
}
