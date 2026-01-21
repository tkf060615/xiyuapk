import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { useApp } from '../context';
import { ChevronLeft, RefreshCw, Flag, AlertTriangle, Skull, Trophy, Play, Pause, Activity, Hash, Grid3X3, Bomb, Save, HelpCircle, Volume2, VolumeX, X } from 'lucide-react';

// --- SOUND ENGINE (Synthesizer) ---
// Using Web Audio API to generate retro 8-bit sounds without external assets
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

  play(type: 'move' | 'select' | 'win' | 'lose' | 'score' | 'merge' | 'bomb' | 'jump') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'move': // Short blip
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'select': // High blip
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'score': // Coin sound
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.setValueAtTime(2000, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'merge': // 2048 merge / Match3 pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'jump': // Parkour jump
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'bomb': // Explosion noise
        // Noise buffer is complex, simulate with low square wave
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'win': // Fanfare
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'lose': // Sad slide
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
    content: '滑动屏幕将所有方块向一个方向移动。两个相同数字的方块碰撞时会合并成一个两倍数值的方块（例如 2+2=4）。目标是合成出 2048 方块！'
  },
  [GameType.MINESWEEPER]: {
    title: '扫雷玩法',
    content: '点击方块“挖开”区域。如果挖到雷（💣），游戏结束。方块上的数字表示周围8格内有多少颗雷。使用“插旗”模式标记你认为有雷的地方。'
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
    content: '点击两个相邻的水果进行交换。如果交换后横向或纵向有3个或以上相同的水果连成一线，它们就会消除并得分。达成连击可以获得更多分数！'
  }
};

// --- UTILS ---
const useGameStats = (type: string) => {
  const { incrementStat } = useApp();
  const recordPlay = () => incrementStat('totalGamesPlayed');
  return { recordPlay };
};

// Generic Hook for Persistence
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
    SoundSynthesizer.init(); // Initialize audio context on first user interaction
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
// ... (Types kept same as before)
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

  const handleCellClick = (r: number, c: number) => {
    if (state.gameState !== 'playing') return;
    const cell = state.grid[r][c];

    if (mode === 'flag') {
      if (cell.isRevealed) return;
      const newGrid = [...state.grid];
      newGrid[r][c].isFlagged = !cell.isFlagged;
      setState({ ...state, grid: newGrid, minesLeft: cell.isFlagged ? state.minesLeft + 1 : state.minesLeft - 1 });
      SoundSynthesizer.play('select');
      return;
    }
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.isMine) {
      const newGrid = state.grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
      setState({ ...state, grid: newGrid, gameState: 'lost' });
      SoundSynthesizer.play('bomb');
      SoundSynthesizer.play('lose');
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
      recordPlay();
      SoundSynthesizer.play('win');
    }
    setState({ ...state, grid: newGrid, gameState: hasWon ? 'won' : 'playing' });
  };

  if (!state.grid || state.grid.length === 0) return <div>Loading...</div>;
  const currentConfig = DIFFICULTY_MINES[state.difficulty];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full justify-center">
      <div className="w-full glass-panel p-4 rounded-xl shadow-lg mb-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => initGame(d)} className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors ${state.difficulty === d ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d}</button>
            ))}
          </div>
          <button onClick={() => initGame(state.difficulty)}><RefreshCw size={18} className="text-gray-500 hover:text-primary transition-colors" /></button>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-red-500"><AlertTriangle size={20} /> {state.minesLeft}</div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               <button onClick={() => setMode('dig')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${mode === 'dig' ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-400'}`}>挖开</button>
               <button onClick={() => setMode('flag')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${mode === 'flag' ? 'bg-white dark:bg-gray-600 shadow text-red-500' : 'text-gray-400'}`}>插旗</button>
            </div>
        </div>
      </div>
      
      <div className="relative w-full aspect-square max-w-[360px]">
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-800/40 p-2 rounded-xl backdrop-blur-sm select-none touch-none shadow-inner grid gap-[2px]" 
           style={{ gridTemplateColumns: `repeat(${currentConfig.cols}, 1fr)`, gridTemplateRows: `repeat(${currentConfig.rows}, 1fr)` }}>
          {state.grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} 
              className={`w-full h-full flex items-center justify-center font-bold text-sm cursor-pointer rounded-sm shadow-sm transition-transform active:scale-95
                ${cell.isRevealed ? (cell.isMine ? 'bg-red-500' : 'bg-white/60 dark:bg-gray-800') : 'bg-blue-300 dark:bg-blue-800 hover:opacity-90'}`}>
              {cell.isRevealed 
                ? (cell.isMine ? <Skull size="60%" className="text-white"/> : (cell.neighborCount > 0 ? <span style={{fontSize: '70%'}} className={['text-gray-500', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500'][cell.neighborCount] || 'text-purple-500'}>{cell.neighborCount}</span> : '')) 
                : (cell.isFlagged ? <Flag size="60%" className="text-red-600 fill-red-600" /> : '')}
            </div>
          )))}
        </div>
        {state.gameState !== 'playing' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-xl">
             <div className="glass-panel p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in">
                <h3 className={`text-2xl font-bold mb-4 ${state.gameState === 'won' ? 'text-green-500' : 'text-red-500'}`}>{state.gameState === 'won' ? '恭喜获胜！' : '游戏结束'}</h3>
                <button onClick={() => initGame(state.difficulty)} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg">再来一局</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- GOMOKU ---
type GomokuState = { board: number[]; player: number; winner: number; difficulty: 'easy' | 'normal' | 'hard'; };
const GomokuGame = () => {
  const { recordPlay } = useGameStats(GameType.GOMOKU);
  const SIZE = 13; 
  const [state, setState] = usePersistentState<GomokuState>('game_mem_gomoku', { board: Array(SIZE * SIZE).fill(0), player: 1, winner: 0, difficulty: 'normal' });

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

  const makeAiMove = () => {
    const available = state.board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (available.length === 0) return;
    let bestMove = available[Math.floor(Math.random() * available.length)];
    if (state.difficulty !== 'easy') {
       for (const move of available) {
         const temp = [...state.board];
         temp[move] = 2; if (checkWin(temp, 2)) { bestMove = move; break; } 
         temp[move] = 1; if (checkWin(temp, 1)) { bestMove = move; break; }
       }
    }
    const newBoard = [...state.board];
    newBoard[bestMove] = 2;
    const hasWon = checkWin(newBoard, 2);
    
    setState({ ...state, board: newBoard, player: 1, winner: hasWon ? 2 : 0 });
    SoundSynthesizer.play(hasWon ? 'lose' : 'move');
  };

  const handleUserClick = (i: number) => {
    SoundSynthesizer.init();
    if (state.board[i] !== 0 || state.winner !== 0 || state.player !== 1) return;
    const newBoard = [...state.board];
    newBoard[i] = 1;
    SoundSynthesizer.play('select');
    
    const hasWon = checkWin(newBoard, 1);
    if (hasWon) { recordPlay(); SoundSynthesizer.play('win'); }
    
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
const SnakeGame = ({ onGameOver }: { onGameOver: () => void }) => {
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
        onGameOver(); 
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
const Game2048 = ({ onMove }: { onMove: () => void }) => {
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
       if (newBoard.includes(2048) && !hasWon) { hasWon = true; SoundSynthesizer.play('win'); }
       setState({ ...state, board: newBoard, score: newScore, bestScore: newBest, hasWon });
       SoundSynthesizer.play(gainedScore > 0 ? 'merge' : 'move');
       onMove();
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
    <div className="flex flex-col items-center select-none h-full justify-center w-full" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
       <div className="flex justify-between w-full max-w-[350px] mb-6 items-center">
          <div className="text-3xl font-bold bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg">2048</div>
          <div className="flex gap-2">
            <div className="flex flex-col items-center glass-panel px-3 py-1 rounded-xl min-w-[70px]"><span className="text-[10px] text-gray-400 font-bold tracking-widest">SCORE</span><span className="text-xl font-bold dark:text-white">{state.score}</span></div>
             <div className="flex flex-col items-center glass-panel px-3 py-1 rounded-xl min-w-[70px]"><span className="text-[10px] text-gray-400 font-bold tracking-widest">BEST</span><span className="text-xl font-bold dark:text-white">{state.bestScore}</span></div>
          </div>
          <button onClick={init} className="bg-white p-3 rounded-full shadow hover:bg-gray-100 transition-colors"><RefreshCw size={20} className="text-primary"/></button>
       </div>
       <div className="w-full max-w-[350px] aspect-square bg-gray-300/50 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/20 grid grid-cols-4 grid-rows-4 gap-3">
          {state.board.map((v, i) => (<div key={i} className={`w-full h-full flex items-center justify-center font-bold rounded-xl shadow-sm transition-all duration-200 border overflow-hidden ${v === 0 ? 'bg-gray-200/50 border-transparent' : getColor(v)} ${v > 0 ? 'scale-100 opacity-100' : 'scale-100 opacity-100'} ${getTextSize(v)}`}>{v > 0 && v}</div>))}
       </div>
       <p className="mt-6 text-gray-400 text-sm font-medium">滑动屏幕移动合并方块</p>
    </div>
  );
};

// --- MATCH 3 (Fruit Edition) ---
type Match3State = { board: string[]; score: number; };
const Match3Game = () => {
  const { recordPlay } = useGameStats(GameType.MATCH3);
  const WIDTH = 8;
  const FRUITS = ['🍎', '🍊', '🍇', '🍌', '🥥', '🍉'];
  const [state, setState] = usePersistentState<Match3State>('game_mem_match3', { board: [], score: 0 });
  const [selected, setSelected] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { if (state.board.length === 0) createBoard(); }, []);

  const createBoard = () => {
    const b = [];
    for(let i=0; i<WIDTH*WIDTH; i++) b.push(FRUITS[Math.floor(Math.random() * FRUITS.length)]);
    setState({ ...state, board: b });
  };

  const checkForMatches = useCallback(() => {
    const board = state.board;
    if (board.length === 0) return false;
    const matches = new Set<number>();
    
    for(let i=0; i<64; i++) {
       if(i%WIDTH < WIDTH-2) {
         if(board[i] === board[i+1] && board[i] === board[i+2] && board[i] !== '') { matches.add(i); matches.add(i+1); matches.add(i+2); }
       }
       if(i < WIDTH*(WIDTH-2)) {
         if(board[i] === board[i+WIDTH] && board[i] === board[i+WIDTH*2] && board[i] !== '') { matches.add(i); matches.add(i+WIDTH); matches.add(i+WIDTH*2); }
       }
    }
    
    if(matches.size > 0) {
      setIsProcessing(true);
      const newB = [...board];
      matches.forEach(idx => newB[idx] = '');
      setState(prev => ({ ...prev, board: newB, score: prev.score + matches.size * 10 }));
      SoundSynthesizer.play('merge');
      setTimeout(() => fillBoard(newB), 300);
      recordPlay();
      return true;
    }
    setIsProcessing(false);
    return false;
  }, [state.board]);

  const fillBoard = (b: string[]) => {
    const newB = [...b];
    for(let i=0; i<WIDTH; i++) {
       let emptySlots = 0;
       for(let j=WIDTH-1; j>=0; j--) {
          const idx = j*WIDTH + i;
          if(newB[idx] === '') { emptySlots++; } else if(emptySlots > 0) { newB[(j+emptySlots)*WIDTH + i] = newB[idx]; newB[idx] = ''; }
       }
       for(let j=0; j<emptySlots; j++) newB[j*WIDTH+i] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    }
    setState(prev => ({ ...prev, board: newB }));
  };

  useEffect(() => { 
    if(state.board.length && !selected && !isProcessing) {
        const t = setTimeout(() => checkForMatches(), 250);
        return () => clearTimeout(t);
    }
  }, [state.board, selected, isProcessing]);

  const handleDrag = (i: number) => {
    SoundSynthesizer.init();
    if(isProcessing) return;
    if(selected === null) {
      setSelected(i);
      SoundSynthesizer.play('select');
    } else {
      const diff = Math.abs(selected - i);
      const validSwap = (diff === 1 && Math.floor(selected/WIDTH) === Math.floor(i/WIDTH)) || diff === WIDTH;
      
      if(validSwap) {
        const newB = [...state.board];
        const temp = newB[selected];
        newB[selected] = newB[i];
        newB[i] = temp;
        setState({ ...state, board: newB });
        setSelected(null);
        SoundSynthesizer.play('move');
      } else {
        setSelected(i);
        SoundSynthesizer.play('select');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="flex justify-between w-full max-w-[350px] mb-4 glass-panel p-3 rounded-2xl items-center">
        <h2 className="text-xl font-bold dark:text-white px-2">消消乐</h2>
        <div className="bg-primary/10 px-4 py-1 rounded-full text-primary font-mono text-xl font-bold">{state.score}</div>
      </div>
      <div className="grid grid-cols-8 gap-1 bg-white/40 p-3 rounded-2xl shadow-xl backdrop-blur-md border border-white/40" style={{ width: '100%', maxWidth: '360px', aspectRatio: '1/1' }}>
        {state.board.map((fruit, i) => (
          <div key={i} onClick={() => handleDrag(i)} className={`w-full h-full flex items-center justify-center text-2xl rounded-lg cursor-pointer transition-all duration-200 select-none ${selected === i ? 'bg-white shadow-lg scale-110 ring-2 ring-primary z-10' : 'hover:bg-white/20'} ${fruit === '' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
             {fruit}
          </div>
        ))}
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
    recordPlay();
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
      case GameType.G2048: return <Game2048 onMove={() => {}} />;
      case GameType.MINESWEEPER: return <MinesweeperGame />;
      case GameType.GOMOKU: return <GomokuGame />;
      case GameType.PARKOUR: return <ParkourGame />;
      case GameType.MATCH3: return <Match3Game />;
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
          <h1 className="text-xl font-bold ml-4 text-gray-800 dark:text-white capitalize drop-shadow-sm">{type}</h1>
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