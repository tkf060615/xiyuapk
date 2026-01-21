import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { THEME_COLORS } from '../data';
import { ChevronLeft, Moon, Sun, Monitor, Camera, Save, User, Trash2 } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, user, updateUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for profile editing within settings
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    bio: '',
    gender: 'male' as 'male' | 'female' | 'other',
  });

  // Sync with current user data on load
  useEffect(() => {
    setProfileForm({
      nickname: user.nickname,
      bio: user.bio,
      gender: user.gender,
    });
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfileSettings = () => {
    updateUser({
      nickname: profileForm.nickname,
      bio: profileForm.bio,
      gender: profileForm.gender,
    });
    // Visual feedback
    const btn = document.getElementById('save-btn');
    if (btn) {
       const originalText = btn.innerText;
       btn.innerText = '已保存!';
       setTimeout(() => btn.innerText = originalText, 2000);
    }
  };

  const clearData = () => {
    if (confirm('确定要清除所有本地数据吗？这将重置您的等级、日记和设置。此操作无法撤销。')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-full pb-10">
      <div className="p-4 flex items-center sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">设置</h1>
      </div>

      <div className="p-6 space-y-8 animate-fade-in">

        {/* Account Settings */}
        <section className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-2 mb-6">
             <div className="bg-primary/10 p-2 rounded-lg text-primary"><User size={20} /></div>
             <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">个人资料设置</h3>
          </div>
          
          <div className="flex items-start gap-4 mb-6">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/50 shadow-md bg-gray-200">
                 <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
               </div>
               <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Camera size={20} className="text-white" />
               </div>
               <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
             </div>
             
             <div className="flex-1 space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 ml-1">昵称</label>
                  <input 
                     type="text" 
                     value={profileForm.nickname}
                     onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                     placeholder="你的昵称"
                     className="w-full bg-white/50 dark:bg-black/20 border border-white/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex bg-white/50 dark:bg-black/20 p-1 rounded-xl border border-white/40">
                    {[
                      { id: 'male', label: '♂ 男' },
                      { id: 'female', label: '♀ 女' },
                      { id: 'other', label: '⚪ 其他' }
                    ].map(g => (
                      <button
                        key={g.id}
                        onClick={() => setProfileForm({...profileForm, gender: g.id as any})}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${profileForm.gender === g.id ? 'bg-white shadow text-primary' : 'text-gray-400 hover:text-gray-500'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                 </div>
             </div>
          </div>
          
          <div className="mb-6">
             <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">个人简介</label>
             <textarea 
               rows={3}
               value={profileForm.bio}
               onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
               placeholder="写一句话介绍自己..."
               className="w-full bg-white/50 dark:bg-black/20 border border-white/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-800 dark:text-white resize-none"
             />
           </div>

           <button 
             id="save-btn"
             onClick={saveProfileSettings}
             className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             <Save size={18} /> 保存资料修改
           </button>
        </section>
        
        {/* Theme Color */}
        <section className="glass-panel p-6 rounded-3xl">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">主题色调</h3>
          <div className="flex gap-4 flex-wrap justify-between">
            {THEME_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => updateSettings({ themeColor: c.hex })}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 ${settings.themeColor === c.hex ? 'ring-4 ring-offset-2 ring-white/50 dark:ring-white/20 scale-110' : 'opacity-80'}`}
                style={{ backgroundColor: c.hex }}
              >
                {settings.themeColor === c.hex && <div className="w-4 h-4 bg-white rounded-full shadow-sm" />}
              </button>
            ))}
          </div>
        </section>

        {/* Dark Mode */}
        <section className="glass-panel p-6 rounded-3xl">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">显示模式</h3>
          <div className="bg-gray-100 dark:bg-black/20 p-1.5 rounded-2xl flex relative">
             <div 
               className="absolute top-1.5 bottom-1.5 w-[31%] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 ease-in-out"
               style={{ 
                 left: settings.darkMode === 'light' ? '1.5%' : settings.darkMode === 'dark' ? '34.5%' : '67.5%' 
               }}
             />
             <button onClick={() => updateSettings({ darkMode: 'light' })} className={`flex-1 relative z-10 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'light' ? 'text-primary' : 'text-gray-400'}`}>
                <Sun size={20} /> <span className="text-[10px] font-bold">浅色</span>
             </button>
             <button onClick={() => updateSettings({ darkMode: 'dark' })} className={`flex-1 relative z-10 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'dark' ? 'text-primary' : 'text-gray-400'}`}>
                <Moon size={20} /> <span className="text-[10px] font-bold">深色</span>
             </button>
             <button onClick={() => updateSettings({ darkMode: 'system' })} className={`flex-1 relative z-10 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'system' ? 'text-primary' : 'text-gray-400'}`}>
                <Monitor size={20} /> <span className="text-[10px] font-bold">跟随系统</span>
             </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pt-4">
           <button 
             onClick={clearData}
             className="w-full py-3 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
           >
             <Trash2 size={16} /> 清除所有数据 (重置应用)
           </button>
           <p className="text-center text-xs text-gray-400 mt-2">EnergyUp v1.0.0</p>
        </section>

      </div>
    </div>
  );
};