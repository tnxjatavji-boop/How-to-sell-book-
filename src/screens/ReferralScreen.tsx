import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { 
  ArrowLeft, Share2, Copy, Check, Users, Gift, TrendingUp, 
  Award, ShieldCheck, HelpCircle, ChevronRight, CheckCircle2,
  DollarSign, ArrowUpRight
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const ReferralScreen = () => {
  const navigate = useNavigate();
  const { userId, userStats } = useAppContext();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const referralCode = userStats?.referralCode || 'TRADEX';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  useEffect(() => {
    if (userId) {
      fetchReferrals();
    }
  }, [userId]);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/referrals?userId=${encodeURIComponent(userId)}`, {
        headers: {
          'Authorization': `Bearer ${encodeURIComponent(userId)}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReferrals(data.referrals || []);
        }
      }
    } catch (e) {
      console.warn("Referrals fetch handled:", e);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyCode = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareToWhatsApp = () => {
    triggerHaptic('light');
    const msg = `🚀 Join TradeXora with my referral code *${referralCode}* to get an instant ₹500 welcome bonus & unlimited ₹10,000 Demo balance!\n\nSign up here: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareToTelegram = () => {
    triggerHaptic('light');
    const msg = `🚀 Join TradeXora - The Fastest Real-Time Trading Platform! Use code: ${referralCode} for exclusive deposit bonus.`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  const tiers = [
    { name: 'Bronze Partner', invites: '1 - 5 Users', share: '0.5%', bonus: '₹50/Active User', current: referrals.length <= 5, color: 'from-amber-700 to-amber-900', badge: 'bg-amber-100 text-amber-800' },
    { name: 'Silver VIP', invites: '6 - 15 Users', share: '0.8%', bonus: '₹100/Active User', current: referrals.length > 5 && referrals.length <= 15, color: 'from-slate-400 to-slate-600', badge: 'bg-slate-100 text-slate-800' },
    { name: 'Gold Elite', invites: '16 - 50 Users', share: '1.2%', bonus: '₹200/Active User', current: referrals.length > 15 && referrals.length <= 50, color: 'from-amber-400 to-amber-600', badge: 'bg-yellow-100 text-yellow-800' },
    { name: 'Diamond Master', invites: '50+ Users', share: '2.0%', bonus: '₹500 + VIP Perks', current: referrals.length > 50, color: 'from-purple-500 to-indigo-600', badge: 'bg-purple-100 text-purple-800' },
  ];

  const faqs = [
    {
      q: "How does the TradeXora Referral Program work?",
      a: "When your friends register using your referral link or enter your referral code, they are permanently linked to your affiliate network. Every time they place trades or make deposits, you earn real turnover commission credited directly to your Real wallet."
    },
    {
      q: "When do I receive my referral earnings?",
      a: "Referral commissions are calculated in real-time and credited instantly to your account. You can withdraw your earnings immediately to your UPI or bank account with zero lock-in period."
    },
    {
      q: "Is there any limit to how many friends I can invite?",
      a: "No! There is absolutely no limit. The more friends you invite, the higher your partner tier and commission percentage becomes (up to 2% lifetime turnover share)."
    },
    {
      q: "What benefits do my referred friends get?",
      a: "Your friends get an instant ₹500 welcome deposit voucher, access to 100% first-deposit booster match, and free ₹10,000 refillable practice balance."
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans select-none overflow-y-auto">
      {/* Header */}
      <div className="bg-white px-4 py-3.5 border-b border-gray-100 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { triggerHaptic('light'); navigate(-1); }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900 tracking-tight">Refer & Earn Program</h1>
            <div className="text-[10px] text-purple-600 font-bold">Lifetime Passive Revenue</div>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200/60 px-2.5 py-1 rounded-full text-purple-700 font-bold text-xs">
          <span>Up to 2%</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Hero Card */}
        <div className="bg-gradient-to-br from-[#1b1035] via-[#2a1352] to-[#120824] rounded-3xl p-5 text-white shadow-xl shadow-purple-950/20 relative overflow-hidden border border-purple-800/40">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-purple-500/20 border border-purple-400/30 px-3 py-1 rounded-full text-purple-200 text-xs font-semibold mb-3">
              <Gift className="w-3.5 h-3.5 text-purple-300" />
              <span>Lifetime Affiliate Partner</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight leading-tight mb-2">
              Invite Friends & Earn <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-200">
                Passive Cash Daily
              </span>
            </h2>

            <p className="text-xs text-purple-200/90 leading-relaxed mb-5 font-medium">
              Share your link with traders, colleagues, and groups. Earn up to <b className="text-white">2% lifetime turnover commission</b> directly to your Real Account every time they trade.
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-purple-300/80">Total Earnings</div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  ₹{(userStats?.referralBonus || 0).toLocaleString()}
                </div>
              </div>
              <div className="text-left border-l border-white/10 pl-3">
                <div className="text-[10px] uppercase font-bold text-purple-300/80">Network Size</div>
                <div className="text-xl font-black text-white font-mono">
                  {referrals.length} <span className="text-xs font-normal text-purple-300">Traders</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Tools Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Your Referral Assets</h3>
                <div className="text-[11px] text-gray-400">Share with friends to link them</div>
              </div>
            </div>
          </div>

          {/* Code Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Your Referral Code</div>
              <div className="text-xl font-black text-gray-900 tracking-widest font-mono mt-0.5">{referralCode}</div>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Link Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Direct Invite Link</div>
              <div className="text-xs text-gray-700 font-mono truncate mt-0.5">{referralLink}</div>
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-3 px-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="font-black text-sm">WhatsApp</span>
            </button>
            <button
              onClick={shareToTelegram}
              className="flex items-center justify-center gap-2 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold text-xs py-3 px-3 rounded-xl transition shadow-sm active:scale-95 cursor-pointer"
            >
              <span className="font-black text-sm">Telegram</span>
            </button>
          </div>
        </div>

        {/* 3 Step Guide */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3.5">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm">How It Works in 3 Simple Steps</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Share Your Link or Code</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  Send your exclusive referral link on WhatsApp, Telegram, or social media to friends and trader communities.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Friend Registers & Deposits</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  Your friend signs up, receives their ₹500 welcome bonus, and starts trading on TradeXora real-time pairs.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900">Earn Daily Lifetime Commission</div>
                <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  You get automatic revenue share on every deal they place, with instant withdrawable balance and zero locking.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner Tiers Ladder */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-gray-900 text-sm">Partner Commission Tiers</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-400">Automatic Upgrades</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tiers.map((t, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl border transition-all ${
                  t.current 
                    ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500/20' 
                    : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${t.badge}`}>
                    {t.name}
                  </span>
                  <span className="text-xs font-black text-purple-700 font-mono">{t.share}</span>
                </div>
                <div className="text-[11px] font-semibold text-gray-800">{t.invites}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{t.bonus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Network Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-900 text-sm">Your Invited Network ({referrals.length})</h3>
            </div>
            <div className="text-xs font-bold text-gray-500">
              Total Bonus: <span className="text-emerald-600 font-black">₹{(userStats?.referralBonus || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[260px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400 font-medium">Loading your network data...</div>
            ) : referrals.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mx-auto mb-2.5">
                  <Users className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-gray-800">No Invites Yet</div>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 mb-3">
                  Share your link with your first friend to unlock lifetime affiliate earnings.
                </p>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Referral Link</span>
                </button>
              </div>
            ) : (
              referrals.map((ref, idx) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                      {(ref.name || ref.email || 'User').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900">{ref.name || 'Trader Partner'}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Active Trader'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-gray-700" />
            <h3 className="font-bold text-gray-900 text-sm">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between bg-gray-50/60 hover:bg-gray-50 transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-800 pr-2">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
                </button>
                {activeFaq === idx && (
                  <div className="p-3 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
