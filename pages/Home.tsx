
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

  const refreshQuote = () => {
    setIsSpinning(true);
    setAnimateCard(true);

    setTimeout(() => {
      const rand = Math.random();
      let selectedQuote: Quote;

      const xiQuotes = INITIAL_QUOTES.filter(q => q.author === '习近平');
      const otherLeaderQuotes = INITIAL_QUOTES.filter(q => q.category === 'leadership' && q.author !== '习近平');
      const generalQuotes = INITIAL_QUOTES.filter(q => q.category !== 'leadership');

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
    }, 400);
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
        backgroundColor: '#f8f9fa',
        scale: 2, 
        width: 375,
        windowWidth: 375,
        onclone: (doc) => {
            const el = doc.getElementById('share-card-home');
            if(el) el.style.display = 'flex';
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            setIsSharing(false);
            return;
        }
        const file = new File([blob], "energy_quote.png", { type: "image/png" });
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: '每日能量语录', text: `${currentQuote.content} — ${currentQuote.author}` });
        } else {
           const link = document.createElement('a');
           link.href = URL.createObjectURL(blob);
           link.download = 'energy_quote.png';
           link.click();
           alert("已保存图片");
        }
        setIsSharing(false);
      }, 'image/png');
    } catch (err) {
      setIsSharing(false);
    }
  };

  const isFav = favorites.includes(currentQuote.id);

  return (
    <div className="h-full max-h-screen flex flex-col items-center relative px-6 py-2 overflow-hidden">
      
      {/* Header - 紧凑化 */}
      <div className="w-full pt-4 pb-2 flex justify-between items-center z-10 shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 drop-shadow-sm">
          <div className="bg-primary p-1.5 rounded-lg">
            <Sparkles size={16} className="text-white" />
          </div>
          每日能量
        </h1>

        <button
          onClick={checkIn}
          disabled={isCheckedInToday}
          className={`
            px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all duration-300
            ${isCheckedInToday
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              : 'bg-primary text-white shadow-lg shadow-primary/30'}
          `}
        >
          {isCheckedInToday ? <Check size={14} /> : <CalendarCheck size={14} />}
          {isCheckedInToday ? '已打卡' : '打卡'}
        </button>
      </div>

      {/* Quote Card Area - 弹性撑开 */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center py-4 min-h-0">
        <div className={`
            glass-panel rounded-[2rem] p-6 relative flex flex-col justify-center min-h-[50%]
            transition-all duration-400 transform
            ${animateCard ? 'scale-95 opacity-50 blur-sm' : 'scale-100 opacity-100 blur-0'}
            shadow-[0_15px_35px_-5px_rgba(0,0,0,0.1)]
        `}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex-1 flex flex-col justify-center py-4">
             <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-50 leading-relaxed text-center tracking-wide">
               {currentQuote.content}
             </p>
          </div>

          <div className="mt-4 flex justify-end items-center gap-2 shrink-0">
             <div className="h-[1px] w-8 bg-primary/40 rounded-full"></div>
             <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{currentQuote.author}</p>
          </div>
        </div>

        {/* Actions - 紧凑化 */}
        <div className="flex justify-center items-center gap-6 mt-8 shrink-0">
           <button 
             onClick={refreshQuote}
             disabled={isSharing}
             className="flex flex-col items-center gap-1.5"
           >
             <div className={`
               w-14 h-14 rounded-2xl flex items-center justify-center
               bg-white dark:bg-gray-800 border border-white/50 dark:border-white/10 shadow-sm
               transition-all active:scale-95
               ${isSpinning ? 'animate-spin' : ''}
             `}>
               <RefreshCw size={22} className="text-gray-600 dark:text-gray-300" />
             </div>
             <span className="text-[10px] font-bold text-gray-400">换一条</span>
           </button>

           <button 
             onClick={() => toggleFavorite(currentQuote.id)}
             disabled={isSharing}
             className="flex flex-col items-center gap-1.5"
           >
             <div className={`
               w-16 h-16 rounded-full flex items-center justify-center
               glass-panel border-2 ${isFav ? 'border-primary/30' : 'border-white/50'}
               shadow-lg shadow-primary/10 transition-all active:scale-90
             `}>
               <Heart 
                 size={28} 
                 className={`transition-all duration-300 ${isFav ? 'text-primary fill-primary scale-110' : 'text-gray-400'}`} 
               />
             </div>
             <span className="text-[10px] font-bold text-gray-400">{isFav ? '已收藏' : '收藏'}</span>
           </button>

           <button 
             onClick={handleShare}
             disabled={isSharing}
             className="flex flex-col items-center gap-1.5"
           >
             <div className="
               w-14 h-14 rounded-2xl flex items-center justify-center
               bg-white dark:bg-gray-800 border border-white/50 dark:border-white/10 shadow-sm
               transition-all active:scale-95
             ">
               {isSharing ? <Loader2 size={22} className="animate-spin text-primary" /> : <Share2 size={22} className="text-gray-600 dark:text-gray-300" />}
             </div>
             <span className="text-[10px] font-bold text-gray-400">分享</span>
           </button>
        </div>
      </div>

      {/* Share Card (Hidden) */}
      <div ref={shareRef} id="share-card-home" style={{ position: 'fixed', left: '-9999px', top: 0, width: '375px', minHeight: '500px' }} className="bg-[#f8f9fa] flex flex-col font-sans box-border p-8">
        <div className="flex items-center gap-4 mb-10 w-full">
           <img src={user.avatar} crossOrigin="anonymous" className="w-12 h-12 rounded-full border border-gray-200" />
           <div className="flex flex-col">
               <h3 className="font-bold text-gray-800 text-lg">{user.nickname}</h3>
               <span className="text-xs text-gray-400">{new Date().toLocaleDateString('zh-CN')}</span>
           </div>
        </div>
        <div className="flex-1 flex flex-col justify-center py-4">
            <p className="text-2xl font-bold text-gray-800 leading-relaxed text-justify">
                {currentQuote.content}
            </p>
            <div className="w-full flex justify-end mt-6">
                <p className="text-lg font-bold text-gray-600">—— {currentQuote.author}</p>
            </div>
        </div>
        <div className="mt-auto pt-8 border-t border-gray-200 flex justify-between items-end">
            <span className="text-xl font-black text-gray-800">EnergyUp</span>
            <div className="h-2 w-24 bg-primary rounded-full"></div>
        </div>
      </div>

    </div>
  );
};
