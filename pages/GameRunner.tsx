import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { useApp } from '../context';
import { ChevronLeft, RefreshCw, Flag, AlertTriangle, Skull, Trophy, Play, Pause, Activity, Hash, Grid3X3, Bomb, HelpCircle, Volume2, VolumeX, X, Rocket, Sparkles, RotateCcw, Frown, Music, CircleDashed, LayoutGrid } from 'lucide-react';

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
      case 'wood':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      case 'pop':
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
  },
  [GameType.TETRIS]: {
    title: '俄罗斯方块玩法',
    content: '通过左右滑动移动方块，向下加速下落，向上滑动旋转方块。填满一整行即可消除得分。方块堆到顶部则游戏结束。'
  }
};

// --- UTILS ---
const useGameStats = (type: string) => {
  const { incrementStat } = useApp();
  
  const recordPlay = (score?: number) => {
    incrementStat('totalGamesPlayed');
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

// --- TETRIS ---
const TETROMINOES = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 'bg-cyan-400' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 'bg-blue-500' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 'bg-orange-500' },
  O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'bg-green-500' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 'bg-purple-500' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'bg-red-500' },
};

type TetrisState = {
  board: (string | null)[];
  activePiece: { pos: { x: number, y: number }, shape: number[][], color: string } | null;
  score: number;
  gameOver: boolean;
  paused: boolean;
};

const TetrisGame = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const WIDTH = 10;
  const HEIGHT = 20;
  const { recordPlay } = useGameStats(GameType.TETRIS);
  const [state, setState] = usePersistentState<TetrisState>('game_mem_tetris', {
    board: Array(WIDTH * HEIGHT).fill(null),
    activePiece: null,
    score: 0,
    gameOver: false,
    paused: true
  });

  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOES) as (keyof typeof TETROMINOES)[];
    const key = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOES[key];
    return {
      pos: { x: Math.floor(WIDTH / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
      shape: piece.shape,
      color: piece.color
    };
  }, []);

  const resetGame = () => {
    setState({
      board: Array(WIDTH * HEIGHT).fill(null),
      activePiece: spawnPiece(),
      score: 0,
      gameOver: false,
      paused: false
    });
    SoundSynthesizer.play('move');
  };

  const checkCollision = (pos: { x: number, y: number }, shape: number[][], board: (string | null)[]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardX = pos.x + x;
          const boardY = pos.y + y;
          if (boardX < 0 || boardX >= WIDTH || boardY >= HEIGHT) return true;
          if (boardY >= 0 && board[boardY * WIDTH + boardX]) return true;
        }
      }
    }
    return false;
  };

  const rotate = (shape: number[][]) => {
    const newShape = shape[0].map((_, i) => shape.map(row => row[i]).reverse());
    return newShape;
  };

  const move = useCallback((dir: { x: number, y: number }) => {
    if (state.gameOver || state.paused || !state.activePiece) return;
    
    const newPos = { x: state.activePiece.pos.x + dir.x, y: state.activePiece.pos.y + dir.y };
    if (!checkCollision(newPos, state.activePiece.shape, state.board)) {
      setState(prev => ({ ...prev, activePiece: prev.activePiece ? { ...prev.activePiece, pos: newPos } : null }));
      if (dir.x !== 0 || dir.y !== 0) SoundSynthesizer.play('move');
    } else if (dir.y > 0) {
      // Land piece
      const newBoard = [...state.board];
      state.activePiece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
          if (val) {
            const boardIdx = (state.activePiece!.pos.y + y) * WIDTH + (state.activePiece!.pos.x + x);
            if (boardIdx >= 0 && boardIdx < WIDTH * HEIGHT) newBoard[boardIdx] = state.activePiece!.color;
          }
        });
      });

      // Clear lines
      let linesCleared = 0;
      for (let y = HEIGHT - 1; y >= 0; y--) {
        const row = newBoard.slice(y * WIDTH, (y + 1) * WIDTH);
        if (row.every(cell => cell !== null)) {
          newBoard.splice(y * WIDTH, WIDTH);
          newBoard.unshift(...Array(WIDTH).fill(null));
          linesCleared++;
          y++;
        }
      }

      const nextPiece = spawnPiece();
      const isGameOver = checkCollision(nextPiece.pos, nextPiece.shape, newBoard);
      const newScore = state.score + (linesCleared === 1 ? 100 : linesCleared === 2 ? 300 : linesCleared === 3 ? 500 : linesCleared === 4 ? 800 : 0);
      
      setState(prev => ({
        ...prev,
        board: newBoard,
        activePiece: isGameOver ? null : nextPiece,
        score: newScore,
        gameOver: isGameOver
      }));

      if (linesCleared > 0) SoundSynthesizer.play('score');
      if (isGameOver) {
        SoundSynthesizer.play('lose');
        onGameOver(newScore);
        recordPlay(newScore);
      }
    }
  }, [state, onGameOver, spawnPiece, setState]);

  const rotatePiece = () => {
    if (!state.activePiece || state.paused || state.gameOver) return;
    const newShape = rotate(state.activePiece.shape);
    if (!checkCollision(state.activePiece.pos, newShape, state.board)) {
      setState(prev => ({ ...prev, activePiece: prev.activePiece ? { ...prev.activePiece, shape: newShape } : null }));
      SoundSynthesizer.play('select');
    }
  };

  useEffect(() => {
    if (state.paused || state.gameOver) return;
    const interval = setInterval(() => move({ x: 0, y: 1 }), 800);
    return () => clearInterval(interval);
  }, [state.paused, state.gameOver, move]);

  useEffect(() => {
    if (!state.activePiece && !state.gameOver) {
      setState(prev => ({ ...prev, activePiece: spawnPiece() }));
    }
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipe((d) => {
    if (d === 'LEFT') move({ x: -1, y: 0 });
    if (d === 'RIGHT') move({ x: 1, y: 0 });
    if (d === 'DOWN') move({ x: 0, y: 1 });
    if (d === 'UP') rotatePiece();
  });

  return (
    <div className="flex flex-col items-center w-full h-full justify-center select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="w-full max-w-[300px] flex justify-between mb-4 items-center">
        <div className="glass-panel px-4 py-1 rounded-xl">
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">SCORE</span>
           <p className="text-xl font-bold dark:text-white tabular-nums">{state.score}</p>
        </div>
        <button onClick={() => setState({ ...state, paused: !state.paused })} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-full shadow-lg text-primary">
           {state.paused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
        </button>
      </div>

      <div className="relative w-[280px] h-[560px] bg-slate-900/90 rounded-2xl border-4 border-slate-700 shadow-2xl overflow-hidden p-0.5 grid grid-cols-10 grid-rows-20 gap-[1px]">
        {state.board.map((color, i) => (
          <div key={i} className={`w-full h-full rounded-[2px] ${color || 'bg-white/5'}`} />
        ))}
        {state.activePiece && state.activePiece.shape.map((row, py) => row.map((val, px) => {
          if (val) {
            const bx = state.activePiece!.pos.x + px;
            const by = state.activePiece!.pos.y + py;
            if (bx >= 0 && bx < WIDTH && by >= 0 && by < HEIGHT) {
               return (
                 <div key={`${bx}-${by}`} 
                   className={`absolute w-[10%] h-[5%] rounded-[2px] ${state.activePiece!.color} border border-white/10 shadow-sm`}
                   style={{ left: `${bx * 10}%`, top: `${by * 5}%` }}
                 />
               );
            }
          }
          return null;
        }))}

        {state.gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-20 backdrop-blur-md">
             <Frown size={48} className="text-primary mb-4" />
             <h2 className="text-3xl font-black mb-2">游戏结束</h2>
             <p className="mb-8 font-bold text-gray-400">最终得分: {state.score}</p>
             <button onClick={resetGame} className="bg-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform">重新开始</button>
          </div>
        )}
        {state.paused && !state.gameOver && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white z-20 backdrop-blur-[2px]">
             <div className="text-center">
                <p className="text-2xl font-black mb-1">已暂停</p>
                <p className="text-xs opacity-60">点击或滑动继续挑战</p>
             </div>
          </div>
        )}
      </div>
      <p className="mt-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-4 py-1 rounded-full shadow-inner">滑动: 移动 | 上划: 旋转 | 下划: 软降</p>
    </div>
  );
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
    const newGrid = state.grid.map((row, rowIndex) => rowIndex === r ? row.map((cell, colIndex) => colIndex === c ? { ...cell, isFlagged: !cell.isFlagged } : cell) : row);
    const wasFlagged = cell.isFlagged;
    setState(prev => ({ ...prev, grid: newGrid, minesLeft: wasFlagged ? prev.minesLeft + 1 : prev.minesLeft - 1 }));
    SoundSynthesizer.play('select');
  };

  const handleCellClick = (r: number, c: number) => {
    if (state.gameState !== 'playing') return;
    const cell = state.grid[r][c];
    if (mode === 'flag') { toggleFlag(r, c); return; }
    if (cell.isFlagged || cell.isRevealed) return;
    if (cell.isMine) {
      const newGrid = state.grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
      setState({ ...state, grid: newGrid, gameState: 'lost' });
      SoundSynthesizer.play('bomb');
      SoundSynthesizer.play('lose');
      recordPlay(0);
    } else {
      revealCells(r, c);
      SoundSynthesizer.play('move');
    }
  };

  const revealCells = (startR: number, startC: number) => {
    const newGrid = JSON.parse(JSON.stringify(state.grid));
    const config = DIFFICULTY_MINES[state.difficulty];
    const stack = [[startR, startC]];
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (newGrid[r][c].isRevealed) continue;
      newGrid[r][c].isRevealed = true;
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
    if (hasWon) { recordPlay(100); SoundSynthesizer.play('win'); }
    setState({ ...state, grid: newGrid, gameState: hasWon ? 'won' : 'playing' });
  };

  if (!state.grid || state.grid.length === 0) return null;
  const currentConfig = DIFFICULTY_MINES[state.difficulty];

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto h-full justify-center">
      <div className="w-full glass-panel p-4 rounded-xl shadow-lg mb-6">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => initGame(d)} className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${state.difficulty === d ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d}</button>
            ))}
          </div>
          <button onClick={() => initGame(state.difficulty)} className="active:rotate-180 transition-transform"><RefreshCw size={18} className="text-gray-500" /></button>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg"><AlertTriangle size={18} /> {state.minesLeft}</div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               <button onClick={() => setMode('dig')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${mode === 'dig' ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-400'}`}>挖开</button>
               <button onClick={() => setMode('flag')} className={`px-4 py-1.5 rounded-md text-sm font-bold ${mode === 'flag' ? 'bg-white dark:bg-gray-600 shadow text-red-500' : 'text-gray-400'}`}>插旗</button>
            </div>
        </div>
      </div>
      <div className="relative p-2 glass-panel rounded-2xl shadow-2xl w-full max-w-[360px] aspect-square">
        <div className="grid gap-[2px] w-full h-full" style={{ gridTemplateColumns: `repeat(${currentConfig.cols}, 1fr)` }}>
          {state.grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`w-full h-full flex items-center justify-center font-bold text-sm cursor-pointer rounded-[2px] ${cell.isRevealed ? (cell.isMine ? 'bg-red-500' : 'bg-gray-100 dark:bg-white/5') : 'bg-blue-400 dark:bg-slate-600 shadow-inner'}`}>
              {cell.isRevealed ? (cell.isMine ? <Skull size="60%" className="text-white"/> : (cell.neighborCount > 0 ? <span className={['text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-700', 'text-orange-700'][cell.neighborCount-1]}>{cell.neighborCount}</span> : '')) : (cell.isFlagged ? <Flag size="50%" className="text-red-600 fill-red-600" /> : '')}
            </div>
          )))}
        </div>
        {state.gameState !== 'playing' && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[3px] rounded-2xl">
             <div className="bg-white/90 dark:bg-gray-800/90 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <h3 className={`text-2xl font-bold mb-6 ${state.gameState === 'won' ? 'text-green-600' : 'text-red-600'}`}>{state.gameState === 'won' ? '恭喜获胜！' : '触发了地雷'}</h3>
                <button onClick={() => initGame(state.difficulty)} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg">再来一局</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- GOMOKU ---
const GomokuGame = () => {
  const SIZE = 13;
  const { recordPlay } = useGameStats(GameType.GOMOKU);
  const [state, setState] = usePersistentState('game_mem_gomoku', { board: Array(SIZE * SIZE).fill(0), player: 1, winner: 0 });

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

  const makeAiMove = useCallback(() => {
    const available = state.board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (available.length === 0) return;
    const move = available[Math.floor(Math.random() * available.length)];
    const newBoard = [...state.board];
    newBoard[move] = 2;
    const hasWon = checkWin(newBoard, 2);
    setState({ board: newBoard, player: 1, winner: hasWon ? 2 : 0 });
    SoundSynthesizer.play(hasWon ? 'lose' : 'move');
    if (hasWon) recordPlay(0);
  }, [state.board, recordPlay]);

  useEffect(() => {
    if (state.player === 2 && state.winner === 0) {
      const timer = setTimeout(makeAiMove, 600);
      return () => clearTimeout(timer);
    }
  }, [state.player, state.winner, makeAiMove]);

  const handleUserClick = (i: number) => {
    if (state.board[i] !== 0 || state.winner !== 0 || state.player !== 1) return;
    const newBoard = [...state.board];
    newBoard[i] = 1;
    SoundSynthesizer.play('select');
    const hasWon = checkWin(newBoard, 1);
    if (hasWon) { recordPlay(100); SoundSynthesizer.play('win'); }
    setState({ board: newBoard, player: hasWon ? 1 : 2, winner: hasWon ? 1 : 0 });
  };

  const reset = () => { setState({ board: Array(SIZE * SIZE).fill(0), winner: 0, player: 1 }); SoundSynthesizer.play('move'); };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="w-full max-w-sm glass-panel p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center font-bold">
         <span className="text-sm text-gray-500">{state.winner ? (state.winner === 1 ? "你赢了!" : "电脑获胜") : (state.player === 1 ? "你的回合" : "电脑思考中...")}</span>
         <button onClick={reset}><RotateCcw size={18}/></button>
      </div>
      <div className="relative w-full max-w-[360px] aspect-square bg-[#e6cba5] rounded-lg shadow-2xl p-4 border-[6px] border-[#d5b081]">
         <div className="w-full h-full grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
            {state.board.map((cell, i) => (
              <div key={i} onClick={() => handleUserClick(i)} className="relative flex items-center justify-center cursor-pointer border-[0.5px] border-black/10">
                {cell !== 0 && (<div className={`w-[85%] h-[85%] rounded-full shadow-md ${cell === 1 ? 'bg-black' : 'bg-white'}`} />)}
              </div>
            ))}
         </div>
         {state.winner !== 0 && (<div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-lg"><button onClick={reset} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-2xl">再来一局</button></div>)}
      </div>
    </div>
  );
};

// --- SNAKE ---
type SnakeState = { snake: {x:number, y:number}[]; food: {x:number, y:number}; score: number; highScore: number; gameOver: boolean; paused: boolean; };
const SnakeGame = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const GRID = 20;
  const { recordPlay } = useGameStats(GameType.SNAKE);
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
        SoundSynthesizer.play('lose');
        onGameOver(prev.score);
        recordPlay(prev.score);
        return { ...prev, gameOver: true };
      }
      const newSnake = [head, ...prev.snake];
      if (head.x === prev.food.x && head.y === prev.food.y) {
        SoundSynthesizer.play('score');
        return { ...prev, snake: newSnake, food: { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }, score: prev.score + 10 };
      }
      newSnake.pop();
      return { ...prev, snake: newSnake };
    });
  }, [dir, state.gameOver, state.paused, onGameOver, recordPlay]);

  useEffect(() => { const interval = setInterval(moveSnake, 150); return () => clearInterval(interval); }, [moveSnake]);

  return (
    <div className="flex flex-col items-center h-full w-full justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="w-full max-w-[320px] flex justify-between mb-4 px-2">
         <div className="glass-panel px-4 py-2 rounded-xl"><span className="text-[10px] text-gray-400 font-bold">SCORE</span><p className="text-xl font-bold dark:text-white">{state.score}</p></div>
         <button onClick={() => setState({ ...state, paused: !state.paused })} className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-full">{state.paused ? <Play/> : <Pause/>}</button>
      </div>
      <div className="relative w-[320px] h-[320px] bg-slate-100 dark:bg-slate-900 rounded-2xl border-4 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden grid" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
         {Array.from({ length: GRID * GRID }).map((_, i) => {
            const x = i % GRID, y = Math.floor(i / GRID);
            const isSnake = state.snake.some(s => s.x === x && s.y === y);
            const isHead = state.snake[0].x === x && state.snake[0].y === y;
            const isFood = state.food.x === x && state.food.y === y;
            return <div key={i} className={`w-full h-full ${isHead ? 'bg-primary rounded-sm scale-110 z-10' : isSnake ? 'bg-primary/40 rounded-[2px]' : isFood ? 'flex items-center justify-center' : ''}`}>{isFood && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-md"/>}</div>;
         })}
         {state.gameOver && (<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20 backdrop-blur-sm"><h2 className="text-3xl font-bold mb-6">游戏结束</h2><button onClick={() => { setDir({x:0,y:0}); setState({ snake: [{ x: 10, y: 10 }], food: { x: 15, y: 15 }, score: 0, highScore: 0, gameOver: false, paused: false }); }} className="bg-primary px-8 py-3 rounded-full font-bold shadow-lg">重新开始</button></div>)}
      </div>
    </div>
  );
};

// --- G2048 ---
const G2048Game = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const { recordPlay } = useGameStats(GameType.G2048);
  const [board, setBoard] = usePersistentState<number[]>('game_mem_2048', Array(16).fill(0));
  const [score, setScore] = usePersistentState('game_mem_2048_score', 0);
  const [gameOver, setGameOver] = useState(false);

  const spawn = useCallback((currentBoard: number[]) => {
    const empty = currentBoard.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (empty.length === 0) return currentBoard;
    const newBoard = [...currentBoard];
    newBoard[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  const reset = () => { const b = spawn(spawn(Array(16).fill(0))); setBoard(b); setScore(0); setGameOver(false); SoundSynthesizer.play('move'); };
  useEffect(() => { if (board.every(v => v === 0)) reset(); }, []);

  const move = (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (gameOver) return;
    let newBoard = [...board];
    let changed = false;
    let gainedScore = 0;

    const get = (r: number, c: number) => newBoard[r * 4 + c];
    const set = (r: number, c: number, v: number) => { newBoard[r * 4 + c] = v; };

    for (let i = 0; i < 4; i++) {
        let line = [];
        for (let j = 0; j < 4; j++) {
            const val = dir === 'LEFT' ? get(i, j) : dir === 'RIGHT' ? get(i, 3 - j) : dir === 'UP' ? get(j, i) : get(3 - j, i);
            if (val !== 0) line.push(val);
        }
        for (let j = 0; j < line.length - 1; j++) {
            if (line[j] === line[j + 1]) { line[j] *= 2; gainedScore += line[j]; line.splice(j + 1, 1); changed = true; SoundSynthesizer.play('merge'); }
        }
        while (line.length < 4) line.push(0);
        for (let j = 0; j < 4; j++) {
            const oldVal = dir === 'LEFT' ? get(i, j) : dir === 'RIGHT' ? get(i, 3 - j) : dir === 'UP' ? get(j, i) : get(3 - j, i);
            if (oldVal !== line[j]) changed = true;
            if (dir === 'LEFT') set(i, j, line[j]); else if (dir === 'RIGHT') set(i, 3 - j, line[j]); else if (dir === 'UP') set(j, i, line[j]); else set(3 - j, i, line[j]);
        }
    }

    if (changed) {
        newBoard = spawn(newBoard);
        setBoard(newBoard);
        setScore(score + gainedScore);
        SoundSynthesizer.play('move');
        
        const canMove = () => {
          if (newBoard.includes(0)) return true;
          for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
              if (newBoard[i * 4 + j] === newBoard[i * 4 + j + 1]) return true;
              if (newBoard[j * 4 + i] === newBoard[(j + 1) * 4 + i]) return true;
            }
          }
          return false;
        };
        if (!canMove()) { setGameOver(true); SoundSynthesizer.play('lose'); onGameOver(score + gainedScore); recordPlay(score + gainedScore); }
    }
  };

  const { onTouchStart, onTouchEnd } = useSwipe(move);

  return (
    <div className="flex flex-col items-center h-full w-full justify-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="w-full max-w-[320px] flex justify-between mb-8">
         <div className="glass-panel px-4 py-2 rounded-xl"><span className="text-[10px] text-gray-400 font-bold uppercase">SCORE</span><p className="text-2xl font-black text-primary">{score}</p></div>
         <button onClick={reset} className="p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl shadow-lg"><RefreshCw size={24}/></button>
      </div>
      <div className="relative w-[320px] h-[320px] bg-slate-200 dark:bg-slate-800 p-3 rounded-2xl shadow-2xl grid grid-cols-4 gap-3">
         {board.map((v, i) => (
           <div key={i} className={`w-full h-full rounded-xl flex items-center justify-center font-black transition-all duration-200 shadow-sm ${v === 0 ? 'bg-slate-300/50 dark:bg-slate-700/50' : v <= 4 ? 'bg-white dark:bg-slate-500 text-slate-800' : v <= 16 ? 'bg-orange-100 text-orange-600' : v <= 64 ? 'bg-orange-500 text-white' : 'bg-primary text-white scale-105 shadow-primary/30'}`} style={{ fontSize: v > 1000 ? '1.2rem' : v > 100 ? '1.5rem' : '1.8rem' }}>{v || ''}</div>
         ))}
         {gameOver && (<div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-20 rounded-2xl backdrop-blur-sm"><h2 className="text-3xl font-bold mb-6">无法移动</h2><button onClick={reset} className="bg-primary px-8 py-3 rounded-full font-bold shadow-lg">重新开始</button></div>)}
      </div>
    </div>
  );
};

// --- PARKOUR ---
const ParkourGame = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const { recordPlay } = useGameStats(GameType.PARKOUR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [charPos, setCharPos] = useState(0);
  const [obstacles, setObstacles] = useState<{x: number, id: number}[]>([]);
  const jumpRef = useRef(false);
  const frameRef = useRef(0);

  const reset = () => { setGameOver(false); setIsPlaying(true); setScore(0); setCharPos(0); setObstacles([]); frameRef.current = 0; SoundSynthesizer.play('move'); };

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const interval = setInterval(() => {
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, x: o.x - 2 })).filter(o => o.x > -10);
        if (frameRef.current % 100 === 0) next.push({ x: 100, id: Date.now() });
        return next;
      });
      setScore(s => s + 1);
      frameRef.current++;
    }, 20);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (obstacles.some(o => o.x > 5 && o.x < 15 && charPos < 20)) {
      setGameOver(true); SoundSynthesizer.play('lose'); onGameOver(score); recordPlay(score);
    }
  }, [obstacles, charPos, score, onGameOver, recordPlay]);

  const jump = () => {
    if (gameOver) { reset(); return; }
    if (!isPlaying) { setIsPlaying(true); return; }
    if (jumpRef.current) return;
    jumpRef.current = true; SoundSynthesizer.play('jump');
    let h = 0; let up = true;
    const anim = setInterval(() => {
        if (up) { h += 5; if (h >= 50) up = false; } else { h -= 5; if (h <= 0) { h = 0; jumpRef.current = false; clearInterval(anim); } }
        setCharPos(h);
    }, 25);
  };

  return (
    <div className="flex flex-col items-center h-full w-full justify-center overflow-hidden" onClick={jump}>
       <div className="glass-panel px-6 py-2 rounded-full mb-12"><span className="text-xs text-gray-400 font-bold mr-2">RUN</span><span className="text-2xl font-black text-primary tabular-nums">{score}</span></div>
       <div className="relative w-full max-w-sm h-48 bg-slate-50 dark:bg-slate-900 border-b-4 border-slate-300 dark:border-slate-700 overflow-hidden rounded-t-3xl">
          <div className="absolute left-10 bottom-0 w-8 h-12 bg-primary rounded-t-lg transition-all duration-75 flex items-center justify-center shadow-lg" style={{ bottom: charPos }}>
             <Activity className="text-white/50" size={16}/>
          </div>
          {obstacles.map(o => (
            <div key={o.id} className="absolute bottom-0 w-6 h-8 bg-slate-800 dark:bg-slate-200 rounded-sm" style={{ left: `${o.x}%` }} />
          ))}
          {!isPlaying && !gameOver && <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm text-gray-700 font-black text-xl">点击开始跑酷</div>}
          {gameOver && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><h2 className="text-2xl font-bold mb-4">撞到了障碍物</h2><button className="bg-primary px-6 py-2 rounded-full font-bold">重新开始</button></div>}
       </div>
    </div>
  );
};

// --- WOODEN FISH ---
const WoodenFishGame = () => {
  const [count, setCount] = useState(0);
  const [scale, setScale] = useState(1);
  const [pops, setPops] = useState<{id: number, x: number, y: number}[]>([]);

  const tap = (e: React.MouseEvent | React.TouchEvent) => {
    setCount(c => c + 1);
    setScale(0.9);
    SoundSynthesizer.play('wood');
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const id = Date.now();
    setPops(p => [...p, { id, x: clientX, y: clientY }]);
    setTimeout(() => { setScale(1); setPops(p => p.filter(item => item.id !== id)); }, 100);
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer touch-none" onMouseDown={tap} onTouchStart={tap}>
       <div className="mb-20 text-center animate-fade-in">
          <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">功德</p>
          <h1 className="text-7xl font-black text-primary drop-shadow-xl">{count}</h1>
       </div>
       <div className="relative transform transition-transform duration-100" style={{ transform: `scale(${scale})` }}>
          <div className="w-48 h-48 bg-slate-800 dark:bg-slate-100 rounded-[3rem] shadow-[inset_-10px_-10px_20px_rgba(0,0,0,0.5),10px_10px_20px_rgba(0,0,0,0.2)] dark:shadow-[inset_-10px_-10px_20px_rgba(255,255,255,0.5),10px_10px_20px_rgba(0,0,0,0.1)] flex items-center justify-center">
             <Music size={64} className="text-white dark:text-slate-800 opacity-20" />
          </div>
       </div>
       <p className="mt-20 text-gray-400 font-medium">心平气和，积攒功德</p>
       {pops.map(p => (
         <span key={p.id} className="fixed pointer-events-none text-xl font-bold text-primary animate-float opacity-0" style={{ left: p.x, top: p.y }}>功德 +1</span>
       ))}
    </div>
  );
};

// --- BUBBLE WRAP ---
const BubbleWrapGame = () => {
  const [bubbles, setBubbles] = useState(Array(30).fill(false));
  const pop = (i: number) => {
    if (bubbles[i]) return;
    const newBubbles = [...bubbles];
    newBubbles[i] = true;
    setBubbles(newBubbles);
    SoundSynthesizer.play('pop');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([10, 5, 10]);
  };
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
       <div className="grid grid-cols-5 gap-4 glass-panel p-6 rounded-[2.5rem] shadow-xl">
          {bubbles.map((b, i) => (
            <div key={i} onClick={() => pop(i)} className={`w-12 h-12 rounded-full transition-all duration-300 border-2 ${b ? 'bg-transparent border-gray-200 dark:border-gray-800 scale-90' : 'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 shadow-md active:scale-110 active:bg-cyan-200'}`} />
          ))}
       </div>
       <button onClick={() => setBubbles(Array(30).fill(false))} className="mt-12 flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"><RotateCcw size={18}/> 全部恢复</button>
    </div>
  );
};

// --- MATCH 3 ---
const FRUITS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒'];
const Match3Game = ({ onGameOver }: { onGameOver: (score: number) => void }) => {
  const SIZE = 7;
  const { recordPlay } = useGameStats(GameType.MATCH3);
  const [board, setBoard] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const init = useCallback(() => {
    let b = Array.from({ length: SIZE * SIZE }, () => FRUITS[Math.floor(Math.random() * FRUITS.length)]);
    setBoard(b); setScore(0); SoundSynthesizer.play('move');
  }, []);
  useEffect(() => init(), [init]);

  const swap = (i1: number, i2: number) => {
    const b = [...board]; const temp = b[i1]; b[i1] = b[i2]; b[i2] = temp;
    setBoard(b); check(b); SoundSynthesizer.play('move');
  };

  const check = (b: string[]) => {
    let toRemove = new Set<number>();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE - 2; c++) {
        const i = r * SIZE + c;
        if (b[i] && b[i] === b[i+1] && b[i] === b[i+2]) { toRemove.add(i); toRemove.add(i+1); toRemove.add(i+2); }
      }
    }
    for (let c = 0; c < SIZE; c++) {
      for (let r = 0; r < SIZE - 2; r++) {
        const i = r * SIZE + c;
        if (b[i] && b[i] === b[(r+1)*SIZE+c] && b[i] === b[(r+2)*SIZE+c]) { toRemove.add(i); toRemove.add((r+1)*SIZE+c); toRemove.add((r+2)*SIZE+c); }
      }
    }
    if (toRemove.size > 0) {
      const nextBoard = b.map((v, i) => toRemove.has(i) ? '' : v);
      setBoard(nextBoard); setScore(s => s + toRemove.size * 10);
      SoundSynthesizer.play('score');
      setTimeout(() => fill(nextBoard), 400);
    }
  };

  const fill = (b: string[]) => {
    const next = [...b];
    for (let c = 0; c < SIZE; c++) {
      let empty = 0;
      for (let r = SIZE - 1; r >= 0; r--) {
        const i = r * SIZE + c;
        if (next[i] === '') empty++;
        else if (empty > 0) { next[(r + empty) * SIZE + c] = next[i]; next[i] = ''; }
      }
      for (let r = 0; r < empty; r++) next[r * SIZE + c] = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    }
    setBoard(next); setTimeout(() => check(next), 400);
  };

  const handleClick = (i: number) => {
    if (selected === null) setSelected(i);
    else {
      const r1 = Math.floor(selected / SIZE), c1 = selected % SIZE;
      const r2 = Math.floor(i / SIZE), c2 = i % SIZE;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) { swap(selected, i); setSelected(null); }
      else setSelected(i);
    }
  };

  return (
    <div className="flex flex-col items-center h-full w-full justify-center p-4">
       <div className="glass-panel px-6 py-2 rounded-full mb-8 font-black text-primary text-xl shadow-lg">{score}</div>
       <div className="grid grid-cols-7 gap-1 p-2 glass-panel rounded-2xl shadow-2xl">
          {board.map((f, i) => (
            <div key={i} onClick={() => handleClick(i)} className={`w-10 h-10 flex items-center justify-center text-xl cursor-pointer rounded-lg transition-all ${selected === i ? 'bg-primary/20 scale-110 shadow-lg' : 'hover:bg-white/10'}`}>{f}</div>
          ))}
       </div>
    </div>
  );
};

// --- MAIN RUNNER COMPONENT ---
export const GameRunner = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorial = GAME_TUTORIALS[type || ''] || { title: '玩法介绍', content: '暂无说明' };

  const handleGameOver = (score: number) => {
    // Score updates are handled inside components for persistence
  };

  const renderGame = () => {
    switch (type) {
      case GameType.SNAKE: return <SnakeGame onGameOver={handleGameOver} />;
      case GameType.G2048: return <G2048Game onGameOver={handleGameOver} />;
      case GameType.MINESWEEPER: return <MinesweeperGame />;
      case GameType.GOMOKU: return <GomokuGame />;
      case GameType.PARKOUR: return <ParkourGame onGameOver={handleGameOver} />;
      case GameType.MATCH3: return <Match3Game onGameOver={handleGameOver} />;
      case GameType.WOODEN_FISH: return <WoodenFishGame />;
      case GameType.BUBBLE_WRAP: return <BubbleWrapGame />;
      case GameType.TETRIS: return <TetrisGame onGameOver={handleGameOver} />;
      default: return <div className="text-white">游戏正在开发中...</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Game Header */}
      <div className="p-4 flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-black/5 rounded-full"><ChevronLeft size={28} /></button>
        <button onClick={() => setShowTutorial(true)} className="p-2 text-gray-400 hover:text-primary"><HelpCircle size={24} /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
         {renderGame()}
      </div>

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative">
             <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24}/></button>
             <h2 className="text-2xl font-black mb-6 text-gray-800 dark:text-white flex items-center gap-2"><Sparkles className="text-primary" /> {tutorial.title}</h2>
             <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">{tutorial.content}</p>
             <button onClick={() => setShowTutorial(false)} className="w-full mt-8 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform">我明白了</button>
          </div>
        </div>
      )}
    </div>
  );
};
