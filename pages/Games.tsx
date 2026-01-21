import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { Grid3X3, Bomb, Trophy, Activity, Ghost, Hash } from 'lucide-react';

const GAMES_LIST = [
  { id: GameType.SNAKE, name: "贪吃蛇", color: "from-green-400 to-emerald-600", shadow: "shadow-green-500/30", icon: Ghost, desc: "经典怀旧" },
  { id: GameType.G2048, name: "2048", color: "from-yellow-400 to-orange-500", shadow: "shadow-orange-500/30", icon: Hash, desc: "数字合成" },
  { id: GameType.MINESWEEPER, name: "扫雷", color: "from-red-400 to-rose-600", shadow: "shadow-red-500/30", icon: Bomb, desc: "智力挑战" },
  { id: GameType.GOMOKU, name: "五子棋", color: "from-blue-400 to-indigo-600", shadow: "shadow-blue-500/30", icon: Grid3X3, desc: "博弈对战" },
  { id: GameType.PARKOUR, name: "跑酷", color: "from-orange-400 to-red-500", shadow: "shadow-orange-500/30", icon: Activity, desc: "敏捷反应" },
  { id: GameType.MATCH3, name: "消消乐", color: "from-purple-400 to-fuchsia-600", shadow: "shadow-purple-500/30", icon: Trophy, desc: "休闲解压" },
];

export const Games = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 h-full">
      <div className="pt-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">娱乐中心</h1>
        <p className="text-gray-500 dark:text-gray-300 mt-2 font-medium">放松心情，享受当下</p>
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
    </div>
  );
};