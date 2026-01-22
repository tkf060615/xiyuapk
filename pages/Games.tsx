
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { Grid3X3, Bomb, Trophy, Activity, Ghost, Hash, ClipboardList, X, Music, CircleDashed, LayoutGrid, Swords, TrendingUp, BarChart3 } from 'lucide-react';

const GAMES_LIST = [
  { id: GameType.SNAKE, name: "贪吃蛇", color: "from-green-400 to-emerald-600", shadow: "shadow-green-500/30", icon: Ghost, desc: "经典怀旧" },
  { id: GameType.G2048, name: "2048", color: "from-yellow-400 to-orange-500", shadow: "shadow-orange-500/30", icon: Hash, desc: "数字合成" },
  { id: GameType.MINESWEEPER, name: "扫雷", color: "from-red-400 to-rose-600", shadow: "shadow-red-500/30", icon: Bomb, desc: "智力挑战" },
  { id: GameType.TETRIS, name: "俄罗斯方块", color: "from-blue-500 to-blue-700", shadow: "shadow-blue-500/30", icon: LayoutGrid, desc: "方块消除" },
  { id: GameType.GOMOKU, name: "五子棋", color: "from-blue-400 to-indigo-600", shadow: "shadow-blue-500/30", icon: Grid3X3, desc: "博弈对战" },
  { id: GameType.KLOTSKI, name: "华容道", color: "from-red-500 to-red-800", shadow: "shadow-red-900/30", icon: Swords, desc: "曹操突围" },
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

  // Fix: Explicitly typing curr to ensure 'played' is accessible and avoid unknown type error
  const totalPlayed = Object.values(records).reduce((acc: number, curr: any) => acc + (curr.played || 0), 0);

  return (
    <div className="h-full flex flex-col">
      {/* 统一标题栏 */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">娱乐中心</h1>
          <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium">放松心情，享受当下</p>
        </div>
        <button 
          onClick={() => setShowRecords(true)}
          className="p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-all active:scale-95"
        >
          <BarChart3 size={24} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 no-scrollbar">
        <div className="grid grid-cols-2 gap-5 pb-24">
          {GAMES_LIST.map((game, idx) => (
            <button
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              className="group relative flex flex-col items-center justify-center p-6 glass-card rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} text-white flex items-center justify-center shadow-lg ${game.shadow} mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <game.icon size={30} strokeWidth={2.5} />
              </div>
              
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">{game.name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 font-medium">{game.desc}</p>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </button>
          ))}
        </div>
      </div>

      {/* Records Modal */}
      {showRecords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh] border border-white/10">
            <button 
              onClick={() => setShowRecords(false)} 
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
               <div className="bg-primary/10 p-2 rounded-xl">
                 <Trophy size={24} className="text-primary" />
               </div>
               <h2 className="text-xl font-bold text-gray-800 dark:text-white">成就与记录</h2>
            </div>

            {/* Total Overview */}
            <div className="bg-gray-50 dark:bg-black/40 p-4 rounded-2xl mb-6 flex justify-around">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">累计游玩</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-white">{totalPlayed}</p>
                </div>
                <div className="w-[1px] bg-gray-200 dark:bg-gray-800 my-2"></div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">游戏项目</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-white">{GAMES_LIST.length}</p>
                </div>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-4 pr-1">
               {GAMES_LIST.map(game => {
                 const rec = records[game.id] || { played: 0, maxScore: 0 };
                 return (
                   <div key={game.id} className="p-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${game.color} text-white flex items-center justify-center shadow-sm`}>
                              <game.icon size={16} />
                           </div>
                           <h4 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{game.name}</h4>
                        </div>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-bold">游玩 {rec.played} 次</span>
                      </div>
                      <div className="glass-panel p-3 rounded-xl flex items-center justify-between border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                           <TrendingUp size={14} className="text-primary" />
                           <span className="text-xs text-gray-400 font-bold">单局最高</span>
                        </div>
                        <span className="text-base font-mono font-black text-primary">{rec.maxScore}</span>
                      </div>
                   </div>
                 );
               })}
            </div>
            
            <p className="text-center text-[10px] text-gray-400 mt-6 font-bold uppercase tracking-widest opacity-50">记录每一次的自我突破</p>
          </div>
        </div>
      )}
    </div>
  );
};
