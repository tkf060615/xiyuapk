import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { useApp } from '../context';
import { ChevronLeft, RefreshCw, Flag, AlertTriangle, Skull, Trophy, Play, Pause, Activity, Hash, Grid3X3, Bomb, HelpCircle, Volume2, VolumeX, X, Rocket, Sparkles, RotateCcw, Frown, Music, CircleDashed } from 'lucide-react';

// --- SOUND ENGINE ---
const SoundSynthesizer = {
  ctx: null as AudioContext | null,
  enabled: true,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  play(type: 'move' | 'select' | 'win' | 'lose' | 'score' | 'merge' | 'bomb' | 'jump' | 'special' | 'wood' | 'pop') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'move': 
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'select': 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'score': 
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.setValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'merge': 
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'jump': 
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'bomb': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'special': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.2);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'wood': // Wooden Fish Sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'pop': // Bubble Pop Sound
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'win': 
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); 
        osc.frequency.setValueAtTime(659.25, now + 0.1); 
        osc.frequency.setValueAtTime(783.99, now + 0.2); 
        osc.frequency.setValueAtTime(1046.50, now + 0.3); 
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'lose': 
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.4);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
    }
  }
};

// --- GAME TUTORIAL DATA ---
const GAME_TUTORIALS: Record<string, { title: string, content: string }> = {
  [GameType.SNAKE]: {
    title: '贪吃蛇玩法',
    content: '通过上下左右滑动屏幕控制蛇的移动方向。吃到红色果实（🔴）可以得分并变长。注意不要撞到墙壁或自己的身体，否则游戏结束。'
  },
  [GameType.G2048]: {
    title: '2048玩法',
    content: '滑动屏幕将所有方块向一个方向移动。两个相同数字的方块碰撞时会合并成一个两倍数值的方块（例如 2+2=4）。目标是合成出 2048 方块！当所有格子填满且无法合并时游戏结束。'
  },
  [GameType.MINESWEEPER]: {
    title: '扫雷玩法',
    content: '点击方块“挖开”区域。长按方块可以“插旗”标记地雷。如果挖到雷（💣），游戏结束。方块上的数字表示周围8格内有多少颗雷。'
  },
  [GameType.GOMOKU]: {
    title: '五子棋玩法',
    content: '你执黑子（⚫），电脑执白子（⚪）。双方轮流在棋盘上下子。最先在横、竖、斜方向连成5个同色棋子的一方获胜。'
  },
  [GameType.PARKOUR]: {
    title: '跑酷玩法',
    content: '点击屏幕任意位置让角色跳跃。躲避地面上的障碍物。坚持的时间越长，分数越高。注意：随着时间推移，速度可能会略微加快！'
  },
  [GameType.MATCH3]: {
    title: '消消乐玩法',
    content: '点击选中水果，再次点击相邻水果交换。凑齐3个消除。4个消除生成【火箭】，可消除整行或整列；T/L型消除生成【炸弹】，消除周围区域；5个消除生成【彩虹】，与任意水果交换可消除同类水果！若无步可走则判负。'
  },
  [GameType.WOODEN_FISH]: {
    title: '电子木鱼玩法',
    content: '点击屏幕上的木鱼，积攒赛博功德。每次点击都会伴随清脆的敲击声和震动反馈，帮助你平心静气。'
  },
  [GameType.BUBBLE_WRAP]: {
    title: '捏泡泡玩法',
    content: '点击泡泡即可“捏破”它，享受解压的音效和触感。点击重置按钮可以恢复所有泡泡，无限畅玩。'
  }
};

// --- UTILS ---
const useGameStats = (type: string) => {
  const { incrementStat } = useApp();
  
  const recordPlay = (score?: number) => {
    incrementStat('totalGamesPlayed');
    
    // Update local detailed records
    try {
        const records = JSON.parse(localStorage.getItem('game_records') || '{}');
        const gameRec = records[type] || { played: 0, maxScore: 0 };
        
        gameRec.played += 1;
        if (score !== undefined) {
            gameRec.maxScore = Math.max(gameRec.maxScore, score);
        }
        
        records[type] = gameRec;
        localStorage.setItem('game_records', JSON.stringify(records));
    } catch(e) {
        console.error("Failed to save game stats", e);
    }
  };

  return { recordPlay };
};

function usePersistentState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  }, [key, state]);

  return [state, setState] as const;
}

const useSwipe = (onSwipe: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void) => {
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    SoundSynthesizer.init(); 
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) { 
      if (absDx > absDy) {
        onSwipe(dx > 0 ? 'RIGHT' : 'LEFT');
      } else {
        onSwipe(dy > 0 ? 'DOWN' : 'UP');
      }
    }
    touchStart.current = null;
  };

  return { onTouchStart, onTouchEnd };
};

// --- MINESWEEPER ---
type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborCount: number;
};
type MinesweeperState = {
  grid: Cell[][];
  gameState: 'playing' | 'won' | 'lost';
  minesLeft: number;
  difficulty: 'easy' | 'medium' | 'hard';
};
const DIFFICULTY_MINES = {
  easy: { rows: 8, cols: 8, mines: 8 },
  medium: { rows: 10, cols: 10, mines: 15 },
  hard: { rows: 12, cols: 12, mines: 24 },
};

const MinesweeperGame = () => {
  const { recordPlay } = useGameStats(GameType.MINESWEEPER);
  const [state, setState] = usePersistentState<MinesweeperState>('game_mem_minesweeper', {
    grid: [],
    gameState: 'playing',
    minesLeft: 0,
    difficulty: 'easy'
  });
  const [mode, setMode] = useState<'dig' | 'flag'>('dig'); 
  const longPressTimer = useRef<any>(null);

  useEffect(() => { if (state.grid.length === 0) initGame(state.difficulty); }, []);

  const initGame = useCallback((diff: 'easy' | 'medium' | 'hard') => {
    const config = DIFFICULTY_MINES[diff];
    const newGrid: Cell[][] = [];
    for (let r = 0; r < config.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < config.cols; c++) {
        row.push({ row: r, col: c, isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0 });
      }
      newGrid.push(row);
    }
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      if (!newGrid[r][c].isMine) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }
    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          directions.forEach(([dr, dc]) => {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && newGrid[nr][nc].isMine) count++;
          });
          newGrid[r][c].neighborCount = count;
        }
      }
    }
    setState({ grid: newGrid, gameState: 'playing', minesLeft: config.mines, difficulty: diff });
    SoundSynthesizer.play('move');
  }, [setState]);

  const toggleFlag = (r: number, c: number) => {
    const cell = state.grid[r][c];
    if (cell.isRevealed) return;

    // Use immutable update pattern to correctly update state
    const newGrid = state.grid.map((row, rowIndex) => 
      rowIndex === r 
        ? row.map((cell, colIndex) => colIndex === c ? { ...cell, isFlagged: !cell.isFlagged } : cell)
        : row
    );

    const wasFlagged = cell.isFlagged;
    
    setState(prev => ({ 
      ...prev, 
      grid: newGrid, 
      // If it was flagged, we are unflagging (+1 mine left). If unflagged, we flag (-1 mine left).
      minesLeft: wasFlagged ? prev.minesLeft + 1 : prev.minesLeft - 1 
    }));
    
    SoundSynthesizer.play('select');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const handleInteractionStart = (r: number, c: number) => {
    if (state.gameState !== 'playing') return;
    longPressTimer.current = setTimeout(() => {
        toggleFlag(r, c);
        longPressTimer.current = null; // Mark as handled
    }, 400); // 400ms long press
  };

  const handleInteractionEnd = (r: number, c: number, isTouch: boolean) => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        // If timer was still running, it means it's a short tap -> Reveal
        handleCellClick(r, c);
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (state.gameState !== 'playing') return;
    const cell = state.grid[r][c];

    if (mode === 'flag') {
      toggleFlag(r, c);
      return;
    }
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.isMine) {
      // Reveal mines visually
      const newGrid = state.grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
      setState({ ...state, grid: newGrid, gameState: 'lost' });
      SoundSynthesizer.play('bomb');
      SoundSynthesizer.play('lose');
      recordPlay(0); // Record game play on loss
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(200);
    } else {
      revealCells(r, c);
      SoundSynthesizer.play('move');
    }
  };

  const revealCells = (startR: number, startC: number) => {
    const newGrid = JSON.parse(JSON.stringify(state.grid)); // Deep copy
    const config = DIFFICULTY_MINES[state.difficulty];
    const stack = [[startR, startC]];

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (newGrid[r][c].isRevealed) continue;
      newGrid[r][c].isRevealed = true;
      newGrid[r][c].isFlagged = false;
      if (newGrid[r][c].neighborCount === 0) {
        const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        directions.forEach(([dr, dc]) => {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && !newGrid[nr][nc].isRevealed && !newGrid[nr][nc].isMine) stack.push([nr, nc]);
        });
      }
    }
    
    let revealedCount = 0;
    newGrid.forEach((row: Cell[]) => row.forEach((cell: Cell) => { if (cell.isRevealed) revealedCount++; }));
    const hasWon = revealedCount === (config.rows * config.cols - config.mines);
    
    if (hasWon) {
      recordPlay(config.rows * config.cols); // Use total cells as score for win
      SoundSynthesizer.play('win');
    }
    setState({ ...state, grid: newGrid, gameState: hasWon ? 'won' : 'playing' });
  };

  if (!state.grid || state.grid.length === 0) return <div>Loading...</div>;
  const currentConfig = DIFFICULTY_MINES[state.difficulty];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full justify-center">
      <div className="w-full glass-panel p-4 rounded-xl shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => initGame(d)} className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all active:scale-95 ${state.difficulty === d ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d}</button>
            ))}
          </div>
          <button onClick={() => initGame(state.difficulty)} className="active:rotate-180 transition-transform duration-300"><RefreshCw size={18} className="text-gray-500 hover:text-primary" /></button>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg"><AlertTriangle size={18} /> {state.minesLeft}</div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               <button onClick={() => setMode('dig')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'dig' ? 'bg-white dark:bg-gray-600 shadow-sm text-primary' : 'text-gray-400'}`}>挖开</button>
               <button onClick={() => setMode('flag')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${mode === 'flag' ? 'bg-white dark:bg-gray-600 shadow-sm text-red-500' : 'text-gray-400'}`}>插旗</button>
            </div>
        </div>
      </div>
      
      <div className="relative p-2 glass-panel rounded-2xl shadow-2xl w-full max-w-[360px]">
        {/* Force Aspect Ratio Square */}
        <div className="grid gap-[2px] select-none touch-none mx-auto w-full aspect-square" 
           style={{ 
             gridTemplateColumns: `repeat(${currentConfig.cols}, 1fr)`, 
             gridTemplateRows: `repeat(${currentConfig.rows}, 1fr)` 
           }}>
          {state.grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} 
              onMouseDown={() => handleInteractionStart(r, c)}
              onMouseUp={() => handleInteractionEnd(r, c, false)}
              onMouseLeave={() => { if(longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } }}
              onTouchStart={() => handleInteractionStart(r, c)}
              onTouchEnd={(e) => { e.preventDefault(); handleInteractionEnd(r, c, true); }}
              className={`w-full h-full flex items-center justify-center font-bold text-sm cursor-pointer rounded-[2px] transition-all duration-100
                ${cell.isRevealed 
                   ? (cell.isMine 
                        ? 'bg-red-500 shadow-none' 
                        : 'bg-gray-100 dark:bg-white/5 shadow-inner border border-black/5 dark:border-white/5') 
                   : 'bg-blue-400 dark:bg-slate-600 shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.2),inset_2px_2px_0_rgba(255,255,255,0.3)] active:bg-blue-500 active:shadow-none'}
              `}
            >
              {cell.isRevealed 
                ? (cell.isMine 
                    ? <Skull size="60%" className="text-white animate-pulse"/> 
                    : (cell.neighborCount > 0 
                        ? <span style={{fontSize: '90%'}} className={['text-gray-500', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-700', 'text-orange-700'][cell.neighborCount]}>{cell.neighborCount}</span> 
                        : '')) 
                : (cell.isFlagged 
                    ? <Flag size="50%" className="text-red-600 fill-red-600 drop-shadow-sm animate-bounce-in" /> 
                    : '')}
            </div>
          )))}
        </div>
        
        {state.gameState !== 'playing' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[3px] rounded-2xl">
             <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in border border-white/20">
                <div className={`text-5xl mb-4 ${state.gameState === 'won' ? 'animate-bounce' : 'animate-pulse'}`}>
                    {state.gameState === 'won' ? '🏆' : '💥'}
                </div>
                <h3 className={`text-2xl font-bold mb-6 ${state.gameState === 'won' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {state.gameState === 'won' ? '恭喜获胜！' : '游戏结束'}
                </h3>
                <button onClick={() => initGame(state.difficulty)} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform active:scale-95">再来一局</button>
             </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs text-gray-400 font-medium">长按方块可快速插旗</p>
    </div>
  );
};

// --- GOMOKU ---
type GomokuState = { board: number[]; player: number; winner: number; difficulty: 'easy' | 'normal' | 'hard'; };
const GomokuGame = () => {
  const { recordPlay } = useGameStats(GameType.GOMOKU);
  const SIZE = 13; 
  const [state, setState] = usePersistentState<GomokuState>('game_mem_gomoku', { board: Array(SIZE * SIZE).fill(0), player: 1, winner: 0, difficulty: 'normal' });

  // Improved Win Check
  const checkWin = (b: number[], p: number) => {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r * SIZE + c] !== p) continue;
        for (const [dr, dc] of dirs) {
          let count = 1;
          for (let k = 1; k < 5; k++) {
            const nr = r + dr * k, nc = c + dc * k;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr * SIZE + nc] === p) count++; else break;
          }
          if (count >= 5) return true;
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (state.player === 2 && state.winner === 0) {
      const timer = setTimeout(makeAiMove, 600);
      return () => clearTimeout(timer);
    }
  }, [state.player, state.winner]);

  // --- HEURISTIC AI ---
  const evaluateMove = (board: number[], move: number, player: number) => {
    let score = 0;
    const r = Math.floor(move / SIZE);
    const c = move % SIZE;
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];

    const centerDist = Math.abs(r - 6) + Math.abs(c - 6);
    score += (12 - centerDist);

    for (const [dr, dc] of dirs) {
      let count = 1;
      let blocked = 0;
      
      for (let k = 1; k < 5; k++) {
        const nr = r + dr * k, nc = c + dc * k;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) { blocked++; break; }
        const val = board[nr * SIZE + nc];
        if (val === player) count++;
        else if (val !== 0) { blocked++; break; }
        else break; 
      }
      
      for (let k = 1; k < 5; k++) {
        const nr = r - dr * k, nc = c - dc * k;
        if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) { blocked++; break; }
        const val = board[nr * SIZE + nc];
        if (val === player) count++;
        else if (val !== 0) { blocked++; break; }
        else break; 
      }

      if (count >= 5) score += 100000;
      else if (count === 4 && blocked === 0) score += 10000; // Open 4
      else if (count === 4 && blocked === 1) score += 1000;  // Closed 4
      else if (count === 3 && blocked === 0) score += 1000;  // Open 3
      else if (count === 3 && blocked === 1) score += 100;
      else if (count === 2 && blocked === 0) score += 50;
    }
    return score;
  };

  const makeAiMove = () => {
    const available = state.board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (available.length === 0) return;

    let bestMove = available[0];
    let maxScore = -1;

    if (state.difficulty === 'easy') {
       if (Math.random() > 0.5) {
         bestMove = available[Math.floor(Math.random() * available.length)];
       } else {
         for (const move of available) {
             const temp = [...state.board];
             temp[move] = 1; 
             if (checkWin(temp, 1)) { bestMove = move; break; }
         }
       }
    } else {
       for (const move of available) {
           const attackScore = evaluateMove(state.board, move, 2);
           const defenseScore = evaluateMove(state.board, move, 1);
           
           let totalScore = attackScore + defenseScore;
           
           if (state.difficulty === 'hard') {
               if (attackScore < 90000 && defenseScore > 500) {
                   totalScore = attackScore + (defenseScore * 1.1);
               }
           }
           if (state.difficulty === 'normal') totalScore += Math.random() * 10;
           
           if (totalScore > maxScore) {
               maxScore = totalScore;
               bestMove = move;
           }
       }
    }

    const newBoard = [...state.board];
    newBoard[bestMove] = 2;
    const hasWon = checkWin(newBoard, 2);
    
    setState({ ...state, board: newBoard, player: 1, winner: hasWon ? 2 : 0 });
    SoundSynthesizer.play(hasWon ? 'lose' : 'move');
    if (hasWon) {
        // AI wins
        recordPlay(0); // Record game played (score 0 for loss)
    }
  };

  const handleUserClick = (i: number) => {
    SoundSynthesizer.init();
    if (state.board[i] !== 0 || state.winner !== 0 || state.player !== 1) return;
    const newBoard = [...state.board];
    newBoard[i] = 1;
    SoundSynthesizer.play('select');
    
    const hasWon = checkWin(newBoard, 1);
    if (hasWon) { recordPlay(1); SoundSynthesizer.play('win'); } // Win, score 1
    
    setState({ ...state, board: newBoard, player: hasWon ? 1 : 2, winner: hasWon ? 1 : 0 });
  };

  const reset = (diff?: 'easy' | 'normal' | 'hard') => { 
    setState({ board: Array(SIZE * SIZE).fill(0), winner: 0, player: 1, difficulty: diff || state.difficulty });
    SoundSynthesizer.play('move');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full max-w-sm glass-panel p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center">
         <div className="flex gap-1">
            {(['easy', 'normal', 'hard'] as const).map(d => (
              <button key={d} onClick={() => reset(d)} className={`px-3 py-1 text-xs rounded-full capitalize transition-all ${state.difficulty === d ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>{d}</button>
            ))}
         </div>
         <span className="text-sm font-bold text-gray-500">{state.winner ? (state.winner === 1 ? "你赢了!" : "电脑获胜") : (state.player === 1 ? "你的回合" : "电脑思考中...")}</span>
      </div>
      <div className="relative w-full max-w-[360px] aspect-square bg-[#e6cba5] rounded-lg shadow-2xl p-4 border-[6px] border-[#d5b081] shadow-black/20 overflow-hidden">
         <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, gridTemplateRows: `repeat(${SIZE}, 1fr)` }}>
            {state.board.map((cell, i) => (
              <div key={i} onClick={() => handleUserClick(i)} className="relative flex items-center justify-center cursor-pointer">
                <div className="absolute w-full h-[1px] bg-gray-700/30 z-0"></div>
                <div className="absolute h-full w-[1px] bg-gray-700/30 z-0"></div>
                {((i % SIZE === 3 || i % SIZE === 9 || i % SIZE === 6) && (Math.floor(i/SIZE) === 3 || Math.floor(i/SIZE) === 9 || Math.floor(i/SIZE) === 6)) && (<div className="absolute w-1.5 h-1.5 rounded-full bg-gray-700/50 z-0" />)}
                {cell !== 0 && (<div className={`w-[85%] h-[85%] rounded-full z-10 shadow-[3px_3px_5px_rgba(0,0,0,0.4),inset_-2px_-2px_6px_rgba(0,0,0,0.2),inset_2px_2px_6px_rgba(255,255,255,0.3)] transition-all duration-300 animate-[drop_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)] ${cell === 1 ? 'bg-gradient-to-br from-gray-800 to-black' : 'bg-gradient-to-br from-white to-gray-200'}`} />)}
              </div>
            ))}
         </div>
         {state.winner !== 0 && (<div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-lg"><button onClick={() => reset()} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-2xl animate-bounce">再来一局</button></div>)}
      </div>
      <style>{`@keyframes drop { 0% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
};

// --- SNAKE ---
type SnakeState = { snake: {x:number, y:number}[]; food: {x:number, y:number}; score: number; highScore: number; gameOver: boolean; paused: boolean; };
const SnakeGame = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const GRID = 20;
  const [state, setState] = usePersistentState<SnakeState>('game_mem_snake', { snake: [{ x: 10, y: 10 }], food: { x: 15, y: 15 }, score: 0, highScore: 0, gameOver: false, paused: true });
  const [dir, setDir] = useState({ x: 0, y: 0 });

  const { onTouchStart, onTouchEnd } = useSwipe((d) => {
    if (state.paused && !state.gameOver) setState({ ...state, paused: false });
    if (d === 'UP' && dir.y !== 1) setDir({x:0, y:-1});
    if (d === 'DOWN' && dir.y !== -1) setDir({x:0, y:1});
    if (d === 'LEFT' && dir.x !== 1) setDir({x:-1, y:0});
    if (d === 'RIGHT' && dir.x !== -1) setDir({x:1, y:0});
  });

  const moveSnake = useCallback(() => {
    if (state.gameOver || state.paused || (dir.x === 0 && dir.y === 0)) return;
    
    setState(prev => {
      const head = { x: prev.snake[0].x + dir.x, y: prev.snake[0].y + dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || prev.snake.some(s => s.x === head.x && s.y === head.y)) {
        onGameOver(prev.score); 
        SoundSynthesizer.play('lose');
        return { ...prev, gameOver: true };
      }
      
      const newSnake = [head, ...prev.snake];
      let newFood = prev.food;
      let newScore = prev.score;
      let newHighScore = prev.highScore;

      if (head.x === prev.food.x && head.y === prev.food.y) {
        newScore += 1;
        newHighScore = Math.max(newScore, newHighScore);
        newFood = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        SoundSynthesizer.play('score');
      } else { 
        newSnake.pop(); 
      }
      return { ...prev, snake: newSnake, food: newFood, score: newScore, highScore: newHighScore };
    });
  }, [dir, onGameOver, state.gameOver, state.paused]);

  useEffect(() => { const i = setInterval(moveSnake, 130); return () => clearInterval(i); }, [moveSnake]);

  const resetGame = () => {
    setState({ snake: [{x:10,y:10}], food: { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }, score: 0, highScore: state.highScore, gameOver: false, paused: false });
    setDir({x:0, y:0});
    SoundSynthesizer.play('move');
  };

  return (
    <div className="flex flex-col items-center w-full select-none h-full justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-4 text-xl font-bold dark:text-white flex justify-between w-full max-w-[350px]">
         <div className="flex gap-4">
            <span className="bg-white/50 px-3 py-1 rounded-full text-sm">分数: {state.score}</span>
            <span className="bg-yellow-100/50 px-3 py-1 rounded-full text-sm text-yellow-700">最高: {state.highScore}</span>
         </div>
         <button onClick={() => setState({...state, paused: !state.paused})} className="p-1 rounded-full bg-white/50">{state.paused ? <Play size={20}/> : <Pause size={20}/>}</button>
      </div>
      <div className="relative w-full max-w-[350px] aspect-square bg-gray-800/80 backdrop-blur-md rounded-xl p-1 border-4 border-gray-600 shadow-2xl overflow-hidden">
        {state.gameOver && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white font-bold z-10 backdrop-blur-sm"><h2 className="text-3xl mb-4">游戏结束</h2><button onClick={resetGame} className="bg-primary px-6 py-2 rounded-full shadow-lg">重试</button></div>}
        {state.paused && !state.gameOver && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white z-10"><div className="text-center animate-pulse"><p className="text-2xl font-bold mb-2">已暂停</p><p className="text-sm opacity-80">点击或滑动继续</p></div></div>)}
        {state.snake.map((s, i) => (<div key={i} className="absolute rounded-sm shadow-sm border border-green-400" style={{ backgroundColor: i === 0 ? '#4ade80' : '#22c55e', zIndex: i === 0 ? 5 : 2, left: `${(s.x/GRID)*100}%`, top: `${(s.y/GRID)*100}%`, width: `${100/GRID}%`, height: `${100/GRID}%` }} />))}
        <div className="absolute bg-red-500 rounded-full animate-pulse shadow-md shadow-red-500/50" style={{ left: `${(state.food.x/GRID)*100}%`, top: `${(state.food.y/GRID)*100}%`, width: `${100/GRID}%`, height: `${100/GRID}%` }} />
      </div>
      <p className="mt-4 text-gray-400 text-xs">滑动屏幕控制方向</p>
    </div>
  );
};

// --- 2048 ---
type State2048 = { board: number[]; score: number; bestScore: number; gameOver: boolean; hasWon: boolean; };
const Game2048 = ({ onMove }: { onMove: (score: number) => void }) => {
  const [state, setState] = usePersistentState<State2048>('game_mem_2048', { board: Array(16).fill(0), score: 0, bestScore: 0, gameOver: false, hasWon: false });

  useEffect(() => { if (state.board.every(n => n === 0)) init(); }, []);

  const init = () => {
     const b = Array(16).fill(0);
     addNum(b); addNum(b);
     setState({ board: b, score: 0, bestScore: state.bestScore, gameOver: false, hasWon: false });
     SoundSynthesizer.play('move');
  };

  const addNum = (b: number[]) => {
    const empty = b.map((v,i)=>v===0?i:-1).filter(i=>i!==-1);
    if(empty.length) b[empty[Math.floor(Math.random()*empty.length)]] = Math.random()>.9 ? 4 : 2;
  };

  const checkGameOver = (b: number[]) => {
    // 1. If any cell is 0, game is not over
    if (b.includes(0)) return false;
    
    // 2. Check adjacent cells for merges
    for (let i = 0; i < 16; i++) {
        const val = b[i];
        const r = Math.floor(i / 4);
        const c = i % 4;

        // Check Right
        if (c < 3 && val === b[i + 1]) return false;
        // Check Down
        if (r < 3 && val === b[i + 4]) return false;
    }
    return true;
  };

  const slideRow = (row: number[], updateScore: (n: number) => void) => {
    let arr = row.filter(val => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        updateScore(arr[i]);
        arr[i + 1] = 0; 
      }
    }
    arr = arr.filter(val => val !== 0);
    while (arr.length < 4) arr.push(0);
    return arr;
  };

  const move = (dir: number) => { 
    if(state.gameOver) return;
    let newBoard = [...state.board];
    let changed = false;
    let gainedScore = 0;
    const rotateRight = (b: number[]) => {
        const res = Array(16).fill(0);
        for(let r=0; r<4; r++) for(let c=0; c<4; c++) res[c*4+(3-r)] = b[r*4+c];
        return res;
    };
    let rotations = 0;
    if (dir === 1) rotations = 3; if (dir === 2) rotations = 2; if (dir === 3) rotations = 1; 
    for(let i=0; i<rotations; i++) newBoard = rotateRight(newBoard);
    for(let r=0; r<4; r++) {
       const rowStart = r * 4;
       const row = newBoard.slice(rowStart, rowStart + 4);
       const newRow = slideRow(row, (s) => gainedScore += s);
       for(let c=0; c<4; c++) {
         if (newBoard[rowStart + c] !== newRow[c]) changed = true;
         newBoard[rowStart + c] = newRow[c];
       }
    }
    const rotationsBack = (4 - rotations) % 4;
    for(let i=0; i<rotationsBack; i++) newBoard = rotateRight(newBoard);

    if (changed) {
       addNum(newBoard);
       const newScore = state.score + gainedScore;
       const newBest = Math.max(newScore, state.bestScore);
       let hasWon = state.hasWon;
       let isGameOver = false;

       if (newBoard.includes(2048) && !hasWon) { hasWon = true; SoundSynthesizer.play('win'); }
       
       if (checkGameOver(newBoard)) {
           isGameOver = true;
           SoundSynthesizer.play('lose');
           onMove(newScore); // Save score
       }

       setState({ ...state, board: newBoard, score: newScore, bestScore: newBest, hasWon, gameOver: isGameOver });
       SoundSynthesizer.play(gainedScore > 0 ? 'merge' : 'move');
       if (!isGameOver) onMove(newScore);
    }
  };

  const { onTouchStart, onTouchEnd } = useSwipe((d) => {
    if(d==='LEFT') move(0); if(d==='UP') move(1); if(d==='RIGHT') move(2); if(d==='DOWN') move(3);
  });

  const getColor = (v: number) => {
    const colors: Record<number, string> = {
      2: 'bg-white text-gray-800 border-gray-200', 4: 'bg-orange-100 text-gray-800 border-orange-200', 8: 'bg-orange-300 text-white border-orange-400', 16: 'bg-orange-500 text-white border-orange-600', 32: 'bg-red-400 text-white border-red-500', 64: 'bg-red-600 text-white border-red-700', 128: 'bg-yellow-300 text-white shadow-lg shadow-yellow-500/50', 256: 'bg-yellow-400 text-white shadow-lg shadow-yellow-500/50', 512: 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/50', 1024: 'bg-yellow-600 text-white shadow-xl', 2048: 'bg-yellow-700 text-white shadow-2xl'
    };
    return colors[v] || 'bg-black text-white';
  };
  const getTextSize = (v: number) => { if (v > 1000) return 'text-xl'; if (v > 100) return 'text-2xl'; return 'text-3xl'; };

  return (
    <div className="flex flex-col items-center select-none h-full justify-center w-full relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
       <div className="flex justify-between w-full max-w-[350px] mb-6 items-center">
          <div className="text-3xl font-bold bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg">2048</div>
          <div className="flex gap-2">
            <div className="flex flex-col items-center glass-panel px-3 py-1 rounded-xl min-w-[70px]"><span className="text-[10px] text-gray-400 font-bold tracking-widest">SCORE</span><span className="text-xl font-bold dark:text-white">{state.score}</span></div>
             <div className="flex flex-col items-center glass-panel px-3 py-1 rounded-xl min-w-[70px]"><span className="text-[10px] text-gray-400 font-bold tracking-widest">BEST</span><span className="text-xl font-bold dark:text-white">{state.bestScore}</span></div>
          </div>
          <button onClick={init} className="bg-white p-3 rounded-full shadow hover:bg-gray-100 transition-colors"><RefreshCw size={20} className="text-primary"/></button>
       </div>
       <div className="w-full max-w-[350px] aspect-square bg-gray-300/50 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20 grid grid-cols-4 grid-rows-4 gap-3 relative">
          {state.board.map((v, i) => (<div key={i} className={`w-full h-full flex items-center justify-center font-bold rounded-xl shadow-sm transition-all duration-200 border overflow-hidden ${v === 0 ? 'bg-gray-200/50 border-transparent' : getColor(v)} ${v > 0 ? 'scale-100 opacity-100' : 'scale-100 opacity-100'} ${getTextSize(v)}`}>{v > 0 && v}</div>))}
          
          {state.gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl">
                <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in border border-white/20">
                    <h3 className="text-3xl font-bold mb-4 text-red-500">游戏结束</h3>
                    <p className="text-gray-500 mb-6 font-bold">最终得分: {state.score}</p>
                    <button onClick={init} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform active:scale-95">再来一局</button>
                </div>
            </div>
          )}
       </div>
       <p className="mt-6 text-gray-400 text-sm font-medium">滑动屏幕移动合并方块</p>
    </div>
  );
};

// --- MATCH 3 (Fruit Edition) ---
type SpecialType = 'NONE' | 'ROW' | 'COL' | 'BOMB' | 'RAINBOW';
type Match3Cell = {
  type: string;
  special: SpecialType;
  id: number; 
};
type Match3State = { board: Match3Cell[]; score: number; gameOver: boolean; };

const Match3Game = () => {
  const { recordPlay } = useGameStats(GameType.MATCH3);
  const WIDTH = 8;
  const FRUITS = ['🍎', '🍊', '🍇', '🍌', '🥥', '🍉'];
  const [state, setState] = usePersistentState<Match3State>('game_mem_match3_v7', { board: [], score: 0, gameOver: false });
  const [selected, setSelected] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchedIndices, setMatchedIndices] = useState<Set<number>>(new Set());
  const nextId = useRef(0);

  const getNextId = () => {
    nextId.current += 1;
    return nextId.current;
  };

  const createRandomCell = (special: SpecialType = 'NONE', forcedType?: string): Match3Cell => ({
    type: forcedType || FRUITS[Math.floor(Math.random() * FRUITS.length)],
    special,
    id: getNextId()
  });

  // Init Board
  useEffect(() => { 
    if (state.board.length === 0) {
        initGame();
    }
    setIsProcessing(false); // Reset lock on mount
  }, []);

  const initGame = () => {
      const b: Match3Cell[] = [];
      for(let i=0; i<WIDTH*WIDTH; i++) b.push(createRandomCell());
      setState({ board: b, score: 0, gameOver: false });
      setSelected(null);
      setMatchedIndices(new Set());
      setIsProcessing(false);
      SoundSynthesizer.play('move');
  };

  // --- GAME LOGIC FUNCTIONS ---
  
  const getSpecialAffectedIndices = (idx: number, type: SpecialType, board: Match3Cell[]) => {
     const indices: number[] = [];
     if (type === 'ROW') {
         const rowStart = Math.floor(idx / WIDTH) * WIDTH;
         for (let i=0; i<WIDTH; i++) indices.push(rowStart + i);
     } else if (type === 'COL') {
         const col = idx % WIDTH;
         for (let i=0; i<WIDTH; i++) indices.push(i * WIDTH + col);
     } else if (type === 'BOMB') {
         const r = Math.floor(idx / WIDTH);
         const c = idx % WIDTH;
         for(let dr=-1; dr<=1; dr++) {
             for(let dc=-1; dc<=1; dc++) {
                 const nr = r+dr, nc = c+dc;
                 if(nr>=0 && nr<WIDTH && nc>=0 && nc<WIDTH) indices.push(nr*WIDTH+nc);
             }
         }
     } else if (type === 'RAINBOW') {
         const r = Math.floor(idx / WIDTH);
         const c = idx % WIDTH;
         for(let dr=-1; dr<=1; dr++) {
             for(let dc=-1; dc<=1; dc++) {
                 const nr = r+dr, nc = c+dc;
                 if(nr>=0 && nr<WIDTH && nc>=0 && nc<WIDTH) indices.push(nr*WIDTH+nc);
             }
         }
     }
     return indices;
  };

  const findMatches = (board: Match3Cell[]) => {
    const matches = new Set<number>();
    const specialCreations: { idx: number, type: SpecialType }[] = [];

    // Horizontal
    for(let i=0; i<64; i++) {
       if(i % WIDTH < WIDTH-2) {
         if(board[i].type === board[i+1].type && board[i].type === board[i+2].type && board[i].type !== '') {
            let matchLen = 3;
            while(i % WIDTH + matchLen < WIDTH && board[i].type === board[i+matchLen].type) matchLen++;
            
            for(let k=0; k<matchLen; k++) matches.add(i+k);
            if (matchLen >= 5) specialCreations.push({ idx: i + 2, type: 'RAINBOW' });
            else if (matchLen === 4) specialCreations.push({ idx: i + 1, type: 'ROW' });
         }
       }
    }

    // Vertical
    for(let i=0; i<WIDTH*(WIDTH-2); i++) {
        if(board[i].type === board[i+WIDTH].type && board[i].type === board[i+WIDTH*2].type && board[i].type !== '') {
            let matchLen = 3;
            while(i + WIDTH*matchLen < 64 && board[i].type === board[i+WIDTH*matchLen].type) matchLen++;
            
            for(let k=0; k<matchLen; k++) matches.add(i+WIDTH*k);
            if (matchLen >= 5) specialCreations.push({ idx: i + WIDTH*2, type: 'RAINBOW' });
            else if (matchLen === 4) specialCreations.push({ idx: i + WIDTH*1, type: 'COL' });
        }
    }
    
    // Expand Matches (Chain Reactions)
    const expandedMatches = new Set(matches);
    const toProcess = Array.from(matches);
    
    let head = 0;
    while(head < toProcess.length) {
        const idx = toProcess[head++];
        const cell = board[idx];
        if (cell.special !== 'NONE') {
            const extra = getSpecialAffectedIndices(idx, cell.special, board);
            extra.forEach(eIdx => {
                if (!expandedMatches.has(eIdx)) {
                    expandedMatches.add(eIdx);
                    toProcess.push(eIdx);
                }
            });
        }
    }

    return { matches: expandedMatches, specialCreations };
  };

  const applyMatches = (board: Match3Cell[], matches: Set<number>, specialCreations: { idx: number, type: SpecialType }[]) => {
      const newB = [...board];
      // Create specials
      specialCreations.forEach(sc => {
          if (sc.type !== 'NONE') {
              matches.delete(sc.idx); 
              newB[sc.idx] = createRandomCell(sc.type, board[sc.idx].type);
          }
      });
      // Clear matched
      matches.forEach(idx => {
          newB[idx] = { ...newB[idx], type: '' };
      });
      return newB;
  };

  const fillBoard = (b: Match3Cell[]) => {
    const newB = [...b];
    for(let i=0; i<WIDTH; i++) {
       let emptySlots = 0;
       for(let j=WIDTH-1; j>=0; j--) {
          const idx = j*WIDTH + i;
          if(newB[idx].type === '') { 
              emptySlots++; 
          } else if(emptySlots > 0) { 
              newB[(j+emptySlots)*WIDTH + i] = newB[idx]; 
              newB[idx] = { ...newB[idx], type: '' }; 
          }
       }
       for(let j=0; j<emptySlots; j++) {
           const specialChance = Math.random();
           let special: SpecialType = 'NONE';
           if (specialChance > 0.97) special = 'BOMB'; 
           else if (specialChance > 0.94) special = 'ROW';
           newB[j*WIDTH+i] = createRandomCell(special);
       }
    }
    return newB;
  };

  // Check if any valid move exists
  const hasValidMoves = (currentBoard: Match3Cell[]) => {
    // If board is empty/processing, assume valid
    if(currentBoard.length === 0) return true;

    // 1. Rainbows are wildcards, so almost always valid unless board empty
    if (currentBoard.some(c => c.special === 'RAINBOW')) return true;

    // 2. Brute force check all swaps
    for(let i=0; i<64; i++) {
        const r = Math.floor(i/WIDTH);
        const c = i % WIDTH;

        // Try Right
        if (c < WIDTH - 1) {
            const right = i + 1;
            // Swap
            const b1 = [...currentBoard];
            [b1[i], b1[right]] = [b1[right], b1[i]];
            if (findMatches(b1).matches.size > 0) return true;
        }

        // Try Down
        if (r < WIDTH - 1) {
            const down = i + WIDTH;
            const b2 = [...currentBoard];
            [b2[i], b2[down]] = [b2[down], b2[i]];
            if (findMatches(b2).matches.size > 0) return true;
        }
    }
    return false;
  };

  // --- GAME LOOP ---
  useEffect(() => {
     if (state.board.length === 0 || state.gameOver) return;

     let timer: any;
     const processGame = async () => {
         const { matches, specialCreations } = findMatches(state.board);
         
         if (matches.size > 0) {
             setIsProcessing(true);
             
             // 1. Highlight Matches (Visual Feedback)
             setMatchedIndices(matches);
             await new Promise(r => setTimeout(r, 300)); // Show feedback animation

             // 2. Clear & Score
             const clearedBoard = applyMatches(state.board, matches, specialCreations);
             setState(prev => ({ ...prev, board: clearedBoard, score: prev.score + matches.size * 10 }));
             setMatchedIndices(new Set()); // Clear highlights
             
             SoundSynthesizer.play('merge');
             if (specialCreations.length > 0) SoundSynthesizer.play('special');

             // 3. Fill
             await new Promise(r => setTimeout(r, 200));
             const filledBoard = fillBoard(clearedBoard);
             setState(prev => ({ ...prev, board: filledBoard }));
             
         } else {
             // Stable state
             setIsProcessing(false);
             setMatchedIndices(new Set());
             
             // Deadlock check
             if (!hasValidMoves(state.board)) {
                 setState(prev => ({ ...prev, gameOver: true }));
                 SoundSynthesizer.play('lose');
                 recordPlay(state.score);
             } else {
                 // Save progress
                 recordPlay(state.score); 
             }
         }
     };

     if (isProcessing || findMatches(state.board).matches.size > 0) {
         timer = setTimeout(processGame, 100);
     }

     return () => clearTimeout(timer);
  }, [state.board]);

  const handleTap = async (i: number) => {
    if(isProcessing || state.gameOver) return;
    SoundSynthesizer.init();
    
    if(selected === null) {
      setSelected(i);
      SoundSynthesizer.play('select');
    } else {
      if (selected === i) {
          setSelected(null);
          return;
      }

      const diff = Math.abs(selected - i);
      const isAdjacent = (diff === 1 && Math.floor(selected/WIDTH) === Math.floor(i/WIDTH)) || diff === WIDTH;
      
      if(isAdjacent) {
        // Tentative Swap
        let newB = [...state.board];
        [newB[selected], newB[i]] = [newB[i], newB[selected]];
        
        setState(prev => ({ ...prev, board: newB }));
        setSelected(null);
        SoundSynthesizer.play('move');

        // Check Validity
        const cellA = state.board[selected];
        const cellB = state.board[i];
        
        const isRainbowSwap = cellA.special === 'RAINBOW' || cellB.special === 'RAINBOW';
        
        if (isRainbowSwap) {
             setIsProcessing(true);
             const rainbowIdx = cellA.special === 'RAINBOW' ? i : selected;
             const targetIdx = cellA.special === 'RAINBOW' ? selected : i;
             const targetColor = newB[targetIdx].type;
             
             // Rainbow Feedback
             const toClear = new Set<number>();
             toClear.add(rainbowIdx);
             newB.forEach((c, idx) => { if(c.type === targetColor) toClear.add(idx); });
             setMatchedIndices(toClear);
             
             await new Promise(r => setTimeout(r, 400));
             
             const finalB = [...newB];
             toClear.forEach(idx => { finalB[idx] = { ...finalB[idx], type: '' }; });
             
             setState(prev => ({ ...prev, board: finalB, score: prev.score + toClear.size * 20 }));
             setMatchedIndices(new Set());
             SoundSynthesizer.play('special');
             return;
        }

        const { matches } = findMatches(newB);
        if (matches.size > 0) {
            setIsProcessing(true); 
        } else {
            // INVALID MOVE - UNDO
            setIsProcessing(true); 
            await new Promise(r => setTimeout(r, 250));
            SoundSynthesizer.play('lose'); 
            
            const revertedB = [...newB];
            [revertedB[selected], revertedB[i]] = [revertedB[i], revertedB[selected]];
            setState(prev => ({ ...prev, board: revertedB }));
            setIsProcessing(false);
        }
      } else {
        setSelected(i);
        SoundSynthesizer.play('select');
      }
    }
  };

  const getSpecialIcon = (special: SpecialType) => {
      switch(special) {
          case 'BOMB': return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><Bomb size={24} className="text-gray-900 drop-shadow-md animate-pulse" /></div>;
          case 'ROW': return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><Rocket size={24} className="text-white drop-shadow-md rotate-90" /></div>;
          case 'COL': return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><Rocket size={24} className="text-white drop-shadow-md" /></div>;
          case 'RAINBOW': return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"><Sparkles size={28} className="text-yellow-200 drop-shadow-lg animate-spin" /></div>;
          default: return null;
      }
  };

  const getSpecialStyle = (special: SpecialType) => {
      switch(special) {
          case 'BOMB': return 'bg-gray-400/50 ring-2 ring-gray-600';
          case 'ROW': return 'bg-blue-400/50 ring-2 ring-blue-300';
          case 'COL': return 'bg-blue-400/50 ring-2 ring-blue-300';
          case 'RAINBOW': return 'bg-gradient-to-br from-red-400 via-yellow-400 to-purple-500 opacity-90 ring-2 ring-white';
          default: return '';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full relative">
      <div className="flex justify-between w-full max-w-[350px] mb-4 glass-panel p-3 rounded-2xl items-center">
        <h2 className="text-xl font-bold dark:text-white px-2">消消乐</h2>
        <div className="flex gap-3 items-center">
            <div className="bg-primary/10 px-4 py-1 rounded-full text-primary font-mono text-xl font-bold">{state.score}</div>
            <button onClick={initGame} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:text-primary active:rotate-180 transition-all"><RotateCcw size={18} /></button>
        </div>
      </div>
      
      <div className="relative">
         <div className="grid grid-cols-8 gap-0.5 bg-white/30 dark:bg-gray-800/30 p-1.5 rounded-2xl shadow-xl backdrop-blur-md border border-white/40 aspect-square mx-auto" style={{ width: '100%', maxWidth: '380px' }}>
            {state.board.map((cell, i) => (
            <div key={`${cell.id}-${i}`} onClick={() => handleTap(i)} 
                className={`w-full h-full flex items-center justify-center text-3xl rounded-md cursor-pointer transition-all duration-300 select-none relative
                ${selected === i ? 'bg-white/80 shadow-[0_0_15px_rgba(255,255,255,0.8)] scale-110 z-20 ring-4 ring-primary' : 'hover:bg-white/20 active:scale-95'} 
                ${cell.type === '' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                ${matchedIndices.has(i) ? 'scale-0 opacity-0 bg-white/50 rotate-180' : ''} 
                ${getSpecialStyle(cell.special)}
                `}>
                <span className={`drop-shadow-sm transition-transform duration-300 ${matchedIndices.has(i) ? 'scale-150' : ''}`}>{cell.type}</span>
                {getSpecialIcon(cell.special)}
            </div>
            ))}
         </div>

         {state.gameOver && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[3px] rounded-2xl">
             <div className="bg-white/90 dark:bg-gray-800/90 p-6 rounded-3xl shadow-2xl flex flex-col items-center animate-fade-in border border-white/20">
                <div className="text-5xl mb-4 animate-bounce"><Frown size={48} className="text-gray-400"/></div>
                <h3 className="text-2xl font-bold mb-2 text-red-500">无步可走</h3>
                <p className="text-gray-500 mb-6 font-bold">最终得分: {state.score}</p>
                <button onClick={initGame} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/30 hover:scale-105 transition-transform active:scale-95">再来一局</button>
             </div>
          </div>
         )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 h-12 justify-start w-full relative">
         <div className="absolute top-0 w-full flex justify-center">
            {isProcessing && <div className="text-primary font-bold animate-pulse text-sm bg-white/50 px-3 py-1 rounded-full shadow-sm">消除中...</div>}
         </div>
      </div>
    </div>
  );
};

// --- PARKOUR ---
type ParkourState = { highScore: number; };
const ParkourGame = () => {
  const { recordPlay } = useGameStats(GameType.PARKOUR);
  const [state, setState] = usePersistentState<ParkourState>('game_mem_parkour', { highScore: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState<{id: number, x: number}[]>([]);
  const gameRef = useRef({ velocity: 0, gravity: 0.6, gameLoop: 0, dinoY: 0, isPlaying: false });

  const jump = () => {
    SoundSynthesizer.init();
    if(gameRef.current.dinoY <= 0.5 && gameRef.current.isPlaying) {
      gameRef.current.velocity = 11; 
      SoundSynthesizer.play('jump');
    } else if(!gameRef.current.isPlaying) {
      startGame();
    }
  };

  const startGame = () => {
    setIsPlaying(true);
    gameRef.current.isPlaying = true;
    setScore(0);
    setObstacles([{id: 1, x: 100}]);
    gameRef.current.velocity = 0;
    gameRef.current.dinoY = 0;
    setDinoY(0);
    gameRef.current.gameLoop = requestAnimationFrame(update);
    recordPlay(0);
    SoundSynthesizer.play('move');
  };

  const update = () => {
    if(!gameRef.current.isPlaying) return;

    gameRef.current.velocity -= gameRef.current.gravity;
    let newY = gameRef.current.dinoY + gameRef.current.velocity;
    if(newY <= 0) { newY = 0; gameRef.current.velocity = 0; }
    gameRef.current.dinoY = newY;
    setDinoY(newY);

    setObstacles(prev => {
       const next = prev.map(o => ({...o, x: o.x - 0.9})).filter(o => o.x > -10); 
       if(prev.length === 0 || (prev[prev.length-1].x < 55 && Math.random() < 0.02)) {
          next.push({id: Date.now(), x: 100});
       }
       if(next.length === 0) next.push({id: Date.now(), x: 100});
       const dinoLeft = 10; const dinoRight = 18; const obsWidth = 8;
       const hit = next.some(o => { return (o.x < dinoRight && (o.x + obsWidth) > dinoLeft) && gameRef.current.dinoY < 10; });
       if(hit) {
          gameRef.current.isPlaying = false;
          setIsPlaying(false);
          setScore(currentScore => {
             recordPlay(currentScore);
             if (currentScore > state.highScore) setState({ highScore: currentScore });
             return currentScore;
          });
          cancelAnimationFrame(gameRef.current.gameLoop);
          SoundSynthesizer.play('lose');
       }
       return next;
    });

    setScore(s => {
       if (s % 100 === 0 && s > 0) SoundSynthesizer.play('score');
       return s + 1;
    });
    if(gameRef.current.isPlaying) gameRef.current.gameLoop = requestAnimationFrame(update);
  };

  useEffect(() => { return () => cancelAnimationFrame(gameRef.current.gameLoop); }, []);

  return (
    <div className="flex flex-col items-center w-full h-full justify-center" onClick={jump}>
       <div className="flex justify-between w-full max-w-[600px] mb-2 px-2"><div className="text-gray-500 font-bold">最高分: {state.highScore}</div></div>
       <div className="w-full max-w-[600px] h-64 bg-white/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden relative border-b-8 border-gray-300 dark:border-gray-600 shadow-2xl select-none backdrop-blur-sm">
          <div className="absolute top-4 right-4 text-2xl font-mono font-bold text-gray-400">{score}</div>
          <div className="absolute left-[10%] w-10 h-10 bg-primary rounded-lg transition-transform duration-75 shadow-lg shadow-primary/40 flex items-center justify-center" style={{ bottom: `${dinoY * 3}px` }}><Activity className="text-white" size={24} /></div>
          {obstacles.map(o => (<div key={o.id} className="absolute bottom-0 w-8 h-12 bg-gray-600 dark:bg-gray-400 rounded-t-lg shadow-md" style={{ left: `${o.x}%` }} />))}
          {!isPlaying && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm z-10"><button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-white text-primary px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"><Play size={20} fill="currentColor" /> {score > 0 ? '重试' : '开始游戏'}</button></div>)}
       </div>
       <p className="mt-6 text-gray-400 font-medium">点击屏幕跳跃</p>
    </div>
  );
};

// --- WOODEN FISH (Digital Merit) ---
const WoodenFishGame = () => {
  const { recordPlay } = useGameStats(GameType.WOODEN_FISH);
  const [count, setCount] = useState(() => {
    const saved = localStorage.getItem('game_wooden_fish_count');
    return saved ? parseInt(saved) : 0;
  });
  const [animating, setAnimating] = useState(false);
  const [floats, setFloats] = useState<{id: number, x: number, y: number}[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('game_wooden_fish_count', count.toString());
  }, [count]);

  const tap = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default to avoid double firing on touch devices if mixed events
    // e.preventDefault(); 
    
    SoundSynthesizer.init();
    SoundSynthesizer.play('wood');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);

    setAnimating(true);
    setTimeout(() => setAnimating(false), 100);

    setCount(c => {
        const newC = c + 1;
        // Record play occasionally to track usage
        if (newC % 10 === 0) recordPlay(newC);
        return newC;
    });

    // Float Animation
    const id = idRef.current++;
    // Get click position or random position near center
    let clientX, clientY;
    if ('touches' in e) {
       clientX = e.touches[0].clientX;
       clientY = e.touches[0].clientY;
    } else {
       clientX = (e as React.MouseEvent).clientX;
       clientY = (e as React.MouseEvent).clientY;
    }
    
    // Adjust relative to container center if desired, or just use click pos
    // Using click pos is more dynamic
    setFloats(prev => [...prev, { id, x: clientX, y: clientY }]);
    setTimeout(() => {
        setFloats(prev => prev.filter(f => f.id !== id));
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full select-none" onTouchStart={(e) => { /* prevent zoom */ }}>
       <div className="absolute top-8 text-center">
          <p className="text-gray-500 font-bold mb-1 uppercase tracking-widest text-xs">当前功德</p>
          <h2 className="text-5xl font-mono font-bold text-gray-800 dark:text-white tabular-nums">{count}</h2>
       </div>

       <div 
         className={`
            w-64 h-64 bg-amber-800 rounded-full shadow-[0_20px_50px_-12px_rgba(146,64,14,0.5)]
            flex items-center justify-center cursor-pointer
            relative transition-transform duration-100
            ${animating ? 'scale-95' : 'scale-100'}
         `}
         onMouseDown={tap}
         onTouchStart={tap}
       >
          <div className="w-56 h-56 bg-amber-700 rounded-full shadow-inner border-4 border-amber-900/30 flex items-center justify-center relative overflow-hidden">
             {/* Simple Wood Texture CSS */}
             <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,#fff,transparent)]"></div>
             {/* "Eye" of the wooden fish */}
             <div className="w-32 h-2 bg-black/20 rounded-full absolute top-1/3"></div>
             <div className="w-40 h-2 bg-black/20 rounded-full absolute bottom-1/3"></div>
             <Music size={80} className="text-amber-900/40" />
          </div>
       </div>

       <p className="mt-12 text-gray-400 font-medium animate-pulse">点击积攒功德</p>

       {/* Floating Text Container */}
       {floats.map(f => (
           <div 
             key={f.id}
             className="fixed text-xl font-bold text-white pointer-events-none animate-float-up z-50"
             style={{ left: f.x, top: f.y, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
           >
             功德 +1
           </div>
       ))}
       <style>{`
         @keyframes floatUp {
           0% { opacity: 1; transform:translate(-50%, -50%) scale(1); }
           100% { opacity: 0; transform:translate(-50%, -150px) scale(1.5); }
         }
         .animate-float-up {
           animation: floatUp 0.8s ease-out forwards;
         }
       `}</style>
    </div>
  );
};

// --- BUBBLE WRAP ---
const BubbleWrapGame = () => {
    const { recordPlay } = useGameStats(GameType.BUBBLE_WRAP);
    const ROWS = 8;
    const COLS = 6;
    const [bubbles, setBubbles] = useState<boolean[]>(Array(ROWS * COLS).fill(false)); // false = unpopped

    const pop = (index: number) => {
        if (bubbles[index]) return; // Already popped

        SoundSynthesizer.init();
        SoundSynthesizer.play('pop');
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(50);

        const newB = [...bubbles];
        newB[index] = true;
        setBubbles(newB);
        
        // Check complete
        if (newB.every(b => b)) {
            recordPlay(100);
        }
    };

    const reset = () => {
        setBubbles(Array(ROWS * COLS).fill(false));
        SoundSynthesizer.play('move');
    };

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="flex justify-between w-full max-w-[320px] mb-4">
                 <h2 className="text-xl font-bold dark:text-white">捏泡泡</h2>
                 <button onClick={reset} className="p-2 bg-white/50 dark:bg-gray-800/50 rounded-full hover:bg-white hover:shadow-md transition-all text-gray-600 dark:text-gray-300">
                    <RefreshCw size={20} />
                 </button>
            </div>

            <div className="glass-panel p-4 rounded-2xl shadow-xl bg-blue-50/50 dark:bg-gray-800/50">
                <div className="grid grid-cols-6 gap-3">
                    {bubbles.map((popped, i) => (
                        <button
                            key={i}
                            onMouseDown={() => pop(i)}
                            onTouchStart={(e) => { e.preventDefault(); pop(i); }}
                            className={`
                                w-10 h-10 rounded-full transition-all duration-200 relative
                                flex items-center justify-center
                                ${popped 
                                    ? 'bg-blue-100/30 shadow-inner scale-90' 
                                    : 'bg-gradient-to-br from-blue-100 to-blue-300 shadow-[2px_4px_6px_rgba(0,0,0,0.1),inset_2px_2px_4px_rgba(255,255,255,0.8)] hover:scale-105 active:scale-95 cursor-pointer'
                                }
                            `}
                        >
                            {!popped && <div className="absolute top-2 left-2 w-3 h-2 bg-white/60 rounded-full rotate-45 blur-[1px]"></div>}
                        </button>
                    ))}
                </div>
            </div>
            
            <p className="mt-6 text-gray-400 text-sm font-medium">解压神器，尽情释放</p>
        </div>
    );
};


// --- MAIN RUNNER ---
export const GameRunner = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { recordPlay } = useGameStats(type || '');
  const [showTutorial, setShowTutorial] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    SoundSynthesizer.enabled = !SoundSynthesizer.enabled;
    setSoundEnabled(SoundSynthesizer.enabled);
  };

  const renderGame = () => {
    switch (type) {
      case GameType.SNAKE: return <SnakeGame onGameOver={recordPlay} />;
      case GameType.G2048: return <Game2048 onMove={(s) => {}} />;
      case GameType.MINESWEEPER: return <MinesweeperGame />;
      case GameType.GOMOKU: return <GomokuGame />;
      case GameType.PARKOUR: return <ParkourGame />;
      case GameType.MATCH3: return <Match3Game />;
      case GameType.WOODEN_FISH: return <WoodenFishGame />;
      case GameType.BUBBLE_WRAP: return <BubbleWrapGame />;
      default: return <div>Game not found</div>;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 flex items-center justify-between z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/games')} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 glass-panel rounded-full hover:bg-white/40 transition-colors">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-xl font-bold ml-4 text-gray-800 dark:text-white capitalize drop-shadow-sm">{type === GameType.WOODEN_FISH ? '电子木鱼' : type === GameType.BUBBLE_WRAP ? '捏泡泡' : type}</h1>
        </div>
        <div className="flex gap-2">
           <button onClick={toggleSound} className="p-2 glass-panel rounded-full text-gray-600 dark:text-gray-300">
             {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
           </button>
           <button onClick={() => setShowTutorial(true)} className="p-2 glass-panel rounded-full text-gray-600 dark:text-gray-300">
             <HelpCircle size={24} />
           </button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4 relative w-full">
        {renderGame()}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && type && GAME_TUTORIALS[type] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full relative">
            <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
              <HelpCircle size={20} />
              {GAME_TUTORIALS[type].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {GAME_TUTORIALS[type].content}
            </p>
            <button onClick={() => setShowTutorial(false)} className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-bold">
              明白了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};