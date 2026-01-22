
export interface Quote {
  id: number;
  content: string;
  author: string;
  category?: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: number; // 1-100
  image?: string; // Base64 or URL
  audio?: string; // Base64 audio data
  location?: string; // Geolocation string
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
}

export interface UserStats {
  loginStreak: number;
  lastLoginDate: string;
  checkInHistory: string[]; // 存储打卡日期的数组 YYYY/M/D
  totalCheckIns: number;
  totalJournalEntries: number;
  totalQuotesLiked: number;
  totalGamesPlayed: number;
  totalMeditationMinutes: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name or emoji
  type: 'streak' | 'journal' | 'game' | 'quote' | 'meditation';
  threshold: number;
  xpReward: number;
}

export interface UserProfile {
  nickname: string;
  gender: 'male' | 'female' | 'other';
  avatar: string; // URL or Base64
  bio: string;
  level: number;
  exp: number;
  nextLevelExp: number;
  unlockedAchievements: string[]; // IDs of unlocked achievements
  stats: UserStats;
}

export interface AppSettings {
  themeColor: string; // Hex code or Tailwind color name
  darkMode: 'system' | 'light' | 'dark';
}

export enum GameType {
  SNAKE = 'snake',
  MINESWEEPER = 'minesweeper',
  G2048 = '2048',
  GOMOKU = 'gomoku',
  PARKOUR = 'parkour',
  MATCH3 = 'match3',
  WOODEN_FISH = 'wooden-fish',
  BUBBLE_WRAP = 'bubble-wrap',
  TETRIS = 'tetris',
  KLOTSKI = 'klotski'
}

export interface MeditationTrack {
  id: string;
  title: string;
  duration: number; // in seconds
  category: 'sleep' | 'focus' | 'relax';
  color: string;
}
