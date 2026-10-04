import { useState, useEffect } from "react";
import { toast } from "./Toast";
import {
  Copy,
  ArrowDownToLine,
  ArrowUpRight,
  Activity,
  BookOpen,
  Gamepad2,
  Trophy,
  Clock,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../apiConfig";

const DEPOSIT_UPIS = [
  "TradeXora@freecharge",
];

const DEPOSIT_OPTIONS = [200, 500, 1000, 2000, 5000, 10000];

function maskUpi(upi: string) {
  if (!upi) return "";
  const parts = upi.split("@");
  if (parts.length < 2) return upi;
  const username = parts[0];
  const domain = parts[1];

  const maskedUsername =
    username.length > 2
      ? username[0] + "*".repeat(username.length - 2) + username[username.length - 1]
      : username[0] + "*";

  const maskedDomain =
    domain.length > 2
      ? domain[0] + "*".repeat(domain.length - 2) + domain[domain.length - 1]
      : domain[0] + "*";

  return `${maskedUsername}@${maskedDomain}`;
}

function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(Number(value || 0));

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;
    const duration = 400;
    const startValue = displayValue;
    const targetValue = Number(value || 0);

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const nextValue = startValue + (targetValue - startValue) * progress;
      setDisplayValue(nextValue);
      
      if (progress < 1) {
        animId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };
    
    animId = window.requestAnimationFrame(step);
    return () => {
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [value]);

  return <>{Number(displayValue || 0).toFixed(2)}</>;
}

export function Wallet({ balance, userId, fetchBalance, wagerData }: any) {
  const [tab, setTab] = useState<"deposit" | "withdraw" | "ledger">("deposit");
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [randomUpi, setRandomUpi] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [ledgerHistory, setLedgerHistory] = useState<any[]>([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  const fetchLedger = async () => {
    setIsLedgerLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/history?userId=${encodeURIComponent(userId)}`));
      const data = await res.json();
      if (data.history) {
        setLedgerHistory(data.history);
      }
    } catch (e) {
      console.error("Error fetching ledger:", e);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "ledger") {
      fetchLedger();
    }
  }, [tab]);

  const redeemGiftCode = async () => {
    const trimmedCode = (giftCode || "").trim().toUpperCase();
    if (!trimmedCode) return;
    setIsRedeeming(true);
    try {
      const res = await fetch(getApiUrl("/api/redeem_gift"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, code: trimmedCode }),
      });
      const data = await res.json();
      if (data.success) {
        toast(data.message || "Code redeemed successfully!");
        setGiftCode("");
        fetchBalance();
      } else {
        toast(data.message || "Invalid or used Gift Code");
      }
    } catch (e) {
      toast("Error redeeming gift code");
    } finally {
      setIsRedeeming(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast("Copied!");
  };

  const handleProceedToPay = () => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt < 200) {
      toast("Minimum deposit is ₹200");
      return;
    }
    if (amt > 20000) {
      toast("Maximum deposit is ₹20000");
      return;
    }
    window.open(`/checkout?amount=${amt}&userId=${encodeURIComponent(userId || '')}`, '_blank');
  };

  const verifyDeposit = async () => {
    if (utr.length < 10) {
      toast("Invalid Transaction ID (UTR)");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/deposit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, utr, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Deposit submitted! Processing instant credit.");
        setUtr("");
        setAmount("");
        setShowPaymentForm(false);
      } else {
        toast(data.message || "Failed to submit");
      }
    } catch (e) {
      toast("Error submitting deposit");
    }
    setIsLoading(false);
  };

  const requestWithdrawal = async () => {
    if (!bankHolder.trim() || !bankAccount.trim() || !bankIfsc.trim()) {
      toast("Please fill all bank details (Holder Name, Account No, IFSC)");
      return;
    }
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt < 100) {
      toast("Minimum withdrawal is ₹100");
      return;
    }

    const recipientDetails = `Bank: ${bankHolder.trim()} | Acc: ${bankAccount.trim()} | IFSC: ${bankIfsc.toUpperCase().trim()}`;

    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/api/withdraw"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, upi: recipientDetails, amount: amt }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Withdrawal requested! Funds will be sent to your bank account via IMPS.");
        setBankHolder("");
        setBankAccount("");
        setBankIfsc("");
        setWithdrawAmount("");
        fetchBalance();
      } else {
        toast(data.message || "Failed to submit");
      }
    } catch (e) {
      toast("Error submitting withdrawal");
    }
    setIsLoading(false);
  };

  const wagerTarget = wagerData?.target || 0;
  const wagerCurrent = wagerData?.current || 0;
  const wagerRemaining = Math.max(0, wagerTarget - wagerCurrent);
  const wagerPercent =
    wagerTarget > 0 ? Math.min(100, (wagerCurrent / wagerTarget) * 100) : 100;

  return (
    <div className="w-full space-y-6 pb-20">
      <div className="flex bg-slate-900/40 p-1.5 rounded-[20px] relative z-10 border border-slate-800/80 shadow-inner backdrop-blur-md">
        <button
          onClick={() => setTab("deposit")}
          className={`flex-1 py-3.5 rounded-[14px] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all relative z-10 ${tab === "deposit" ? "text-indigo-400 font-extrabold" : "text-slate-500 hover:text-slate-300 cursor-pointer"}`}
        >
          {tab === "deposit" && (
            <motion.div
              layoutId="wallet-tab"
              className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-[14px] shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.55 }}
            />
          )}
          <ArrowDownToLine size={14} className={`relative z-10 stroke-[2.5] transition-transform duration-300 ${tab === "deposit" ? "-translate-y-0.5 scale-110" : ""}`} />{" "}
          <span className={`relative z-10 transition-transform duration-300 ${tab === "deposit" ? "-translate-y-0.5" : ""}`}>Deposit</span>
        </button>
        <button
          onClick={() => setTab("withdraw")}
          className={`flex-1 py-3.5 rounded-[14px] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all relative z-10 ${tab === "withdraw" ? "text-purple-400 font-extrabold" : "text-slate-500 hover:text-slate-300 cursor-pointer"}`}
        >
          {tab === "withdraw" && (
            <motion.div
              layoutId="wallet-tab"
              className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-[14px] shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.55 }}
            />
          )}
          <ArrowUpRight size={14} className={`relative z-10 stroke-[2.5] transition-transform duration-300 ${tab === "withdraw" ? "-translate-y-0.5 scale-110" : ""}`} />{" "}
          <span className={`relative z-10 transition-transform duration-300 ${tab === "withdraw" ? "-translate-y-0.5" : ""}`}>Withdraw</span>
        </button>
        <button
          onClick={() => setTab("ledger")}
          className={`flex-1 py-3.5 rounded-[14px] text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-1.5 transition-all relative z-10 ${tab === "ledger" ? "text-emerald-400 font-extrabold" : "text-slate-500 hover:text-slate-300 cursor-pointer"}`}
        >
          {tab === "ledger" && (
            <motion.div
              layoutId="wallet-tab"
              className="absolute inset-0 bg-slate-950 border border-slate-800 rounded-[14px] shadow-sm -z-10"
              transition={{ type: "spring", bounce: 0.15, duration: 0.55 }}
            />
          )}
          <BookOpen size={14} className={`relative z-10 stroke-[2.5] transition-transform duration-300 ${tab === "ledger" ? "-translate-y-0.5 scale-110" : ""}`} />{" "}
          <span className={`relative z-10 sm:inline hidden transition-transform duration-300 ${tab === "ledger" ? "-translate-y-0.5" : ""}`}>Transaction History</span>
          <span className={`relative z-10 sm:hidden inline transition-transform duration-300 ${tab === "ledger" ? "-translate-y-0.5" : ""}`}>History</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab + (showPaymentForm ? "-form" : "")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "deposit" && (
            <>
              {!showPaymentForm ? (
                <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl"></div>
                  <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                  <div className="mb-8 relative z-10">
                    <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-5">
                      <div className="w-6 h-6 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-900/50">
                         <ArrowDownToLine size={12} className="text-indigo-400" />
                      </div>
                      Select Deposit Amount
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {DEPOSIT_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setAmount(opt.toString())}
                          className={`py-4 rounded-[12px] font-black text-sm transition-all border cursor-pointer ${amount === opt.toString() ? "bg-gradient-to-br from-indigo-500 to-indigo-600 border-transparent text-white shadow-md shadow-indigo-500/20 scale-[1.02]" : "bg-slate-950 border-slate-850 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-950/20"}`}
                        >
                          ₹{opt}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-500">₹</div>
                      <input
                        type="number"
                        placeholder="Custom Amount (Min 200, Max 20k)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-4.5 pl-9 pr-5 rounded-[12px] text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToPay}
                    className="w-full py-5 rounded-[12px] border-none bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-[0.2em] cursor-pointer active:scale-[0.98] transition-all shadow-xl shadow-indigo-600/20 relative z-10 flex justify-center items-center gap-2"
                  >
                    Proceed to Pay <ArrowUpRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-[10px] text-slate-300 uppercase tracking-[0.15em] font-black mb-6 hover:text-indigo-400 transition-colors relative z-10 flex items-center gap-1.5 cursor-pointer bg-slate-950 border border-slate-800 py-2 px-3 rounded-lg"
                  >
                    &larr; Back
                  </button>

                  <div className="bg-slate-950 border border-slate-850 rounded-[16px] p-6 text-center mb-6 relative overflow-hidden z-10 shadow-sm">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <div className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2 mt-2">
                      Pay exactly
                    </div>
                    <div className="text-4xl font-display font-black text-slate-100 mb-8 drop-shadow-sm">
                      ₹{amount}
                    </div>

                    <div className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-500 mb-3 text-left pl-1">
                      To UPI ID
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 mb-6 shadow-inner gap-2">
                      <span className="font-black text-slate-300 tracking-wide text-xs sm:text-sm truncate flex-1 min-w-0 text-left">
                        {maskUpi(randomUpi)}
                      </span>
                      <button
                        onClick={() => copyText(randomUpi)}
                        className="flex items-center justify-center shrink-0 gap-1.5 text-[10px] uppercase tracking-wider font-black text-indigo-400 hover:text-white transition-all py-2 px-3 bg-indigo-950/40 border border-indigo-900/40 hover:bg-indigo-600 active:scale-95 rounded-lg cursor-pointer"
                      >
                        <Copy size={14} /> Copy
                      </button>
                    </div>

                    <a
                      href={`upi://pay?pa=${randomUpi}&pn=Pingo&am=${amount}&cu=INR`}
                      className="flex items-center justify-center gap-2 w-full py-4.5 rounded-lg border-2 border-indigo-500/20 bg-indigo-950/30 hover:bg-indigo-600 hover:text-white text-indigo-400 text-xs font-black active:scale-[0.98] transition-all uppercase tracking-[0.15em] shadow-sm"
                    >
                      Open UPI App <ArrowUpRight size={16} />
                    </a>
                  </div>

                  <div className="mb-8 relative z-10">
                    <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-3 pl-1">
                      Enter 12-Digit UTR / Ref Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30129381..."
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-4.5 px-5 rounded-[12px] text-sm outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                    />
                  </div>

                  <button
                    onClick={verifyDeposit}
                    disabled={isLoading}
                    className="w-full py-5 rounded-[12px] border-none bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black cursor-pointer active:scale-[0.98] transition-all uppercase tracking-[0.2em] mb-6 disabled:opacity-50 shadow-xl shadow-emerald-500/20 relative z-10"
                  >
                    {isLoading ? "Verifying..." : "Confirm Deposit"}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "withdraw" && (
            <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

              <div className="bg-slate-950 p-6 rounded-[16px] mb-8 border border-slate-850 flex flex-col items-center justify-center relative overflow-hidden z-10 shadow-sm">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black mb-2 text-slate-500 mt-1">
                  Available Real Liquidity
                </span>
                <span className="text-5xl font-display font-black text-slate-100 mb-2 drop-shadow-sm flex items-center justify-center gap-1">
                  ₹<AnimatedCounter value={balance} />
                </span>

                <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 py-1.5 px-3.5 rounded-full shadow-inner">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Instant IMPS Liquidity • 100% Unlocked</span>
                </div>
              </div>

              <div className="mb-4 relative z-10">
                <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-2 pl-1">
                  Withdraw Amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="Amount (Min ₹100)"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3.5 px-4 rounded-[12px] text-sm outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                />
              </div>

              <div className="mb-4 relative z-10 space-y-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-1.5 pl-1">
                    Select Your Bank
                  </label>
                  <select
                    onChange={e => {
                      const bankVal = e.target.value;
                      const prefixMap: Record<string, string> = {
                        'SBI': 'SBIN0',
                        'HDFC': 'HDFC0',
                        'ICICI': 'ICIC0',
                        'PNB': 'PUNB0',
                        'Axis': 'UTIB0',
                        'Bank of Baroda': 'BARB0',
                        'Kotak': 'KKBK0',
                        'Canara': 'CNRB0',
                        'Union Bank': 'UBIN0',
                        'Airtel Bank': 'AIRP0',
                        'Paytm Bank': 'PYTM0'
                      };
                      if (prefixMap[bankVal] && (!bankIfsc || bankIfsc.length <= 5)) {
                        setBankIfsc(prefixMap[bankVal]);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3 px-4 rounded-[12px] text-xs outline-none focus:border-purple-500/50 transition-all font-bold shadow-inner"
                  >
                    <option value="">Choose Bank (All Indian Banks)</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="PNB">Punjab National Bank (PNB)</option>
                    <option value="Axis">Axis Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda (BOB)</option>
                    <option value="Kotak">Kotak Mahindra Bank</option>
                    <option value="Canara">Canara Bank</option>
                    <option value="Union Bank">Union Bank of India</option>
                    <option value="Airtel Bank">Airtel Payments Bank</option>
                    <option value="Paytm Bank">Paytm Payments Bank</option>
                    <option value="IPPB">India Post Payments Bank (IPPB)</option>
                    <option value="Other">Other Bank</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-1.5 pl-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="Full name as in bank passbook"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3 px-4 rounded-[12px] text-xs outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-1.5 pl-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Bank Account Number"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value.replace(/\s+/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3 px-4 rounded-[12px] text-xs font-mono outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 mb-1.5 pl-1">
                    Bank IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="e.g. SBIN0001234 / HDFC0000123"
                    value={bankIfsc}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-100 py-3 px-4 rounded-[12px] text-xs font-mono uppercase outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-500 font-bold shadow-inner"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 mb-4 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Withdrawal Amount:</span>
                  <span className="font-bold text-slate-200">₹{Number(amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Processing Fee (4%):</span>
                  <span className="font-bold text-rose-400">₹{(Math.round(Number(amount || 0) * 0.04 * 100) / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-100 border-t border-slate-800 pt-1 text-xs">
                  <span>Net Payout to Bank:</span>
                  <span className="text-emerald-400 font-black">₹{(Math.max(0, Math.round((Number(amount || 0) - Number(amount || 0) * 0.04) * 100) / 100)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={requestWithdrawal}
                disabled={isLoading || wagerRemaining > 0}
                className="w-full py-5 rounded-[12px] border-none bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-black cursor-pointer active:scale-[0.98] transition-all uppercase tracking-[0.2em] disabled:opacity-50 relative z-10 shadow-xl shadow-purple-500/20"
              >
                {isLoading ? "Processing..." : wagerRemaining > 0 ? `Turnover Incomplete (₹${Number(wagerRemaining || 0).toFixed(0)} Left)` : "Confirm Withdrawal Request"}
              </button>
            </div>
          )}

          {tab === "ledger" && (
            <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-slate-800/80 bg-slate-900/40">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

              <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-800/60 pb-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-900/40 flex items-center justify-center">
                       <BookOpen size={16} className="text-emerald-400 stroke-[2.5]" />
                    </div>
                    Transaction History
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Deposit & Withdrawal Logs</p>
                </div>
                <button
                  onClick={fetchLedger}
                  disabled={isLedgerLoading}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Refresh History"
                >
                  <RefreshCw size={14} className={`stroke-[2.5] ${isLedgerLoading ? "animate-spin text-emerald-400" : ""}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center shadow-inner">
                  <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500">Available</div>
                  <div className="text-base font-black text-slate-100 mt-1">₹{Number(balance || 0).toFixed(2)}</div>
                </div>
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-center shadow-inner">
                  <div className="text-[9px] uppercase tracking-[0.15em] font-black text-slate-500">Total Logs</div>
                  <div className="text-base font-black text-slate-100 mt-1">{ledgerHistory.filter(tx => tx.type === "deposit" || tx.type === "withdraw").length} logs</div>
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2.5 relative z-10 custom-scrollbar">
                {isLedgerLoading ? (
                  <div className="flex flex-col justify-center items-center py-12 gap-3">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] uppercase tracking-wider font-black text-slate-500">Loading Records...</span>
                  </div>
                ) : ledgerHistory.filter(tx => tx.type === "deposit" || tx.type === "withdraw").length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center bg-slate-950 border border-slate-850 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-3 border border-slate-800">
                       <Clock size={20} className="text-slate-600" />
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      No records found
                    </div>
                  </div>
                ) : (
                  ledgerHistory.filter(tx => tx.type === "deposit" || tx.type === "withdraw").map((tx, idx) => {
                    const isNegative = tx.type === "withdraw" || tx.type === "bet";
                    
                    const getLabel = (type: string) => {
                      switch (type) {
                        case "deposit": return "Deposit";
                        case "withdraw": return "Withdrawal";
                        case "bet": return "Game Bet";
                        case "win": return "Game Win";
                        default: return type.charAt(0).toUpperCase() + type.slice(1);
                      }
                    };

                    const getIconElement = (type: string) => {
                      switch (type) {
                        case "deposit": return <ArrowDownToLine size={14} className="text-indigo-400 stroke-[2.5]" />;
                        case "withdraw": return <ArrowUpRight size={14} className="text-purple-400 stroke-[2.5]" />;
                        case "bet": return <Gamepad2 size={14} className="text-slate-400 stroke-[2.5]" />;
                        case "win": return <Trophy size={14} className="text-emerald-400 stroke-[2.5]" />;
                        default: return <Clock size={14} className="text-slate-500 stroke-[2.5]" />;
                      }
                    };

                    const getBadgeStyle = (status: string) => {
                      if (status === "pending") return "bg-amber-950/40 text-amber-400 border-amber-900/40";
                      if (status === "rejected") return "bg-rose-950/40 text-rose-400 border-rose-900/40";
                      return "bg-emerald-950/40 text-emerald-400 border-emerald-900/40";
                    };

                    return (
                      <div
                        key={tx.id || idx}
                        className="flex items-center justify-between p-3 px-4 rounded-xl border border-slate-850 bg-slate-950 hover:border-slate-800 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${tx.type === 'deposit' ? 'bg-indigo-950/40 border border-indigo-900/40' : 'bg-purple-950/40 border border-purple-900/40'}`}>
                            {getIconElement(tx.type)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-slate-200 text-xs tracking-tight truncate">
                              {getLabel(tx.type)}
                            </div>
                            <div className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                              {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <div className={`text-sm font-black tracking-tight ${isNegative ? "text-purple-400" : "text-emerald-400"}`}>
                            {isNegative ? "-" : "+"}₹{Number(tx.amount || 0).toFixed(2)}
                          </div>
                          {tx.status && (
                            <span className={`inline-block px-1.5 py-0.5 mt-1 text-[8px] font-black uppercase tracking-widest rounded-md border ${getBadgeStyle(tx.status)}`}>
                              {tx.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Gift Code Redemption */}
      <div className="glass-premium rounded-[20px] p-6 relative overflow-hidden z-10 border border-slate-800/80 bg-slate-900/40 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 mb-4">
             <div className="w-6 h-6 rounded-lg bg-emerald-950/80 flex items-center justify-center border border-emerald-900/50">
                <Trophy size={12} className="text-emerald-400" />
             </div>
             Have a Gift Code?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Gift Code"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-100 py-4 px-4 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-500 font-bold uppercase shadow-inner"
            />
            <button
              onClick={redeemGiftCode}
              disabled={isRedeeming || !giftCode.trim()}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 border-none"
            >
              {isRedeeming ? "Wait..." : "Redeem"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
