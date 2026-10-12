import { UserProfile, LeaderboardEntry } from '../game/Types';
import { telegram } from '../telegram';
import { DEFAULT_QUESTS } from '../game/CatData';

export class ApiClient {
  private static instance: ApiClient;
  private cachedProfile: UserProfile | null = null;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public async getProfile(): Promise<UserProfile> {
    const user = telegram.user;
    const initData = telegram.getInitData();

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData,
          user,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        this.cachedProfile = data;
        return data;
      }
    } catch {
      // Local fallback
    }

    // Local Storage Fallback
    const saved = localStorage.getItem(`cat_profile_${user.id}`);
    if (saved) {
      try {
        this.cachedProfile = JSON.parse(saved);
        return this.cachedProfile!;
      } catch {}
    }

    // Create Fresh Profile
    const fresh: UserProfile = {
      id: user.id,
      username: user.username || '',
      firstName: user.first_name || 'Любитель Котиков',
      coins: 100, // Starter coins gift
      highScore: 0,
      totalMerges: 0,
      totalGames: 0,
      selectedCollection: 'classic',
      selectedTheme: 'room',
      unlockedCollections: ['classic'],
      unlockedThemes: ['room'],
      dailyStreak: 1,
      lastDailyClaim: '',
      tutorialCompleted: false,
      quests: JSON.parse(JSON.stringify(DEFAULT_QUESTS)),
    };

    this.cachedProfile = fresh;
    this.saveLocalProfile(fresh);
    return fresh;
  }

  public async saveGameSession(
    score: number,
    coinsEarned: number,
    mergesCount: number
  ): Promise<UserProfile> {
    if (!this.cachedProfile) await this.getProfile();
    const p = this.cachedProfile!;

    p.coins += coinsEarned;
    p.totalMerges += mergesCount;
    p.totalGames += 1;
    if (score > p.highScore) {
      p.highScore = score;
    }

    // Update quest progress
    p.quests.forEach((q) => {
      if (q.id === 'merge_15') {
        q.currentProgress += mergesCount;
        if (q.currentProgress >= q.targetProgress) q.completed = true;
      } else if (q.id === 'score_1500') {
        if (score >= q.targetProgress) {
          q.currentProgress = score;
          q.completed = true;
        }
      }
    });

    this.saveLocalProfile(p);

    // Sync with backend
    try {
      await fetch('/api/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: p.id,
          score,
          coinsEarned,
          mergesCount,
        }),
      });
    } catch {}

    return p;
  }

  public async buyItem(
    type: 'skin' | 'theme',
    id: string,
    newCoins: number
  ): Promise<void> {
    if (!this.cachedProfile) await this.getProfile();
    const p = this.cachedProfile!;

    p.coins = newCoins;
    if (type === 'skin') {
      if (!p.unlockedCollections.includes(id)) p.unlockedCollections.push(id);
      p.selectedCollection = id;
    } else {
      if (!p.unlockedThemes.includes(id)) p.unlockedThemes.push(id);
      p.selectedTheme = id;
    }

    this.saveLocalProfile(p);

    try {
      await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: p.id,
          type,
          itemId: id,
          newCoins,
        }),
      });
    } catch {}
  }

  public async claimDailyBonus(reward: number): Promise<UserProfile> {
    if (!this.cachedProfile) await this.getProfile();
    const p = this.cachedProfile!;

    const todayStr = new Date().toISOString().split('T')[0];
    p.coins += reward;
    p.lastDailyClaim = todayStr;
    p.dailyStreak = (p.dailyStreak % 7) + 1;

    this.saveLocalProfile(p);

    try {
      await fetch('/api/daily/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: p.id,
          reward,
          streak: p.dailyStreak,
          date: todayStr,
        }),
      });
    } catch {}

    return p;
  }

  public async claimQuest(questId: string, reward: number): Promise<UserProfile> {
    if (!this.cachedProfile) await this.getProfile();
    const p = this.cachedProfile!;

    const q = p.quests.find((quest) => quest.id === questId);
    if (q) {
      q.claimed = true;
      p.coins += reward;
    }

    this.saveLocalProfile(p);
    return p;
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  }

  private saveLocalProfile(p: UserProfile) {
    localStorage.setItem(`cat_profile_${p.id}`, JSON.stringify(p));
    telegram.setCloudItem(`cat_profile_${p.id}`, JSON.stringify(p));
  }
}

export const api = ApiClient.getInstance();
