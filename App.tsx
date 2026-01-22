
import React from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, Gamepad2, User, Flower2 } from 'lucide-react';
import { AppProvider } from './context';
import { Home } from './pages/Home';
import { Journal } from './pages/Journal';
import { Games } from './pages/Games';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { GameRunner } from './pages/GameRunner';
import { Meditation } from './pages/Meditation';

const DockItem = ({ icon: Icon, path, active }: { icon: any, path: string, active: boolean }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="relative flex flex-col items-center justify-center flex-1 h-full cursor-pointer touch-manipulation transition-all duration-300"
    >
      {/* 选中时的光效 (Backlight Glow) */}
      <div 
        className={`
          absolute inset-0 m-auto w-10 h-10 rounded-full blur-xl
          transition-all duration-700 ease-in-out pointer-events-none
          ${active ? 'opacity-60 scale-150 animate-pulse' : 'opacity-0 scale-0'}
        `}
        style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.5)' }}
      />

      {/* 图标容器 - 不再位移或突起 */}
      <div className={`
        relative z-10 flex items-center justify-center
        transition-all duration-500
        ${active ? 'text-primary scale-110' : 'text-gray-400 dark:text-gray-500'}
      `}>
         <Icon
           size={24}
           strokeWidth={active ? 2.5 : 2}
           className="transition-all duration-300"
         />
      </div>

      {/* 底部指示光条 */}
      <div className={`
        absolute bottom-2 w-6 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]
        transition-all duration-500 ease-out
        ${active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'}
      `} />
    </button>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  // 判断是否为子页面（全屏页面）
  const isSubPage = location.pathname.includes('/game/') || location.pathname === '/settings';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* 内容区域 */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${isSubPage ? 'pb-0' : 'pb-16'}`}>
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>

      {/* 底部通栏 Dock - 不再悬浮 */}
      {!isSubPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 w-full flex justify-around items-center px-4 backdrop-blur-2xl bg-white/70 dark:bg-black/60 border-t border-white/20 dark:border-white/5 animate-fade-in shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <DockItem icon={HomeIcon} path="/" active={location.pathname === '/'} />
          <DockItem icon={BookOpen} path="/journal" active={location.pathname === '/journal'} />
          <DockItem icon={Flower2} path="/meditation" active={location.pathname === '/meditation'} />
          <DockItem icon={Gamepad2} path="/games" active={location.pathname === '/games'} />
          <DockItem icon={User} path="/profile" active={location.pathname === '/profile'} />
        </nav>
      )}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/journal" element={<Journal />} />
      <Route path="/games" element={<Games />} />
      <Route path="/meditation" element={<Meditation />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/game/:type" element={<GameRunner />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </HashRouter>
    </AppProvider>
  );
}
