import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GameType } from '../types';
import { useApp } from '../context';
import { ChevronLeft, RefreshCw, Flag, AlertTriangle, Skull, Trophy, Play, Pause, Zap, Gem, Footprints } from 'lucide-react';

// --- UTILS ---
const useGameStats = (type: string) => {
  const { incrementStat } = useApp();
  const recordPlay = () => incrementStat('totalGamesPlayed');
  return { recordPlay };
};

const useSwipe = (onSwipe: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void) => {
  const touchStart = useRef<{x: number, y: number} | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
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

const DIFFICULTY_MINES = {
  easy: { rows: 8, cols: 8, mines: 8 },
  medium: { rows: 10, cols: 10, mines: 15 },
  hard: { rows: 14, cols: 12, mines: 30 },
};

const MinesweeperGame = () => {
  const { recordPlay } = useGameStats(GameType.MINESWEEPER);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [mode, setMode] = useState<'dig' | 'flag'>('dig'); 
  const [minesLeft, setMinesLeft] = useState(0);

  const initGame = useCallback(() => {
    const config = DIFFICULTY_MINES[difficulty];
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
    setGrid(newGrid);
    setGameState('playing');
    setMinesLeft(config.mines);
  }, [difficulty]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    const cell = grid[r][c];

    if (mode === 'flag') {
      if (cell.isRevealed) return;
      const newGrid = [...grid];
      newGrid[r][c].isFlagged = !cell.isFlagged;
      setGrid(newGrid);
      setMinesLeft(prev => cell.isFlagged ? prev + 1 : prev - 1);
      return;
    }
    if (cell.isFlagged || cell.isRevealed) return;

    if (cell.isMine) {
      const newGrid = grid.map(row => row.map(cell => ({ ...cell, isRevealed: cell.isMine ? true : cell.isRevealed })));
      setGrid(newGrid);
      setGameState('lost');
    } else {
      revealCells(r, c);
    }
  };

  const revealCells = (startR: number, startC: number) => {
    const newGrid = [...grid];
    const config = DIFFICULTY_MINES[difficulty];
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
    setGrid(newGrid);
    // Check Win
    let revealedCount = 0;
    newGrid.forEach(row => row.forEach(cell => { if (cell.isRevealed) revealedCount++; }));
    if (revealedCount === (config.rows * config.cols - config.mines)) {
      setGameState('won');
      recordPlay();
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      <div className="w-full glass-panel p-4 rounded-xl shadow-lg mb-4">
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className={`px-3 py-1 rounded text-xs font-bold capitalize transition-colors ${difficulty === d ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d}</button>
            ))}
          </div>
          <button onClick={initGame}><RefreshCw size={18} className="text-gray-500 hover:text-primary transition-colors" /></button>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-xl font-bold text-red-500"><AlertTriangle size={20} /> {minesLeft}</div>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               <button onClick={() => setMode('dig')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${mode === 'dig' ? 'bg-white dark:bg-gray-600 shadow text-primary' : 'text-gray-400'}`}>挖开</button>
               <button onClick={() => setMode('flag')} className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${mode === 'flag' ? 'bg-white dark:bg-gray-600 shadow text-red-500' : 'text-gray-400'}`}>插旗</button>
            </div>
        </div>
      </div>
      <div className="bg-white/40 dark:bg-gray-800/40 p-2 rounded-xl backdrop-blur-sm select-none touch-none shadow-inner" style={{ display: 'grid', gridTemplateColumns: `repeat(${DIFFICULTY_MINES[difficulty].cols}, 1fr)`, gap: '2px' }}>
        {grid.map((row, r) => row.map((cell, c) => (
          <div key={`${r}-${c}`} onClick={() => handleCellClick(r, c)} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center font-bold text-sm cursor-pointer rounded-sm shadow-sm transition-transform active:scale-95 ${cell.isRevealed ? (cell.isMine ? 'bg-red-500' : 'bg-white/60 dark:bg-gray-800') : 'bg-blue-300 dark:bg-blue-800 hover:opacity-90'}`}>
            {cell.isRevealed ? (cell.isMine ? <Skull size={16} className="text-white"/> : (cell.neighborCount > 0 ? <span className={{1:'text-blue-500',2:'text-green-500',3:'text-red-500'}[cell.neighborCount] || 'text-purple-500'}>{cell.neighborCount}</span> : '')) : (cell.isFlagged ? <Flag size={16} className="text-red-600 fill-red-600" /> : '')}
          </div>
        )))}
      </div>
      {gameState !== 'playing' && (
        <div className="mt-6 p-6 glass-panel rounded-2xl shadow-2xl flex flex-col items-center animate-bounce-in z-20">
           <h3 className={`text-xl font-bold mb-2 ${gameState === 'won' ? 'text-green-500' : 'text-red-500'}`}>{gameState === 'won' ? '恭喜获胜！' : '游戏结束'}</h3>
           <button onClick={initGame} className="px-6 py-2 bg-primary text-white rounded-full font-bold shadow-lg">再来一局</button>
        </div>
      )}
    </div>
  );
};

// --- GOMOKU ---
const GomokuGame = () => {
  const { recordPlay } = useGameStats(GameType.GOMOKU);
  const SIZE = 12; 
  const [board, setBoard] = useState<number[]>(Array(SIZE * SIZE).fill(0));
  const [player, setPlayer] = useState(1);
  const [winner, setWinner] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

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
    if (player === 2 && winner === 0) {
      const timer = setTimeout(makeAiMove, 500);
      return () => clearTimeout(timer);
    }
  }, [player, winner]);

  const makeAiMove = () => {
    const available = board.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1);
    if (available.length === 0) return;
    let bestMove = available[Math.floor(Math.random() * available.length)];

    if (difficulty !== 'easy') {
       // Simple blocking AI
       for (const move of available) {
         const temp = [...board];
         temp[move] = 1; // Check if player wins
         if (checkWin(temp, 1)) { bestMove = move; break; } // Block
         temp[move] = 2; // Check if AI wins
         if (checkWin(temp, 2)) { bestMove = move; break; } // Win
       }
    }

    const newBoard = [...board];
    newBoard[bestMove] = 2;
    setBoard(newBoard);
    if (checkWin(newBoard, 2)) { setWinner(2); } else { setPlayer(1); }
  };

  const handleUserClick = (i: number) => {
    if (board[i] !== 0 || winner !== 0 || player !== 1) return;
    const newBoard = [...board];
    newBoard[i] = 1;
    setBoard(newBoard);
    if (checkWin(newBoard, 1)) { setWinner(1); recordPlay(); } else { setPlayer(2); }
  };

  const reset = () => { setBoard(Array(SIZE*SIZE).fill(0)); setWinner(0); setPlayer(1); };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm glass-panel p-4 rounded-xl shadow-lg mb-6 flex justify-between items-center">
         <div className="flex gap-1">
            {(['easy', 'normal', 'hard'] as const).map(d => (
              <button key={d} onClick={() => { setDifficulty(d); reset(); }} className={`px-3 py-1 text-xs rounded-full capitalize transition-all ${difficulty === d ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>{d}</button>
            ))}
         </div>
         <span className="text-sm font-bold text-gray-500">{winner ? (winner === 1 ? "你赢了!" : "电脑获胜") : (player === 1 ? "你的回合" : "电脑思考中...")}</span>
      </div>
      <div className="bg-[#e6cba5] p-3 rounded-lg shadow-2xl grid gap-0 border-8 border-[#d5b081] relative shadow-black/20" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)`, width: '90vw', maxWidth: '360px' }}>
        {board.map((cell, i) => (
          <div key={i} onClick={() => handleUserClick(i)} className="aspect-square border-[0.5px] border-gray-700/20 flex items-center justify-center relative cursor-pointer">
            <div className="absolute w-full h-[1px] bg-gray-700/20 z-0"/><div className="absolute h-full w-[1px] bg-gray-700/20 z-0"/>
            {cell !== 0 && (
              <div className={`w-[85%] h-[85%] rounded-full shadow-[2px_2px_4px_rgba(0,0,0,0.4)] z-10 transform transition-all scale-0 animate-fade-in ${cell === 1 ? 'bg-gray-900 scale-100' : 'bg-gray-100 scale-100'}`} />
            )}
          </div>
        ))}
        {winner !== 0 && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm"><button onClick={reset} className="bg-primary text-white px-8 py-3 rounded-full font-bold shadow-2xl animate-bounce">再来一局</button></div>}
      </div>
    </div>
  );
};

// --- SNAKE ---
const SnakeGame = ({ onGameOver }: { onGameOver: () => void }) => {
  const GRID = 20;
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [dir, setDir] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const { onTouchStart, onTouchEnd } = useSwipe((d) => {
    if (d === 'UP' && dir.y !== 1) setDir({x:0, y:-1});
    if (d === 'DOWN' && dir.y !== -1) setDir({x:0, y:1});
    if (d === 'LEFT' && dir.x !== 1) setDir({x:-1, y:0});
    if (d === 'RIGHT' && dir.x !== -1) setDir({x:1, y:0});
  });

  const moveSnake = useCallback(() => {
    if (gameOver || (dir.x === 0 && dir.y === 0)) return;
    setSnake(prev => {
      const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || prev.some(s => s.x === head.x && s.y === head.y)) {
        setGameOver(true); onGameOver(); return prev;
      }
      const newSnake = [head, ...prev];
      if (head.x === food.x && head.y === food.y) {
        setScore(s => s + 1);
        setFood({ x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) });
      } else { newSnake.pop(); }
      return newSnake;
    });
  }, [dir, food, gameOver, onGameOver]);

  useEffect(() => { const i = setInterval(moveSnake, 150); return () => clearInterval(i); }, [moveSnake]);

  return (
    <div className="flex flex-col items-center w-full select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="mb-4 text-xl font-bold dark:text-white flex justify-between w-full max-w-[300px]">
         <span className="bg-white/50 px-3 py-1 rounded-full">分数: {score}</span>
         <span className="text-sm text-gray-400 self-center">滑动控制</span>
      </div>
      <div className="bg-gray-800/80 backdrop-blur-md rounded-xl p-1 relative border-4 border-gray-600 shadow-2xl overflow-hidden" style={{ width: 'min(90vw, 350px)', height: 'min(90vw, 350px)' }}>
        {gameOver && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white font-bold z-10 backdrop-blur-sm"><h2 className="text-3xl mb-4">游戏结束</h2><button onClick={() => { setSnake([{x:10,y:10}]); setGameOver(false); setScore(0); setDir({x:0,y:0}); }} className="bg-primary px-6 py-2 rounded-full shadow-lg">重试</button></div>}
        {snake.map((s, i) => <div key={i} className="absolute bg-green-500 rounded-sm shadow-sm border border-green-400" style={{ left: `${(s.x/GRID)*100}%`, top: `${(s.y/GRID)*100}%`, width: '5%', height: '5%' }} />)}
        <div className="absolute bg-red-500 rounded-full animate-pulse shadow-md shadow-red-500/50" style={{ left: `${(food.x/GRID)*100}%`, top: `${(food.y/GRID)*100}%`, width: '5%', height: '5%' }} />
      </div>
    </div>
  );
};

// --- 2048 ---
const Game2048 = ({ onMove }: { onMove: () => void }) => {
  const [board, setBoard] = useState<number[]>(Array(16).fill(0));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const init = () => {
     const b = Array(16).fill(0);
     addNum(b); addNum(b);
     setBoard(b); setScore(0); setGameOver(false);
  };
  useEffect(init, []);

  const addNum = (b: number[]) => {
    const empty = b.map((v,i)=>v===0?i:-1).filter(i=>i!==-1);
    if(empty.length) b[empty[Math.floor(Math.random()*empty.length)]] = Math.random()>.9 ? 4 : 2;
  };

  const getVal = (r: number, c: number, b: number[]) => b[r*4+c];
  const setVal = (r: number, c: number, v: number, b: number[]) => { b[r*4+c] = v; };

  const moveLeft = (b: number[]) => {
    let changed = false;
    let addedScore = 0;
    const newB = [...b];
    for(let r=0; r<4; r++) {
      let row = [getVal(r,0,b), getVal(r,1,b), getVal(r,2,b), getVal(r,3,b)].filter(x=>x);
      for(let i=0; i<row.length-1; i++) {
        if(row[i]===row[i+1]) { row[i]*=2; addedScore+=row[i]; row.splice(i+1,1); }
      }
      while(row.length<4) row.push(0);
      for(let c=0; c<4; c++) {
        if(getVal(r,c,b) !== row[c]) changed=true;
        setVal(r,c,row[c],newB);
      }
    }
    return { changed, newB, addedScore };
  };

  const rotate = (b: number[]) => {
     const newB = Array(16).fill(0);
     for(let r=0; r<4; r++) for(let c=0; c<4; c++) newB[c*4+(3-r)] = b[r*4+c];
     return newB;
  };

  const move = (dir: number) => { 
    if(gameOver) return;
    let b = [...board];
    for(let i=0; i<dir; i++) b = rotate(b);
    const res = moveLeft(b);
    if(res.changed) {
      b = res.newB;
      for(let i=0; i<(4-dir)%4; i++) b = rotate(b);
      addNum(b);
      setBoard(b);
      setScore(s => s + res.addedScore);
      onMove();
    }
  };

  const { onTouchStart, onTouchEnd } = useSwipe((d) => {
    if(d==='LEFT') move(0); if(d==='UP') move(1); if(d==='RIGHT') move(2); if(d==='DOWN') move(3);
  });

  const getColor = (v: number) => {
    const colors: Record<number, string> = {
      2: 'bg-gray-200 text-gray-800', 4: 'bg-orange-100 text-gray-800', 8: 'bg-orange-300 text-white', 16: 'bg-orange-500 text-white',
      32: 'bg-red-400 text-white', 64: 'bg-red-600 text-white', 128: 'bg-yellow-300 text-white text-3xl', 256: 'bg-yellow-400 text-white text-3xl',
      512: 'bg-yellow-500 text-white text-3xl', 1024: 'bg-yellow-600 text-white text-2xl', 2048: 'bg-yellow-700 text-white text-2xl'
    };
    return colors[v] || 'bg-black text-white';
  };

  return (
    <div className="flex flex-col items-center select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
       <div className="flex justify-between w-full max-w-xs mb-4 items-center">
          <div className="text-2xl font-bold bg-yellow-500 text-white px-4 py-2 rounded-xl shadow-lg">2048</div>
          <div className="flex flex-col items-end glass-panel px-3 py-1 rounded-lg">
             <span className="text-[10px] text-gray-400 font-bold">SCORE</span>
             <span className="text-xl font-bold dark:text-white">{score}</span>
          </div>
          <button onClick={init} className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"><RefreshCw size={20} className="text-primary"/></button>
       </div>
       <div className="grid grid-cols-4 gap-2 bg-gray-300/50 backdrop-blur-md p-2 rounded-xl shadow-inner border border-white/20" style={{ width: 'min(90vw, 350px)', height: 'min(90vw, 350px)' }}>
          {board.map((v, i) => (
             <div key={i} className={`flex items-center justify-center font-bold text-3xl rounded-lg shadow-sm transition-all duration-150 ${v===0 ? 'bg-gray-200/50' : getColor(v)}`}>
               {v > 0 && v}
             </div>
          ))}
       </div>
       <p className="mt-4 text-gray-400 text-sm font-medium">滑动屏幕移动方块</p>
    </div>
  );
};

// --- MATCH 3 ---
const Match3Game = () => {
  const { recordPlay } = useGameStats(GameType.MATCH3);
  const WIDTH = 8;
  const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
  const [board, setBoard] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const createBoard = () => {
    const b = [];
    for(let i=0; i<WIDTH*WIDTH; i++) b.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setBoard(b);
  };

  useEffect(() => { createBoard(); }, []);

  const checkForMatches = () => {
    // Basic check for rows of 3
    const matches = new Set<number>();
    for(let i=0; i<64; i++) {
       // Row
       if(i%WIDTH < WIDTH-2) {
         if(board[i] === board[i+1] && board[i] === board[i+2]) { matches.add(i); matches.add(i+1); matches.add(i+2); }
       }
       // Col
       if(i < WIDTH*(WIDTH-2)) {
         if(board[i] === board[i+WIDTH] && board[i] === board[i+WIDTH*2]) { matches.add(i); matches.add(i+WIDTH); matches.add(i+WIDTH*2); }
       }
    }
    
    if(matches.size > 0) {
      const newB = [...board];
      matches.forEach(idx => newB[idx] = '');
      setScore(s => s + matches.size * 10);
      setBoard(newB);
      setTimeout(() => fillBoard(newB), 200);
      recordPlay();
    }
  };

  const fillBoard = (b: string[]) => {
    const newB = [...b];
    // Gravity
    for(let i=0; i<WIDTH; i++) {
       let emptySlots = 0;
       for(let j=WIDTH-1; j>=0; j--) {
          const idx = j*WIDTH + i;
          if(newB[idx] === '') {
             emptySlots++;
          } else if(emptySlots > 0) {
             newB[(j+emptySlots)*WIDTH + i] = newB[idx];
             newB[idx] = '';
          }
       }
       for(let j=0; j<emptySlots; j++) newB[j*WIDTH+i] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    setBoard(newB);
  };

  useEffect(() => { if(board.length) checkForMatches(); }, [board]);

  const handleDrag = (i: number) => {
    if(selected === null) {
      setSelected(i);
    } else {
      // Check adjacency
      const diff = Math.abs(selected - i);
      if((diff === 1 && Math.floor(selected/WIDTH) === Math.floor(i/WIDTH)) || diff === WIDTH) {
        // Swap
        const newB = [...board];
        const temp = newB[selected];
        newB[selected] = newB[i];
        newB[i] = temp;
        setBoard(newB);
        setSelected(null);
      } else {
        setSelected(i);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-between w-full max-w-xs mb-4 glass-panel p-2 rounded-xl">
        <h2 className="text-xl font-bold dark:text-white px-2">消消乐</h2>
        <span className="font-mono text-xl text-primary font-bold px-2">{score}</span>
      </div>
      <div className="grid grid-cols-8 gap-1 bg-white/40 p-2 rounded-2xl shadow-xl backdrop-blur-md" style={{ width: 'min(90vw, 350px)' }}>
        {board.map((color, i) => (
          <div 
             key={i} 
             onClick={() => handleDrag(i)}
             className={`aspect-square rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),2px_2px_4px_rgba(0,0,0,0.1)] cursor-pointer transition-transform ${selected === i ? 'ring-4 ring-primary/30 scale-110' : ''}`}
             style={{ backgroundColor: color === '' ? 'transparent' : color }}
          >
             {color === '' ? '' : <Gem size="60%" className="text-white/40 m-auto mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PARKOUR ---
const ParkourGame = () => {
  const { recordPlay } = useGameStats(GameType.PARKOUR);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState<{id: number, x: number}[]>([]);
  
  const gameRef = useRef({ velocity: 0, gravity: 0.6, gameLoop: 0, dinoY: 0, isPlaying: false });

  const jump = () => {
    if(gameRef.current.dinoY <= 0.5 && gameRef.current.isPlaying) {
      gameRef.current.velocity = 12;
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
  };

  const update = () => {
    if(!gameRef.current.isPlaying) return;

    // Physics
    gameRef.current.velocity -= gameRef.current.gravity;
    let newY = gameRef.current.dinoY + gameRef.current.velocity;
    if(newY <= 0) { newY = 0; gameRef.current.velocity = 0; }
    gameRef.current.dinoY = newY;
    setDinoY(newY);

    setObstacles(prev => {
       const next = prev.map(o => ({...o, x: o.x - 0.8})).filter(o => o.x > -10);
       
       if(prev.length === 0 || (prev[prev.length-1].x < 60 && Math.random() < 0.02)) {
          next.push({id: Date.now(), x: 100});
       }
       if(next.length === 0) next.push({id: Date.now(), x: 100});
       
       // Collision
       const hit = next.some(o => o.x < 15 && o.x > 5 && gameRef.current.dinoY < 10);
       if(hit) {
          gameRef.current.isPlaying = false;
          setIsPlaying(false);
          cancelAnimationFrame(gameRef.current.gameLoop);
       }
       return next;
    });

    setScore(s => s + 1);
    if(gameRef.current.isPlaying) gameRef.current.gameLoop = requestAnimationFrame(update);
  };

  useEffect(() => {
     return () => cancelAnimationFrame(gameRef.current.gameLoop);
  }, []);

  return (
    <div className="flex flex-col items-center w-full" onClick={jump}>
       <div className="w-full h-64 bg-white/80 dark:bg-gray-800/80 rounded-2xl overflow-hidden relative border-b-8 border-gray-300 dark:border-gray-600 shadow-2xl select-none backdrop-blur-sm">
          <div className="absolute top-4 right-4 text-2xl font-mono font-bold text-gray-400">{score}</div>
          
          {/* Dino */}
          <div 
            className="absolute left-8 w-10 h-10 bg-primary rounded-lg transition-transform duration-75 shadow-lg shadow-primary/40"
            style={{ bottom: `${dinoY * 3}px` }}
          >
            <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
          </div>

          {/* Obstacles */}
          {obstacles.map(o => (
             <div 
               key={o.id}
               className="absolute bottom-0 w-8 h-12 bg-gray-600 dark:bg-gray-400 rounded-t-lg shadow-md"
               style={{ left: `${o.x}%` }}
             />
          ))}

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
               <button onClick={(e) => { e.stopPropagation(); startGame(); }} className="bg-white text-primary px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform">
                 <Play size={20} fill="currentColor" /> {score > 0 ? '重试' : '开始游戏'}
               </button>
            </div>
          )}
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
      <div className="p-4 flex items-center z-10">
        <button onClick={() => navigate('/games')} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 glass-panel rounded-full hover:bg-white/40 transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold ml-4 text-gray-800 dark:text-white capitalize drop-shadow-sm">{type}</h1>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 relative">
        {renderGame()}
      </div>
    </div>
  );
};