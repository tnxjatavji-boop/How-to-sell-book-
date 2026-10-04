import { useState, useEffect } from "react";
import { Wallet, ArrowUp, Bomb, Gem, Activity, Star, Sparkles, Check, Volume2, VolumeX, Trophy, X, BadgeCheck, CheckCircle2 } from "lucide-react";
import { toast } from "./Toast";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../apiConfig";
import { measureApiCall } from "../utils/performanceTracker";
import { confetti } from "../utils/confetti";

function combinations(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

function calculateMultiplier(mines: number, revealed: number) {
  const totalWays = combinations(25, mines);
  const currentWays = combinations(25 - revealed, mines);
  const mult = 0.98 * (totalWays / (currentWays || 1));
  return (Number(mult) || 1).toFixed(2);
}

class SoundEffects {
  private static ctx: AudioContext | null = null;
  public static isMuted: boolean = typeof window !== "undefined" && localStorage.getItem("mines_muted") === "true";

  private static getContext() {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  static toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem("mines_muted", this.isMuted ? "true" : "false");
    return this.isMuted;
  }

  static playStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.exponentialRampToValueAtTime(523.25, ctx.currentTime + 0.15); // C5

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.error(e);
    }
  }

  static playGem(revealIndex: number) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      // Scale pitch with consecutive gems
      const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
      const baseFreq = scale[revealIndex % scale.length];
      const octaveShift = Math.floor(revealIndex / scale.length);
      const freq = baseFreq * Math.pow(2, octaveShift);

      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.2, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.error(e);
    }
  }

  static playBomb() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.error(e);
    }
  }

  static playCashout() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);

        osc.start(ctx.currentTime + idx * 0.06);
        osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export function Game({ balance, executeBet, executeWin, setActivePage, winRate, userId }: any) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [betAmount, setBetAmount] = useState(100);
  const [mineCount, setMineCount] = useState(3);
  const [revealedCount, setRevealedCount] = useState(0);
  const [mineLocations, setMineLocations] = useState<number[]>([]);
  const [revealedCells, setRevealedCells] = useState<Record<number, boolean>>(
    {},
  );
  const [currentMult, setCurrentMult] = useState(1.0);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState<{
    isWin: boolean;
    amount: number;
    revealedCount: number;
    mineCount: number;
    betAmount: number;
    periodId: string;
  } | null>(null);

  const [countdown, setCountdown] = useState(3);
  const [isMuted, setIsMuted] = useState(SoundEffects.isMuted);

  const toggleMute = () => {
    const muted = SoundEffects.toggleMute();
    setIsMuted(muted);
    toast(muted ? "Sound muted" : "Sound unmuted");
  };

  useEffect(() => {
    if (!gameOver) {
      setCountdown(3);
      return;
    }
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          closeModal();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver]);

  const adjustBet = (factor: number) => {
    if (isPlaying) return;
    setBetAmount((prev) => Math.max(10, Math.floor(prev * factor)));
  };

  const startGame = async () => {
    if (isPlaying) return;
    if (betAmount > balance) {
      toast("Insufficient Balance!");
      return;
    }
    if (betAmount < 10) {
      toast("Minimum bet is ₹10!");
      return;
    }

    SoundEffects.playStart();
    const txId = await executeBet(betAmount);
    if (txId) {
      setCurrentTxId(txId);
    }
    setIsPlaying(true);
    setRevealedCount(0);
    setCurrentMult(1.0);
    setRevealedCells({});
    setGameOver(null);

    const locations: number[] = [];
    while (locations.length < mineCount) {
      let loc = Math.floor(Math.random() * 25);
      if (!locations.includes(loc)) locations.push(loc);
    }
    setMineLocations(locations);
    toast("Game Started! Dig carefully.");
  };

  const revealCell = (index: number) => {
    if (!isPlaying) return;
    if (revealedCells[index]) return;

    let isMine = mineLocations.includes(index);

    if (isMine && winRate && Math.random() < winRate) {
      // Find a cell that is not in mineLocations, is not the clicked cell, and has not been revealed yet
      const unrevealedNotMined: number[] = [];
      for (let i = 0; i < 25; i++) {
        if (i !== index && !mineLocations.includes(i) && !revealedCells[i]) {
          unrevealedNotMined.push(i);
        }
      }

      if (unrevealedNotMined.length > 0) {
        // Pick a random safe cell to move the mine to
        const newMineLoc = unrevealedNotMined[Math.floor(Math.random() * unrevealedNotMined.length)];
        const newMines = mineLocations.map(m => m === index ? newMineLoc : m);
        setMineLocations(newMines);
        isMine = false; // The current clicked cell is now safe!
      }
    }

    if (isMine) {
      SoundEffects.playBomb();
      setIsPlaying(false);
      setRevealedCells((prev) => ({ ...prev, [index]: true }));
      handleGameOver(false, 0, revealedCount, index);
    } else {
      const newRevealedCount = revealedCount + 1;
      const newMult = parseFloat(
        calculateMultiplier(mineCount, newRevealedCount),
      );

      SoundEffects.playGem(revealedCount);
      setRevealedCount(newRevealedCount);
      setCurrentMult(newMult);
      setRevealedCells((prev) => ({ ...prev, [index]: true }));

      if (newRevealedCount === 25 - mineCount) {
        cashout(newMult, newRevealedCount);
      }
    }
  };

  const cashout = (forcedMult?: number, forcedRevealed?: number) => {
    const multToUse = forcedMult || currentMult;
    const finalRevealed = forcedRevealed !== undefined ? forcedRevealed : revealedCount;
    if (!isPlaying || finalRevealed === 0) return;
    SoundEffects.playCashout();
    setIsPlaying(false);
    const winAmount = betAmount * multToUse;
    executeWin(winAmount);
    
    // Trigger confetti if the board was completely cleared
    if (finalRevealed === 25 - mineCount) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b']
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b']
        });
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4f46e5', '#8b5cf6', '#10b981', '#f59e0b']
        });
      }, 250);
    }
    
    handleGameOver(true, winAmount, finalRevealed);
  };

  const handleGameOver = async (
    isWin: boolean,
    amount: number = 0,
    finalRevealedCount: number = 0,
    lastClickedIndex?: number
  ) => {
    const allMines: Record<number, boolean> = {};
    mineLocations.forEach((loc) => (allMines[loc] = true));
    setRevealedCells((prev) => ({ ...prev, ...allMines }));

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(100000000 + Math.random() * 900000000);
    const generatedPeriod = `${dateStr}1000${randomSuffix.toString().slice(0, 6)}`;

    if (currentTxId && userId) {
      try {
        const finalRevealedCells = Object.keys(revealedCells).map(Number);
        if (lastClickedIndex !== undefined && !finalRevealedCells.includes(lastClickedIndex)) {
          finalRevealedCells.push(lastClickedIndex);
        }

        await measureApiCall(
          "/api/update_game_details",
          "Sync Game Move Details",
          async () => {
            const res = await fetch(getApiUrl("/api/update_game_details"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId,
                txId: currentTxId,
                gameDetails: {
                  isWin,
                  betAmount,
                  winAmount: amount,
                  mineCount,
                  revealedCount: finalRevealedCount,
                  multiplier: isWin ? (amount / betAmount).toFixed(2) : "0.00",
                  mineLocations,
                  revealedCells: finalRevealedCells
                }
              })
            });
            return await res.json();
          },
          true
        );
      } catch (e) {
        console.error("Failed to update game details", e);
      }
    }

    setTimeout(() => {
      setGameOver({
        isWin,
        amount,
        revealedCount: finalRevealedCount,
        mineCount,
        betAmount,
        periodId: generatedPeriod,
      });
    }, 800);
  };

  const closeModal = () => {
    setGameOver(null);
    setRevealedCells({});
  };

  return (
    <div className="w-full">
      {/* Balance Widget */}
      <div
        className="glass-premium rounded-[20px] p-6 mb-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40 transform-gpu"
      >
        {/* Background Mesh Orbs (static for zero repaint lag) */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[30px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-[30px] pointer-events-none" />
        
        {/* Futuristic Card Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-60 mix-blend-overlay pointer-events-none" />

        <div className="flex justify-between items-center relative z-10 gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase text-indigo-400 tracking-[0.2em] font-black mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" />
              Available Balance
            </div>
            <div className="text-2xl font-display font-black flex items-center gap-1 text-slate-100 tracking-tight drop-shadow-sm truncate">
              <span className="text-indigo-400 font-semibold text-xl">₹</span>
              <span className="truncate">{Number(balance || 0).toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => setActivePage("wallet")}
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-5 rounded-[12px] text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-transform active:scale-[0.98] cursor-pointer shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] border border-indigo-400/30 overflow-hidden relative group mt-1"
          >
            <Wallet size={15} className="stroke-[2.5] relative z-10" /> 
            <span className="relative z-10">Deposit</span>
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="mb-8 relative transform-gpu">
        <div className="flex justify-between items-center mb-4 px-2">
          <div className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-950/40 flex items-center justify-center border border-indigo-900/40">
               <Activity size={14} className="text-indigo-400" />
            </div>
            Mines Grid
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:bg-slate-850 hover:border-slate-750 text-slate-400 transition-all cursor-pointer"
              title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-sm">
              <select
              value={mineCount}
              onChange={(e) => {
                if (!isPlaying) setMineCount(parseInt(e.target.value));
              }}
              disabled={isPlaying}
              className="bg-transparent text-slate-200 font-black py-1.5 px-3 rounded-lg text-xs outline-none appearance-none cursor-pointer text-center disabled:opacity-50"
            >
              <option value="1" className="bg-slate-950 text-slate-200">1 Mine</option>
              <option value="3" className="bg-slate-950 text-slate-200">3 Mines</option>
              <option value="5" className="bg-slate-950 text-slate-200">5 Mines</option>
              <option value="10" className="bg-slate-950 text-slate-200">10 Mines</option>
              <option value="20" className="bg-slate-950 text-slate-200">20 Mines</option>
              <option value="24" className="bg-slate-950 text-slate-200">24 Mines</option>
            </select>
          </div>
        </div>
      </div>

        <div className="relative">
        <div className="grid grid-cols-5 gap-2.5 perspective-[1000px] bg-slate-900/40 p-3.5 rounded-[24px] border border-slate-800/80 shadow-[0_12px_40px_-4px_rgba(0,0,0,0.6)] transform-gpu">
          {Array.from({ length: 25 }).map((_, i) => {
            const isRevealed = revealedCells[i];
            const isMine = mineLocations.includes(i);

            return (
              <div
                key={i}
                onClick={() => revealCell(i)}
                className={`aspect-square rounded-[14px] cursor-pointer flex items-center justify-center text-xl relative preserve-3d group select-none transition-all duration-300
                  ${!isRevealed 
                    ? "mine-cell-unrevealed hover:scale-105 active:scale-95" 
                    : ""
                  }
                  ${isRevealed && !isMine 
                    ? "bg-gradient-to-br from-indigo-950 via-indigo-600 to-indigo-500 border border-indigo-400 text-white rotate-y-180 shadow-[0_8px_20px_-5px_rgba(99,102,241,0.4)]" 
                    : ""
                  }
                  ${isRevealed && isMine 
                    ? "bg-gradient-to-br from-rose-950 via-rose-600 to-red-600 border border-rose-400 text-white rotate-y-180 shadow-[0_8px_20px_-5px_rgba(244,63,94,0.4)]" 
                    : ""
                  }
                `}
              >
                {!isRevealed && (
                  <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-800 group-hover:bg-indigo-400/80 rotate-45 transition-colors duration-200" />
                )}
                {isRevealed && !isMine && (
                  <Gem size={26} className="rotate-y-180 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
                )}
                {isRevealed && isMine && (
                  <Bomb size={26} className="rotate-y-180 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]" />
                )}
              </div>
            );
          })}
        </div>

  
        </div>

        <AnimatePresence>
          {isPlaying && revealedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 py-5 px-6 glass-premium border border-indigo-500/20 rounded-[20px] text-center flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden bg-slate-900/40"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] font-black text-slate-400 relative z-10">
                Current Multiplier
              </span>
              <span className="text-3xl font-display font-black text-indigo-400 relative z-10 drop-shadow-sm">
                {Number(currentMult || 1).toFixed(2)}x
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="glass-premium rounded-[20px] p-6 border border-slate-800/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] bg-slate-900/40"
      >
        <div className="mb-6">
          <label className="block text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-3 pl-1">
            Bet Amount (₹)
          </label>
          <div className="flex bg-slate-950 rounded-[14px] p-1 border border-slate-800 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all shadow-inner items-center">
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
              disabled={isPlaying}
              className="bg-transparent border-none text-slate-100 p-3 w-full text-2xl font-display font-black outline-none pl-4 disabled:text-slate-500"
              min="10"
            />
            <button
              onClick={() => adjustBet(0.5)}
              disabled={isPlaying}
              className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-[10px] font-black hover:bg-slate-750 disabled:opacity-40 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              ½
            </button>
            <button
              onClick={() => adjustBet(2)}
              disabled={isPlaying}
              className="ml-2 mr-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-[10px] font-black hover:bg-slate-750 disabled:opacity-40 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              2x
            </button>
          </div>
        </div>

        {!isPlaying ? (
          <button
            onClick={startGame}
            className="w-full py-4.5 rounded-[14px] border-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2.5"
          >
            <Activity size={16} className="animate-pulse" />
            Initiate Protocol
          </button>
        ) : (
          <button
            onClick={() => cashout()}
            disabled={revealedCount === 0}
            className={`w-full py-4.5 rounded-[14px] border-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-black uppercase tracking-[0.2em] cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2.5 ${revealedCount === 0 ? "grayscale opacity-50 cursor-not-allowed shadow-none" : ""}`}
          >
            <Trophy size={16} className="animate-bounce" />
            Cashout{" "}
            {revealedCount > 0
              ? `(₹${(Number(betAmount || 0) * Number(currentMult || 1)).toFixed(2)})`
              : "(1.00x)"}
          </button>
        )}
      </motion.div>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[100] p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 300 }}
              className={`w-full max-w-[340px] text-center rounded-[24px] relative p-8 shadow-[0_32px_80px_-15px_rgba(0,0,0,0.8)] border backdrop-blur-xl overflow-hidden bg-slate-950/95
                ${gameOver.isWin
                  ? "border-amber-500/30 shadow-amber-500/10"
                  : "border-slate-800 shadow-slate-950/50"
                }`}
            >
              {/* Dynamic Confetti/Particles Effect */}
              <ParticlesEffect isWin={gameOver.isWin} />

              {/* Decorative top glow */}
              {gameOver.isWin && (
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
              )}

              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 p-1.5 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer z-20"
                title="Close"
              >
                <X size={18} className="stroke-[2.5]" />
              </button>

              {/* Header Badge */}
              <div className="relative w-24 h-24 mx-auto mt-2 mb-6 flex items-center justify-center">
                {gameOver.isWin ? (
                  <>
                    <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 p-[3px] shadow-lg shadow-amber-500/30">
                      <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                        <div className="w-[85%] h-[85%] rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-inner relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20" />
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="text-white drop-shadow-md"
                          >
                            <Trophy size={40} className="stroke-[2]" />
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-slate-800/20 rounded-full blur-xl" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 p-[3px] shadow-sm">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                        <div className="w-[85%] h-[85%] rounded-full bg-slate-900 flex items-center justify-center shadow-inner text-slate-500">
                          <Bomb size={36} className="stroke-[2]" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Title & Status */}
              <div className="mt-2 relative z-10">
                {gameOver.isWin ? (
                  <>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500/90 flex items-center justify-center gap-1.5 mb-1">
                      <Sparkles size={12} className="text-amber-500 animate-pulse" />
                      Huge Win!
                      <Sparkles size={12} className="text-amber-500 animate-pulse" />
                    </h3>
                    <h2 className="text-5xl font-black text-slate-100 tracking-tighter my-3 font-display drop-shadow-sm flex items-center justify-center gap-1">
                      <span className="text-2xl font-bold text-amber-500">₹</span>
                      {Number(gameOver.amount || 0).toFixed(2)}
                    </h2>
                  </>
                ) : (
                  <>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">
                      Game Over
                    </h3>
                    <h2 className="text-4xl font-black text-slate-300 tracking-tighter my-3 font-display">
                      Defeat
                    </h2>
                  </>
                )}
              </div>

              {/* Minimalist Stats Grid */}
              <div className="grid grid-cols-3 gap-2.5 my-6 relative z-10">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-[12px] p-3 text-center flex flex-col justify-center shadow-sm backdrop-blur-sm">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Bet</span>
                  <span className="text-sm font-black text-slate-300 font-mono">₹{gameOver.betAmount}</span>
                </div>
                <div className={`border rounded-[12px] p-3 text-center flex flex-col justify-center shadow-sm backdrop-blur-sm
                  ${gameOver.isWin
                    ? "bg-amber-950/20 border-amber-900/40 text-amber-400"
                    : "bg-slate-900/60 border-slate-800/80 text-slate-400"
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-widest font-bold mb-1">Payout</span>
                  <span className="text-sm font-black mt-0.5 font-mono">
                    {((Number(gameOver.amount || 0)) / (Number(gameOver.betAmount || 1))).toFixed(2)}x
                  </span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-[12px] p-3 text-center flex flex-col justify-center shadow-sm backdrop-blur-sm">
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Gems</span>
                  <span className="text-sm font-black text-slate-300 mt-0.5 flex items-center justify-center gap-1 font-mono">
                    <Gem size={12} className="text-indigo-400" /> {gameOver.revealedCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 relative z-10 mt-2">
                <button
                  onClick={closeModal}
                  className={`w-full py-3.5 px-6 rounded-[12px] text-[13px] font-black tracking-widest uppercase transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.98]
                    ${gameOver.isWin
                      ? "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-white shadow-amber-500/15 border border-amber-400/50"
                      : "bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 shadow-slate-900/40"
                    }`}
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LiveTicker() {
  const [ticks, setTicks] = useState<
    { user: string; amount: string; id: number; mines: number; multiplier: number; bet: number }[]
  >([]);

  const indianUsers = [
    "Trader_Pro",
    "Aditya_K",
    "Sneha_Patel",
    "Vikram_Singh",
    "Priya_Sharma",
    "Karan_D",
    "Rohan_Mehta",
    "Pooja_Joshi",
    "Sanjay_Gupta",
    "Divya_Nair",
    "Arjun_Reddy",
    "Amit_Kumar",
    "Simran_K",
    "Vijay_Chawla",
    "Aisha_Khan",
    "Manish_G",
    "Sandeep_88",
    "Preeti_M",
    "Sunil_D",
    "Ritu_Sharma",
    "Alok_Verma",
    "Harish_K",
    "Kavita_P",
    "Deepak_Yadav"
  ];

  useEffect(() => {
    // Generate initial items
    const initialTicks = Array.from({ length: 3 }).map((_, idx) => {
      const user = indianUsers[Math.floor(Math.random() * indianUsers.length)];
      const mines = [1, 3, 5, 10, 20][Math.floor(Math.random() * 5)];
      let multiplier = 1.1;
      if (mines === 1) multiplier = parseFloat((Math.random() * 0.5 + 1.1).toFixed(2));
      else if (mines === 3) multiplier = parseFloat((Math.random() * 2 + 1.3).toFixed(2));
      else if (mines === 5) multiplier = parseFloat((Math.random() * 5 + 1.5).toFixed(2));
      else if (mines === 10) multiplier = parseFloat((Math.random() * 12 + 2.0).toFixed(2));
      else multiplier = parseFloat((Math.random() * 40 + 5.0).toFixed(2));
      
      const bet = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
      const amt = (bet * multiplier).toFixed(2);
      return {
        user,
        amount: amt,
        id: Date.now() - idx * 4000,
        mines,
        multiplier,
        bet
      };
    });
    setTicks(initialTicks);

    const interval = setInterval(() => {
      const user = indianUsers[Math.floor(Math.random() * indianUsers.length)];
      const mines = [1, 3, 5, 10, 20][Math.floor(Math.random() * 5)];
      let multiplier = 1.1;
      if (mines === 1) multiplier = parseFloat((Math.random() * 0.4 + 1.05).toFixed(2));
      else if (mines === 3) multiplier = parseFloat((Math.random() * 1.8 + 1.25).toFixed(2));
      else if (mines === 5) multiplier = parseFloat((Math.random() * 4.5 + 1.45).toFixed(2));
      else if (mines === 10) multiplier = parseFloat((Math.random() * 10 + 1.95).toFixed(2));
      else multiplier = parseFloat((Math.random() * 35 + 4.95).toFixed(2));

      const bet = [100, 200, 500, 1000, 2000, 3000][Math.floor(Math.random() * 6)];
      const amt = (bet * multiplier).toFixed(2);

      setTicks((prev) => {
        const newTicks = [{ user, amount: amt, id: Date.now(), mines, multiplier, bet }, ...prev];
        return newTicks.slice(0, 4);
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-premium p-5 rounded-[20px] mt-6 text-xs relative overflow-hidden border-slate-800/80 bg-slate-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Background Mesh */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-[30px]" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="text-slate-400 text-[10px] uppercase tracking-widest font-black flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>{" "}
          Live Global Payouts
        </div>
        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 bg-slate-950/40 px-2 py-0.5 rounded-md border border-slate-800/40">
          <span>Active Players</span>
        </div>
      </div>
      
      <div className="overflow-hidden relative z-10 h-[260px]">
        <AnimatePresence>
          {ticks.map((tick) => (
            <motion.div
              key={tick.id}
              initial={{ opacity: 0, x: -15, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, x: 0, height: "54px", marginBottom: 10 }}
              exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="flex justify-between items-center px-3 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/40 hover:border-slate-700/60 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-900/50 flex items-center justify-center text-indigo-400 font-black text-xs shrink-0 shadow-inner">
                  {tick.user.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-extrabold text-[11px] truncate">{tick.user}</span>
                    <BadgeCheck size={11} className="text-blue-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Mined {tick.mines} 💣</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-indigo-400">{tick.multiplier}x</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-emerald-400 font-black bg-emerald-950/40 px-2.5 py-1 rounded-[8px] border border-emerald-900/40 shadow-sm text-[11px]">
                  +₹{parseFloat(tick.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mr-1">Bet: ₹{tick.bet}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {ticks.length === 0 && (
          <div className="text-slate-400 italic font-medium p-2 text-[10px]">
            Syncing live payouts from server...
          </div>
        )}
      </div>
    </div>
  );
}

function WingedRocket({ isWin }: { isWin: boolean }) {
  return (
    <div className="relative w-20 h-20 mx-auto -mt-10 flex items-center justify-center">
      {/* Outer winged ornament */}
      <svg className="absolute w-36 h-18 overflow-visible" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Wing with layered premium look */}
        <path
          d="M75 50 C40 35, 25 45, 5 30 C12 55, 35 65, 75 52 C50 67, 35 77, 20 72 C40 85, 60 80, 75 52"
          fill={isWin ? "url(#win-wing)" : "url(#lose-wing)"}
          className="drop-shadow-md"
        />
        {/* Right Wing with layered premium look */}
        <path
          d="M125 50 C160 35, 175 45, 195 30 C188 55, 165 65, 125 52 C150 67, 165 77, 180 72 C160 85, 140 80, 125 52"
          fill={isWin ? "url(#win-wing)" : "url(#lose-wing)"}
          className="drop-shadow-md"
        />
        <defs>
          <linearGradient id="win-wing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFB300" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="lose-wing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Outer circle of badge */}
      <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shadow-md border-2 ${isWin ? 'bg-gradient-to-br from-amber-300 via-orange-400 to-amber-600 border-amber-200 shadow-amber-500/20' : 'bg-gradient-to-br from-slate-200 via-sky-300 to-indigo-400 border-slate-100 shadow-slate-400/20'}`}>
        {/* Inner circle */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-inner ${isWin ? 'text-orange-500' : 'text-slate-500'}`}>
          {/* Rocket icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 3.12-2 4.5 1.38 0 3.24-.5 4.5-2" />
            <path d="M12 15l-3-3m0 0l-3 3M9 12l3 3" />
            <path d="M15 9l-3-3m0 0L9 9m3-3l3 3" />
            <path d="M19.5 4.5c-2.78-2.78-7.31-2.42-10 1l6.5 6.5c3.42-2.69 3.78-7.22 1-10z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ParticlesEffect({ isWin }: { isWin: boolean }) {
  if (!isWin) return null;

  const colors = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6"];

  const particles = [
    { id: 1, x: 15, size: 6, color: colors[0], delay: 0, duration: 1.6 },
    { id: 2, x: 35, size: 7, color: colors[1], delay: 0.2, duration: 1.8 },
    { id: 3, x: 55, size: 5, color: colors[2], delay: 0.1, duration: 1.5 },
    { id: 4, x: 75, size: 6, color: colors[3], delay: 0.3, duration: 1.9 },
    { id: 5, x: 85, size: 5, color: colors[4], delay: 0.15, duration: 1.7 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute opacity-75 rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: `${p.x}%`,
            top: `-10px`,
          }}
          animate={{
            y: ["0px", "400px"],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
