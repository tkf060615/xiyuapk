import React, { useState, useRef } from 'react';
import { useApp } from '../context';
import { JournalEntry } from '../types';
import { Plus, Smile, Camera, X } from 'lucide-react';

export const Journal = () => {
  const { journal, addJournalEntry } = useApp();
  const [isWriting, setIsWriting] = useState(false);
  
  // New Entry State
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(50);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const saveEntry = () => {
    if (!content.trim()) return;
    
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      content,
      mood,
      image: image || undefined,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString('zh-CN'),
    };
    
    addJournalEntry(newEntry);
    setIsWriting(false);
    resetForm();
  };

  const resetForm = () => {
    setContent('');
    setMood(50);
    setImage(null);
  };

  if (isWriting) {
    return (
      <div className="h-full flex flex-col p-6 animate-fade-in glass-panel m-4 rounded-[2rem] shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setIsWriting(false)} className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
          <span className="font-bold text-lg dark:text-white">写日记</span>
          <button onClick={saveEntry} className="bg-primary text-white px-4 py-1.5 rounded-full font-bold shadow-lg shadow-primary/30">
            发布
          </button>
        </div>

        <textarea 
          className="w-full flex-1 bg-transparent text-lg resize-none outline-none dark:text-white placeholder-gray-400 p-2"
          placeholder="今天发生了什么有趣的事？..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
        />

        {image && (
          <div className="mb-4 relative rounded-2xl overflow-hidden shadow-lg h-40 group">
            <img src={image} alt="Upload" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white backdrop-blur-sm">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="glass-card p-4 rounded-xl flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300 text-sm flex items-center gap-2 font-bold">
              <Smile size={20} className="text-yellow-500" /> 心情: {mood}
            </span>
            <input 
              type="range" 
              min="0" max="100" 
              value={mood} 
              onChange={(e) => setMood(Number(e.target.value))}
              className="w-32 accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
            />
          </div>

          <div className="flex gap-4">
            <button onClick={() => fileInputRef.current?.click()} className="p-3 glass-card rounded-xl text-primary flex items-center gap-2 font-bold w-full justify-center active:scale-95 transition-transform">
              <Camera size={20} /> 添加图片
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6">
      <div className="flex justify-between items-end mb-8 pt-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">日记</h1>
           <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium">记录每一份感动</p>
        </div>
        <button 
          onClick={() => setIsWriting(true)}
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
               className="glass-card p-6 rounded-[2rem] hover:shadow-xl transition-shadow animate-fade-in"
               style={{ animationDelay: `${idx * 100}ms` }}
             >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-gray-800 dark:text-gray-100">{entry.dateStr.split('/')[2] || 'Today'}</span>
                    <span className="text-xs text-gray-400 font-bold">{entry.dateStr}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${entry.mood > 80 ? 'bg-green-100/50 text-green-700 border-green-200' : entry.mood > 40 ? 'bg-blue-100/50 text-blue-700 border-blue-200' : 'bg-gray-100/50 text-gray-700 border-gray-200'}`}>
                    {entry.mood > 80 ? '😆 开心' : entry.mood > 40 ? '🙂 平静' : '😔 低落'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">{entry.content}</p>
                {entry.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden shadow-md">
                     <img src={entry.image} alt="Diary" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
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