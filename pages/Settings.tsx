
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { THEME_COLORS } from '../data';
import { 
  ChevronLeft, Moon, Sun, Monitor, Camera, Save, User, Trash2, 
  ShieldCheck, MapPin, Mic, FolderOpen, CheckCircle2, AlertCircle, RefreshCw, Palette,
  ChevronRight, Info, Eye, Zap, AlertTriangle
} from 'lucide-react';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'checking';
type SettingsView = 'menu' | 'profile' | 'theme' | 'display' | 'permissions' | 'about';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, user, updateUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  const [clearStep, setClearStep] = useState(0); // 0: initial, 1: confirming

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    bio: '',
    gender: 'male' as 'male' | 'female' | 'other',
  });

  // Permissions State
  const [permissions, setPermissions] = useState<Record<string, PermissionStatus>>({
    location: 'checking',
    camera: 'checking',
    microphone: 'checking',
    storage: 'checking'
  });

  // Sync with current user data on load
  useEffect(() => {
    setProfileForm({
      nickname: user.nickname,
      bio: user.bio,
      gender: user.gender,
    });
    checkAllPermissions();
  }, [user]);

  const checkPermission = async (name: PermissionName): Promise<PermissionStatus> => {
    try {
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch (e) {
      return 'prompt';
    }
  };

  const checkAllPermissions = async () => {
    const loc = await checkPermission('geolocation' as PermissionName);
    const cam = await checkPermission('camera' as PermissionName);
    const mic = await checkPermission('microphone' as PermissionName);
    
    setPermissions({
      location: loc,
      camera: cam,
      microphone: mic,
      storage: 'prompt' 
    });
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      () => { setPermissions(prev => ({ ...prev, location: 'granted' })); },
      () => { setPermissions(prev => ({ ...prev, location: 'denied' })); }
    );
  };

  const requestMedia = async (type: 'camera' | 'microphone') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: type === 'camera', 
        audio: type === 'microphone' 
      });
      stream.getTracks().forEach(track => track.stop());
      setPermissions(prev => ({ ...prev, [type]: 'granted' }));
    } catch (err) {
      setPermissions(prev => ({ ...prev, [type]: 'denied' }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
        setPermissions(prev => ({ ...prev, storage: 'granted' }));
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
    alert('保存成功！');
  };

  const handleClearData = () => {
    if (clearStep === 0) {
      setClearStep(1);
      // 3秒后自动重置确认状态
      setTimeout(() => setClearStep(0), 3000);
    } else {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleBack = () => {
    if (currentView === 'menu') {
      navigate(-1);
    } else {
      setCurrentView('menu');
      setClearStep(0); // 退出关于页面时重置确认状态
    }
  };

  const StatusBadge = ({ status }: { status: PermissionStatus }) => {
    if (status === 'granted') return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={10} /> 已授权
      </span>
    );
    if (status === 'denied') return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
        <AlertCircle size={10} /> 已拒绝
      </span>
    );
    if (status === 'checking') return (
        <span className="text-[10px] font-bold text-gray-400 animate-pulse">检测中...</span>
    );
    return (
      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
        待申请
      </span>
    );
  };

  const MenuItem = ({ icon: Icon, title, desc, onClick, colorClass = "text-gray-600 dark:text-gray-300", bgClass = "bg-gray-100 dark:bg-gray-800" }: any) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 mb-2 glass-panel rounded-2xl active:scale-[0.98] transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className={`${bgClass} ${colorClass} p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
          <p className="font-bold text-gray-800 dark:text-white text-base">{title}</p>
          <p className="text-xs text-gray-400 font-medium">{desc}</p>
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
    </button>
  );

  return (
    <div className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Dynamic Header */}
      <div className="p-4 flex items-center sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <button onClick={handleBack} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">
          {currentView === 'menu' ? '设置' : 
           currentView === 'profile' ? '个人资料' :
           currentView === 'theme' ? '应用主题' :
           currentView === 'display' ? '显示模式' :
           currentView === 'permissions' ? '系统权限' : '关于应用'}
        </h1>
      </div>

      <div className="flex-1 p-6 animate-fade-in overflow-y-auto no-scrollbar">
        {currentView === 'menu' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-3">账号与资料</h3>
              <MenuItem 
                icon={User} title="个人资料" desc="修改昵称、简介和头像" 
                onClick={() => setCurrentView('profile')} 
                colorClass="text-blue-500" bgClass="bg-blue-50 dark:bg-blue-900/20"
              />
            </section>

            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-3">界面外观</h3>
              <MenuItem 
                icon={Palette} title="主题色调" desc="20种精选色调同步光感背景" 
                onClick={() => setCurrentView('theme')} 
                colorClass="text-primary" bgClass="bg-primary/10"
              />
              <MenuItem 
                icon={Eye} title="显示模式" desc="深色模式与系统自适应" 
                onClick={() => setCurrentView('display')} 
                colorClass="text-purple-500" bgClass="bg-purple-50 dark:bg-purple-900/20"
              />
            </section>

            <section>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 mb-3">系统与安全</h3>
              <MenuItem 
                icon={ShieldCheck} title="系统权限" desc="地理位置、相机与文件访问" 
                onClick={() => setCurrentView('permissions')} 
                colorClass="text-green-500" bgClass="bg-green-50 dark:bg-green-900/20"
              />
              <MenuItem 
                icon={Info} title="关于应用" desc="版本信息与数据重置" 
                onClick={() => setCurrentView('about')} 
                colorClass="text-orange-500" bgClass="bg-orange-50 dark:bg-orange-900/20"
              />
            </section>
          </div>
        )}

        {/* --- DETAIL VIEWS --- */}

        {currentView === 'profile' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-8">
               <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl bg-gray-200">
                   <img src={user.avatar} className="w-full h-full object-cover" alt="avatar" />
                 </div>
                 <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                   <Camera size={16} />
                 </div>
                 <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange} />
               </div>
            </div>
            
            <div className="space-y-4">
              <div className="glass-panel p-4 rounded-2xl">
                <label className="text-xs font-bold text-gray-400 ml-1">昵称</label>
                <input 
                   type="text" 
                   value={profileForm.nickname}
                   onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})}
                   className="w-full bg-transparent border-none outline-none py-2 text-lg font-bold text-gray-800 dark:text-white"
                />
              </div>

              <div className="glass-panel p-4 rounded-2xl">
                <label className="text-xs font-bold text-gray-400 ml-1">性别</label>
                <div className="flex gap-2 mt-2">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setProfileForm({...profileForm, gender: g})}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${profileForm.gender === g ? 'bg-primary text-white border-primary shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-transparent hover:bg-gray-100'}`}
                      >
                        {g === 'male' ? '男 ♂' : g === 'female' ? '女 ♀' : '其他 ⚪'}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl">
                <label className="text-xs font-bold text-gray-400 ml-1 block mb-1">个人简介</label>
                <textarea 
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                  className="w-full bg-transparent border-none outline-none py-2 text-base text-gray-800 dark:text-white resize-none"
                />
              </div>

              <button 
                onClick={saveProfileSettings}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 active:scale-95 transition-all mt-6 flex items-center justify-center gap-2"
              >
                <Save size={20} /> 保存修改
              </button>
            </div>
          </div>
        )}

        {currentView === 'theme' && (
          <div className="space-y-8">
            <div className="glass-panel p-6 rounded-3xl">
              <div className="grid grid-cols-5 gap-3">
                {THEME_COLORS.map((c) => (
                  <div key={c.hex} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => updateSettings({ themeColor: c.hex })}
                      className={`w-12 h-12 rounded-2xl shadow-sm flex items-center justify-center transition-all duration-300 relative ${settings.themeColor === c.hex ? 'scale-110 shadow-xl ring-4 ring-primary/20' : 'hover:scale-105 active:scale-90'}`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {settings.themeColor === c.hex && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 bg-white/40 rounded-full backdrop-blur-md animate-pulse flex items-center justify-center text-white">
                                <CheckCircle2 size={12} />
                            </div>
                        </div>
                      )}
                    </button>
                    <span className={`text-[10px] font-bold truncate w-full text-center ${settings.themeColor === c.hex ? 'text-primary' : 'text-gray-400'}`}>
                      {c.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20">
               <div className="flex items-center gap-3 mb-3 text-primary">
                  <RefreshCw size={20} className="animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="font-bold">实时同步技术</span>
               </div>
               <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  您的选择将瞬间应用至全局：导航栏发光、页面背景呼吸灯效、按钮阴影及所有强调文本色。
               </p>
            </div>
          </div>
        )}

        {currentView === 'display' && (
          <div className="space-y-6">
            <div className="glass-panel p-2 rounded-3xl flex h-20 relative">
               <div 
                 className="absolute top-2 bottom-2 w-[31.5%] bg-primary text-white rounded-2xl shadow-lg transition-all duration-500 ease-out"
                 style={{ 
                   left: settings.darkMode === 'light' ? '1.5%' : settings.darkMode === 'dark' ? '34.25%' : '67%' 
                 }}
               />
               <button onClick={() => updateSettings({ darkMode: 'light' })} className={`flex-1 relative z-10 flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'light' ? 'text-white' : 'text-gray-400'}`}>
                  <Sun size={20} /> <span className="text-xs font-bold">浅色</span>
               </button>
               <button onClick={() => updateSettings({ darkMode: 'dark' })} className={`flex-1 relative z-10 flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'dark' ? 'text-white' : 'text-gray-400'}`}>
                  <Moon size={20} /> <span className="text-xs font-bold">深色</span>
               </button>
               <button onClick={() => updateSettings({ darkMode: 'system' })} className={`flex-1 relative z-10 flex flex-col items-center justify-center gap-1 transition-colors ${settings.darkMode === 'system' ? 'text-white' : 'text-gray-400'}`}>
                  <Monitor size={20} /> <span className="text-xs font-bold">跟随系统</span>
               </button>
            </div>

            <div className="p-6 glass-panel rounded-3xl flex items-center gap-4">
               <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-xl">
                  <Sun size={24} />
               </div>
               <div>
                  <h4 className="font-bold text-gray-800 dark:text-white">护眼建议</h4>
                  <p className="text-xs text-gray-400 font-medium">在光线不足的环境下，推荐开启深色模式以保护您的视力。</p>
               </div>
            </div>
          </div>
        )}

        {currentView === 'permissions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2 mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">权限列表</span>
              <button onClick={checkAllPermissions} className="text-xs text-primary font-bold flex items-center gap-1"><RefreshCw size={12}/> 刷新状态</button>
            </div>

            {[
              { id: 'location', title: '精准定位', desc: '用于日记位置标注', icon: MapPin, color: 'text-blue-500', bg: 'bg-blue-50', request: requestLocation },
              { id: 'camera', title: '相机权限', desc: '用于拍摄日记照片', icon: Camera, color: 'text-purple-500', bg: 'bg-purple-50', request: () => requestMedia('camera') },
              { id: 'microphone', title: '麦克风', desc: '用于录制语音日记', icon: Mic, color: 'text-red-500', bg: 'bg-red-50', request: () => requestMedia('microphone') },
              { id: 'storage', title: '文件与存储', desc: '用于读取相册图片', icon: FolderOpen, color: 'text-orange-500', bg: 'bg-orange-50', request: () => fileInputRef.current?.click() },
            ].map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${p.bg} dark:bg-opacity-10 flex items-center justify-center ${p.color}`}>
                    <p.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.title}</p>
                    <p className="text-[10px] text-gray-400">{p.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={permissions[p.id]} />
                  {permissions[p.id] !== 'granted' && (
                    <button onClick={p.request} className="text-xs font-black text-primary px-3 py-1 bg-primary/10 rounded-lg active:scale-90 transition-transform">申请</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {currentView === 'about' && (
          <div className="space-y-8">
            <div className="flex flex-col items-center py-6">
               <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 mb-4 animate-float">
                  <Zap size={40} fill="currentColor" />
               </div>
               <h2 className="text-2xl font-black text-gray-800 dark:text-white">EnergyUp</h2>
               <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mt-1">Version 1.2.0 • Android Edition</p>
            </div>

            <div className="glass-panel p-6 rounded-3xl space-y-4">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">开发者</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">Casper Tien</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">隐私政策</span>
                  <span className="text-primary font-bold">查看详情</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">检查更新</span>
                  <span className="text-green-500 font-bold">已是最新版本</span>
               </div>
            </div>

            <div className="pt-12 space-y-4">
              <button 
                onClick={handleClearData}
                className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border shadow-lg active:scale-95
                  ${clearStep === 0 
                    ? 'text-red-500 bg-red-50 hover:bg-red-100 border-red-100 dark:bg-red-900/10 dark:border-red-900/20' 
                    : 'text-white bg-red-600 border-red-600 animate-pulse'
                  }
                `}
              >
                {clearStep === 0 ? (
                  <><Trash2 size={16} /> 清除数据并重置应用</>
                ) : (
                  <><AlertTriangle size={18} /> 再次点击以确认 (不可撤销)</>
                )}
              </button>
              {clearStep === 1 && (
                <p className="text-center text-[10px] text-red-500 font-bold animate-fade-in">
                  注意：这将永久删除您的所有打卡记录、日记和等级进度。
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
