import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, CheckCircle2, RotateCcw, Smartphone, Eye, EyeOff } from 'lucide-react';

interface PatternLockProps {
  onSuccess: (token: string) => void;
  onCancel?: () => void;
}

// 3x3 Grid Coordinates (Canvas size 300x300)
const DOTS = [
  { id: 1, x: 50, y: 50 },
  { id: 2, x: 150, y: 50 },
  { id: 3, x: 250, y: 50 },
  { id: 4, x: 50, y: 150 },
  { id: 5, x: 150, y: 150 },
  { id: 6, x: 250, y: 150 },
  { id: 7, x: 50, y: 250 },
  { id: 8, x: 150, y: 250 },
  { id: 9, x: 250, y: 250 },
];

export const PatternLock: React.FC<PatternLockProps> = ({ onSuccess, onCancel }) => {
  // Config status: whether a pattern has been configured in the system yet
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup mode states: 'draw_new' | 'confirm_new' | 'enter_vip'
  const [setupStep, setSetupStep] = useState<'draw_new' | 'confirm_new' | 'enter_vip'>('draw_new');
  const [firstPattern, setFirstPattern] = useState<number[]>([]);
  const [vipKey, setVipKey] = useState('');
  const [confirmVipKey, setConfirmVipKey] = useState('');
  const [showVipKey, setShowVipKey] = useState(false);

  // Active interaction states
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [statusText, setStatusText] = useState<string>('Draw Pattern to Unlock');
  const [statusColor, setStatusColor] = useState<'normal' | 'error' | 'success'>('normal');

  // VIP Key Reset Modal State
  const [showVipResetModal, setShowVipResetModal] = useState(false);
  const [resetVipKeyInput, setResetVipKeyInput] = useState('');
  const [vipResetError, setVipResetError] = useState<string | null>(null);
  const [isVerifyingVip, setIsVerifyingVip] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Check whether a pattern is already configured
  useEffect(() => {
    fetchPatternStatus();
  }, []);

  const fetchPatternStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pattern_status');
      const data = await res.json();
      setIsConfigured(Boolean(data.configured));
      if (!data.configured) {
        setSetupStep('draw_new');
        setStatusText('Set New Master Pattern (Connect at least 4 dots)');
      } else {
        setStatusText('Draw Pattern to Unlock');
      }
    } catch {
      // Default to configured if fetch fails
      setIsConfigured(true);
      setStatusText('Draw Pattern to Unlock');
    } finally {
      setLoading(false);
    }
  };

  // Convert client pointer event (touch/mouse) to grid coordinates
  const getCoordinates = (e: React.PointerEvent) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = 300 / rect.width;
    const scaleY = 300 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Find if coordinate touches a dot
  const getDotAtPosition = (x: number, y: number): number | null => {
    const HIT_RADIUS = 32;
    for (const dot of DOTS) {
      const dist = Math.hypot(dot.x - x, dot.y - y);
      if (dist <= HIT_RADIUS) {
        return dot.id;
      }
    }
    return null;
  };

  // Pointer Down (Start drawing)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (loading || statusColor === 'error') return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const hitDot = getDotAtPosition(coords.x, coords.y);
    setIsDrawing(true);
    setCurrentPointer(coords);

    if (hitDot) {
      setSelectedDots([hitDot]);
    } else {
      setSelectedDots([]);
    }
  };

  // Pointer Move (Dragging line)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    setCurrentPointer(coords);
    const hitDot = getDotAtPosition(coords.x, coords.y);

    if (hitDot && !selectedDots.includes(hitDot)) {
      setSelectedDots((prev) => [...prev, hitDot]);
    }
  };

  // Pointer Up (Complete pattern)
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPointer(null);

    if (selectedDots.length === 0) return;

    if (!isConfigured) {
      handleSetupPatternInput(selectedDots);
    } else {
      handleUnlockPatternInput(selectedDots);
    }
  };

  // Manual dot click (Alternative to drag for trackpads)
  const handleDotClick = (id: number) => {
    if (isDrawing || statusColor === 'error') return;
    if (!selectedDots.includes(id)) {
      setSelectedDots((prev) => [...prev, id]);
    }
  };

  const handleManualSubmit = () => {
    if (selectedDots.length === 0) return;
    if (!isConfigured) {
      handleSetupPatternInput(selectedDots);
    } else {
      handleUnlockPatternInput(selectedDots);
    }
  };

  const clearSelection = () => {
    setSelectedDots([]);
    setCurrentPointer(null);
    setStatusColor('normal');
  };

  // Handle pattern verification during unlock
  const handleUnlockPatternInput = async (pattern: number[]) => {
    if (pattern.length < 4) {
      flashError('Pattern too short (minimum 4 dots required)');
      return;
    }

    setStatusText('Verifying Master Pattern...');
    try {
      const res = await fetch('/api/admin/pattern_login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern: pattern.join(',') }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        setStatusColor('success');
        setStatusText('Master Pattern Verified! Unlocking Terminal...');
        sessionStorage.setItem('tradexora_admin_token', data.token);
        sessionStorage.setItem('tradexora_admin_auth', 'true');
        try {
          localStorage.setItem('tradexora_admin_token', data.token);
          localStorage.setItem('tradexora_admin_auth', 'true');
        } catch {}
        setTimeout(() => {
          onSuccess(data.token);
        }, 500);
      } else {
        flashError(data.message || 'गलत पैटर्न! कृपया पुनः प्रयास करें।');
      }
    } catch {
      flashError('Authentication network error. Please try again.');
    }
  };

  // Handle pattern during first-time setup
  const handleSetupPatternInput = (pattern: number[]) => {
    if (setupStep === 'draw_new') {
      if (pattern.length < 4) {
        flashError('Pattern must connect at least 4 dots.');
        return;
      }
      setFirstPattern(pattern);
      setSelectedDots([]);
      setSetupStep('confirm_new');
      setStatusText('Confirm Pattern: Draw the same pattern again');
    } else if (setupStep === 'confirm_new') {
      if (pattern.join(',') !== firstPattern.join(',')) {
        flashError('Patterns do not match! Draw again.');
        setSelectedDots([]);
        setSetupStep('draw_new');
        setStatusText('Set New Master Pattern (Connect at least 4 dots)');
        return;
      }
      // Pattern confirmed! Now ask for VIP Key
      setSetupStep('enter_vip');
      setStatusText('Step 2: Set VIP Recovery Key (Crucial)');
    }
  };

  // Save Pattern + VIP Key to Server
  const handleSavePatternAndVip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipKey.trim()) {
      flashError('Please enter a VIP Key.');
      return;
    }
    if (vipKey !== confirmVipKey) {
      flashError('VIP Keys do not match.');
      return;
    }

    setStatusText('Encrypting & Arming Pattern Security...');
    try {
      const endpoint = isConfigured ? '/api/admin/pattern_reset' : '/api/admin/pattern_setup';
      const body = isConfigured
        ? { vipKey: resetVipKeyInput || vipKey, newPattern: firstPattern.join(',') }
        : { pattern: firstPattern.join(','), vipKey: vipKey.trim() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.token) {
        setStatusColor('success');
        setStatusText('✅ Pattern & VIP Key successfully saved!');
        sessionStorage.setItem('tradexora_admin_token', data.token);
        sessionStorage.setItem('tradexora_admin_auth', 'true');
        try {
          localStorage.setItem('tradexora_admin_token', data.token);
          localStorage.setItem('tradexora_admin_auth', 'true');
        } catch {}
        setTimeout(() => {
          onSuccess(data.token);
        }, 800);
      } else {
        flashError(data.message || 'Failed to save pattern configuration.');
      }
    } catch {
      flashError('Server error while saving pattern.');
    }
  };

  // Handle VIP Key Reset Verification
  const handleVerifyVipKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetVipKeyInput.trim()) {
      setVipResetError('Please enter your Secret VIP Key.');
      return;
    }

    setIsVerifyingVip(true);
    setVipResetError(null);

    try {
      const res = await fetch('/api/admin/verify_vip_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vipKey: resetVipKeyInput.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setShowVipResetModal(false);
        setIsConfigured(false); // Switch to setup mode for entering new pattern!
        setSetupStep('draw_new');
        setVipKey(resetVipKeyInput.trim());
        setConfirmVipKey(resetVipKeyInput.trim());
        setSelectedDots([]);
        setStatusColor('normal');
        setStatusText('VIP Key Verified! Draw your NEW Master Pattern:');
      } else {
        setVipResetError('❌ अमान्य VIP Key! पैटर्न केवल सही VIP Key से ही रिसेट हो सकता है।');
      }
    } catch {
      setVipResetError('Network error verifying VIP Key.');
    } finally {
      setIsVerifyingVip(false);
    }
  };

  const flashError = (msg: string) => {
    setStatusColor('error');
    setStatusText(msg);
    setTimeout(() => {
      setSelectedDots([]);
      setStatusColor('normal');
      if (!isConfigured) {
        setStatusText(setupStep === 'draw_new' ? 'Connect at least 4 dots' : 'Confirm your pattern');
      } else {
        setStatusText('Draw Pattern to Unlock');
      }
    }, 1200);
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 p-6 sm:p-8 space-y-6 select-none font-sans text-slate-100">
      
      {/* Smartphone Lock Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-1">
          <Smartphone className="w-7 h-7" />
        </div>
        
        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-black text-white tracking-tight font-mono">
              OPERATOR<span className="text-emerald-400">_NEXUS</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-mono font-black uppercase border border-emerald-800/60">
              PATTERN OS
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Mobile-Grade Pattern Authentication Shield
          </p>
        </div>
      </div>

      {/* Status Notice Indicator */}
      <div
        className={`p-3 rounded-2xl text-xs font-mono font-bold text-center border transition-all ${
          statusColor === 'error'
            ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
            : statusColor === 'success'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
            : 'bg-slate-900 border-slate-700/80 text-slate-300'
        }`}
      >
        {statusText}
      </div>

      {/* Main Pattern Lock Screen or VIP Setup Form */}
      {setupStep === 'enter_vip' ? (
        <form onSubmit={handleSavePatternAndVip} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>महत्वपूर्ण VIP Key सुरक्षा नियम:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              यह VIP Key अत्यंत गुप्त रखें। भविष्य में यदि आप पैटर्न भूल जाते हैं, तो यह पैटर्न <strong>केवल इसी VIP Key से रिसेट हो सकेगा</strong>। किसी अन्य डेटा या पासवर्ड से यह रिसेट नहीं होगा।
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                Enter Secret VIP Key:
              </label>
              <div className="relative">
                <input
                  type={showVipKey ? "text" : "password"}
                  value={vipKey}
                  onChange={(e) => setVipKey(e.target.value)}
                  placeholder="e.g. TX_VIP_MASTER_KEY_9821"
                  required
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowVipKey(!showVipKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showVipKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
                Confirm Secret VIP Key:
              </label>
              <input
                type={showVipKey ? "text" : "password"}
                value={confirmVipKey}
                onChange={(e) => setConfirmVipKey(e.target.value)}
                placeholder="Re-enter same VIP Key..."
                required
                className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setSetupStep('draw_new');
                setSelectedDots([]);
                setStatusText('Draw Pattern to Setup (Minimum 4 dots)');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
            >
              Re-draw Pattern
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              Save Pattern & Arm Security
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Interactive Pattern Grid Container */}
          <div className="flex justify-center">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] bg-[#070b12] rounded-3xl border border-slate-800/90 shadow-inner flex items-center justify-center touch-none cursor-crosshair overflow-hidden"
            >
              {/* SVG Connecting Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 300 300">
                {/* Completed Lines between selected dots */}
                {selectedDots.map((dotId, index) => {
                  if (index === 0) return null;
                  const prevDot = DOTS.find((d) => d.id === selectedDots[index - 1])!;
                  const curDot = DOTS.find((d) => d.id === dotId)!;
                  return (
                    <line
                      key={`line-${index}`}
                      x1={prevDot.x}
                      y1={prevDot.y}
                      x2={curDot.x}
                      y2={curDot.y}
                      stroke={statusColor === 'error' ? '#f43f5e' : statusColor === 'success' ? '#10b981' : '#38bdf8'}
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeOpacity="0.85"
                    />
                  );
                })}

                {/* Active dragging line to pointer */}
                {isDrawing && selectedDots.length > 0 && currentPointer && (
                  <line
                    x1={DOTS.find((d) => d.id === selectedDots[selectedDots.length - 1])!.x}
                    y1={DOTS.find((d) => d.id === selectedDots[selectedDots.length - 1])!.y}
                    x2={currentPointer.x}
                    y2={currentPointer.y}
                    stroke={statusColor === 'error' ? '#f43f5e' : '#38bdf8'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                    strokeOpacity="0.75"
                  />
                )}
              </svg>

              {/* 3x3 Dots */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-4">
                {DOTS.map((dot) => {
                  const isSelected = selectedDots.includes(dot.id);
                  return (
                    <div
                      key={dot.id}
                      onClick={() => handleDotClick(dot.id)}
                      className="flex items-center justify-center cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? statusColor === 'error'
                              ? 'bg-rose-500/20 border-2 border-rose-500 shadow-lg shadow-rose-500/50 scale-110'
                              : statusColor === 'success'
                              ? 'bg-emerald-500/20 border-2 border-emerald-400 shadow-lg shadow-emerald-500/50 scale-110'
                              : 'bg-cyan-500/20 border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 scale-110'
                            : 'bg-slate-800/80 border border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full transition-all ${
                            isSelected
                              ? statusColor === 'error'
                                ? 'bg-rose-400 shadow-sm shadow-rose-400'
                                : statusColor === 'success'
                                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                                : 'bg-cyan-300 shadow-sm shadow-cyan-300'
                              : 'bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Helper Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
            <button
              type="button"
              onClick={clearSelection}
              disabled={selectedDots.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            {selectedDots.length > 0 && (
              <button
                type="button"
                onClick={handleManualSubmit}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Pattern ({selectedDots.length} Dots)</span>
              </button>
            )}

            {isConfigured && (
              <button
                type="button"
                onClick={() => {
                  setShowVipResetModal(true);
                  setVipResetError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-700/50 hover:bg-amber-900/50 text-amber-300 transition text-[11px] font-bold cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Reset with VIP Key</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span className="flex items-center gap-1.5 text-emerald-400/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Pattern Lock Armed
        </span>
        <span className="text-[11px]">VIP SHA-256 Protocol</span>
      </div>

      {/* ========================================================= */}
      {/* VIP KEY RESET MODAL (ONLY VIP KEY CAN RESET PATTERN)     */}
      {/* ========================================================= */}
      {showVipResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111726] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-sm text-white">VIP Key Pattern Reset</h3>
                <p className="text-[11px] text-slate-400 font-mono">केवल अधिकृत VIP Key द्वारा ही रीसेट संभव है</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              सुरक्षा नियमों के अनुसार, एडमिन पैटर्न लॉक केवल आपकी पंजीकृत <strong>Secret VIP Key</strong> से ही रिसेट हो सकता है। कृपया अपनी VIP Key दर्ज करें:
            </p>

            <form onSubmit={handleVerifyVipKey} className="space-y-3">
              <input
                type="password"
                value={resetVipKeyInput}
                onChange={(e) => setResetVipKeyInput(e.target.value)}
                placeholder="Enter registered VIP Key..."
                required
                autoFocus
                className="w-full bg-[#0a0e17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />

              {vipResetError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{vipResetError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVipResetModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingVip}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs transition shadow-md shadow-amber-600/25 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingVip ? 'Verifying VIP Key...' : 'Verify & Unlock Pattern Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
