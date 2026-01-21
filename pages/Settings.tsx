import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { THEME_COLORS } from '../data';
import { ChevronLeft, Moon, Sun, Monitor } from 'lucide-react';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useApp();

  return (
    <div className="min-h-full">
      <div className="p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">设置</h1>
      </div>

      <div className="p-6 space-y-8">
        
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
          <div className="bg-gray-100/50 dark:bg-black/20 rounded-2xl p-1.5 flex border border-white/20">
            {[
              { id: 'light', icon: Sun, label: '浅色' },
              { id: 'system', icon: Monitor, label: '系统' },
              { id: 'dark', icon: Moon, label: '深色' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => updateSettings({ darkMode: mode.id as any })}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all duration-300 ${settings.darkMode === mode.id ? 'bg-white dark:bg-gray-700 shadow-md text-primary font-bold' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <mode.icon size={20} className="mb-1" />
                <span className="text-xs">{mode.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="glass-panel p-6 rounded-3xl text-center">
          <h4 className="font-bold text-gray-800 dark:text-white text-lg">EnergyUp</h4>
          <p className="text-xs text-gray-500 mt-2 font-medium">
            v1.0.0 (Build 20231027)
            <br />
            Designed for Serenity
          </p>
        </section>

      </div>
    </div>
  );
};