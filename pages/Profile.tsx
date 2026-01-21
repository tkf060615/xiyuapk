import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Settings, Camera, Edit2, Medal, Lock, Zap, Book, Gamepad2, X, Save, User as UserIcon, Heart, Quote, Trash2 } from 'lucide-react';
import { ACHIEVEMENTS, INITIAL_QUOTES } from '../data';

export const Profile = () => {
  const { user, updateUser, favorites, toggleFavorite } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'favorites'>('achievements');
  
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

  return (
    <div className="min-h-full pb-10">
      {/* Glass Header */}
      <div className="relative h-64 overflow-hidden rounded-b-[3rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-red-400 to-orange-300 opacity-90"></div>
        {/* Abstract shapes in header */}
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
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Zap size={18} className="text-yellow-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.loginStreak}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">连续登录</span>
             </div>
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Book size={18} className="text-blue-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalJournalEntries}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">日记</span>
             </div>
             <div className="flex-1 glass-card p-3 rounded-2xl flex flex-col items-center">
                <Gamepad2 size={18} className="text-green-500 mb-1" />
                <span className="text-lg font-bold text-gray-800 dark:text-white">{user.stats.totalGamesPlayed}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">游戏</span>
             </div>
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