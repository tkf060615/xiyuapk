
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Settings, Camera, Edit2, Medal, Lock, Zap, Book, Gamepad2, X, Save, User as UserIcon, Heart, Quote, Trash2, Activity, Calendar, BarChart2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { ACHIEVEMENTS, INITIAL_QUOTES } from '../data';

export const Profile = () => {
  const { user, updateUser, favorites, toggleFavorite, journal } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'favorites'>('achievements');
  
  // View Date for Calendars
  const [viewDate, setViewDate] = useState(new Date());
  const [checkInViewDate, setCheckInViewDate] = useState(new Date());
  
  // Mood Chart State
  const [chartRange, setChartRange] = useState<'week' | 'month' | 'year'>('week');

  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    gender: 'male' as 'male' | 'female' | 'other',
    avatar: ''
  });

  useEffect(() => {
    if (isEditing) {
      setEditForm({
        nickname: user.nickname,
        bio: user.bio,
        gender: user.gender,
        avatar: user.avatar
      });
    }
  }, [isEditing, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEditMode) {
          setEditForm(prev => ({ ...prev, avatar: result }));
        } else {
          updateUser({ avatar: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    updateUser({
      nickname: editForm.nickname,
      bio: editForm.bio,
      gender: editForm.gender,
      avatar: editForm.avatar
    });
    setIsEditing(false);
  };

  const xpPercentage = Math.min(100, (user.exp / user.nextLevelExp) * 100);
  
  // Resolve favorite quotes
  const favoriteQuotes = INITIAL_QUOTES.filter(q => favorites.includes(q.id));

  // --- CALENDAR LOGIC HELPER ---
  const getCalendarMeta = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { year, month, daysInMonth, firstDayOfMonth };
  };

  // --- MOOD CALENDAR LOGIC ---
  const handlePrevMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const moodCalendarData = useMemo(() => {
    const { year, month, daysInMonth, firstDayOfMonth } = getCalendarMeta(viewDate);
    const dayMoods: Record<number, { sum: number, count: number }> = {};
    
    journal.forEach(entry => {
      const d = new Date(entry.timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!dayMoods[day]) dayMoods[day] = { sum: 0, count: 0 };
        dayMoods[day].sum += entry.mood;
        dayMoods[day].count += 1;
      }
    });

    return { year, month, daysInMonth, firstDayOfMonth, dayMoods };
  }, [journal, viewDate]);

  // --- CHECK-IN CALENDAR LOGIC ---
  const checkInCalendarData = useMemo(() => {
    const { year, month, daysInMonth, firstDayOfMonth } = getCalendarMeta(checkInViewDate);
    const history = user.stats.checkInHistory || [];
    
    const checkedDays = history.filter(dStr => {
      const parts = dStr.split('/');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      return y === year && (m - 1) === month;
    }).map(dStr => parseInt(dStr.split('/')[2]));

    return { year, month, daysInMonth, firstDayOfMonth, checkedDays };
  }, [user.stats.checkInHistory, checkInViewDate]);

  const handlePrevCheckInMonth = () => {
    setCheckInViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextCheckInMonth = () => {
    setCheckInViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const getMoodEmoji = (avg: number) => {
    if (avg > 80) return '😆';
    if (avg > 50) return '🙂';
    if (avg > 0) return '😔';
    return null;
  };

  const getMoodColor = (avg: number) => {
    if (avg > 80) return 'bg-green-100 dark:bg-green-900/30 text-green-600';
    if (avg > 50) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
    if (avg > 0) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
    return 'bg-gray-50 dark:bg-gray-800/50 text-gray-300';
  };

  // --- MOOD CHART LOGIC ---
  const chartData = useMemo(() => {
    const now = new Date();
    const dataPoints: { label: string, value: number, date: string }[] = [];
    const count = chartRange === 'week' ? 7 : chartRange === 'month' ? 30 : 12;

    const formatDateKey = (d: Date) => d.toLocaleDateString('zh-CN');
    const formatMonthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}`;

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      let label = '';
      let key = '';

      if (chartRange === 'year') {
        d.setMonth(now.getMonth() - i);
        label = `${d.getMonth() + 1}月`;
        key = formatMonthKey(d);
      } else {
        d.setDate(now.getDate() - i);
        label = chartRange === 'week' ? ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()] : `${d.getDate()}日`;
        key = formatDateKey(d);
      }
      
      dataPoints.push({ label, value: 0, date: key });
    }

    const pointMap = new Map(); 
    dataPoints.forEach((p, index) => pointMap.set(p.date, { ...p, index, sum: 0, count: 0 }));

    journal.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      let key = '';
      if (chartRange === 'year') {
        key = formatMonthKey(entryDate);
      } else {
        key = formatDateKey(entryDate);
      }

      if (pointMap.has(key)) {
        const p = pointMap.get(key);
        p.sum += entry.mood;
        p.count += 1;
      }
    });

    return dataPoints.map(p => {
        const mapData = pointMap.get(p.date);
        return {
            label: p.label,
            value: mapData.count > 0 ? Math.round(mapData.sum / mapData.count) : 0
        };
    });
  }, [journal, chartRange]);

  const renderChart = () => {
    if (!chartData || chartData.length === 0) return null;

    const width = 1000;
    const height = 300;
    const paddingLeft = 80; // 增加左边距容纳 Y 轴刻度
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 40;
    const availableWidth = width - paddingLeft - paddingRight;
    const availableHeight = height - paddingTop - paddingBottom;

    const points = chartData.map((d, i) => {
        const x = paddingLeft + (i / (chartData.length - 1)) * availableWidth;
        const y = paddingTop + availableHeight - (d.value / 100) * availableHeight;
        return { x, y, value: d.value, label: d.label };
    });

    const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaD = `${pathD} L ${points[points.length-1].x} ${paddingTop + availableHeight} L ${points[0].x} ${paddingTop + availableHeight} Z`;

    return (
        <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
            <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                </linearGradient>
            </defs>
            
            {/* 网格线 & Y 轴刻度 (纵向刻度) */}
            <g>
                {[0, 25, 50, 75, 100].map(val => {
                    const y = paddingTop + availableHeight - (val / 100) * availableHeight;
                    return (
                        <React.Fragment key={val}>
                            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="gray" strokeOpacity="0.1" strokeDasharray="5,5" />
                            <text x={paddingLeft - 15} y={y} dy="0.32em" textAnchor="end" fill="gray" fontSize="22" fontWeight="bold" opacity="0.6">
                                {val}
                            </text>
                        </React.Fragment>
                    );
                })}
            </g>

            {/* 渐变填充 */}
            <path d={areaD} fill="url(#chartGradient)" />
            
            {/* 曲线 */}
            <path d={pathD} fill="none" stroke="var(--primary-color)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* 数据点 & X 轴标签 (横向标签) */}
            {points.map((p, i) => (
                <g key={i}>
                    {p.value > 0 && (
                        <circle cx={p.x} cy={p.y} r="8" fill="white" stroke="var(--primary-color)" strokeWidth="4" />
                    )}
                    {(chartRange === 'week' || chartRange === 'year' || i % 5 === 0 || i === points.length - 1) && (
                        <text 
                            x={p.x} 
                            y={height} 
                            textAnchor="middle" 
                            fill="gray" 
                            fontSize="24" 
                            fontWeight="bold"
                            style={{ opacity: 0.7 }}
                        >
                            {p.label}
                        </text>
                    )}
                </g>
            ))}
        </svg>
    );
  };

  return (
    <div className="min-h-full pb-10">
      {/* Glass Header */}
      <div className="relative h-64 overflow-hidden rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-red-400 to-orange-300 opacity-90"></div>
        <div className="absolute top-[-50%] left-[-20%] w-[150%] h-[200%] bg-white/10 rotate-12 blur-3xl rounded-[40%]"></div>
        
        <div className="absolute top-0 w-full p-6 flex justify-end pt-8">
           <button 
             onClick={() => navigate('/settings')}
             className="bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition-colors border border-white/20 shadow-lg"
           >
             <Settings size={22} />
           </button>
        </div>
      </div>

      {/* Floating User Card */}
      <div className="px-6 -mt-24 relative z-10">
        <div className="glass-panel rounded-[2rem] p-6 flex flex-col items-center animate-fade-in relative group">
          
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
          >
            <Edit2 size={18} />
          </button>

          <div className="relative -mt-16 mb-4">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden bg-gray-200 shadow-2xl">
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800 active:scale-90 transition-transform"
            >
              <Camera size={14} />
            </button>
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => handleAvatarChange(e, false)} />
          </div>

          <div className="text-center w-full mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2 mb-1">
              {user.nickname}
              {user.gender === 'male' && <span className="text-blue-500 text-lg">♂</span>}
              {user.gender === 'female' && <span className="text-pink-500 text-lg">♀</span>}
            </h2>
            <p className="text-gray-500 text-sm mb-4 max-w-[200px] truncate mx-auto">{user.bio}</p>

            {/* Level & XP Bar */}
            <div className="w-full max-w-xs mx-auto bg-gray-100 dark:bg-gray-700/50 p-3 rounded-2xl border border-white/50 dark:border-white/5">
               <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                 <span className="text-primary">Lv.{user.level}</span>
                 <span>{user.exp} / {user.nextLevelExp} XP</span>
               </div>
               <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden shadow-inner">
                 <div 
                    className="h-full bg-gradient-to-r from-primary to-orange-400 shadow-lg"
                    style={{ width: `${xpPercentage}%` }}
                 />
               </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex w-full justify-between gap-2">
             <button 
                onClick={() => setShowCheckInCalendar(true)}
                className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center active:scale-95 transition-transform"
             >
                <Zap size={18} className="text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalCheckIns}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">累计打卡</span>
             </button>
             <button 
                onClick={() => navigate('/journal')}
                className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center active:scale-95 transition-transform"
             >
                <Book size={18} className="text-blue-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalJournalEntries}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">日记</span>
             </button>
             <button 
                onClick={() => navigate('/games')}
                className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center active:scale-95 transition-transform"
             >
                <Gamepad2 size={18} className="text-green-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalGamesPlayed}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">游戏</span>
             </button>
          </div>
        </div>
      </div>

      {/* --- MOOD CALENDAR SECTION --- */}
      <div className="px-6 mt-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
         <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold">
                    <Calendar size={20} className="text-primary" />
                    <span>心情日历</span>
                </div>
                
                {/* Month Controller */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 rounded-xl px-2 py-1 gap-3">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-1 hover:text-primary transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 min-w-[70px] text-center">
                        {moodCalendarData.year}年{moodCalendarData.month + 1}月
                    </span>
                    <button 
                        onClick={handleNextMonth}
                        className="p-1 hover:text-primary transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
                {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                    <div key={w} className="text-[10px] font-bold text-gray-400 mb-2">{w}</div>
                ))}
                
                {/* Empty slots for first week */}
                {Array.from({ length: moodCalendarData.firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Days of the month */}
                {Array.from({ length: moodCalendarData.daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const mood = moodCalendarData.dayMoods[day];
                    const avg = mood ? mood.sum / mood.count : 0;
                    const emoji = getMoodEmoji(avg);

                    return (
                        <div key={day} className="flex flex-col items-center">
                            <div 
                                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${getMoodColor(avg)}`}
                                title={mood ? `当日心情平均分: ${Math.round(avg)}` : '无记录'}
                            >
                                {emoji ? (
                                    <span className="text-sm">{emoji}</span>
                                ) : (
                                    <span className="text-[10px] font-medium opacity-50">{day}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex justify-center gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    <span className="text-[10px] text-gray-400 font-medium">优秀</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                    <span className="text-[10px] text-gray-400 font-medium">良好</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                    <span className="text-[10px] text-gray-400 font-medium">波动</span>
                </div>
            </div>
         </div>
      </div>

      {/* --- MOOD CHART SECTION --- */}
      <div className="px-6 mt-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
         <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-gray-800 dark:text-white font-bold">
                    <Activity size={20} className="text-primary" />
                    <span>心情曲线</span>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    {(['week', 'month', 'year'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setChartRange(r)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                chartRange === r 
                                ? 'bg-white text-primary shadow-sm' 
                                : 'text-gray-400 hover:text-gray-500'
                            }`}
                        >
                            {r === 'week' ? '周' : r === 'month' ? '月' : '年'}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="w-full h-48 px-2">
                {renderChart()}
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="mx-6 mt-6 p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl flex relative shadow-inner">
         <div 
           className={`absolute top-1 bottom-1 w-[48%] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 ease-in-out ${activeTab === 'favorites' ? 'translate-x-[100%] left-1.5' : 'left-1'}`}
         />
         <button onClick={() => setActiveTab('achievements')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'achievements' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
           <Medal size={16} /> 成就
         </button>
         <button onClick={() => setActiveTab('favorites')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2 ${activeTab === 'favorites' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>
           <Heart size={16} className={activeTab === 'favorites' ? 'fill-red-500 text-red-500' : ''} /> 收藏
         </button>
      </div>

      {/* Tab Content */}
      <div className="px-6 mt-6">
        {activeTab === 'achievements' ? (
          <div>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">我的勋章</h3>
              <span className="text-xs text-gray-400 bg-white/50 px-2 py-1 rounded-full">
                {user.unlockedAchievements.length} / {ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {ACHIEVEMENTS.map((ach) => {
                const isUnlocked = user.unlockedAchievements.includes(ach.id);
                return (
                  <div 
                    key={ach.id} 
                    className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                      isUnlocked 
                        ? 'glass-card border-yellow-200/50 shadow-lg shadow-yellow-500/10' 
                        : 'bg-gray-100/50 dark:bg-gray-800/30 border border-transparent opacity-60 grayscale'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-3 shadow-md ${isUnlocked ? 'bg-gradient-to-br from-yellow-100 to-yellow-50' : 'bg-gray-200'}`}>
                      {isUnlocked ? ach.icon : <Lock size={20} className="text-gray-400" />}
                    </div>
                    <h4 className="font-bold text-xs text-center text-gray-800 dark:text-gray-200">{ach.title}</h4>
                    <p className="text-[10px] text-gray-400 text-center mt-1 leading-tight scale-90">{ach.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
             <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">语录收藏夹</h3>
              <span className="text-xs text-gray-400 bg-white/50 px-2 py-1 rounded-full">
                {favoriteQuotes.length} 条
              </span>
            </div>
            
            {favoriteQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 glass-panel rounded-3xl border-dashed border-2 border-gray-300/50">
                 <Quote size={40} className="mb-2 opacity-50" />
                 <p className="text-sm">暂无收藏</p>
                 <p className="text-xs mt-1">去首页发现更多正能量吧</p>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                {favoriteQuotes.map((quote) => (
                  <div key={quote.id} className="glass-card p-5 rounded-2xl relative group hover:-translate-y-1 transition-transform">
                     <Quote size={24} className="text-primary/20 absolute top-4 left-4" />
                     <p className="text-gray-800 dark:text-gray-200 font-medium mb-3 pl-6 leading-relaxed">
                        {quote.content}
                     </p>
                     <div className="flex justify-between items-center pl-6">
                        <p className="text-sm font-bold text-primary">—— {quote.author}</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(quote.id); }}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-full opacity-80 hover:opacity-100 transition-all active:scale-90"
                          title="取消收藏"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHECK-IN CALENDAR MODAL */}
      {showCheckInCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-fade-in">
           <div className="glass-panel w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative flex flex-col">
              <button onClick={() => setShowCheckInCalendar(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                 <X size={24} />
              </button>
              
              <div className="flex items-center gap-2 mb-6 text-gray-800 dark:text-white font-bold">
                  <Zap size={22} className="text-yellow-500" />
                  <span className="text-xl">累计打卡</span>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">总计打卡</p>
                    <p className="text-3xl font-black text-primary">{user.stats.totalCheckIns}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">当前连续</p>
                    <p className="text-2xl font-black text-yellow-500">{user.stats.loginStreak}天</p>
                  </div>
              </div>

              {/* Check-in Calendar Month Controller */}
              <div className="flex justify-between items-center mb-6 px-1">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    {checkInCalendarData.year}年{checkInCalendarData.month + 1}月
                  </span>
                  <div className="flex gap-2">
                    <button onClick={handlePrevCheckInMonth} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:text-primary transition-colors active:scale-90">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={handleNextCheckInMonth} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:text-primary transition-colors active:scale-90">
                      <ChevronRight size={16} />
                    </button>
                  </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-4">
                  {['日', '一', '二', '三', '四', '五', '六'].map(w => (
                      <div key={w} className="text-[10px] font-bold text-gray-400 mb-2">{w}</div>
                  ))}
                  {Array.from({ length: checkInCalendarData.firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  {Array.from({ length: checkInCalendarData.daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isChecked = checkInCalendarData.checkedDays.includes(day);
                      return (
                          <div key={day} className="aspect-square flex items-center justify-center">
                              <div className={`
                                w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all border
                                ${isChecked 
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 scale-110 z-10' 
                                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-100/50 dark:border-slate-700/30'
                                }
                              `}>
                                 {isChecked ? <Check size={16} strokeWidth={4} /> : day}
                              </div>
                          </div>
                      );
                  })}
              </div>

              <button 
                onClick={() => setShowCheckInCalendar(false)}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 mt-2 active:scale-95 transition-transform"
              >
                我知道了
              </button>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
            <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
               <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
              <Edit2 size={20} className="text-primary" /> 编辑资料
            </h3>

            <div className="space-y-4">
               {/* Avatar Edit */}
               <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/50 shadow-lg">
                      <img src={editForm.avatar} className="w-full h-full object-cover" alt="Avatar" />
                    </div>
                    <button 
                      onClick={() => editFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera size={14} />
                    </button>
                    <input type="file" ref={editFileInputRef} hidden accept="image/*" onChange={(e) => handleAvatarChange(e, true)} />
                  </div>
               </div>

               {/* Inputs */}
               <div>
                 <label className="text-xs font-bold text-gray-500 ml-1">昵称</label>
                 <input 
                   type="text" 
                   value={editForm.nickname}
                   onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
                   className="w-full bg-white/50 dark:bg-black/20 border border-white/40 rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-white font-medium"
                 />
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 ml-1">性别</label>
                 <div className="flex bg-white/50 dark:bg-black/20 p-1 rounded-xl mt-1 border border-white/40">
                    {[
                      { id: 'male', label: '♂ 男' },
                      { id: 'female', label: '♀ 女' },
                      { id: 'other', label: '⚪ 其他' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setEditForm({...editForm, gender: g.id as any})}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${editForm.gender === g.id ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-500'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                 </div>
               </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 ml-1">个人介绍</label>
                 <textarea 
                   rows={3}
                   value={editForm.bio}
                   onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                   className="w-full bg-white/50 dark:bg-black/20 border border-white/40 rounded-xl px-4 py-3 mt-1 outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-white font-medium resize-none"
                 />
               </div>

               <button 
                 onClick={saveProfile}
                 className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 mt-4 active:scale-95 transition-transform flex items-center justify-center gap-2"
               >
                 <Save size={18} /> 保存修改
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
