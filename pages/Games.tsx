import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { Grid3X3, Bomb, Trophy, Activity, Ghost, Hash, ClipboardList, X, Music, CircleDashed } from 'lucide-react';

const GAMES_LIST = [
  { id: GameType.SNAKE, name: "贪吃蛇", color: "from-green-400 to-emerald-600", shadow: "shadow-green-500/30", icon: Ghost, desc: "经典怀旧" },
  { id: GameType.G2048, name: "2048", color: "from-yellow-400 to-orange-500", shadow: "shadow-orange-500/30", icon: Hash, desc: "数字合成" },
  { id: GameType.MINESWEEPER, name: "扫雷", color: "from-red-400 to-rose-600", shadow: "shadow-red-500/30", icon: Bomb, desc: "智力挑战" },
  { id: GameType.GOMOKU, name: "五子棋", color: "from-blue-400 to-indigo-600", shadow: "shadow-blue-500/30", icon: Grid3X3, desc: "博弈对战" },
  { id: GameType.PARKOUR, name: "跑酷", color: "from-orange-400 to-red-500", shadow: "shadow-orange-500/30", icon: Activity, desc: "敏捷反应" },
  { id: GameType.MATCH3, name: "消消乐", color: "from-purple-400 to-fuchsia-600", shadow: "shadow-purple-500/30", icon: Trophy, desc: "休闲解压" },
  { id: GameType.WOODEN_FISH, name: "电子木鱼", color: "from-amber-500 to-orange-700", shadow: "shadow-amber-500/30", icon: Music, desc: "积攒功德" },
  { id: GameType.BUBBLE_WRAP, name: "捏泡泡", color: "from-cyan-400 to-blue-500", shadow: "shadow-cyan-500/30", icon: CircleDashed, desc: "无限解压" },
];

export const Games = () => {
  const navigate = useNavigate();
  const [showRecords, setShowRecords] = useState(false);
  const [records, setRecords] = useState<Record<string, { played: number, maxScore: number }>>({});

  useEffect(() => {
    if (showRecords) {
      try {
        const saved = localStorage.getItem('game_records');
        if (saved) setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading records", e);
      }
    }
  }, [showRecords]);

  return (
    <div className="p-6 h-full relative">
      <div className="pt-8 mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">娱乐中心</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-2 font-medium">放松心情，享受当下</p>
        </div>
        <button 
          onClick={() => setShowRecords(true)}
          className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
        >
          <ClipboardList size={24} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-5 pb-8">
        {GAMES_LIST.map((game, idx) => (
          <button
            key={game.id}
            onClick={() => navigate(`/game/${game.id}`)}
            className="group relative flex flex-col items-center justify-center p-6 glass-card rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* 3D Icon Container */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} text-white flex items-center justify-center shadow-lg ${game.shadow} mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              <game.icon size={30} strokeWidth={2.5} />
            </div>
            
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">{game.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-medium">{game.desc}</p>
            
            {/* Shine Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          </button>
        ))}
      </div>

      {/* Records Modal */}
      {showRecords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative flex flex-col max-h-[80vh]">
            <button 
              onClick={() => setShowRecords(false)} 
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-2 mb-6 text-primary">
               <Trophy size={24} />
               <h2 className="text-xl font-bold text-gray-800 dark:text-white">游戏记录</h2>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-3 pr-2">
               {GAMES_LIST.map(game => {
                 const rec = records[game.id] || { played: 0, maxScore: 0 };
                 return (
                   <div key={game.id} className="glass-panel p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} text-white flex items-center justify-center shadow-sm`}>
                            <game.icon size={18} />
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-800 dark:text-white">{game.name}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">游玩 {rec.played} 次</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="block text-xs text-gray-400 font-bold uppercase">最高分</span>
                         <span className="text-lg font-mono font-bold text-primary">{rec.maxScore}</span>
                      </div>
                   </div>
                 );
               })}
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6">继续加油，突破自我！</p>
          </div>
        </div>
      )}
    </div>
  );
};