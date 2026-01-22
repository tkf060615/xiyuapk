
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { useApp } from '../context';
import { 
  ChevronLeft, RefreshCw, Flag, Skull, Trophy, Play, Pause, 
  Activity, HelpCircle, X, Zap, Star, Target, Crown, RotateCcw,
  Music, Volume2, Gamepad2, Bomb, Info
} from 'lucide-react';

// --- 游戏规则说明数据 ---
const GAME_RULES: Record<string, string> = {
  [GameType.GOMOKU]: "1. 黑白双方轮流落子。\n2. 率先在横、竖、斜任意方向连成五子者获胜。\n3. 支持触屏点击落子，上方可切换难度。",
  [GameType.MINESWEEPER]: "1. 点击格子翻开，长按格子插旗标记地雷。\n2. 数字表示周围8个格子中地雷的数量。\n3. 翻开所有非地雷格子即可获胜。\n4. 触屏模式下，长按约0.4秒会有震动反馈并插旗。",
  [GameType.TETRIS]: "1. 滑动屏幕控制方块移动：\n   - 上滑：旋转方块\n   - 下滑：加速下落\n   - 左右滑：左右移动\n2. 填满一行即可消除得分。\n3. 方块堆积到顶部则游戏结束。",
  [GameType.G2048]: "1. 上下左右滑动屏幕移动数字块。\n2. 相同数字碰撞时会合并翻倍（2+2=4，4+4=8...）。\n3. 尽可能合成更大的数字，挑战2048！",
  [GameType.SNAKE]: "1. 上下左右滑动屏幕控制蛇的移动方向。\n2. 吃掉红色食物得分并变长。\n3. 撞墙或撞到自己身体则游戏结束。",
  [GameType.KLOTSKI]: "1. 经典的“曹操逃跑”谜题。\n2. 移动各个棋子，最终将最大的“曹操”移动到下方出口处即可过关。\n3. 极其考验逻辑思维能力。",
  [GameType.MATCH3]: "1. 点击相邻的两个水果交换位置。\n2. 横向或纵向凑齐3个及以上相同水果即可消除。\n3. 凑齐4个或5个会有强力炸弹或火箭生成！",
  [GameType.PARKOUR]: "1. 点击屏幕让方块跳跃。\n2. 躲避地面上的障碍物。\n3. 空中不可二段跳，请把握好起跳时机。",
  [GameType.WOODEN_FISH]: "1. 点击屏幕敲击木鱼。\n2. 每次敲击积攒功德，净化心灵。\n3. 纯粹的解压与冥想工具。",
  [GameType.BUBBLE_WRAP]: "1. 点击泡泡将其捏破。\n2. 享受解压的音效和触感。\n3. 无限模式，泡泡可反复重置。",
};

// --- 自定义 Hook: 自动存档 ---
function useStoredState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 使用函数式初始化，只在组件挂载时读取一次 localStorage
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // 当状态变化时，写入 localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [key, state]);

  return [state, setState];
}

// --- 全局音效与震动引擎 ---
const SoundSynthesizer = {
  ctx: null as AudioContext | null,
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },
  vibrate(ms: number | number[]) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {}
  },
  play(type: 'move' | 'select' | 'win' | 'lose' | 'score' | 'pop' | 'merge') {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    const now = this.ctx.currentTime;
    
    switch(type) {
      case 'move':
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(); osc.stop(now + 0.05);
        this.vibrate(5);
        break;
      case 'select':
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.03);
        osc.start(); osc.stop(now + 0.03);
        this.vibrate(2);
        break;
      case 'score':
      case 'merge':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(); osc.stop(now + 0.2);
        this.vibrate(15);
        break;
      case 'win':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        osc.frequency.setValueAtTime(1046.50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(); osc.stop(now + 0.8);
        this.vibrate([50, 30, 50, 30]);
        break;
      case 'lose':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.4);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(); osc.stop(now + 0.4);
        this.vibrate(200);
        break;
      case 'pop':
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(); osc.stop(now + 0.1);
        this.vibrate(8);
        break;
    }
  }
};

// --- 通用 UI 组件 ---

const GameShell = ({ children, title, score, best, onReset, colorTheme = "blue" }: any) => {
  const themeColors: any = {
    blue: "from-blue-500 to-indigo-600",
    green: "from-emerald-500 to-teal-600",
    orange: "from-orange-400 to-red-500",
    purple: "from-purple-500 to-fuchsia-600",
    slate: "from-slate-600 to-slate-800",
    wood: "from-amber-700 to-yellow-800"
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full p-4">
      {/* 3D Dashboard Header */}
      <div className="w-full mb-4 relative shrink-0">
        <div className="absolute inset-0 bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-white/40 dark:border-white/10 transform translate-y-1"></div>
        <div className="relative bg-gradient-to-br from-white/90 to-white/50 dark:from-slate-800/90 dark:to-slate-900/50 backdrop-blur-md p-4 rounded-3xl border-t border-white/60 shadow-xl flex justify-between items-center z-10">
          
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{title}</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r ${themeColors[colorTheme] || themeColors.blue} drop-shadow-sm filter`}>
                {score}
              </span>
              {best !== undefined && <span className="text-xs font-bold text-gray-400">/ 最高 {best}</span>}
            </div>
          </div>

          <button 
            onClick={onReset}
            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${themeColors[colorTheme] || themeColors.blue} flex items-center justify-center text-white shadow-lg shadow-blue-500/30 active:translate-y-1 active:shadow-none transition-all border-b-4 border-black/20`}
          >
            <RotateCcw size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Game Board Container with "Sunken" Depth */}
      <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-0">
         <div className="absolute inset-0 bg-gray-200 dark:bg-slate-800/50 rounded-[2.5rem] shadow-[inset_0_4px_12px_rgba(0,0,0,0.15),0_1px_2px_rgba(255,255,255,0.5)] border-b-2 border-white/20"></div>
         <div className="relative z-10 w-full h-full p-4 flex items-center justify-center overflow-hidden">
            {children}
         </div>
      </div>
    </div>
  );
};

const GameOverModal = ({ isVisible, type, score, onReset, message }: any) => {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-[320px] rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center border-t border-white/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
        {type === 'win' ? (
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40 mb-6 animate-bounce">
            <Trophy size={40} className="text-white drop-shadow-md" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center shadow-inner mb-6">
            <Skull size={40} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <h2 className="text-3xl font-black mb-2 text-gray-800 dark:text-white tracking-tight">{type === 'win' ? '胜利!' : '游戏结束'}</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 text-center text-sm">{message || '再接再厉，相信你可以做的更好！'}</p>
        
        {score !== undefined && (
          <div className="flex flex-col items-center mb-8">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">本次得分</span>
            <span className="text-4xl font-black text-primary tabular-nums">{score}</span>
          </div>
        )}

        <button onClick={onReset} className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30 active:scale-95 transition-transform flex items-center justify-center gap-2 text-lg">
          <RefreshCw size={22} strokeWidth={3} /> 重来一局
        </button>
      </div>
    </div>
  );
};

// --- 重构 Stats Hook: 支持仅更新分数不增加场次 ---
const useGameStats = (type: string) => {
  const { incrementStat } = useApp();
  const [best, setBest] = useState(0);

  useEffect(() => {
    const records = JSON.parse(localStorage.getItem('game_records') || '{}');
    if (records[type]) setBest(records[type].maxScore);
  }, [type]);

  // 仅更新最高分（用于实时游戏，如2048、木鱼）
  const updateRecord = (score: number) => {
     const records = JSON.parse(localStorage.getItem('game_records') || '{}');
     const rec = records[type] || { played: 0, maxScore: 0 };
     if (score > rec.maxScore) {
         rec.maxScore = score;
         setBest(rec.maxScore);
         records[type] = rec;
         localStorage.setItem('game_records', JSON.stringify(records));
     }
  };

  // 结算游戏：更新最高分 + 增加游玩次数
  const finishGame = (score: number) => {
    incrementStat('totalGamesPlayed'); // 全局统计
    const records = JSON.parse(localStorage.getItem('game_records') || '{}');
    const rec = records[type] || { played: 0, maxScore: 0 };
    rec.played += 1;
    rec.maxScore = Math.max(rec.maxScore, score);
    setBest(rec.maxScore);
    records[type] = rec;
    localStorage.setItem('game_records', JSON.stringify(records));
  };

  return { best, updateRecord, finishGame };
};

const useSwipe = (onSwipe: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void) => {
  const ts = useRef<{x: number, y: number} | null>(null);
  return {
    onTouchStart: (e: React.TouchEvent) => { ts.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; SoundSynthesizer.init(); },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!ts.current) return;
      const dx = e.changedTouches[0].clientX - ts.current.x, dy = e.changedTouches[0].clientY - ts.current.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) onSwipe(dx > 0 ? 'RIGHT' : 'LEFT');
        else onSwipe(dy > 0 ? 'DOWN' : 'UP');
      }
      ts.current = null;
    }
  };
};

// --- 1. 五子棋 (Realistic Wood Texture + Strong AI) ---
const GomokuGame = () => {
  const SIZE = 15;
  const { best, finishGame } = useGameStats(GameType.GOMOKU);
  
  // Persistence State
  const [board, setBoard] = useStoredState<(number | null)[]>(`${GameType.GOMOKU}_board`, Array(SIZE * SIZE).fill(null));
  const [turn, setTurn] = useStoredState<number>(`${GameType.GOMOKU}_turn`, 1); // 1: Black (Player), 2: White (AI)
  const [winner, setWinner] = useStoredState<number | null>(`${GameType.GOMOKU}_winner`, null);
  const [lastMove, setLastMove] = useStoredState<number | null>(`${GameType.GOMOKU}_lastMove`, null);
  const [difficulty, setDifficulty] = useStoredState<'easy'|'medium'|'hard'>(`${GameType.GOMOKU}_diff`, 'hard'); 

  const checkWin = (b: (number | null)[], idx: number, p: number) => {
    const r = Math.floor(idx / SIZE), c = idx % SIZE;
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let i=1; i<5; i++) { const nr = r+dr*i, nc = c+dc*i; if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && b[nr*SIZE+nc] === p) count++; else break; }
      for (let i=1; i<5; i++) { const nr = r-dr*i, nc = c-dc*i; if (nr>=0 && nr<SIZE && nc>=0 && nc<SIZE && b[nr*SIZE+nc] === p) count++; else break; }
      if (count >= 5) return true;
    }
    return false;
  };

  const getPointScore = (b: (number|null)[], idx: number, role: number) => {
      let score = 0;
      const r = Math.floor(idx / SIZE);
      const c = idx % SIZE;
      const dirs = [[1,0], [0,1], [1,1], [1,-1]];
      for(const [dr, dc] of dirs) {
          let count = 1; let openEnds = 0;
          for (let i = 1; i < 5; i++) {
              const nr = r + dr * i; const nc = c + dc * i;
              if(nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
              const val = b[nr*SIZE + nc];
              if(val === role) count++; else if (val === null) { openEnds++; break; } else break;
          }
          for (let i = 1; i < 5; i++) {
              const nr = r - dr * i; const nc = c - dc * i;
              if(nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) break;
              const val = b[nr*SIZE + nc];
              if(val === role) count++; else if (val === null) { openEnds++; break; } else break;
          }
          if (count >= 5) score += 100000;
          else if (count === 4) score += openEnds === 2 ? 10000 : 2000;
          else if (count === 3) score += openEnds === 2 ? 2000 : 100;
          else if (count === 2) score += openEnds === 2 ? 100 : 10;
      }
      return score;
  };

  const aiMove = useCallback((currBoard: (number|null)[]) => {
    const emptyIndices: number[] = [];
    const hasNeighbor: boolean[] = new Array(SIZE*SIZE).fill(false);
    let hasPieces = false;
    for(let i=0; i<SIZE*SIZE; i++) {
        if(currBoard[i] !== null) {
            hasPieces = true;
            const r = Math.floor(i/SIZE); const c = i%SIZE;
            for(let dr=-2; dr<=2; dr++) {
                for(let dc=-2; dc<=2; dc++) {
                     const nr = r+dr, nc = c+dc;
                     if(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) hasNeighbor[nr*SIZE+nc] = true;
                }
            }
        }
    }
    if (!hasPieces) { handleMove(Math.floor(SIZE*SIZE/2), 2, currBoard); return; }
    currBoard.forEach((v, i) => { if(v === null && hasNeighbor[i]) emptyIndices.push(i); });
    if(emptyIndices.length === 0) currBoard.forEach((v, i) => { if(v === null) emptyIndices.push(i); });
    let bestMove = -1;
    if (difficulty === 'easy') {
        bestMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    } else {
        const scoredMoves = emptyIndices.map(idx => {
            const attackScore = getPointScore(currBoard, idx, 2);
            const defenseScore = getPointScore(currBoard, idx, 1);
            let score = 0;
            if (attackScore >= 100000) score = 1000000;
            else if (defenseScore >= 100000) score = 500000;
            else if (attackScore >= 10000) score = 100000 + attackScore;
            else if (defenseScore >= 10000) score = 50000 + defenseScore;
            else score = attackScore * 1.1 + defenseScore;
            if (difficulty === 'medium') score += Math.random() * 200;
            return { idx, score };
        });
        scoredMoves.sort((a,b) => b.score - a.score);
        bestMove = scoredMoves[0]?.idx || emptyIndices[0];
    }
    if (bestMove !== -1) handleMove(bestMove, 2, currBoard);
  }, [difficulty]);

  const handleMove = (idx: number, p: number, currBoard?: (number|null)[]) => {
    const b = currBoard || board;
    if (winner || b[idx] !== null) return;
    const nb = [...b];
    nb[idx] = p;
    setBoard(nb);
    setLastMove(idx);
    SoundSynthesizer.play('select');
    if (checkWin(nb, idx, p)) {
      setWinner(p);
      SoundSynthesizer.play(p === 1 ? 'win' : 'lose');
      if (p === 1) finishGame(100);
    } else {
      setTurn(p === 1 ? 2 : 1);
    }
  };

  useEffect(() => {
    if (turn === 2 && !winner) {
      const t = setTimeout(() => aiMove(board), 500);
      return () => clearTimeout(t);
    }
  }, [turn, winner, board]);

  const reset = () => {
    setBoard(Array(SIZE * SIZE).fill(null));
    setTurn(1);
    setWinner(null);
    setLastMove(null);
  };

  return (
    <GameShell title={turn===1 ? "你的回合 (黑)" : "AI 思考中 (白)"} score={winner ? (winner===1?"胜":"负") : "-"} best={best} onReset={reset} colorTheme="wood">
      <style>{`@keyframes dropIn { 0% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-sm z-20 shrink-0">
          {(['easy', 'medium', 'hard'] as const).map(d => (
             <button 
               key={d}
               onClick={() => { setDifficulty(d); reset(); }}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${difficulty === d ? 'bg-white shadow text-primary scale-105' : 'text-gray-400 hover:text-gray-600'}`}
             >
               {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
             </button>
          ))}
        </div>
        <div className="relative w-full aspect-square bg-[#e6c288] rounded shadow-2xl p-1 border-[4px] border-[#8b5a2b] ring-1 ring-[#5c3a1a] select-none">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] pointer-events-none mix-blend-multiply"></div>
          <div className="grid w-full h-full relative z-10" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gridTemplateRows: `repeat(${SIZE}, 1fr)` }}>
            {board.map((cell, i) => {
               const r = Math.floor(i/SIZE), c = i % SIZE;
               const isStar = (r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11);
               return (
                  <div key={i} onClick={() => turn === 1 && handleMove(i, 1)} className="relative flex items-center justify-center cursor-pointer">
                      <div className={`absolute h-[1px] bg-[#5c3a1a]/60 top-1/2 left-0 right-0 ${c === 0 ? 'left-1/2' : ''} ${c === SIZE - 1 ? 'right-1/2' : ''}`}></div>
                      <div className={`absolute w-[1px] bg-[#5c3a1a]/60 top-0 bottom-0 left-1/2 ${r === 0 ? 'top-1/2' : ''} ${r === SIZE - 1 ? 'bottom-1/2' : ''}`}></div>
                      {isStar && <div className="absolute w-1.5 h-1.5 bg-[#5c3a1a] rounded-full z-0"></div>}
                      {cell && (
                          <div className={`w-[85%] h-[85%] rounded-full shadow-[2px_3px_5px_rgba(0,0,0,0.4)] z-10 relative ${cell === 1 ? 'bg-gradient-to-br from-[#303030] to-black' : 'bg-gradient-to-br from-white to-[#d0d0d0]'}`} style={{ animation: 'dropIn 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards' }}>
                              <div className="absolute top-[15%] left-[20%] w-[25%] h-[15%] bg-white/40 rounded-full blur-[1px]"></div>
                              {lastMove === i && <div className={`absolute inset-0 m-auto w-2 h-2 rounded-full ${cell === 1 ? 'bg-white/50' : 'bg-black/30'}`}></div>}
                          </div>
                      )}
                      {turn === 1 && !cell && !winner && <div className="absolute w-3 h-3 bg-black/10 rounded-full opacity-0 hover:opacity-100 transition-opacity"></div>}
                  </div>
               );
            })}
          </div>
        </div>
      </div>
      <GameOverModal isVisible={!!winner} type={winner===1 ? 'win' : 'lose'} message={winner===1 ? "你击败了AI！" : "AI技高一筹"} onReset={reset} />
    </GameShell>
  );
};

// --- 2. 扫雷 (Modern Glass Style + Touch Support) ---
const MinesweeperGame = () => {
  const { best, finishGame } = useGameStats(GameType.MINESWEEPER);
  const DIFFICULTIES = {
    easy: { rows: 8, cols: 8, mines: 8 },
    medium: { rows: 10, cols: 10, mines: 15 },
    hard: { rows: 12, cols: 12, mines: 25 }
  };
  const [difficulty, setDifficulty] = useStoredState<'easy'|'medium'|'hard'>(`${GameType.MINESWEEPER}_diff`,'easy');
  const { rows, cols, mines } = DIFFICULTIES[difficulty];

  const [grid, setGrid] = useStoredState<any[]>(`${GameType.MINESWEEPER}_grid`,[]);
  const [status, setStatus] = useStoredState<'playing' | 'won' | 'lost'>(`${GameType.MINESWEEPER}_status`,'playing');

  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  const init = useCallback((newDifficulty?: 'easy'|'medium'|'hard') => {
    const d = newDifficulty || difficulty;
    const cfg = DIFFICULTIES[d];
    let g = Array(cfg.rows * cfg.cols).fill(0).map((_, i) => ({ id: i, isMine: false, open: false, flag: false, count: 0 }));
    let placed = 0;
    while(placed < cfg.mines) {
      let idx = Math.floor(Math.random()*g.length);
      if(!g[idx].isMine) { g[idx].isMine = true; placed++; }
    }
    g.forEach((c, i) => {
      if(c.isMine) return;
      const r = Math.floor(i/cfg.cols), col = i%cfg.cols;
      for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
        const nr=r+dr, nc=col+dc;
        if(nr>=0 && nr<cfg.rows && nc>=0 && nc<cfg.cols && g[nr*cfg.cols+nc].isMine) c.count++;
      }
    });
    setGrid(g); setStatus('playing');
  }, [difficulty]);

  // Init once if empty
  useEffect(() => { if (grid.length === 0) init(); }, []);

  const open = (i: number) => {
    if(status !== 'playing' || grid[i].open || grid[i].flag) return;
    const ng = [...grid];
    if(ng[i].isMine) {
      setStatus('lost'); SoundSynthesizer.play('lose'); finishGame(0);
      ng.forEach(c => { if(c.isMine) c.open = true; });
    } else {
      const flood = (idx: number) => {
        if(ng[idx].open || ng[idx].flag) return;
        ng[idx].open = true;
        if(ng[idx].count === 0) {
          const r = Math.floor(idx/cols), c = idx%cols;
          for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
            const nr=r+dr, nc=c+dc;
            if(nr>=0 && nr<rows && nc>=0 && nc<cols) flood(nr*cols+nc);
          }
        }
      };
      flood(i);
      SoundSynthesizer.play('pop');
      if(ng.filter(c => !c.isMine && !c.open).length === 0) {
        setStatus('won'); SoundSynthesizer.play('win'); finishGame(100);
      }
    }
    setGrid(ng);
  };

  const handleTouchStart = (i: number) => {
    isLongPress.current = false;
    longPressTimer.current = window.setTimeout(() => {
        isLongPress.current = true;
        setGrid(prevGrid => {
            if(status !== 'playing' || prevGrid[i].open) return prevGrid;
            const ng = [...prevGrid];
            ng[i].flag = !ng[i].flag;
            return ng;
        });
        SoundSynthesizer.play('select');
        SoundSynthesizer.vibrate(50);
    }, 400); 
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const handleTouchMove = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };
  const handleCellClick = (i: number) => {
      if (isLongPress.current) { isLongPress.current = false; return; }
      open(i);
  };

  const getNumberColor = (count: number) => {
    const colors = ['', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-600', 'text-orange-600', 'text-teal-600', 'text-gray-800', 'text-gray-500'];
    return colors[count] || 'text-black';
  };

  return (
    <GameShell title="扫雷" score={mines - grid.filter(c=>c.flag).length} best={best} onReset={() => init()} colorTheme="slate">
      <div className="flex flex-col items-center w-full h-full">
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-sm z-20 shrink-0 mb-4">
            {(['easy', 'medium', 'hard'] as const).map(d => (
               <button 
                 key={d}
                 onClick={() => { setDifficulty(d); init(d); }}
                 className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${difficulty === d ? 'bg-white shadow text-primary scale-105' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难'}
               </button>
            ))}
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-0">
           <div className="bg-white/50 dark:bg-black/20 p-2 rounded-2xl backdrop-blur-sm shadow-xl border border-white/20 w-full aspect-square max-h-full flex items-center justify-center">
              <div className="grid gap-1 w-full h-full" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                {grid.map((c, i) => (
                  <div 
                    key={i} 
                    onClick={() => handleCellClick(i)}
                    onTouchStart={() => handleTouchStart(i)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    onContextMenu={(e) => e.preventDefault()}
                    className={`relative rounded-md flex items-center justify-center font-black cursor-pointer select-none transition-all duration-200 overflow-hidden text-sm sm:text-base md:text-lg lg:text-xl ${c.open ? 'bg-slate-200/50 dark:bg-slate-800/50 shadow-inner' : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 shadow-[0_2px_0_rgba(0,0,0,0.1)] active:shadow-none active:translate-y-[2px] border-b-2 border-slate-300 dark:border-slate-900 active:border-b-0'}`}
                  >
                    {c.open ? (c.isMine ? (<div className="animate-pulse drop-shadow-md"><Bomb size={difficulty === 'hard' ? '60%' : '70%'} className="text-slate-700 dark:text-slate-200 fill-slate-800 dark:fill-slate-100" /></div>) : (<span className={`drop-shadow-sm ${getNumberColor(c.count)}`}>{c.count > 0 ? c.count : ''}</span>)) : (c.flag && <Flag size={difficulty === 'hard' ? '50%' : '60%'} className="text-red-500 fill-red-500 drop-shadow-md animate-bounce" />)}
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
      <GameOverModal isVisible={status !== 'playing'} type={status === 'won' ? 'win' : 'lose'} onReset={() => init()} />
    </GameShell>
  );
};

// --- 3. 俄罗斯方块 (3D Bevel Blocks) ---
const TetrisGame = () => {
  const ROWS = 20, COLS = 10;
  const { best, finishGame } = useGameStats(GameType.TETRIS);
  const SHAPE_COLORS: Record<string, string> = { I: 'cyan', J: 'blue', L: 'orange', O: 'yellow', S: 'green', T: 'purple', Z: 'red' };
  const SHAPES = { I: [[1,1,1,1]], J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]], O: [[1,1],[1,1]], S: [[0,1,1],[1,1,0]], T: [[0,1,0],[1,1,1]], Z: [[1,1,0],[0,1,1]] };
  
  const [grid, setGrid] = useStoredState<any[][]>(`${GameType.TETRIS}_grid`, Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
  const [active, setActive] = useStoredState<any>(`${GameType.TETRIS}_active`, null);
  const [score, setScore] = useStoredState<number>(`${GameType.TETRIS}_score`, 0);
  const [over, setOver] = useStoredState<boolean>(`${GameType.TETRIS}_over`, false);
  const [isPaused, setIsPaused] = useState(true); // 默认进入为暂停状态

  const spawn = useCallback(() => {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[type as keyof typeof SHAPES];
    const colorName = SHAPE_COLORS[type];
    const piece = { shape, x: 3, y: 0, color: colorName };
    if (checkCollision(piece, grid)) setOver(true);
    setActive(piece);
  }, [grid]);

  const checkCollision = (p: any, g: any[][]) => {
    return p.shape.some((row: any, dy: number) => row.some((v: number, dx: number) => {
      if (!v) return false;
      const nx = p.x + dx, ny = p.y + dy;
      return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && g[ny][nx]);
    }));
  };

  const move = (dx: number, dy: number) => {
    if (over || !active || isPaused) return;
    const next = { ...active, x: active.x + dx, y: active.y + dy };
    if (!checkCollision(next, grid)) { setActive(next); return true; }
    if (dy > 0) lock();
    return false;
  };

  const lock = () => {
    const ng = grid.map(r => [...r]);
    active.shape.forEach((row: any, dy: number) => row.forEach((v: number, dx: number) => {
      if (v) ng[active.y + dy][active.x + dx] = active.color;
    }));
    let lines = 0;
    const cleared = ng.filter(r => { const full = r.every(c => c !== 0); if(full) lines++; return !full; });
    while(cleared.length < ROWS) cleared.unshift(Array(COLS).fill(0));
    setGrid(cleared);
    const add = lines * 100 * lines;
    setScore(s => s + add);
    if(lines > 0) SoundSynthesizer.play('score');
    spawn();
  };

  const rotate = () => {
    if(!active || over || isPaused) return;
    const nextShape = active.shape[0].map((_:any, i:number) => active.shape.map((row:any) => row[i]).reverse());
    const next = { ...active, shape: nextShape };
    if(!checkCollision(next, grid)) setActive(next);
  };

  const reset = () => {
      setGrid(Array(ROWS).fill(0).map(() => Array(COLS).fill(0)));
      setActive(null);
      setScore(0);
      setOver(false);
      setIsPaused(false);
  };

  // 初始化时如果有active，说明是读取了存档，先暂停
  useEffect(() => { 
      if(!active && !over && !isPaused) spawn(); 
  }, [active, over, isPaused]);
  
  useEffect(() => {
    if(over) { finishGame(score); SoundSynthesizer.play('lose'); return; }
    if(isPaused) return;
    const t = setInterval(() => move(0,1), 800);
    return () => clearInterval(t);
  }, [active, grid, over, isPaused]);

  const renderBlock = (colorKey: string | 0, x: number, y: number) => {
    if(!colorKey) return <div key={`${x}-${y}`} className="bg-slate-900/50 border border-slate-800/30"></div>;
    const colorClass = {
        cyan: 'bg-cyan-400 border-cyan-200', blue: 'bg-blue-600 border-blue-400', orange: 'bg-orange-500 border-orange-300',
        yellow: 'bg-yellow-400 border-yellow-200', green: 'bg-green-500 border-green-300', purple: 'bg-purple-600 border-purple-400', red: 'bg-red-600 border-red-400'
    }[colorKey] || 'bg-gray-500';
    return (
        <div key={`${x}-${y}`} className={`w-full h-full ${colorClass} relative border box-border shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4)]`}>
            <div className="absolute top-[15%] left-[15%] w-[30%] h-[30%] bg-white/30 rounded-full blur-[1px]"></div>
        </div>
    );
  };

  return (
    <GameShell title="俄罗斯方块" score={score} best={best} onReset={reset} colorTheme="purple">
       <div className="h-full w-full flex items-center justify-center p-2">
            <div 
                className="bg-slate-900 p-2 rounded-xl border-4 border-slate-700 shadow-2xl h-full max-h-[85vh] aspect-[10/20] flex flex-col relative" 
                {...useSwipe(d => {
                    if(d==='UP') rotate(); if(d==='DOWN') move(0,1); if(d==='LEFT') move(-1,0); if(d==='RIGHT') move(1,0);
                })}
                onClick={() => isPaused && !over && setIsPaused(false)}
            >
                <div className="grid w-full h-full bg-slate-900 border border-slate-800" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
                {grid.map((row, y) => row.map((cell, x) => {
                    let color = cell;
                    if(active && !isPaused) {
                        const dy = y - active.y, dx = x - active.x;
                        if(dy>=0 && dy<active.shape.length && dx>=0 && dx<active.shape[0].length && active.shape[dy][dx]) color = active.color;
                    }
                    return renderBlock(color, x, y);
                }))}
                </div>
                {isPaused && !over && (
                    <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                        <Play size={48} className="text-white mb-4 animate-pulse" />
                        <p className="text-white font-bold">点击继续游戏</p>
                    </div>
                )}
            </div>
       </div>
       <GameOverModal isVisible={over} score={score} onReset={reset} />
    </GameShell>
  );
};

// --- 4. 2048 (Rounded Glossy Tiles) ---
const G2048Game = () => {
  const { best, updateRecord, finishGame } = useGameStats(GameType.G2048);
  const [board, setBoard] = useStoredState<number[]>(`${GameType.G2048}_board`, Array(16).fill(0));
  const [score, setScore] = useStoredState<number>(`${GameType.G2048}_score`, 0);

  const addRandom = (b: number[]) => {
    const empty = b.map((v,i) => v===0?i:-1).filter(i=>i!==-1);
    if(empty.length) b[empty[Math.floor(Math.random()*empty.length)]] = Math.random()<0.9?2:4;
    return [...b];
  };

  const reset = () => {
    finishGame(score); // 结算上一局
    setBoard(addRandom(addRandom(Array(16).fill(0))));
    setScore(0);
  };
  
  // First load init
  useEffect(() => { if(board.every(v => v===0)) reset(); }, []);

  const slide = (row: number[]) => {
    let arr = row.filter(v=>v);
    let scoreAdd = 0;
    for(let i=0; i<arr.length-1; i++){
        if(arr[i]===arr[i+1]) { arr[i]*=2; scoreAdd+=arr[i]; arr.splice(i+1,1); SoundSynthesizer.play('merge'); }
    }
    while(arr.length<4) arr.push(0);
    return { arr, scoreAdd };
  };

  const move = (dir: string) => {
    let newBoard = [...board];
    let totalScoreAdd = 0;
    let changed = false;
    const getIdx = (r:number, c:number) => r*4+c;
    const shift = (getVal:(i:number,j:number)=>number, setVal:(i:number,j:number,v:number)=>void) => {
        for(let i=0; i<4; i++){
            let row = [0,1,2,3].map(j => getVal(i,j));
            const {arr, scoreAdd} = slide(row);
            totalScoreAdd += scoreAdd;
            for(let j=0; j<4; j++){
                if(getVal(i,j) !== arr[j]) changed = true;
                setVal(i,j,arr[j]);
            }
        }
    };
    if(dir==='LEFT') shift((r,c)=>newBoard[getIdx(r,c)], (r,c,v)=>newBoard[getIdx(r,c)]=v);
    if(dir==='RIGHT') shift((r,c)=>newBoard[getIdx(r,3-c)], (r,c,v)=>newBoard[getIdx(r,3-c)]=v);
    if(dir==='UP') shift((c,r)=>newBoard[getIdx(r,c)], (c,r,v)=>newBoard[getIdx(r,c)]=v);
    if(dir==='DOWN') shift((c,r)=>newBoard[getIdx(3-r,c)], (c,r,v)=>newBoard[getIdx(3-r,c)]=v);

    if(changed) {
        setBoard(addRandom(newBoard));
        setScore(s => { const ns = s+totalScoreAdd; updateRecord(ns); return ns; });
        if(totalScoreAdd === 0) SoundSynthesizer.play('move');
    }
  };

  const getTileStyle = (val: number) => {
    const colors: any = {
        0: 'bg-[#cdc1b4]', 2: 'bg-[#eee4da] text-[#776e65]', 4: 'bg-[#ede0c8] text-[#776e65]',
        8: 'bg-[#f2b179] text-white', 16: 'bg-[#f59563] text-white', 32: 'bg-[#f67c5f] text-white',
        64: 'bg-[#f65e3b] text-white', 128: 'bg-[#edcf72] text-white', 256: 'bg-[#edcc61] text-white',
        512: 'bg-[#edc850] text-white', 1024: 'bg-[#edc53f] text-white', 2048: 'bg-[#edc22e] text-white'
    };
    return colors[val] || 'bg-[#3c3a32] text-white';
  };

  return (
    <GameShell title="2048" score={score} best={best} onReset={reset} colorTheme="orange">
      <div className="bg-[#bbada0] p-3 rounded-2xl shadow-xl w-[320px] aspect-square" {...useSwipe(move)}>
        <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
            {board.map((val, i) => (
                <div key={i} className={`rounded-xl flex items-center justify-center font-bold text-3xl shadow-sm transition-all duration-200 transform ${val ? 'scale-100' : 'scale-100'} ${getTileStyle(val)}`}>
                    {val > 0 && val}
                </div>
            ))}
        </div>
      </div>
    </GameShell>
  );
};

// --- 5. 贪吃蛇 (Neon Glow Style) ---
const SnakeGame = () => {
    const GS = 20;
    const { best, finishGame } = useGameStats(GameType.SNAKE);
    const [snake, setSnake] = useStoredState<{x:number, y:number}[]>(`${GameType.SNAKE}_snake`, [{x:10,y:10},{x:10,y:11}]);
    const [food, setFood] = useStoredState<{x:number, y:number}>(`${GameType.SNAKE}_food`, {x:5,y:5});
    const [dir, setDir] = useStoredState<{x:number, y:number}>(`${GameType.SNAKE}_dir`, {x:0,y:-1});
    const [score, setScore] = useStoredState<number>(`${GameType.SNAKE}_score`, 0);
    const [over, setOver] = useStoredState<boolean>(`${GameType.SNAKE}_over`, false);
    const [isPaused, setIsPaused] = useState(true);

    const reset = () => {
        setSnake([{x:10,y:10},{x:10,y:11}]);
        setFood({x:5,y:5});
        setDir({x:0,y:-1});
        setScore(0);
        setOver(false);
        setIsPaused(false);
    };

    const move = useCallback(() => {
        if(over || isPaused) return;
        const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
        if(head.x < 0 || head.x >= GS || head.y < 0 || head.y >= GS || snake.some(s => s.x===head.x && s.y===head.y)) {
            setOver(true); SoundSynthesizer.play('lose'); finishGame(score); return;
        }
        const newSnake = [head, ...snake];
        if(head.x === food.x && head.y === food.y) {
            setScore(s => s + 10); SoundSynthesizer.play('score');
            setFood({x: Math.floor(Math.random()*GS), y: Math.floor(Math.random()*GS)});
        } else {
            newSnake.pop();
        }
        setSnake(newSnake);
    }, [snake, dir, food, over, score, isPaused]);

    useEffect(() => { const t = setInterval(move, 150); return () => clearInterval(t); }, [move]);

    return (
        <GameShell title="贪吃蛇" score={score} best={best} onReset={reset} colorTheme="green">
            <div className="bg-black rounded-2xl p-1 border-4 border-emerald-900 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative" 
                 {...useSwipe(d => {
                     if(d==='UP' && dir.y===0) setDir({x:0,y:-1}); if(d==='DOWN' && dir.y===0) setDir({x:0,y:1});
                     if(d==='LEFT' && dir.x===0) setDir({x:-1,y:0}); if(d==='RIGHT' && dir.x===0) setDir({x:1,y:0});
                 })}
                 onClick={() => isPaused && !over && setIsPaused(false)}
            >
                <div className="grid grid-cols-20 grid-rows-20 w-[300px] h-[300px] bg-gray-900/50 relative">
                    <div className="absolute w-[5%] h-[5%] rounded-full bg-red-500 shadow-[0_0_15px_red] animate-pulse" style={{ left: `${food.x * 5}%`, top: `${food.y * 5}%` }} />
                    {snake.map((s, i) => (
                        <div key={i} className={`absolute w-[5%] h-[5%] transition-all duration-150 ${i===0 ? 'z-10 bg-emerald-400' : 'bg-emerald-600'} rounded-sm border border-black/20`} style={{ left: `${s.x * 5}%`, top: `${s.y * 5}%`, boxShadow: i===0 ? '0 0 10px #34d399' : 'none' }}>
                            {i===0 && (<div className="absolute inset-0 flex items-center justify-around px-[1px]"><div className="w-[20%] h-[20%] bg-black rounded-full"></div><div className="w-[20%] h-[20%] bg-black rounded-full"></div></div>)}
                        </div>
                    ))}
                </div>
                {isPaused && !over && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                        <Play size={48} className="text-emerald-400 mb-4 animate-pulse" />
                        <p className="text-white font-bold">点击开始</p>
                    </div>
                )}
            </div>
            <GameOverModal isVisible={over} score={score} onReset={reset} />
        </GameShell>
    );
};

// --- 6. 华容道 (Wooden Tiles) ---
const KlotskiGame = () => {
    const { best, finishGame } = useGameStats(GameType.KLOTSKI);
    const INITIAL_PIECES = [
        { id: 1, type: 'cao', x: 1, y: 0, w: 2, h: 2 },
        { id: 2, type: 'v', x: 0, y: 0, w: 1, h: 2 }, { id: 3, type: 'v', x: 3, y: 0, w: 1, h: 2 },
        { id: 4, type: 'v', x: 0, y: 2, w: 1, h: 2 }, { id: 5, type: 'v', x: 3, y: 2, w: 1, h: 2 },
        { id: 6, type: 'h', x: 1, y: 2, w: 2, h: 1 },
        { id: 7, type: 's', x: 1, y: 3, w: 1, h: 1 }, { id: 8, type: 's', x: 2, y: 3, w: 1, h: 1 },
        { id: 9, type: 's', x: 0, y: 4, w: 1, h: 1 }, { id: 10, type: 's', x: 3, y: 4, w: 1, h: 1 }
    ];
    const [pieces, setPieces] = useStoredState(`${GameType.KLOTSKI}_pieces`, INITIAL_PIECES);
    const [selected, setSelected] = useState<number|null>(null); // Selection is transient
    const [moves, setMoves] = useStoredState(`${GameType.KLOTSKI}_moves`, 0);
    const [won, setWon] = useStoredState(`${GameType.KLOTSKI}_won`, false);

    const reset = () => {
        setPieces(INITIAL_PIECES);
        setMoves(0);
        setWon(false);
        setSelected(null);
    };

    const canMove = (p: any, dx: number, dy: number) => {
        const nx = p.x + dx, ny = p.y + dy;
        if(nx<0 || nx+p.w>4 || ny<0 || ny+p.h>5) return false;
        return !pieces.some(o => o.id!==p.id && !(nx+p.w<=o.x || nx>=o.x+o.w || ny+p.h<=o.y || ny>=o.y+o.h));
    };
    const tryMove = (dx:number, dy:number) => {
        if(selected===null || won) return;
        const p = pieces.find(i=>i.id===selected);
        if(p && canMove(p,dx,dy)) {
            setPieces(pieces.map(i=>i.id===selected?{...i,x:i.x+dx,y:i.y+dy}:i));
            setMoves(m=>m+1); SoundSynthesizer.play('move');
            if(p.type==='cao' && p.x+dx===1 && p.y+dy===3) { setWon(true); SoundSynthesizer.play('win'); finishGame(moves); }
        }
    };

    return (
        <GameShell title="华容道" score={moves} best={best} onReset={reset} colorTheme="wood">
             <div className="relative w-[280px] h-[350px] bg-[#5c3a1a] rounded-xl border-8 border-[#3e2712] shadow-2xl p-1" {...useSwipe(d => {
                 if(d==='UP') tryMove(0,-1); if(d==='DOWN') tryMove(0,1); if(d==='LEFT') tryMove(-1,0); if(d==='RIGHT') tryMove(1,0);
             })}>
                 {pieces.map(p => (
                     <div 
                        key={p.id}
                        onClick={() => { setSelected(p.id); SoundSynthesizer.play('select'); }}
                        className={`absolute rounded-lg flex items-center justify-center font-bold text-lg shadow-md transition-all duration-200 cursor-pointer
                            ${p.type==='cao' ? 'bg-red-800 text-red-100' : 'bg-[#dbb086] text-[#5c3a1a]'}
                            ${selected===p.id ? 'ring-4 ring-yellow-400 z-10 brightness-110' : 'brightness-100'}
                            border-t border-l border-white/20 border-b-2 border-r-2 border-black/30
                        `}
                        style={{ width: p.w*66, height: p.h*66, left: p.x*67, top: p.y*67 }}
                     >
                        {p.type==='cao' ? '曹操' : p.type.startsWith('v') ? '将' : p.type==='h' ? '关羽' : '兵'}
                     </div>
                 ))}
                 <div className="absolute bottom-0 left-[67px] w-[134px] h-2 bg-black/50" />
             </div>
             <GameOverModal isVisible={won} type="win" message={`逃脱成功！步数: ${moves}`} onReset={reset} />
        </GameShell>
    );
};

// --- 7. 消消乐 (Jelly Effect + Gravity) ---
const Match3Game = () => {
    const SIZE = 7;
    const { best, finishGame } = useGameStats(GameType.MATCH3);
    const ITEMS = ['🍎', '🍇', '🍊', '🍋', '🥝', '🫐'];
    const BOMB = '💣';
    const ROCKET = '🚀';
    const ITEM_STYLES: Record<string, string> = {
        '🍎': 'bg-red-500 shadow-[0_4px_0_#b91c1c] border-red-600',
        '🍇': 'bg-purple-500 shadow-[0_4px_0_#7e22ce] border-purple-600',
        '🍊': 'bg-orange-500 shadow-[0_4px_0_#c2410c] border-orange-600',
        '🍋': 'bg-yellow-400 shadow-[0_4px_0_#a16207] border-yellow-500',
        '🥝': 'bg-lime-500 shadow-[0_4px_0_#4d7c0f] border-lime-600',
        '🫐': 'bg-blue-600 shadow-[0_4px_0_#1d4ed8] border-blue-700',
        '💣': 'bg-slate-800 shadow-[0_4px_0_#000] border-slate-900 animate-pulse ring-2 ring-red-500/50',
        '🚀': 'bg-cyan-500 shadow-[0_4px_0_#0e7490] border-cyan-600 animate-pulse ring-2 ring-white/50'
    };

    const [grid, setGrid] = useStoredState<any[]>(`${GameType.MATCH3}_grid`,[]);
    const [score, setScore] = useStoredState<number>(`${GameType.MATCH3}_score`, 0);
    const [gameOver, setGameOver] = useStoredState<boolean>(`${GameType.MATCH3}_over`, false);
    
    const [sel, setSel] = useState<number|null>(null);
    const [explodingIndices, setExplodingIndices] = useState<number[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const getGroups = (g: any[]) => {
        const hMatches: number[][] = []; const vMatches: number[][] = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE - 2; c++) {
                const i = r * SIZE + c; const v = g[i].v;
                if (!v || [BOMB, ROCKET].includes(v)) continue;
                let match = [i]; let k = c + 1;
                while (k < SIZE && g[r * SIZE + k].v === v && ![BOMB, ROCKET].includes(g[r * SIZE + k].v)) { match.push(r * SIZE + k); k++; }
                if (match.length >= 3) { hMatches.push(match); c = k - 1; }
            }
        }
        for (let c = 0; c < SIZE; c++) {
            for (let r = 0; r < SIZE - 2; r++) {
                const i = r * SIZE + c; const v = g[i].v;
                if (!v || [BOMB, ROCKET].includes(v)) continue;
                let match = [i]; let k = r + 1;
                while (k < SIZE && g[k * SIZE + c].v === v && ![BOMB, ROCKET].includes(g[k * SIZE + c].v)) { match.push(k * SIZE + c); k++; }
                if (match.length >= 3) { vMatches.push(match); r = k - 1; }
            }
        }
        const rawGroups = [...hMatches, ...vMatches];
        const mergedGroups: Set<number>[] = [];
        for (const raw of rawGroups) {
             let overlappingSets: Set<number>[] = [];
             for (const set of mergedGroups) { if (raw.some(idx => set.has(idx))) overlappingSets.push(set); }
             if (overlappingSets.length > 0) {
                 const baseSet = overlappingSets[0];
                 raw.forEach(idx => baseSet.add(idx));
                 for (let i = 1; i < overlappingSets.length; i++) {
                     overlappingSets[i].forEach(idx => baseSet.add(idx));
                     const indexToRemove = mergedGroups.indexOf(overlappingSets[i]);
                     if (indexToRemove > -1) mergedGroups.splice(indexToRemove, 1);
                 }
             } else { mergedGroups.push(new Set(raw)); }
        }
        return mergedGroups;
    };

    const hasPossibleMoves = (g: any[]) => {
        if (g.some(c => c.v && [BOMB, ROCKET].includes(c.v))) return true;
        for (let i = 0; i < SIZE * SIZE; i++) {
            if (!g[i].v) continue;
            const r = Math.floor(i / SIZE), c = i % SIZE;
            if (c < SIZE - 1) {
                const right = i + 1;
                [g[i], g[right]] = [g[right], g[i]];
                const groups = getGroups(g);
                [g[i], g[right]] = [g[right], g[i]];
                if (groups.length > 0) return true;
            }
            if (r < SIZE - 1) {
                const down = i + SIZE;
                [g[i], g[down]] = [g[down], g[i]];
                const groups = getGroups(g);
                [g[i], g[down]] = [g[down], g[i]];
                if (groups.length > 0) return true;
            }
        }
        return false;
    };

    const generateItem = () => ITEMS[Math.floor(Math.random()*ITEMS.length)];

    const init = useCallback(() => {
        let g = Array(SIZE*SIZE).fill(0).map((_,i) => ({id:i, v:ITEMS[Math.floor(Math.random()*ITEMS.length)]}));
        while(getGroups(g).length > 0) g = g.map(c=>({...c, v:ITEMS[Math.floor(Math.random()*ITEMS.length)]}));
        setGrid(g); setScore(0); setGameOver(false); setExplodingIndices([]); setIsProcessing(false);
    }, []);

    // Load init
    useEffect(() => { if (grid.length===0) init(); }, []);

    const explode = (idx: number, type: string, g: any[], visited: Set<number> = new Set()) => {
        if (visited.has(idx)) return;
        visited.add(idx);
        const r = Math.floor(idx/SIZE), c = idx%SIZE;
        if (type === BOMB) {
            for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
                const nr = r+dr, nc = c+dc;
                if(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) {
                    const nIdx = nr*SIZE + nc;
                    if (!visited.has(nIdx) && g[nIdx].v && [BOMB, ROCKET].includes(g[nIdx].v)) explode(nIdx, g[nIdx].v, g, visited);
                    else visited.add(nIdx);
                }
            }
        } else if (type === ROCKET) {
            for(let ic=0; ic<SIZE; ic++) {
                const nIdx = r*SIZE + ic;
                if (!visited.has(nIdx) && g[nIdx].v && [BOMB, ROCKET].includes(g[nIdx].v)) explode(nIdx, g[nIdx].v, g, visited);
                else visited.add(nIdx);
            }
            for(let ir=0; ir<SIZE; ir++) {
                const nIdx = ir*SIZE + c;
                if (!visited.has(nIdx) && g[nIdx].v && [BOMB, ROCKET].includes(g[nIdx].v)) explode(nIdx, g[nIdx].v, g, visited);
                else visited.add(nIdx);
            }
        }
    };

    const applyGravity = (g: any[]) => {
        const newGrid = g.map(c => ({ ...c }));
        for (let c = 0; c < SIZE; c++) {
            let colValues = [];
            for (let r = 0; r < SIZE; r++) {
                const val = newGrid[r * SIZE + c].v;
                if (val !== null) colValues.push(val);
            }
            const missing = SIZE - colValues.length;
            const newItems = Array(missing).fill(0).map(() => generateItem());
            const finalCol = [...newItems, ...colValues];
            for (let r = 0; r < SIZE; r++) {
                newGrid[r * SIZE + c].v = finalCol[r];
            }
        }
        return newGrid;
    };

    const handleTap = async (i: number) => {
        if(gameOver || isProcessing) return;
        if ([BOMB, ROCKET].includes(grid[i].v)) {
            setIsProcessing(true);
            const visited = new Set<number>();
            explode(i, grid[i].v, grid, visited);
            await processGravityCycle(Array.from(visited), grid);
            setSel(null);
            return;
        }
        if(sel===null) { setSel(i); SoundSynthesizer.play('select'); return; }
        if(sel===i) { setSel(null); return; }
        const r1=Math.floor(sel/SIZE), c1=sel%SIZE, r2=Math.floor(i/SIZE), c2=i%SIZE;
        if(Math.abs(r1-r2)+Math.abs(c1-c2)===1) {
            setIsProcessing(true);
            let ng = [...grid];
            const t = ng[sel].v; ng[sel].v = ng[i].v; ng[i].v = t;
            setGrid(ng);
            setSel(null); 
            await new Promise(r => setTimeout(r, 200));
            const isSpecial = [BOMB, ROCKET].includes(ng[sel].v) || [BOMB, ROCKET].includes(ng[i].v);
            const groups = getGroups(ng);
            if (isSpecial || groups.length > 0) {
                if (isSpecial) {
                    const visited = new Set<number>();
                    if ([BOMB, ROCKET].includes(ng[sel].v)) explode(sel, ng[sel].v, ng, visited);
                    if ([BOMB, ROCKET].includes(ng[i].v)) explode(i, ng[i].v, ng, visited);
                    await processGravityCycle(Array.from(visited), ng);
                } else {
                    await processTurn(groups, ng, sel, i);
                }
            } else {
                SoundSynthesizer.play('lose');
                ng[i].v = ng[sel].v; ng[sel].v = t;
                setGrid([...ng]); setIsProcessing(false);
            }
        } else {
            setSel(i); SoundSynthesizer.play('select');
        }
    };

    const processTurn = async (groups: Set<number>[], currentGrid: any[], swap1?: number, swap2?: number) => {
        const toRemove = new Set<number>();
        const spawns: { idx: number, type: string }[] = [];
        groups.forEach(groupSet => {
            const groupArr = Array.from(groupSet);
            if (groupArr.every(idx => ![BOMB, ROCKET].includes(currentGrid[idx].v))) {
                let spawnType = null;
                if (groupArr.length >= 5) spawnType = BOMB;
                else if (groupArr.length === 4) spawnType = ROCKET;
                if (spawnType) {
                    let spawnIdx = groupArr[0];
                    if (swap2 !== undefined && groupSet.has(swap2)) spawnIdx = swap2;
                    else if (swap1 !== undefined && groupSet.has(swap1)) spawnIdx = swap1;
                    spawns.push({ idx: spawnIdx, type: spawnType });
                    groupArr.forEach(idx => { if (idx !== spawnIdx) toRemove.add(idx); });
                } else { groupArr.forEach(idx => toRemove.add(idx)); }
            } else { groupArr.forEach(idx => toRemove.add(idx)); }
        });
        spawns.forEach(s => { currentGrid[s.idx].v = s.type; });
        const finalRemovalIndices = Array.from(toRemove).filter(idx => !spawns.some(s => s.idx === idx));
        await processGravityCycle(finalRemovalIndices, currentGrid);
    };

    const processGravityCycle = async (indices: number[], currentGrid: any[]) => {
        let activeGrid = [...currentGrid];
        let removeIndices = indices;
        while (removeIndices.length > 0) {
             setExplodingIndices(removeIndices);
             if (removeIndices.length > 4) { SoundSynthesizer.vibrate([50, 50, 50]); SoundSynthesizer.play('win'); } else { SoundSynthesizer.vibrate(40); SoundSynthesizer.play('pop'); }
             await new Promise(r => setTimeout(r, 300)); 
             const scoreGain = removeIndices.length * 10 + (removeIndices.length > 4 ? 100 : 0);
             setScore(s => s + scoreGain);
             removeIndices.forEach(idx => { activeGrid[idx].v = null; });
             setGrid([...activeGrid]);
             setExplodingIndices([]);
             activeGrid = applyGravity(activeGrid);
             setGrid([...activeGrid]);
             await new Promise(r => setTimeout(r, 300)); 
             const newGroups = getGroups(activeGrid);
             if (newGroups.length > 0) {
                 const nextRemove = new Set<number>();
                 newGroups.forEach(g => g.forEach(idx => nextRemove.add(idx)));
                 removeIndices = Array.from(nextRemove);
             } else { removeIndices = []; }
        }
        setIsProcessing(false);
        if (!hasPossibleMoves(activeGrid)) { setGameOver(true); SoundSynthesizer.play('lose'); finishGame(score); }
    };

    return (
        <GameShell title="消消乐" score={score} best={best} onReset={init} colorTheme="purple">
            <div className="bg-slate-200/50 dark:bg-slate-800/50 p-3 rounded-2xl shadow-inner border border-white/20 backdrop-blur-sm">
                <div className="grid grid-cols-7 gap-1.5">
                    {grid.map((c, i) => (
                        <div 
                            key={i} 
                            onClick={() => handleTap(i)} 
                            className={`
                                w-10 h-10 rounded-lg flex items-center justify-center text-xl cursor-pointer transition-all duration-200 border-b-4 relative overflow-hidden
                                ${c.v ? ITEM_STYLES[c.v] || 'bg-white' : 'bg-transparent border-none shadow-none'}
                                ${explodingIndices.includes(i) 
                                    ? 'scale-150 opacity-0 brightness-200 ring-4 ring-white z-50 transition-all duration-300 ease-out' 
                                    : (sel===i ? 'ring-4 ring-white z-10 scale-110 brightness-110' : 'hover:brightness-110 active:scale-95')
                                }
                            `}
                        >
                            {c.v && (
                                <>
                                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
                                <span className="relative z-10 filter drop-shadow-md">{c.v}</span>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <GameOverModal isVisible={gameOver} type="lose" message="无路可走，死局！" onReset={init} />
        </GameShell>
    );
};

// --- 8. 跑酷 (Side Scrolling) ---
const ParkourGame = () => {
    const { best, finishGame } = useGameStats(GameType.PARKOUR);
    const [y, setY] = useStoredState(`${GameType.PARKOUR}_y`, 0);
    const [vel, setVel] = useStoredState(`${GameType.PARKOUR}_vel`, 0);
    const [obs, setObs] = useStoredState<{x:number, w:number, h:number}[]>(`${GameType.PARKOUR}_obs`, []);
    const [score, setScore] = useStoredState(`${GameType.PARKOUR}_score`, 0);
    const [over, setOver] = useStoredState(`${GameType.PARKOUR}_over`, false);
    const [isPaused, setIsPaused] = useState(true);
    const frame = useRef(0);

    const reset = () => {
        setY(0); setVel(0); setObs([]); setScore(0); setOver(false); setIsPaused(false);
        frame.current = 0;
    };

    useEffect(() => {
        if(over || isPaused) return;
        const loop = setInterval(() => {
            setY(v => { const next = v+vel; if(next<=0){setVel(0); return 0;} setVel(v_=>v_-1.5); return next; });
            setObs(o => {
                const next = o.map(i => ({...i, x:i.x-8})).filter(i => i.x > -50);
                if(frame.current % 40 === 0) next.push({x: 400, w: 25, h: 30 + Math.random()*40});
                return next;
            });
            setScore(s=>s+1); frame.current++;
        }, 30);
        return () => clearInterval(loop);
    }, [vel, over, isPaused]);

    useEffect(() => {
        if(obs.some(o => o.x<60 && o.x>20 && y<o.h)) { setOver(true); SoundSynthesizer.play('lose'); finishGame(score); }
    }, [obs, y, score]);

    return (
        <GameShell title="跑酷" score={score} best={best} onReset={reset} colorTheme="orange">
            <div className="w-full h-64 bg-gradient-to-b from-sky-300 to-sky-100 rounded-2xl overflow-hidden relative shadow-inner border-b-8 border-[#654321] active:cursor-grabbing" 
                 onClick={() => { 
                     if(isPaused && !over) { setIsPaused(false); return; }
                     if(y<=0 && !isPaused) { setVel(18); SoundSynthesizer.play('move'); } 
                 }}>
                <div className="absolute top-4 right-8 w-12 h-12 bg-yellow-300 rounded-full blur-md opacity-80"></div>
                <div className="absolute top-10 left-10 w-20 h-8 bg-white/60 rounded-full blur-sm animate-pulse"></div>
                <div className="absolute left-10 w-8 h-8 bg-gradient-to-tr from-orange-500 to-yellow-400 rounded-lg shadow-lg border-2 border-white flex items-center justify-center transition-transform" style={{ bottom: y, transform: `rotate(${y>0 ? -20 : 0}deg)` }}>
                    <div className="w-5 h-5 bg-white/30 rounded-full"></div>
                </div>
                {obs.map((o,i) => (<div key={i} className="absolute bottom-0 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-lg border-t border-white/20 shadow-lg" style={{ left: o.x, width: o.w, height: o.h }} />))}
                <div className="absolute bottom-0 w-full h-1 bg-[#4ade80]"></div>
                {isPaused && !over && (
                    <div className="absolute inset-0 z-20 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play size={48} className="text-white animate-pulse" />
                    </div>
                )}
            </div>
            <GameOverModal isVisible={over} score={score} onReset={reset} />
        </GameShell>
    );
};

// --- 9. 木鱼 (Zen Mode) ---
const WoodenFishGame = () => {
    const { updateRecord } = useGameStats(GameType.WOODEN_FISH);
    const [cnt, setCnt] = useStoredState(`${GameType.WOODEN_FISH}_cnt`, 0);
    const [scale, setScale] = useState(1);
    const tap = () => { 
        const newCnt = cnt + 1;
        setCnt(newCnt); 
        updateRecord(newCnt); // 实时更新功德记录到数据中心
        setScale(0.95); 
        SoundSynthesizer.play('pop'); 
        setTimeout(() => setScale(1), 100); 
    };
    return (
        <GameShell title="电子木鱼" score={cnt} onReset={() => setCnt(0)} colorTheme="slate">
             <div className="flex flex-col items-center justify-center h-full w-full">
                 <div onClick={tap} className="w-64 h-64 bg-[#2d3748] rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_5px_10px_rgba(255,255,255,0.1)] border-b-8 border-[#1a202c] flex items-center justify-center cursor-pointer transition-transform duration-100 relative group" style={{ transform: `scale(${scale})` }}>
                     <div className="absolute inset-4 rounded-[2.5rem] border-2 border-white/5 pointer-events-none"></div>
                     <div className="w-32 h-20 bg-[#1a202c]/50 rounded-full blur-xl absolute bottom-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <Music size={80} className="text-gray-500 drop-shadow-lg" />
                     <span className="absolute -top-10 text-gray-400 font-bold opacity-0 group-active:opacity-100 group-active:-translate-y-5 transition-all">功德 +1</span>
                 </div>
                 <p className="mt-8 text-gray-500 font-bold uppercase tracking-widest text-xs">点击积累功德</p>
             </div>
        </GameShell>
    );
};

// --- 10. 捏泡泡 (Pop It) ---
const BubbleWrapGame = () => {
    const { updateRecord } = useGameStats(GameType.BUBBLE_WRAP);
    const [b, setB] = useStoredState<number[]>(`${GameType.BUBBLE_WRAP}_b`, Array(24).fill(0));
    
    // 计算已捏数量
    const poppedCount = b.filter(Boolean).length;

    return (
        <GameShell title="捏泡泡" score={poppedCount} onReset={() => setB(Array(24).fill(0))} colorTheme="blue">
            <div className="flex flex-col items-center justify-center h-full w-full">
                <div className="grid grid-cols-4 gap-4 p-6 bg-blue-400 rounded-3xl shadow-2xl border-b-8 border-blue-600">
                    {b.map((v, i) => (
                        <div key={i} onClick={() => { 
                            const nb=[...b]; 
                            if(!nb[i]){ 
                                nb[i]=1; 
                                setB(nb); 
                                updateRecord(poppedCount + 1); // 记录捏泡泡数量
                                SoundSynthesizer.play('pop'); 
                            } 
                        }} className={`w-16 h-16 rounded-full cursor-pointer transition-all duration-200 ${v ? 'bg-blue-800 shadow-[inset_0_5px_10px_rgba(0,0,0,0.5)] scale-95 border-none' : 'bg-blue-300 shadow-[0_5px_0_#1e3a8a,0_10px_10px_rgba(0,0,0,0.3)] hover:bg-blue-200 active:translate-y-1 active:shadow-none'}`} />
                    ))}
                </div>
            </div>
        </GameShell>
    );
};

// --- Main Router ---
export const GameRunner = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const renderGame = () => {
    switch (type) {
      case GameType.GOMOKU: return <GomokuGame />;
      case GameType.MINESWEEPER: return <MinesweeperGame />;
      case GameType.TETRIS: return <TetrisGame />;
      case GameType.KLOTSKI: return <KlotskiGame />;
      case GameType.MATCH3: return <Match3Game />;
      case GameType.SNAKE: return <SnakeGame />;
      case GameType.G2048: return <G2048Game />;
      case GameType.PARKOUR: return <ParkourGame />;
      case GameType.WOODEN_FISH: return <WoodenFishGame />;
      case GameType.BUBBLE_WRAP: return <BubbleWrapGame />;
      default: return <div className="text-gray-400 font-bold animate-pulse">加载游戏中...</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="px-4 py-3 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md z-50 border-b border-gray-100 dark:border-white/5 pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full transition-colors active:scale-90">
            <ChevronLeft size={28} />
        </button>
        <span className="font-black text-gray-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
            <Gamepad2 size={16} className="text-primary" /> 能量电玩
        </span>
        <button 
            onClick={() => setShowHelp(true)}
            className="p-2 -mr-2 text-gray-400 hover:text-primary transition-colors"
        >
            <HelpCircle size={24} />
        </button>
      </div>
      
      {/* Game Content Area */}
      <div className="flex-1 w-full h-full relative">
        {renderGame()}
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowHelp(false)}>
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
               <div className="flex items-center gap-2 mb-4">
                   <Info className="text-primary" size={24} />
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">游戏说明</h3>
               </div>
               <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                   {GAME_RULES[type || ''] || "暂无说明"}
               </div>
               <button 
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
               >
                   知道了
               </button>
           </div>
        </div>
      )}
    </div>
  );
};
