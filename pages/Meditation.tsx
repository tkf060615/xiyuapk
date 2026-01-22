
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Music, Clock, Infinity as InfinityIcon, Wind, Square } from 'lucide-react';
import { MEDITATION_TRACKS } from '../data';
import { useApp } from '../context';
import { MeditationTrack } from '../types';

// --- AMBIENT AUDIO ENGINE ---
// Generates continuous audio (noise colors, binaural beats) using Web Audio API
const AmbientAudio = {
  ctx: null as AudioContext | null,
  nodes: [] as AudioNode[],
  gainNode: null as GainNode | null,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  // Generate specific noise buffer (Pink or Brown)
  createNoiseBuffer(type: 'pink' | 'brown') {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds loop
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
            // Brown noise: Integrate white noise
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5; // Compensate gain
        } else {
            // Simple Pink Noise approximation
            const b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
            // (Complex filtering omitted for brevity, using softer white noise)
             data[i] = (lastOut + (0.05 * white)) / 1.05; // Soften
             lastOut = data[i];
             data[i] *= 2.5; 
        }
    }
    return buffer;
  },

  play(category: 'sleep' | 'focus' | 'relax') {
    this.stop(); // Stop any existing sound safely
    this.init();
    if (!this.ctx) return;

    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    
    // Fade in
    this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 2);

    if (category === 'sleep') {
        // Brown Noise (Deep, rumbles)
        const buffer = this.createNoiseBuffer('brown');
        if (buffer) {
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            source.connect(this.gainNode);
            source.start();
            this.nodes.push(source);
        }
        // Low Drone (Delta Waves)
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime); // 60Hz
        const oscGain = this.ctx.createGain();
        oscGain.gain.value = 0.1;
        osc.connect(oscGain).connect(this.gainNode);
        osc.start();
        this.nodes.push(osc, oscGain);

    } else if (category === 'focus') {
        // Binaural Beats / Drone (Alpha/Beta)
        const freq = 200;
        const diff = 10; // 10Hz Alpha beat
        
        const left = this.ctx.createOscillator();
        const right = this.ctx.createOscillator();
        left.frequency.value = freq;
        right.frequency.value = freq + diff;
        
        // Stereo separation
        const merger = this.ctx.createChannelMerger(2);
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        merger.connect(this.gainNode);
        
        left.start();
        right.start();
        this.nodes.push(left, right, merger);

    } else {
        // Relax (Soft drift)
        // Pink Noise layer
        const buffer = this.createNoiseBuffer('pink');
        if (buffer) {
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.value = 0.3;
            source.connect(noiseGain).connect(this.gainNode);
            source.start();
            this.nodes.push(source, noiseGain);
        }
        // Gentle Chord
        [261.63, 329.63, 392.00].forEach(f => { // C Major
            const osc = this.ctx!.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = f;
            const g = this.ctx!.createGain();
            g.gain.value = 0.05;
            osc.connect(g).connect(this.gainNode!);
            osc.start();
            this.nodes.push(osc, g);
        });
    }
  },

  stop() {
      if (this.gainNode && this.ctx) {
          // IMPORTANT: Capture current nodes to disconnect them later, 
          // clear global array immediately so new play() calls don't interfere.
          const oldNodes = [...this.nodes];
          const oldGain = this.gainNode;
          this.nodes = [];
          this.gainNode = null;

          // Fade out the old gain node
          try {
              oldGain.gain.cancelScheduledValues(this.ctx.currentTime);
              oldGain.gain.setValueAtTime(oldGain.gain.value, this.ctx.currentTime);
              oldGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
              
              setTimeout(() => {
                  oldNodes.forEach(n => {
                      try { n.disconnect(); } catch(e){}
                      try { (n as any).stop(); } catch(e){}
                  });
                  try { oldGain.disconnect(); } catch(e){}
              }, 600);
          } catch (e) {
              console.error("Error stopping audio", e);
          }
      }
  }
};

export const Meditation = () => {
  const { incrementStat } = useApp();
  const [activeTab, setActiveTab] = useState<'meditation' | 'breathing'>('meditation');
  
  // --- Meditation State ---
  const [activeTrack, setActiveTrack] = useState<MeditationTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(300); // Target duration in seconds
  const [timeLeft, setTimeLeft] = useState(300); // Current countdown
  const [isInfinity, setIsInfinity] = useState(false);

  // --- Breathing State ---
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [breathTimeLeft, setBreathTimeLeft] = useState(4);
  
  // Breathing Settings
  const [breathingDuration, setBreathingDuration] = useState<number | 'inf'>(1); // Minutes
  const [sessionTimeLeft, setSessionTimeLeft] = useState(60); // Total session countdown in seconds

  // --- Meditation Logic ---
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
        interval = setInterval(() => {
          if (!isInfinity) {
              setTimeLeft((t) => {
                  if (t <= 1) {
                      finishMeditation();
                      return 0;
                  }
                  return t - 1;
              });
          }
          if ((isInfinity || timeLeft > 0) && new Date().getSeconds() === 0) {
              incrementStat('totalMeditationMinutes', 1);
          }
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, timeLeft, isInfinity]);

  const startMeditation = (track: MeditationTrack) => {
    // If switching tracks, stop current one first implicitly via play
    setActiveTrack(track);
    setDuration(track.duration);
    setTimeLeft(track.duration);
    setIsInfinity(false);
    setIsPlaying(true);
    AmbientAudio.play(track.category);
  };

  const changeDuration = (mins: number | 'inf') => {
    if (mins === 'inf') {
        setIsInfinity(true);
        setTimeLeft(0);
    } else {
        setIsInfinity(false);
        setDuration(mins * 60);
        setTimeLeft(mins * 60);
    }
  };

  const finishMeditation = () => {
    setIsPlaying(false);
    AmbientAudio.stop();
    setActiveTrack(null);
  };

  const closePlayer = () => {
      setIsPlaying(false);
      AmbientAudio.stop();
      setActiveTrack(null);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 0) return "∞";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- Breathing Logic ---
  
  // Reset session timer when duration setting changes
  useEffect(() => {
      if (!isBreathingActive) {
          setSessionTimeLeft(breathingDuration === 'inf' ? -1 : breathingDuration * 60);
      }
  }, [breathingDuration, isBreathingActive]);

  useEffect(() => {
    let interval: any;
    if (isBreathingActive) {
      interval = setInterval(() => {
        // 1. Handle Breath Cycle (4-7-8)
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
              // Log stats every full cycle approx
              return 4;
            }
          }
          return t - 1;
        });

        // 2. Handle Total Session Timer
        if (breathingDuration !== 'inf') {
            setSessionTimeLeft(prev => {
                if (prev <= 1) {
                    setIsBreathingActive(false); // Finish
                    incrementStat('totalMeditationMinutes', breathingDuration as number);
                    setBreathPhase('Inhale');
                    setBreathTimeLeft(4);
                    // breathingDuration is narrowed to number here
                    return (breathingDuration as number) * 60;
                }
                return prev - 1;
            });
        } else {
            // Just count for stats occasionally or handle infinity logic
            if (new Date().getSeconds() === 0) incrementStat('totalMeditationMinutes', 1);
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive, breathPhase, breathingDuration]);

  const toggleBreathing = () => {
      if (isBreathingActive) {
          // Stop
          setIsBreathingActive(false);
          setBreathPhase('Inhale');
          setBreathTimeLeft(4);
          setSessionTimeLeft(breathingDuration === 'inf' ? -1 : (breathingDuration as number) * 60);
      } else {
          // Start
          setIsBreathingActive(true);
      }
  };

  const getBreathingScale = () => {
    if (!isBreathingActive) return 1;
    switch (breathPhase) {
      case 'Inhale': return 1.6; // Significantly larger for visibility
      case 'Hold': return 1.6;
      case 'Exhale': return 1.0;
    }
  };

  const getTransitionDuration = () => {
    if (!isBreathingActive) return '0.5s';
    switch (breathPhase) {
      case 'Inhale': return '4s'; // Match Inhale time
      case 'Hold': return '0s';   // Instant state switch, holds scale
      case 'Exhale': return '8s'; // Match Exhale time
    }
  };

  // --- Player Overlay ---
  if (activeTrack) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6 animate-fade-in overflow-hidden">
        {/* Dynamic Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${activeTrack.color.replace('text', 'from').replace('100', '500').split(' ')[0]} to-gray-900 opacity-95 transition-colors duration-1000`}></div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-black/20"></div>

        {/* Header */}
        <button onClick={closePlayer} className="absolute top-8 right-8 text-white/70 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md z-20">
          <X size={28} />
        </button>
        
        {/* Visualizer Circle */}
        <div className="relative z-10 w-64 h-64 rounded-full glass-panel border-4 border-white/10 flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(255,255,255,0.15)]">
           <div className={`absolute inset-0 rounded-full bg-white/5 ${isPlaying ? 'animate-pulse-slow' : ''}`}></div>
           {/* Sound Wave Bars Animation Simulation */}
           <div className="flex gap-1 items-end h-16">
               {[...Array(5)].map((_, i) => (
                   <div key={i} className={`w-3 bg-white/80 rounded-full transition-all duration-300 ${isPlaying ? 'animate-float' : 'h-2'}`} style={{ height: isPlaying ? `${Math.random() * 40 + 20}px` : '4px', animationDelay: `${i*0.1}s` }}></div>
               ))}
           </div>
        </div>

        <h2 className="relative z-10 text-3xl font-bold mb-1 text-center text-white drop-shadow-md">{activeTrack.title}</h2>
        <p className="relative z-10 text-white/60 mb-8 font-medium flex items-center gap-2">
            <Music size={14} /> 循环音频 • {activeTrack.category === 'sleep' ? '助眠脑波' : activeTrack.category === 'focus' ? '专注频率' : '放松白噪'}
        </p>

        {/* Timer Display */}
        <div className="relative z-10 text-7xl font-thin font-mono mb-8 tracking-wider text-white drop-shadow-lg tabular-nums">
          {formatTime(timeLeft)}
        </div>

        {/* Duration Selector */}
        <div className="relative z-10 flex gap-2 mb-10 overflow-x-auto max-w-full px-2 no-scrollbar py-2">
            {[5, 10, 15, 30, 60].map(mins => (
                <button 
                  key={mins}
                  onClick={() => changeDuration(mins)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${duration === mins * 60 && !isInfinity ? 'bg-white text-primary border-white scale-105' : 'bg-transparent text-white/70 border-white/30 hover:bg-white/10'}`}
                >
                    {mins}分
                </button>
            ))}
             <button 
                  onClick={() => changeDuration('inf')}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${isInfinity ? 'bg-white text-primary border-white scale-105' : 'bg-transparent text-white/70 border-white/30 hover:bg-white/10'}`}
                >
                    <InfinityIcon size={16} />
                </button>
        </div>

        {/* Controls */}
        <div className="relative z-10 flex gap-8 items-center">
            <button 
            onClick={() => {
                if(isPlaying) { setIsPlaying(false); AmbientAudio.stop(); }
                else { setIsPlaying(true); AmbientAudio.play(activeTrack.category); }
            }}
            className="bg-white text-gray-900 rounded-full p-6 shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
            {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 统一标题栏 */}
      <div className="px-6 pt-10 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white drop-shadow-sm">冥想与呼吸</h1>
        <p className="text-gray-500 dark:text-gray-300 mt-1 font-medium">让心灵回归宁静</p>
      </div>

      <div className="mx-6 p-1 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-md rounded-2xl flex relative">
         <div 
           className={`absolute top-1 bottom-1 w-[48%] bg-white dark:bg-gray-700 rounded-xl shadow-md transition-all duration-300 ease-in-out ${activeTab === 'breathing' ? 'translate-x-[100%] left-1.5' : 'left-1'}`}
         />
         <button onClick={() => { setActiveTab('meditation'); setIsBreathingActive(false); }} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'meditation' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>引导冥想</button>
         <button onClick={() => setActiveTab('breathing')} className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'breathing' ? 'text-gray-800 dark:text-white' : 'text-gray-500'}`}>深呼吸</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {activeTab === 'meditation' ? (
          <div className="space-y-4 pb-24">
            {MEDITATION_TRACKS.map((track, idx) => (
              <div 
                key={track.id}
                onClick={() => startMeditation(track)}
                className="glass-card p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-white/60 transition-all active:scale-95 group border-l-4"
                style={{ 
                    animationDelay: `${idx * 100}ms`, 
                    borderLeftColor: track.color.includes('orange') ? '#f97316' : track.color.includes('indigo') ? '#4f46e5' : track.color.includes('teal') ? '#14b8a6' : track.color.includes('green') ? '#22c55e' : '#3b82f6'
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${track.color.split(' ')[0]} bg-opacity-20 flex items-center justify-center text-gray-700 dark:text-white group-hover:scale-110 transition-transform shadow-sm`}>
                    <Play size={18} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{track.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold mt-1">
                      <Music size={12} /> {track.category === 'sleep' ? '助眠' : track.category === 'focus' ? '专注' : '放松'}系列
                    </div>
                  </div>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full">
                    <Clock size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pb-20">
            
            {/* Breathing Duration Selector */}
            <div className="flex gap-2 mb-8 animate-fade-in">
                {[1, 3, 5].map(min => (
                    <button 
                       key={min}
                       onClick={() => !isBreathingActive && setBreathingDuration(min)}
                       className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                           breathingDuration === min 
                           ? 'bg-primary text-white border-primary shadow-lg scale-105' 
                           : 'bg-white/50 dark:bg-white/10 text-gray-500 border-transparent hover:bg-white/80'
                       } ${isBreathingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {min}分钟
                    </button>
                ))}
                <button 
                   onClick={() => !isBreathingActive && setBreathingDuration('inf')}
                   className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                       breathingDuration === 'inf'
                       ? 'bg-primary text-white border-primary shadow-lg scale-105' 
                       : 'bg-white/50 dark:bg-white/10 text-gray-500 border-transparent hover:bg-white/80'
                   } ${isBreathingActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <InfinityIcon size={14} />
                </button>
            </div>

            <div className="relative flex items-center justify-center h-96 w-full">
               
               {/* Background Blur Blob */}
               <div 
                 className="absolute rounded-full pointer-events-none blur-3xl"
                 style={{
                   width: '220px',
                   height: '220px',
                   background: `radial-gradient(circle, rgba(var(--primary-rgb), 0.4) 0%, transparent 70%)`,
                   transform: `scale(${isBreathingActive && breathPhase === 'Exhale' ? 1 : (isBreathingActive ? 2.0 : 1)})`,
                   transition: `transform ${getTransitionDuration()} ease-in-out`
                 }}
               />

               {/* Outer Boundary Ring */}
               <div className="w-72 h-72 rounded-full glass-panel flex items-center justify-center shadow-2xl z-10 relative border border-white/40 dark:border-white/10">
                 
                 {/* Main Breathing Circle / Button */}
                 <button
                   onClick={toggleBreathing}
                   className={`w-40 h-40 rounded-full shadow-2xl flex flex-col items-center justify-center transition-all ease-in-out relative z-20 outline-none
                     ${!isBreathingActive ? 'hover:scale-105 active:scale-95 cursor-pointer animate-pulse-slow' : 'cursor-pointer'}
                   `}
                   style={{
                     background: `linear-gradient(135deg, var(--primary-color), var(--secondary-color))`,
                     boxShadow: `0 10px 30px -10px rgba(var(--primary-rgb), 0.5), inset 0 0 20px rgba(255,255,255,0.3)`,
                     transform: `scale(${getBreathingScale()})`,
                     transitionDuration: getTransitionDuration()
                   }}
                 >
                    <div className="text-center z-10 text-white drop-shadow-md pointer-events-none transition-transform duration-300" style={{ transform: isBreathingActive ? 'scale(1)' : 'scale(1)' }}>
                       {isBreathingActive ? (
                         <div className="flex flex-col items-center">
                           <h2 className="text-xl font-bold mb-1 whitespace-nowrap">
                             {breathPhase === 'Inhale' ? '吸气' : breathPhase === 'Hold' ? '屏气' : '呼气'}
                           </h2>
                           <p className="text-3xl font-mono font-bold">{breathTimeLeft}</p>
                           <div className="mt-2 flex items-center gap-1 opacity-80 scale-75">
                              <Square size={12} fill="currentColor" />
                              <span className="text-[10px]">停止</span>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center">
                            <Play size={32} fill="currentColor" className="ml-1 mb-1" />
                            <span className="font-bold text-lg">开始</span>
                         </div>
                       )}
                    </div>
                 </button>
               </div>
            </div>

            <div className="mt-8 text-center h-10">
                {isBreathingActive ? (
                    <div className="animate-fade-in flex flex-col items-center">
                        <p className="text-sm text-gray-500 font-bold mb-1">训练进行中</p>
                        <p className="text-xs text-gray-400 font-mono">
                           {breathingDuration === 'inf' ? '无限模式' : `剩余: ${formatTime(sessionTimeLeft)}`}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 font-medium flex items-center justify-center gap-2 animate-fade-in">
                        <Wind size={16} /> 4-7-8 呼吸法：吸气4秒 - 屏气7秒 - 呼气8秒
                    </p>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
