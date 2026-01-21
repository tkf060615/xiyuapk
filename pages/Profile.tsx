import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Settings, Camera, Edit2, Medal, Lock, Zap, Calendar, Book, Gamepad2 } from 'lucide-react';
import { ACHIEVEMENTS } from '../data';

export const Profile = () => {
  const { user, updateUser, journal } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const xpPercentage = Math.min(100, (user.exp / user.nextLevelExp) * 100);

  return (
    <div className="min-h-full pb-10">
      {/* Glass Header */}
      <div className="relative h-64 overflow-hidden rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-red-400 to-orange-300 opacity-90"></div>
        {/* Abstract shapes in header */}
        <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-white/10 rotate-12 blur-3xl rounded-[40%]"></div>
        
        <div className="absolute top-0 w-full p-6 flex justify-end pt-8">
           <button 
             onClick={() => navigate('/settings')}
             className="bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors border border-white/20 shadow-lg"
           >
             <Settings size={22} />
           </button>
        </div>
      </div>

      {/* Floating User Card */}
      <div className="px-6 -mt-24 relative z-10">
        <div className="glass-panel rounded-[2rem] p-6 flex flex-col items-center animate-fade-in">
          
          <div className="relative -mt-16 mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 shadow-2xl">
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800 active:scale-90 transition-transform"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
          </div>

          <div className="text-center w-full mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2 mb-1">
              {user.nickname}
              <div className="bg-gray-100 p-1.5 rounded-full cursor-pointer hover:bg-gray-200" onClick={() => {
                const newName = prompt("请输入新昵称:", user.nickname);
                if (newName) updateUser({ nickname: newName });
              }}>
                 <Edit2 size={12} className="text-gray-500" />
              </div>
            </h2>
            <p className="text-gray-500 text-sm mb-4 max-w-[200px] truncate mx-auto">{user.bio}</p>

            {/* Level & XP Bar */}
            <div className="w-full max-w-xs mx-auto bg-gray-100 dark:bg-gray-700/50 p-3 rounded-2xl border border-white/50 dark:border-white/5">
               <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                 <span className="text-primary">Lv.{user.level}</span>
                 <span>{user.exp} / {user.nextLevelExp} XP</span>
               </div>
               <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shadow-inner">
                 <div 
                    className="h-full bg-gradient-to-r from-primary to-orange-400 shadow-lg"
                    style={{ width: `${xpPercentage}%` }}
                 />
               </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex w-full justify-between gap-2">
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Zap size={18} className="text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.loginStreak}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">连续登录</span>
             </div>
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Book size={18} className="text-blue-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalJournalEntries}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">日记</span>
             </div>
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Gamepad2 size={18} className="text-green-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalGamesPlayed}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">游戏</span>
             </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
          <div className="bg-yellow-100 p-1.5 rounded-lg">
             <Medal size={18} className="text-yellow-600" /> 
          </div>
          成就徽章 
          <span className="text-xs text-gray-400 ml-auto bg-white/50 px-2 py-1 rounded-full">
            {user.unlockedAchievements.length} / {ACHIEVEMENTS.length}
          </span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = user.unlockedAchievements.includes(ach.id);
            return (
              <div 
                key={ach.id} 
                className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                  isUnlocked 
                    ? 'glass-card border-yellow-200/50 shadow-lg shadow-yellow-500/10' 
                    : 'bg-gray-100/50 dark:bg-gray-800/30 border border-transparent opacity-60 grayscale'
                }`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 shadow-md ${isUnlocked ? 'bg-gradient-to-br from-yellow-100 to-yellow-50' : 'bg-gray-200'}`}>
                  {isUnlocked ? ach.icon : <Lock size={20} className="text-gray-400" />}
                </div>
                <h4 className="font-bold text-xs text-center text-gray-800 dark:text-gray-200">{ach.title}</h4>
                <p className="text-[10px] text-gray-400 text-center mt-1 leading-tight scale-90">{ach.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};