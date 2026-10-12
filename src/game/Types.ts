export interface CatTier {
  tier: number; // 1 to 11
  name: string;
  breed: string;
  radius: number;
  points: number;
  coins: number;
  color: string;
  earColor: string;
  eyeColor: string;
  innerEarColor: string;
  spotColor?: string;
  isCrown?: boolean; // For King Cat
  specialEffect?: string;
}

export interface SkinCollection {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  tierOverrides: Record<number, Partial<CatTier>>;
}

export interface GameTheme {
  id: string;
  name: string;
  description: string;
  price: number;
  unlocked: boolean;
  backgroundGradient: [string, string];
  boxBorderColor: string;
  boxBgColor: string;
  bubbleBgColor: string;
  accentColor: string;
  decorIcon: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  rewardCoins: number;
  currentProgress: number;
  targetProgress: number;
  completed: boolean;
  claimed: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  firstName: string;
  coins: number;
  highScore: number;
  totalMerges: number;
  totalGames: number;
  selectedCollection: string;
  selectedTheme: string;
  unlockedCollections: string[];
  unlockedThemes: string[];
  dailyStreak: number;
  lastDailyClaim: string; // ISO date YYYY-MM-DD
  tutorialCompleted: boolean;
  quests: DailyQuest[];
}

export interface LeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  username?: string;
  score: number;
  isCurrentPlayer?: boolean;
}

export type GameMode = 'classic' | 'sandbox';
