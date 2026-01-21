import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import { JournalEntry } from '../types';
import { Plus, Smile, Camera, X, Trash2, Edit2, Calendar, MapPin, Loader2, ImageIcon, Navigation, Share2, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

export const Journal = () => {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry, user } = useApp();
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form State
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(50);
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Sharing State
  const [isSharing, setIsSharing] = useState(false);
  const shareJournalRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && selectedEntry) {
      setContent(selectedEntry.content);
      setMood(selectedEntry.mood);
      setImage(selectedEntry.image || null);
      setLocation(selectedEntry.location || null);
    } else if (isWriting && !editingId) {
      resetForm();
    }
  }, [isWriting, editingId, selectedEntry]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("您的设备不支持定位功能");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
           const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
           if (res.ok) {
             const data = await res.json();
             const addr = data.address;
             const locStr = addr.city || addr.town || addr.district || addr.village || addr.county || `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
             setLocation(locStr);
           } else {
             setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
           }
        } catch(e) {
           setLocation(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`);
        }
        setIsGettingLocation(false);
      },
      (err) => {
        console.error(err);
        let msg = "无法获取位置信息";
        if (err.code === 1) msg = "请允许获取位置权限";
        else if (err.code === 2) msg = "位置获取失败";
        else if (err.code === 3) msg = "获取位置超时";
        alert(msg);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveEntry = () => {
    if (!content.trim()) return;
    
    if (editingId && selectedEntry) {
      const updatedEntry: JournalEntry = {
        ...selectedEntry,
        content,
        mood,
        image: image || undefined,
        location: location || undefined,
      };
      updateJournalEntry(updatedEntry);
      setSelectedEntry(updatedEntry);
      setEditingId(null);
      setIsWriting(false);
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        content,
        mood,
        image: image || undefined,
        location: location || undefined,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('zh-CN'),
      };
      addJournalEntry(newEntry);
      setIsWriting(false);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (selectedEntry && window.confirm("确定要删除这篇日记吗？")) {
      deleteJournalEntry(selectedEntry.id);
      setSelectedEntry(null);
    }
  };

  const handleShare = async () => {
    if (!shareJournalRef.current || isSharing) return;
    setIsSharing(true);

    try {
      const canvas = await html2canvas(shareJournalRef.current, {
        useCORS: true,
        backgroundColor: '#f8f9fa',
        scale: 2,
        width: 375,
        windowWidth: 375,
        onclone: (doc) => {
            const el = doc.getElementById('share-card-journal');
            if(el) el.style.display = 'flex';
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            alert("生成分享图片失败");
            setIsSharing(false);
            return;
        }

        const file = new File([blob], "energy_journal.png", { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: '我的日记分享',
              text: '来自 EnergyUp 的生活记录',
            });
          } catch (e) {
             console.log("分享取消");
          }
        } else {
           const link = document.createElement('a');
           link.href = URL.createObjectURL(blob);
           link.download = 'energy_journal.png';
           link.click();
           alert("已保存图片到相册");
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (e) {
      console.error(e);
      alert("分享失败");
      setIsSharing(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMood(50);
    setImage(null);
    setLocation(null);
    setEditingId(null);
  };

  // --- WRITE / EDIT MODE ---
  if (isWriting) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col p-6 animate-fade-in bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <button onClick={() => { setIsWriting(false); setEditingId(null); }} className="text-gray-500 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={24} />
          </button>
          <span className="font-bold text-lg dark:text-white">{editingId ? '编辑日记' : '写日记'}</span>
          <button onClick={saveEntry} className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform">
            {editingId ? '保存' : '发布'}
          </button>
        </div>

        <textarea 
          className="w-full flex-1 bg-transparent text-lg resize-none outline-none dark:text-white placeholder-gray-400 p-2 min-h-[150px]"
          placeholder="今天发生了什么有趣的事？..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />

        {/* Attachments Preview */}
        <div className="space-y-3 mb-4 shrink-0">
            {image && (
              <div className="relative rounded-2xl overflow-hidden shadow-lg h-48 group bg-gray-100 dark:bg-gray-800">
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            
            {location && (
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm animate-fade-in border border-blue-100 dark:border-blue-800">
                    <MapPin size={16} className="fill-blue-500/20" />
                    {location}
                    <button onClick={() => setLocation(null)} className="ml-2 hover:text-red-500 p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50"><X size={14}/></button>
                </div>
            )}
        </div>

        <div className="mt-auto space-y-4 pb-4 shrink-0">
          <div className="glass-card p-4 rounded-2xl flex items-center justify-between border border-white/50 dark:border-white/10">
            <span className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2 font-bold">
              <Smile size={20} className="text-yellow-500" /> 心情: {mood}
            </span>
            <input 
              type="range" 
              min="0" max="100" 
              value={mood} 
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-32 accent-primary h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex-1 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all hover:shadow-md border border-purple-100 dark:border-purple-800"
            >
              <ImageIcon size={20} />
              {image ? '更换图片' : '添加图片'}
            </button>
            <button 
                onClick={handleGetLocation} 
                disabled={isGettingLocation}
                className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all hover:shadow-md border border-blue-100 dark:border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGettingLocation ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />} 
              {location ? '更新定位' : '添加定位'}
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW MODE ---
  if (selectedEntry) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 overflow-y-auto animate-fade-in flex flex-col">
        {/* Detail Header */}
        <div className="sticky top-0 p-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
           <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={24} className="text-gray-600 dark:text-gray-300" />
           </button>
           <div className="flex gap-2">
              <button 
                onClick={handleShare}
                disabled={isSharing}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
              >
                 {isSharing ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
              </button>
              <button 
                onClick={() => { setEditingId(selectedEntry.id); setIsWriting(true); }}
                className="p-2 rounded-full text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                 <Edit2 size={20} />
              </button>
              <button 
                onClick={handleDelete}
                className="p-2 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                 <Trash2 size={20} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-24">
           <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary/10 p-3 rounded-2xl">
                 <Calendar size={24} className="text-primary" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEntry.dateStr}</h2>
                 <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                    <span>{new Date(selectedEntry.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</span>
                    {selectedEntry.location && (
                        <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">
                            <MapPin size={10} /> {selectedEntry.location}
                        </span>
                    )}
                 </div>
              </div>
              <div className="ml-auto">
                <span className={`px-4 py-2 rounded-full text-sm font-bold border ${selectedEntry.mood > 80 ? 'bg-green-100 text-green-700 border-green-200' : selectedEntry.mood > 40 ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {selectedEntry.mood > 80 ? '😆 开心' : selectedEntry.mood > 40 ? '🙂 平静' : '😔 低落'}
                </span>
              </div>
           </div>

           {selectedEntry.image && (
             <div className="w-full mb-8 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                <img src={selectedEntry.image} alt="Memory" className="w-full h-auto max-h-[50vh] object-cover" />
             </div>
           )}

           <div className="glass-panel p-6 rounded-3xl shadow-sm">
             <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-serif">
                {selectedEntry.content}
             </p>
           </div>
        </div>

        {/* 
          Simplified Journal Share Card 
          - Clean Background
          - Proper Spacing
          - Clear Typography
        */}
        <div 
          ref={shareJournalRef}
          id="share-card-journal"
          style={{ position: 'fixed', left: '-9999px', top: 0, width: '375px', minHeight: '500px' }}
          className="bg-[#f8f9fa] flex flex-col font-sans box-border"
        >
           {/* Top Bar Decoration */}
           <div className="h-1.5 w-full bg-primary mb-6"></div>

           <div className="px-6 pb-8 flex-1 flex flex-col">
               {/* User Info */}
               <div className="flex items-center gap-3 mb-6 w-full">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0">
                        <img src={user.avatar} crossOrigin="anonymous" alt="User" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 text-sm leading-tight">{user.nickname}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{selectedEntry.dateStr}</span>
                          <span>•</span>
                          <span>{new Date(selectedEntry.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedEntry.mood > 80 ? 'bg-green-50 text-green-600 border-green-200' : selectedEntry.mood > 40 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                           {selectedEntry.mood > 80 ? '开心' : selectedEntry.mood > 40 ? '平静' : '低落'}
                        </span>
                    </div>
               </div>

               {/* Image */}
               {selectedEntry.image && (
                    <div className="w-full h-56 rounded-xl overflow-hidden mb-6 shadow-sm border border-gray-100">
                        <img src={selectedEntry.image} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Diary" />
                    </div>
               )}

               {/* Content */}
               <div className="mb-8">
                   <p className="text-gray-700 leading-relaxed font-serif whitespace-pre-wrap text-justify text-base">
                     {selectedEntry.content}
                   </p>
                   {selectedEntry.location && (
                       <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                           <MapPin size={12} /> {selectedEntry.location}
                       </div>
                   )}
               </div>

               {/* Footer */}
               <div className="mt-auto pt-6 border-t border-gray-200 flex justify-center items-center gap-2 opacity-70">
                   <div className="bg-gray-200 p-1 rounded">
                     <Sparkles size={12} className="text-gray-500" />
                   </div>
                   <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">EnergyUp Journal</span>
               </div>
           </div>
        </div>

      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-full p-6">
      <div className="flex justify-between items-end mb-8 pt-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">日记</h1>
           <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium">记录每一份感动</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsWriting(true); }}
          className="bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {journal.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
          <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
             <BookIcon size={48} className="opacity-30" />
          </div>
          <p className="font-medium">还没有日记，快去写一篇吧~</p>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {journal.map((entry, idx) => (
             <div 
               key={entry.id} 
               onClick={() => setSelectedEntry(entry)}
               className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-all cursor-pointer animate-fade-in hover:scale-[1.02]"
               style={{ animationDelay: `${idx * 100}ms` }}
             >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-gray-800 dark:text-gray-100">{entry.dateStr.split('/')[2] || entry.dateStr.slice(-2)}日</span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold">{entry.dateStr}</span>
                        {entry.location && <span className="text-[10px] text-blue-400 flex items-center gap-0.5 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"><MapPin size={10} />{entry.location}</span>}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${entry.mood > 80 ? 'bg-green-100/50 text-green-700 border-green-200' : entry.mood > 40 ? 'bg-blue-100/50 text-blue-700 border-blue-200' : 'bg-gray-100/50 text-gray-700 border-gray-200'}`}>
                    {entry.mood > 80 ? '😆 开心' : entry.mood > 40 ? '🙂 平静' : '😔 低落'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium line-clamp-3">{entry.content}</p>
                {entry.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden shadow-md h-32 relative">
                     <img src={entry.image} alt="Diary" className="w-full h-full object-cover" />
                     <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                )}
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BookIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);