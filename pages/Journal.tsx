
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context';
import { JournalEntry } from '../types';
import { 
  Plus, Smile, Camera, X, Trash2, Edit2, Calendar, MapPin, 
  Loader2, ImageIcon, Navigation, Share2, Sparkles, Mic, StopCircle, 
  Play, Pause, Volume2 
} from 'lucide-react';
import html2canvas from 'html2canvas';

export const Journal = () => {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry, user } = useApp();
  const [isWriting, setIsWriting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form State
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(50);
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  // Audio Playback State (for detail view)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sharing State
  const [isSharing, setIsSharing] = useState(false);
  const shareJournalRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && selectedEntry) {
      setContent(selectedEntry.content);
      setMood(selectedEntry.mood);
      setImage(selectedEntry.image || null);
      setAudio(selectedEntry.audio || null);
      setLocation(selectedEntry.location || null);
    } else if (isWriting && !editingId) {
      resetForm();
    }
  }, [isWriting, editingId, selectedEntry]);

  // Handle Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudio(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("无法访问麦克风，请检查权限设置");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // 重置 input 值，允许重复上传同一张图
    e.target.value = '';
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
        let msg = "无法获取位置信息";
        if (err.code === 1) msg = "请允许获取位置权限";
        alert(msg);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const saveEntry = () => {
    if (!content.trim() && !image && !audio) return;
    
    if (editingId && selectedEntry) {
      const updatedEntry: JournalEntry = {
        ...selectedEntry,
        content,
        mood,
        image: image || undefined,
        audio: audio || undefined,
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
        audio: audio || undefined,
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

  const toggleAudioPlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
    } else {
      audioPlayerRef.current.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
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
            await navigator.share({ files: [file], title: '我的日记分享', text: '来自 EnergyUp 的生活记录' });
          } catch (e) {}
        } else {
           const link = document.createElement('a');
           link.href = URL.createObjectURL(blob);
           link.download = 'energy_journal.png';
           link.click();
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (e) {
      setIsSharing(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setMood(50);
    setImage(null);
    setAudio(null);
    setLocation(null);
    setEditingId(null);
    setIsRecording(false);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const formatRecordTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  // --- WRITE / EDIT MODE ---
  if (isWriting) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col p-6 animate-fade-in bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
        <div className="flex justify-between items-center mb-6 shrink-0 pt-4">
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
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white backdrop-blur-md hover:bg-red-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
            )}
            
            {audio && (
              <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 px-4 py-3 rounded-2xl border border-orange-100 dark:border-orange-800 animate-fade-in">
                 <div className="flex items-center gap-3">
                    <Volume2 size={20} />
                    <span className="text-sm font-bold">语音备忘录已就绪</span>
                 </div>
                 <button onClick={() => setAudio(null)} className="p-1 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            )}
            
            {location && (
                <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-blue-100 dark:border-blue-800">
                    <MapPin size={16} className="fill-blue-500/20" />
                    {location}
                    <button onClick={() => setLocation(null)} className="ml-2 hover:text-red-500"><X size={14}/></button>
                </div>
            )}
        </div>

        {/* Recording Visualizer Overlay */}
        {isRecording && (
          <div className="fixed inset-x-0 bottom-40 mx-auto w-3/4 glass-panel p-6 rounded-3xl border-2 border-primary flex flex-col items-center gap-4 animate-pulse shadow-2xl z-50">
             <div className="flex items-center gap-1.5 h-8">
               {[...Array(8)].map((_, i) => (
                 <div key={i} className="w-1.5 bg-primary rounded-full animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i*0.1}s` }} />
               ))}
             </div>
             <div className="text-2xl font-mono font-bold text-gray-800 dark:text-white">{formatRecordTime(recordingTime)}</div>
             <button onClick={stopRecording} className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95">
               <StopCircle size={32} />
             </button>
             <p className="text-xs font-bold text-primary uppercase tracking-widest">正在录音...</p>
          </div>
        )}

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

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all border border-purple-100 dark:border-purple-800"
            >
              <ImageIcon size={20} /> 相册
            </button>
            <button 
              onClick={() => cameraInputRef.current?.click()} 
              className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all border border-orange-100 dark:border-orange-800"
            >
              <Camera size={20} /> 拍照
            </button>
            <button 
                onClick={startRecording}
                disabled={isRecording}
                className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all border border-red-100 dark:border-red-800"
            >
              <Mic size={20} /> {audio ? '重录' : '录音'}
            </button>
            <button 
                onClick={handleGetLocation} 
                disabled={isGettingLocation}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all border border-blue-100 dark:border-blue-800"
            >
              {isGettingLocation ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />} 
              定位
            </button>
          </div>
          {/* 这里是普通的相册选择 */}
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageUpload} />
          {/* 这里通过 capture 属性提示浏览器或系统强制调用相机，标准 Web 表现可能依浏览器而异 */}
          <input 
            type="file" 
            ref={cameraInputRef} 
            hidden 
            accept="image/*" 
            capture="environment" 
            onChange={handleImageUpload} 
          />
        </div>
      </div>
    );
  }

  // --- DETAIL VIEW MODE ---
  if (selectedEntry) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 overflow-y-auto animate-fade-in flex flex-col">
        {/* Detail Header */}
        <div className="sticky top-0 p-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800 pt-8">
           <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X size={24} className="text-gray-600 dark:text-gray-300" />
           </button>
           <div className="flex gap-2">
              <button onClick={handleShare} disabled={isSharing} className="p-2 rounded-full text-gray-500">
                 {isSharing ? <Loader2 size={20} className="animate-spin" /> : <Share2 size={20} />}
              </button>
              <button onClick={() => { setEditingId(selectedEntry.id); setIsWriting(true); }} className="p-2 rounded-full text-blue-500">
                 <Edit2 size={20} />
              </button>
              <button onClick={handleDelete} className="p-2 rounded-full text-red-500">
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
                    {selectedEntry.location && <span className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-md"><MapPin size={10} /> {selectedEntry.location}</span>}
                 </div>
              </div>
           </div>

           {selectedEntry.image && (
             <div className="w-full mb-8 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                <img src={selectedEntry.image} alt="Memory" className="w-full h-auto max-h-[50vh] object-cover" />
             </div>
           )}

           {selectedEntry.audio && (
              <div className="mb-8 glass-panel p-6 rounded-3xl flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
                 <div className="flex items-center gap-4">
                    <button 
                      onClick={toggleAudioPlayback}
                      className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      {isPlayingAudio ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">语音日记</p>
                      <p className="text-xs text-gray-500">点击播放记录的声音</p>
                    </div>
                 </div>
                 <audio 
                   ref={audioPlayerRef} 
                   src={selectedEntry.audio} 
                   onEnded={() => setIsPlayingAudio(false)} 
                   className="hidden" 
                 />
                 <Volume2 className="text-primary/40" size={24} />
              </div>
           )}

           <div className="glass-panel p-6 rounded-3xl shadow-sm min-h-[150px]">
             <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-serif">
                {selectedEntry.content || (selectedEntry.audio ? "这段语音记录了此时的心情..." : "无文字内容")}
             </p>
           </div>
        </div>

        {/* Share Card (Hidden) */}
        <div ref={shareJournalRef} id="share-card-journal" style={{ position: 'fixed', left: '-9999px', top: 0, width: '375px', minHeight: '500px' }} className="bg-[#f8f9fa] flex flex-col font-sans box-border">
           <div className="h-1.5 w-full bg-primary mb-6"></div>
           <div className="px-6 pb-8 flex-1 flex flex-col">
               <div className="flex items-center gap-3 mb-6 w-full">
                    <img src={user.avatar} crossOrigin="anonymous" className="w-10 h-10 rounded-full border border-gray-200" />
                    <div className="flex flex-col">
                        <h3 className="font-bold text-gray-800 text-sm">{user.nickname}</h3>
                        <span className="text-xs text-gray-400">{selectedEntry.dateStr}</span>
                    </div>
                    {selectedEntry.audio && <div className="ml-auto text-primary"><Mic size={16} /></div>}
               </div>
               {selectedEntry.image && (
                    <div className="w-full h-56 rounded-xl overflow-hidden mb-6 shadow-sm border border-gray-100">
                        <img src={selectedEntry.image} crossOrigin="anonymous" className="w-full h-full object-cover" />
                    </div>
               )}
               <div className="mb-8">
                   <p className="text-gray-700 leading-relaxed font-serif whitespace-pre-wrap text-base">
                     {selectedEntry.content || "一段珍贵的记录"}
                   </p>
               </div>
               <div className="mt-auto pt-6 border-t border-gray-200 flex justify-center items-center gap-2 opacity-70">
                   <Sparkles size={12} className="text-gray-500" />
                   <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">EnergyUp Journal</span>
               </div>
           </div>
        </div>
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-full flex flex-col">
      {/* 统一标题栏 */}
      <div className="px-6 pt-10 pb-4 flex justify-between items-end shrink-0">
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

      <div className="px-6 flex-1">
        {journal.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
            <p className="font-medium">还没有日记，快去写一篇吧~</p>
          </div>
        ) : (
          <div className="space-y-6 pb-24">
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
                          {entry.location && <span className="text-[10px] text-blue-400 flex items-center gap-0.5 bg-blue-50 px-1.5 py-0.5 rounded"><MapPin size={10} />{entry.location}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {entry.audio && <Mic size={14} className="text-primary animate-pulse" />}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${entry.mood > 80 ? 'bg-green-100/50 text-green-700 border-green-200' : entry.mood > 40 ? 'bg-blue-100/50 text-blue-700 border-blue-200' : 'bg-gray-100/50 text-gray-700 border-gray-200'}`}>
                        {entry.mood > 80 ? '😆 开心' : entry.mood > 40 ? '🙂 平静' : '😔 低落'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium line-clamp-3">
                      {entry.content || (entry.audio ? "语音日记" : "")}
                  </p>
                  {entry.image && (
                    <div className="mt-4 rounded-2xl overflow-hidden shadow-md h-32 relative">
                       <img src={entry.image} alt="Diary" className="w-full h-full object-cover" />
                    </div>
                  )}
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
