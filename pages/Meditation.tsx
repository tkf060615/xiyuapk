import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Music, Clock } from 'lucide-react';
import { MEDITATION_TRACKS } from '../data';
import { useApp } from '../context';
import { MeditationTrack } from '../types';

export const Meditation = () => {
  const { incrementStat } = useApp();
  const [activeTab, setActiveTab] = useState<'meditation' | 'breathing'>('meditation');
  
  // --- Meditation State ---
  const [activeTrack, setActiveTrack] = useState<MeditationTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // --- Breathing State ---
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimeLeft, setBreathTimeLeft] = useState(4);

  // --- Meditation Logic ---
  useEffect(() => {
    let interval: any;
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
        if (timeLeft % 60 === 0) incrementStat('totalMeditationMinutes', 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      setActiveTrack(null);
      alert("练习完成！");
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft]);

  const startTrack = (track: MeditationTrack) => {
    setActiveTrack(track);
    setTimeLeft(track.duration);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Breathing Logic ---
  useEffect(() => {
    let interval: any;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimeLeft((t) => {
          if (t <= 1) {
            if (breathPhase === 'Inhale') {
              setBreathPhase('Hold');
              return 7;
            } else if (breathPhase === 'Hold') {
              setBreathPhase('Exhale');
              return 8;
            } else {
              setBreathPhase('Inhale');
              incrementStat('totalMeditationMinutes', 1);
              return 4;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase]);

  // Determine styles based on phase
  const getBreathingTransform = () => {
    if (!isBreathingActive) return 'scale(1)';
    switch (breathPhase) {
      case 'Inhale': return 'scale(1.5)';
      case 'Hold': return 'scale(1.5)';
      case 'Exhale': return 'scale(1)';
    }
  };

  const getBreathingDuration = () => {
    if (!isBreathingActive) return '0.5s';
    switch (breathPhase) {
      case 'Inhale': return '4s';
      case 'Hold': return '0s'; // Sustain size
      case 'Exhale': return '8s';
    }
  };

  // --- Player Overlay (Strong Glass) ---
  if (activeTrack) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 animate-fade-in overflow-hidden">
        {/* Blurred Background Image Simulation */}
        <div className={`absolute inset-0 bg-gradient-to-br ${activeTrack.color.replace('text', 'from').replace('100', '400').split(' ')[0]} to-gray-900 opacity-90`}></div>
        <div className="absolute inset-0 backdrop-blur-3xl"></div>

        <button onClick={() => { setIsPlaying(false); setActiveTrack(null); }} className="absolute top-8 right-8 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md">
          <X size={28} />
        </button>
        
        <div className="relative z-10 w-72 h-72 rounded-full glass-panel border-4 border-white/20 flex items-center justify-center mb-12 shadow-[0_0_60px_rgba(255,255,255,0.2)] animate-float">
           <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse"></div>
           <Music size={80} className="text-white drop-shadow-lg" />
        </div>

        <h2 className="relative z-10 text-3xl font-bold mb-2 text-center text-white drop-shadow-md">{activeTrack.title}</h2>
        <p className="relative z-10 text-white/70 mb-10 font-medium">正在播放引导音频...</p>

        <div className="relative z-10 text-7xl font-thin font-mono mb-16 tracking-wider text-white drop-shadow-lg">
          {formatTime(timeLeft)}
        </div>

        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="relative z-10 bg-white text-gray-900 rounded-full p-6 shadow-2xl hover:scale-105 transition-transform"
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pt-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">冥想与呼吸</h1>
        <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium">让心灵回归宁静</p>
      </div>

      {/* Glass Tabs */}
      <div className="mx-6 p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl flex relative">
         <div 
           className={`absolute top-1 bottom-1 w-[48%] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 ease-in-out ${activeTab === 'breathing' ? 'translate-x-[100%] left-1.5' : 'left-1'}`}
         />
         <button onClick={() => { setActiveTab('meditation'); setIsBreathingActive(false); }} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'meditation' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>引导冥想</button>
         <button onClick={() => setActiveTab('breathing')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'breathing' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>深呼吸</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'meditation' ? (
          <div className="space-y-4">
            {MEDITATION_TRACKS.map((track, idx) => (
              <div 
                key={track.id}
                onClick={() => startTrack(track)}
                className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/60 transition-all active:scale-95 group"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${track.color.split(' ')[0]} bg-opacity-20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform`}>
                    <Play size={18} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{track.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                      <Clock size={12} /> {Math.floor(track.duration / 60)} 分钟
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            <div className="relative flex items-center justify-center h-96 w-full">
               
               {/* Outer Expanding Ring (Visual Breath) */}
               <div 
                 className="absolute rounded-full pointer-events-none blur-3xl"
                 style={{
                   width: '200px',
                   height: '200px',
                   background: `radial-gradient(circle, rgba(var(--primary-rgb), 0.4) 0%, transparent 70%)`,
                   transform: getBreathingTransform(),
                   transition: `transform ${getBreathingDuration()} ease-in-out`
                 }}
               />

               {/* Middle Glass Container */}
               <div className="w-64 h-64 rounded-full glass-panel flex items-center justify-center shadow-2xl z-10 relative border-2 border-white/30 dark:border-white/10">
                 
                 {/* Inner Colored Circle */}
                 <div 
                   className={`w-48 h-48 rounded-full shadow-2xl flex items-center justify-center transition-all`}
                   style={{
                     background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))`,
                     boxShadow: `0 10px 30px -10px rgba(var(--primary-rgb), 0.5), inset 0 0 20px rgba(255,255,255,0.3)`,
                     transform: isBreathingActive && breathPhase === 'Hold' ? 'scale(1.05)' : 'scale(1)',
                     transition: 'transform 2s ease-in-out'
                   }}
                 >
                    <div className="text-center z-10 text-white drop-shadow-md">
                       <h2 className="text-3xl font-bold mb-1">
                         {isBreathingActive ? (breathPhase === 'Inhale' ? '吸气' : breathPhase === 'Hold' ? '屏气' : '呼气') : '准备'}
                       </h2>
                       {isBreathingActive && <p className="text-2xl font-mono opacity-90">{breathTimeLeft}s</p>}
                    </div>
                 </div>

                 {/* Ripple Effect Circles (Decorative) */}
                 {isBreathingActive && (
                    <>
                      <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute inset-4 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
                    </>
                 )}
               </div>
            </div>

            <button 
              onClick={() => { setIsBreathingActive(!isBreathingActive); setBreathPhase('Inhale'); setBreathTimeLeft(4); }}
              className={`mt-12 px-10 py-3 rounded-full font-bold text-lg shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 ${
                isBreathingActive 
                  ? 'bg-white text-gray-600 border border-gray-100' 
                  : 'text-white'
              }`}
              style={!isBreathingActive ? { background: 'var(--primary-color)' } : {}}
            >
              {isBreathingActive ? '停止练习' : '开始 4-7-8 呼吸'}
            </button>
            
            {!isBreathingActive && (
              <p className="mt-4 text-sm text-gray-400 font-medium">吸气 4秒 - 屏气 7秒 - 呼气 8秒</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};