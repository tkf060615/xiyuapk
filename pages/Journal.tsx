import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import { JournalEntry } from '../types';
import { Plus, Smile, Camera, X, Trash2, Edit2, Calendar } from 'lucide-react';

export const Journal = () => {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp();
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form State (used for both Create and Edit)
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(50);
  const [image, setImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // If set, we are editing this ID

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening write mode or editing
  useEffect(() => {
    if (editingId && selectedEntry) {
      setContent(selectedEntry.content);
      setMood(selectedEntry.mood);
      setImage(selectedEntry.image || null);
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

  const saveEntry = () => {
    if (!content.trim()) return;
    
    if (editingId && selectedEntry) {
      // Update existing
      const updatedEntry: JournalEntry = {
        ...selectedEntry,
        content,
        mood,
        image: image || undefined,
      };
      updateJournalEntry(updatedEntry);
      setSelectedEntry(updatedEntry); // Update view
      setEditingId(null);
      setIsWriting(false);
    } else {
      // Create new
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
    }
    resetForm();
  };

  const handleDelete = () => {
    if (selectedEntry && window.confirm("确定要删除这篇日记吗？")) {
      deleteJournalEntry(selectedEntry.id);
      setSelectedEntry(null);
    }
  };

  const resetForm = () => {
    setContent('');
    setMood(50);
    setImage(null);
    setEditingId(null);
  };

  // --- WRITE / EDIT MODE ---
  if (isWriting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col p-6 animate-fade-in bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => { setIsWriting(false); setEditingId(null); }} className="text-gray-500 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
          <span className="font-bold text-lg dark:text-white">{editingId ? '编辑日记' : '写日记'}</span>
          <button onClick={saveEntry} className="bg-primary text-white px-4 py-1.5 rounded-full font-bold shadow-lg shadow-primary/30">
            {editingId ? '保存' : '发布'}
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

        <div className="mt-4 space-y-4 pb-8">
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

  // --- DETAIL VIEW MODE ---
  if (selectedEntry) {
    return (
      <div className="fixed inset-0 z-40 bg-white dark:bg-gray-900 overflow-y-auto animate-fade-in flex flex-col">
        {/* Detail Header */}
        <div className="sticky top-0 p-4 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800">
           <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={24} className="text-gray-600 dark:text-gray-300" />
           </button>
           <div className="flex gap-2">
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
                 <p className="text-gray-500 text-sm">
                   {new Date(selectedEntry.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
                 </p>
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
                    <span className="text-xs text-gray-400 font-bold">{entry.dateStr}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${entry.mood > 80 ? 'bg-green-100/50 text-green-700 border-green-200' : entry.mood > 40 ? 'bg-blue-100/50 text-blue-700 border-blue-200' : 'bg-gray-100/50 text-gray-700 border-gray-200'}`}>
                    {entry.mood > 80 ? '😆 开心' : entry.mood > 40 ? '🙂 平静' : '😔 低落'}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium line-clamp-3">{entry.content}</p>
                {entry.image && (
                  <div className="mt-4 rounded-2xl overflow-hidden shadow-md">
                     <img src={entry.image} alt="Diary" className="w-full h-32 object-cover" />
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