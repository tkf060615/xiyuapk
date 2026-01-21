import React, { useState, useEffect, useRef } from 'react';
import { Quote } from '../types';
import { INITIAL_QUOTES } from '../data';
import { useApp } from '../context';
import { RefreshCw, Heart, Share2, Sparkles, CalendarCheck, Check, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export const Home = () => {
  const { toggleFavorite, favorites, checkIn, isCheckedInToday, user } = useApp();
  const [currentQuote, setCurrentQuote] = useState<Quote>(INITIAL_QUOTES[0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Weighted Random Logic
  const refreshQuote = () => {
    setIsSpinning(true);
    setAnimateCard(true);

    setTimeout(() => {
      const rand = Math.random();
      let selectedQuote: Quote;

      // Filter quotes by category/author
      const xiQuotes = INITIAL_QUOTES.filter(q => q.author === '习近平');
      const otherLeaderQuotes = INITIAL_QUOTES.filter(q => q.category === 'leadership' && q.author !== '习近平');
      const generalQuotes = INITIAL_QUOTES.filter(q => q.category !== 'leadership');

      // Logic: 50% Xi Jinping, 25% Other Leaders, 25% General
      if (rand < 0.5 && xiQuotes.length > 0) {
        selectedQuote = xiQuotes[Math.floor(Math.random() * xiQuotes.length)];
      } else if (rand < 0.75 && otherLeaderQuotes.length > 0) {
        selectedQuote = otherLeaderQuotes[Math.floor(Math.random() * otherLeaderQuotes.length)];
      } else {
        selectedQuote = generalQuotes[Math.floor(Math.random() * generalQuotes.length)];
      }

      setCurrentQuote(selectedQuote);
      setIsSpinning(false);
      setAnimateCard(false);
    }, 500);
  };

  useEffect(() => {
    refreshQuote();
  }, []);

  const handleShare = async () => {
    if (!shareRef.current || isSharing) return;
    setIsSharing(true);

    try {
      const canvas = await html2canvas(shareRef.current, {
        useCORS: true, 
        backgroundColor: '#f8f9fa', // Light gray/white background
        scale: 2, 
        logging: false,
        width: 375,
        windowWidth: 375,
        onclone: (doc) => {
            const el = doc.getElementById('share-card-home');
            if(el) el.style.display = 'flex';
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            alert("生成图片失败");
            setIsSharing(false);
            return;
        }

        const file = new File([blob], "energy_quote.png", { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '每日能量语录',
              text: `${currentQuote.content} — ${currentQuote.author}`,
            });
          } catch (error) {
             console.log("分享被取消或失败", error);
          }
        } else {
           const link = document.createElement('a');
           link.href = URL.createObjectURL(blob);
           link.download = 'energy_quote.png';
           link.click();
           alert("已保存图片到相册");
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error("Share generation error:", err);
      setIsSharing(false);
      alert("分享功能暂时不可用");
    }
  };

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

        <button
          onClick={checkIn}
          disabled={isCheckedInToday}
          className={`
            px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg transition-all duration-300
            ${isCheckedInToday
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-default shadow-none'
              : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:scale-105 active:scale-95 shadow-primary/30'}
          `}
        >
          {isCheckedInToday ? <Check size={16} /> : <CalendarCheck size={16} />}
          {isCheckedInToday ? '已打卡' : '打卡'}
        </button>
      </div>

      {/* Quote Card (Stereoscopic Glass) */}
      <div className="flex-1 flex flex-col justify-center w-full max-w-md perspective-1000">
        <div className={`
            glass-panel rounded-[2.5rem] p-8 relative 
            transition-all duration-500 transform
            ${animateCard ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100 blur-0'}
            hover:shadow-3xl hover:-translate-y-2
        `}>
          
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

        {/* Actions */}
        <div className="flex justify-center items-center gap-8 mt-16">
           <button 
             onClick={refreshQuote}
             disabled={isSharing}
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
             disabled={isSharing}
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
             onClick={handleShare}
             disabled={isSharing}
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
               {isSharing ? <Loader2 size={24} className="animate-spin text-primary" /> : <Share2 size={24} className="text-gray-600 dark:text-gray-300 group-hover:text-primary transition-colors" />}
             </div>
             <span className="text-xs font-bold text-gray-500">分享</span>
           </button>
        </div>
      </div>

      {/* 
        Simplified Share Card 
        - Clean white background
        - Minimal decoration
        - High contrast text
      */}
      <div 
        ref={shareRef}
        id="share-card-home"
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '375px', minHeight: '600px' }}
        className="bg-[#f8f9fa] flex flex-col relative font-sans box-border"
      >
        <div className="p-8 flex-1 flex flex-col">
            {/* Header Area */}
            <div className="flex items-center gap-4 mb-10 w-full">
               <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 shrink-0">
                   <img src={user.avatar} crossOrigin="anonymous" alt="User" className="w-full h-full object-cover" />
               </div>
               <div className="flex flex-col">
                   <h3 className="font-bold text-gray-800 text-lg leading-tight">{user.nickname}</h3>
                   <span className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('zh-CN')}</span>
               </div>
               <div className="ml-auto">
                    <div className="bg-primary/10 p-2 rounded-lg">
                        <Sparkles size={16} className="text-primary" />
                    </div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-center relative my-4">
                <div className="absolute -top-4 -left-4 text-6xl text-gray-200 font-serif z-0">“</div>
                
                <p className="text-2xl font-bold text-gray-800 leading-relaxed text-justify relative z-10 break-words tracking-wide px-2">
                    {currentQuote.content}
                </p>

                <div className="w-full flex justify-end mt-8 pr-2">
                    <p className="text-lg font-bold text-gray-600">—— {currentQuote.author}</p>
                </div>
                
                <div className="absolute -bottom-8 -right-2 text-6xl text-gray-200 font-serif rotate-180 z-0">“</div>
            </div>

            {/* Footer Area */}
            <div className="mt-auto pt-8 border-t border-gray-200 w-full flex justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-xl font-black text-gray-800 tracking-tighter">EnergyUp</span>
                    <span className="text-xs text-gray-400 tracking-widest uppercase mt-1">Daily Motivation</span>
                </div>
                <div className="bg-gray-200 w-16 h-16 rounded-lg flex items-center justify-center text-[10px] text-gray-500">
                    QR Code
                </div>
            </div>
        </div>
        
        {/* Simple color strip at bottom */}
        <div className="h-2 w-full bg-primary"></div>
      </div>

    </div>
  );
};
