import React, { useState, useEffect } from 'react';
import { Quote } from '../types';
import { INITIAL_QUOTES } from '../data';
import { useApp } from '../context';
import { RefreshCw, Heart, Share2, Sparkles } from 'lucide-react';

export const Home = () => {
  const { toggleFavorite, favorites } = useApp();
  const [currentQuote, setCurrentQuote] = useState<Quote>(INITIAL_QUOTES[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);

  const refreshQuote = () => {
    setIsSpinning(true);
    setAnimateCard(true);
    // Simple random
    const randomIndex = Math.floor(Math.random() * INITIAL_QUOTES.length);
    setTimeout(() => {
      setCurrentQuote(INITIAL_QUOTES[randomIndex]);
      setIsSpinning(false);
      setAnimateCard(false);
    }, 500);
  };

  useEffect(() => {
    refreshQuote();
  }, []);

  const isFav = favorites.includes(currentQuote.id);

  return (
    <div className="h-full flex flex-col items-center relative p-6">
      
      {/* Header */}
      <div className="w-full pt-8 pb-6 flex justify-between items-center z-10">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3 drop-shadow-sm">
          <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/40">
            <Sparkles size={20} className="text-white" />
          </div>
          每日能量
        </h1>
      </div>

      {/* Quote Card (Stereoscopic Glass) */}
      <div className="flex-1 flex flex-col justify-center w-full max-w-md perspective-1000">
        <div className={`
            glass-panel rounded-[2.5rem] p-8 relative 
            transition-all duration-500 transform
            ${animateCard ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100 blur-0'}
            hover:shadow-3xl hover:-translate-y-2
        `}>
          
          {/* Decorative Elements for 3D Feel */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

          <div className="absolute -top-6 -left-2 text-8xl text-primary/20 font-serif drop-shadow-lg">“</div>
          
          <div className="min-h-[240px] flex flex-col justify-center relative z-10">
             <p className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-50 leading-relaxed text-center tracking-wide drop-shadow-sm">
               {currentQuote.content}
             </p>
          </div>

          <div className="mt-8 flex justify-end items-center gap-3">
             <div className="h-[2px] w-12 bg-primary/50 rounded-full"></div>
             <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{currentQuote.author}</p>
          </div>

          <div className="absolute -bottom-8 -right-2 text-8xl text-primary/20 font-serif transform rotate-180 drop-shadow-lg">“</div>
        </div>

        {/* Actions (3D Buttons) */}
        <div className="flex justify-center items-center gap-8 mt-16">
           <button 
             onClick={refreshQuote}
             className="group flex flex-col items-center gap-2"
           >
             <div className={`
               w-16 h-16 rounded-2xl flex items-center justify-center
               bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800
               border border-white/50 dark:border-white/10
               shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]
               dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05)]
               transition-all active:scale-95 active:shadow-inner
               ${isSpinning ? 'animate-spin' : ''}
             `}>
               <RefreshCw size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
             </div>
             <span className="text-xs font-bold text-gray-500">刷新</span>
           </button>

           <button 
             onClick={() => toggleFavorite(currentQuote.id)}
             className="group flex flex-col items-center gap-2"
           >
             <div className={`
               w-20 h-20 -mt-6 rounded-full flex items-center justify-center
               glass-panel border-2 ${isFav ? 'border-red-500/30' : 'border-white/50'}
               shadow-xl shadow-red-500/10
               transition-all duration-300 transform active:scale-90
             `}>
               <Heart 
                 size={36} 
                 className={`transition-all duration-300 ${isFav ? 'text-red-500 fill-red-500 scale-110 drop-shadow-md' : 'text-gray-400 group-hover:text-red-400'}`} 
               />
             </div>
             <span className="text-xs font-bold text-gray-500">{isFav ? '已收藏' : '收藏'}</span>
           </button>

           <button 
             onClick={() => alert('分享功能模拟成功！')}
             className="group flex flex-col items-center gap-2"
           >
             <div className="
               w-16 h-16 rounded-2xl flex items-center justify-center
               bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800
               border border-white/50 dark:border-white/10
               shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]
               dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-4px_-4px_12px_rgba(255,255,255,0.05)]
               transition-all active:scale-95 active:shadow-inner
             ">
               <Share2 size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />
             </div>
             <span className="text-xs font-bold text-gray-500">分享</span>
           </button>
        </div>
      </div>
    </div>
  );
};