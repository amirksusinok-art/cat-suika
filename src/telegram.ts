// Telegram WebApp SDK Integration & Helpers

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isVersionAtLeast: (version: string) => boolean;
        requestFullscreen?: () => void;
        enableClosingConfirmation?: () => void;
        disableClosingConfirmation?: () => void;
        openLink?: (url: string) => void;
        openTelegramLink?: (url: string) => void;
        initData: string;
        initDataUnsafe?: {
          query_id?: string;
          user?: TelegramUser;
          auth_date?: number;
          hash?: string;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (fn: () => void) => void;
          offClick: (fn: () => void) => void;
        };
        CloudStorage?: {
          setItem: (key: string, value: string, callback?: (err: Error | null, stored: boolean) => void) => void;
          getItem: (key: string, callback: (err: Error | null, value: string | null) => void) => void;
          getItems: (keys: string[], callback: (err: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (err: Error | null, removed: boolean) => void) => void;
        };
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

export class TelegramService {
  private static instance: TelegramService;
  public isTMA: boolean = false;
  public user: TelegramUser;

  private constructor() {
    const tg = window.Telegram?.WebApp;
    if (tg && tg.initDataUnsafe?.user) {
      this.isTMA = true;
      this.user = tg.initDataUnsafe.user;
    } else {
      // Local / Browser Fallback for Testing & Development
      const savedUser = localStorage.getItem('mock_telegram_user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch {
          this.user = this.createDefaultMockUser();
        }
      } else {
        this.user = this.createDefaultMockUser();
        localStorage.setItem('mock_telegram_user', JSON.stringify(this.user));
      }
    }
  }

  private createDefaultMockUser(): TelegramUser {
    return {
      id: 777123456,
      first_name: 'Любитель Котиков',
      username: 'cat_master',
      photo_url: '',
    };
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  public init() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();

      // Bot API 8.0+ Fullscreen & Safe area support
      if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('8.0')) {
        if (typeof tg.requestFullscreen === 'function') {
          tg.requestFullscreen();
        }
      }

      // Prevent accidental swipes from closing the game mid-session
      if (typeof tg.enableClosingConfirmation === 'function') {
        tg.enableClosingConfirmation();
      }

      // Sync CSS Theme Variables
      this.syncTheme();
      tg.onEvent('themeChanged', () => this.syncTheme());
    } catch (e) {
      console.warn('Telegram WebApp init error:', e);
    }
  }

  private syncTheme() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const root = document.documentElement;
    if (tg.themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    }
    if (tg.themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
    }
    if (tg.themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
    }
  }

  public haptic(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error' | 'selection') {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      try {
        if (type === 'selection') {
          tg.HapticFeedback.selectionChanged();
        } else if (type === 'success' || type === 'warning' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
        return;
      } catch (e) {
        // Fallback
      }
    }

    // Web Vibration API fallback
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
        case 'rigid':
          navigator.vibrate(35);
          break;
        case 'success':
          navigator.vibrate([20, 40, 30]);
          break;
        case 'warning':
          navigator.vibrate([30, 50, 40]);
          break;
        case 'error':
          navigator.vibrate([50, 50, 50]);
          break;
      }
    }
  }

  public getInitData(): string {
    return window.Telegram?.WebApp?.initData || '';
  }

  // Cloud Storage with LocalStorage fallback
  public setCloudItem(key: string, value: string): Promise<boolean> {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.CloudStorage) {
        tg.CloudStorage.setItem(key, value, (err, stored) => {
          localStorage.setItem(key, value);
          resolve(!err && !!stored);
        });
      } else {
        localStorage.setItem(key, value);
        resolve(true);
      }
    });
  }

  public getCloudItem(key: string): Promise<string | null> {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.CloudStorage) {
        tg.CloudStorage.getItem(key, (err, value) => {
          if (!err && value !== null && value !== undefined) {
            resolve(value);
          } else {
            resolve(localStorage.getItem(key));
          }
        });
      } else {
        resolve(localStorage.getItem(key));
      }
    });
  }
}

export const telegram = TelegramService.getInstance();
