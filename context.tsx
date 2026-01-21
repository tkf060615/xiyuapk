import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, JournalEntry, AppSettings, Quote, Achievement, UserStats } from './types';
import { THEME_COLORS, ACHIEVEMENTS } from './data';

interface AppContextType {
  user: UserProfile;
  updateUser: (data: Partial<UserProfile>) => void;
  journal: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  favorites: number[]; // Quote IDs
  toggleFavorite: (id: number) => void;
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
  // New actions
  incrementStat: (key: keyof UserStats, amount?: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_STATS: UserStats = {
  loginStreak: 0,
  lastLoginDate: '',
  totalJournalEntries: 0,
  totalQuotesLiked: 0,
  totalGamesPlayed: 0,
  totalMeditationMinutes: 0
};

const DEFAULT_USER: UserProfile = {
  nickname: '新用户',
  gender: 'male',
  avatar: 'https://picsum.photos/200',
  bio: '这家伙很懒，什么都没留下。',
  level: 1,
  exp: 0,
  nextLevelExp: 100,
  unlockedAchievements: [],
  stats: DEFAULT_STATS
};

// Helper to convert hex to rgb string "r, g, b"
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '239, 68, 68';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- State ---
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('app_user');
    let loadedUser = saved ? JSON.parse(saved) : DEFAULT_USER;
    // Ensure stats structure exists if loading from old version
    if (!loadedUser.stats) loadedUser.stats = DEFAULT_STATS;
    if (!loadedUser.nextLevelExp) loadedUser.nextLevelExp = 100 * loadedUser.level;
    if (!loadedUser.unlockedAchievements) loadedUser.unlockedAchievements = [];
    return loadedUser;
  });

  const [journal, setJournal] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('app_journal');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('app_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    return saved ? JSON.parse(saved) : { themeColor: THEME_COLORS[0].hex, darkMode: 'system' };
  });

  // --- Effects ---
  useEffect(() => { localStorage.setItem('app_user', JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem('app_journal', JSON.stringify(journal)); }, [journal]);
  useEffect(() => { localStorage.setItem('app_favorites', JSON.stringify(favorites)); }, [favorites]);
  
  useEffect(() => { 
    localStorage.setItem('app_settings', JSON.stringify(settings)); 
    
    // Update CSS Variables
    document.documentElement.style.setProperty('--primary-color', settings.themeColor);
    document.documentElement.style.setProperty('--secondary-color', settings.themeColor + '80');
    // Critical: Update RGB variable for alpha shadows/glows
    document.documentElement.style.setProperty('--primary-rgb', hexToRgb(settings.themeColor));

    const root = window.document.documentElement;
    if (settings.darkMode === 'dark' || (settings.darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  // Login Streak Check on Mount
  useEffect(() => {
    const today = new Date().toLocaleDateString('zh-CN');
    setUser(prev => {
      const lastLogin = prev.stats.lastLoginDate;
      let newStreak = prev.stats.loginStreak;

      if (lastLogin !== today) {
        // Calculate difference in days
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('zh-CN');

        if (lastLogin === yesterdayStr) {
           newStreak += 1;
        } else {
           newStreak = 1; // Reset streak if missed a day, or first login
        }
        
        // Return updated user with new streak
        const updatedUser = { 
          ...prev, 
          stats: { ...prev.stats, loginStreak: newStreak, lastLoginDate: today } 
        };
        setTimeout(() => checkAchievements(updatedUser), 100); 
        return updatedUser;
      }
      return prev;
    });
  }, []);

  // --- Logic Helpers ---

  const checkAchievements = (currentUser: UserProfile) => {
    const stats = currentUser.stats;
    const newUnlocked = [...currentUser.unlockedAchievements];
    let addedExp = 0;
    let achievementUnlocked = false;

    ACHIEVEMENTS.forEach(ach => {
      if (newUnlocked.includes(ach.id)) return;

      let achieved = false;
      if (ach.type === 'streak' && stats.loginStreak >= ach.threshold) achieved = true;
      if (ach.type === 'journal' && stats.totalJournalEntries >= ach.threshold) achieved = true;
      if (ach.type === 'game' && stats.totalGamesPlayed >= ach.threshold) achieved = true;
      if (ach.type === 'quote' && stats.totalQuotesLiked >= ach.threshold) achieved = true;
      if (ach.type === 'meditation' && stats.totalMeditationMinutes >= ach.threshold) achieved = true;

      if (achieved) {
        newUnlocked.push(ach.id);
        addedExp += ach.xpReward;
        achievementUnlocked = true;
        console.log(`Unlocked: ${ach.title}`);
      }
    });

    if (achievementUnlocked) {
      // Calculate Level Up
      let currentExp = currentUser.exp + addedExp;
      let currentLevel = currentUser.level;
      let nextLevelExp = currentUser.nextLevelExp;

      while (currentExp >= nextLevelExp) {
        currentExp -= nextLevelExp;
        currentLevel += 1;
        nextLevelExp = Math.floor(nextLevelExp * 1.2); // Increase difficulty
      }

      setUser(prev => ({
        ...prev,
        level: currentLevel,
        exp: currentExp,
        nextLevelExp: nextLevelExp,
        unlockedAchievements: newUnlocked
      }));
    }
  };

  // --- Handlers ---
  const updateUser = (data: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...data }));
  };

  const incrementStat = (key: keyof UserStats, amount = 1) => {
    setUser(prev => {
      const currentVal = prev.stats[key];
      if (typeof currentVal === 'number') {
        const newStats = { ...prev.stats, [key]: currentVal + amount };
        const updatedUser = { ...prev, stats: newStats };
        // Check achievements after stat update
        setTimeout(() => checkAchievements(updatedUser), 0);
        return updatedUser;
      }
      return prev;
    });
  };

  const addJournalEntry = (entry: JournalEntry) => {
    setJournal(prev => [entry, ...prev]);
    // Award flat XP for journal
    setUser(prev => {
      let exp = prev.exp + 10;
      let level = prev.level;
      let nextExp = prev.nextLevelExp;
      if (exp >= nextExp) {
        exp -= nextExp;
        level += 1;
        nextExp = Math.floor(nextExp * 1.2);
      }
      return { ...prev, exp, level, nextLevelExp: nextExp };
    });
    incrementStat('totalJournalEntries');
  };

  const updateJournalEntry = (entry: JournalEntry) => {
    setJournal(prev => prev.map(item => item.id === entry.id ? entry : item));
  };

  const deleteJournalEntry = (id: string) => {
    setJournal(prev => prev.filter(item => item.id !== id));
  };

  const toggleFavorite = (id: number) => {
    let isAdding = false;
    setFavorites(prev => {
      if (prev.includes(id)) return prev.filter(fid => fid !== id);
      isAdding = true;
      return [...prev, id];
    });
    if (isAdding) {
      incrementStat('totalQuotesLiked');
    }
  };

  const updateSettings = (data: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...data }));
  };

  return (
    <AppContext.Provider value={{ user, updateUser, journal, addJournalEntry, updateJournalEntry, deleteJournalEntry, favorites, toggleFavorite, settings, updateSettings, incrementStat }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};