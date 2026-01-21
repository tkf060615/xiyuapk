import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, Gamepad2, User, ChevronLeft, Flower2 } from 'lucide-react';
import { AppProvider, useApp } from './context';
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
      className="group relative flex items-center justify-center w-12 h-full cursor-pointer touch-manipulation"
    >
      {/* Breathing Glow / Light Effect */}
      <div 
        className={`
          absolute bottom-4 w-10 h-10 rounded-full blur-xl
          transition-all duration-700 ease-in-out pointer-events-none
          ${active ? 'opacity-100 scale-150 animate-pulse' : 'opacity-0 scale-0'}
        `}
        style={{ backgroundColor: 'rgba(var(--primary-rgb), 0.4)' }}
      />

      {/* Floating 3D Icon Container */}
      <div className={`
        relative z-10 flex items-center justify-center
        w-14 h-14 rounded-2xl
        transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
        ${active
          ? '-translate-y-6 bg-gradient-to-br from-white/95 to-white/50 dark:from-gray-700 dark:to-gray-900 border border-white/60 dark:border-white/20 shadow-[0_12px_24px_-8px_rgba(var(--primary-rgb),0.3)] scale-110'
          : 'text-gray-400 dark:text-gray-500 hover:bg-white/10 active:scale-90 border border-transparent'}
      `}>
         <Icon
           size={26}
           className={`
             transition-all duration-500
             ${active
               ? 'text-primary drop-shadow-[0_2px_4px_rgba(var(--primary-rgb),0.3)]'
               : 'opacity-70 group-hover:opacity-100 group-hover:text-gray-600 dark:group-hover:text-gray-300'}
           `}
           strokeWidth={active ? 2.5 : 2}
         />
         
         {/* Specular Highlight for Glass effect */}
         {active && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/40 via-transparent to-transparent opacity-60 pointer-events-none" />
         )}
      </div>

      {/* Active Dot Indicator */}
      <div className={`
        absolute bottom-2.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]
        transition-all duration-500 delay-100
        ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-0 translate-y-4'}
      `} />
    </button>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isSubPage = location.pathname.includes('/game/') || location.pathname === '/settings' || location.pathname.includes('/journal/new');

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Content Area */}
      <main className={`flex-1 overflow-y-auto no-scrollbar ${isSubPage ? 'pb-0' : 'pb-24'}`}>
        <div className="min-h-full w-full">
          {children}
        </div>
      </main>

      {/* Floating Glass Dock */}
      {!isSubPage && (
        <div className="fixed bottom-6 left-6 right-6 z-50 flex justify-center">
          <nav className="glass-panel h-20 w-full max-w-lg rounded-[2rem] flex justify-between items-center px-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-2xl bg-white/60 dark:bg-black/40 border border-white/50 dark:border-white/10 ring-1 ring-white/40 dark:ring-white/5 animate-fade-in">
            <DockItem icon={HomeIcon} path="/" active={location.pathname === '/'} />
            <DockItem icon={BookOpen} path="/journal" active={location.pathname === '/journal'} />
            <DockItem icon={Flower2} path="/meditation" active={location.pathname === '/meditation'} />
            <DockItem icon={Gamepad2} path="/games" active={location.pathname === '/games'} />
            <DockItem icon={User} path="/profile" active={location.pathname === '/profile'} />
          </nav>
        </div>
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