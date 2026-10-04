import { useState, useEffect } from "react";
import { Copy, Users, Gift, TrendingUp, Sparkles, History, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "./Toast";
import { getApiUrl } from "../apiConfig";

export function Promotion({
  userId,
  fetchBalance,
  wagerData,
  balanceData,
}: any) {
  const referralCode = balanceData?.referralCode || "";
  const referralCount = balanceData?.referralCount || 0;
  const referralBonus = balanceData?.referralBonus || 0;

  const [promoHistory, setPromoHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/promotion/history?userId=${encodeURIComponent(userId)}`));
        const data = await res.json();
        if (active && data.history) {
          setPromoHistory(data.history);
        }
      } catch (e) {
        console.error("Error fetching promo history:", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      active = false;
    };
  }, [userId]);

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast("Referral code copied!");
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return dateStr;
    }
  };

  const shareCode = async () => {
    const shareData = {
      title: 'Join me on Tradexora!',
      text: `Use my referral code ${referralCode} to get a sign-up bonus!`,
      url: window.location.origin + `?ref=${referralCode}`,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      copyCode();
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-950 via-purple-950 to-indigo-900 p-1">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-10"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
        
        <div className="relative bg-slate-900/60 backdrop-blur-md rounded-[16px] p-6 border border-slate-800 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-950/80 rounded-xl mb-4 border border-indigo-900/50 shadow-inner">
            <Sparkles className="text-amber-400" size={24} />
          </div>
          <h2 className="text-2xl font-display font-black text-white mb-2 tracking-tight">Invite & Earn</h2>
          <p className="text-indigo-200 text-xs font-medium mb-6 px-4">
            Earn high commissions directly in your account. The reward is credited when your referee successfully registers with your code and completes their first deposit.
          </p>
          
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
            <div className="text-[9px] text-indigo-400 tracking-[0.2em] font-extrabold uppercase">Your Referral Code</div>
            <div className="text-4xl font-display font-black text-white tracking-[0.1em] drop-shadow-sm">
              {referralCode || "------"}
            </div>
            
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={copyCode}
                className="flex-1 py-3 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center gap-2 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Copy size={16} /> Copy
              </button>
              <button
                onClick={shareCode}
                className="flex-1 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-500/30 flex items-center justify-center gap-2 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] active:scale-95 cursor-pointer"
              >
                <Users size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Verification Notice Box */}
      <div className="border border-amber-500/30 bg-amber-950/20 rounded-[14px] p-4 flex gap-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
        <div className="space-y-1">
          <div className="text-[10px] font-black uppercase tracking-wider text-amber-500">Crucial Wallet Credit Rule</div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The promotional bonus remains strictly locked until your referrers complete their initial deposit. Fake or inactive registration tracking is automatically filtered by our verification layers to prevent self-referrals.
          </p>
        </div>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-premium rounded-[20px] p-5 relative overflow-hidden group hover:border-slate-700 transition-all border border-slate-800 bg-slate-900/40">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 flex items-center justify-center border border-indigo-900/50">
              <Users size={18} className="text-indigo-400" />
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-tight">Total<br/>Invites</div>
          </div>
          <div className="text-3xl font-display font-black text-slate-100 tracking-tight">
            {referralCount}
          </div>
        </div>

        <div className="glass-premium rounded-[20px] p-5 relative overflow-hidden group hover:border-slate-700 transition-all border border-slate-800 bg-slate-900/40">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 rounded-full blur-xl"></div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 flex items-center justify-center border border-emerald-900/50">
              <Gift size={18} className="text-emerald-400" />
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 leading-tight">Total<br/>Bonus</div>
          </div>
          <div className="text-3xl font-display font-black text-emerald-400 tracking-tight">
            ₹{referralBonus.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Commission Tiers */}
      <div className="glass-premium rounded-[20px] p-6 border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <TrendingUp className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-lg">Commission</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Multi-level Rewards</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { level: 'Level 1', type: 'Direct Referrals', req: 'Requires Register + Active Deposit', val: '₹20 + 5% + 1%', color: 'from-amber-400 to-orange-500', icon: '🥇' },
            { level: 'Level 2', type: 'Indirect Referrals', req: 'Referee Deposit + Bet Match', val: '2% + 0.5%', color: 'from-slate-400 to-slate-500', icon: '🥈' },
            { level: 'Level 3', type: 'Indirect Referrals', req: 'Referee Deposit + Bet Match', val: '1% + 0.2%', color: 'from-orange-800 to-amber-900', icon: '🥉' }
          ].map((tier, i) => (
            <div key={i} className="group relative bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between hover:border-slate-700 transition-all">
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-xl shadow-inner border border-white/10`}>
                  {tier.icon}
                </div>
                <div>
                  <div className="font-black text-slate-200 text-sm">{tier.level} <span className="text-xs font-bold text-slate-500 ml-1">({tier.type})</span></div>
                  <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">{tier.req}</div>
                </div>
              </div>
              <div className="text-right relative z-10">
                <div className="font-black text-indigo-400 text-sm">{tier.val}</div>
                <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest mt-0.5">Bonus</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bonus History */}
      <div className="glass-premium rounded-[20px] p-6 border border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-slate-850 flex items-center justify-center border border-slate-800">
            <History className="text-slate-300" size={18} />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-lg">History</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recent Earnings</p>
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex flex-col justify-center items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] uppercase tracking-wider font-black text-slate-500">Loading Records...</span>
          </div>
        ) : promoHistory.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center bg-slate-950/40 border border-slate-800 rounded-xl">
            <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center mb-4 border border-slate-800">
              <Gift size={24} className="text-slate-600" />
            </div>
            <p className="text-slate-300 font-bold text-sm">No Earnings Yet</p>
            <p className="text-slate-500 text-xs font-medium mt-1 max-w-[200px]">Referrals must complete an active deposit for commission to credit!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {promoHistory.map((item, index) => {
              let iconColor = "text-indigo-400 bg-indigo-950/50 border-indigo-900/40";
              let badgeText = "Commission";
              let Icon = TrendingUp;

              if (item.type === "promo_reg") {
                iconColor = "text-purple-400 bg-purple-950/50 border-purple-900/40";
                badgeText = "Sign Up";
                Icon = Users;
              } else if (item.type === "promo_dep") {
                iconColor = "text-emerald-400 bg-emerald-950/50 border-emerald-900/40";
                badgeText = "Deposit";
                Icon = Gift;
              } else if (item.type === "promo_bet") {
                iconColor = "text-amber-400 bg-amber-950/50 border-amber-900/40";
                badgeText = "Wager";
              }

              return (
                <div key={item.id || index} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-800 transition-all shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 ${iconColor}`}>
                      <Icon size={18} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-200">
                        {item.description || "Referral Reward"}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {badgeText}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">
                          {formatDate(item.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-display font-black text-sm text-emerald-400 bg-emerald-950/50 px-2.5 py-1.5 rounded-lg border border-emerald-900/40 shadow-sm">
                      +₹{Number(item.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
