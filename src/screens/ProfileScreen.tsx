import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { triggerHaptic } from '../utils/haptics';
import { motion } from 'motion/react';
import { 
  User, ShieldCheck, Gift, Share2, Copy, Check, LogOut, 
  ArrowUpRight, ArrowDownLeft, ChevronRight, 
  History, Wallet, Headphones, MessageSquare, ExternalLink, Send, Activity, Shield, Info,
  Lock, Eye, EyeOff, Key
} from 'lucide-react';

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { userId, realBalance, demoBalance, userStats, fetchBalance } = useAppContext();
  const [giftModal, setGiftModal] = useState(false);
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [giftLoading, setGiftLoading] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);

  // Password Change & Reset Modal State
  const [passwordModal, setPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSecretTap = () => {
    const newCount = secretTapCount + 1;
    if (newCount >= 5) {
      window.location.href = '/alina-rovergo90-crownpic/rahulraj';
    } else {
      setSecretTapCount(newCount);
      setTimeout(() => setSecretTapCount(0), 3000);
    }
  };

  const referralCode = userStats?.referralCode || 'TRADEX';

  const copyReferral = () => {
    triggerHaptic('success');
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleRedeemGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCodeInput.trim()) {
      alert("Please enter a gift code");
      return;
    }

    setGiftLoading(true);
    try {
      const res = await fetch('/api/redeem_gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: giftCodeInput.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Gift Code redeemed successfully!");
        setGiftCodeInput('');
        setGiftModal(false);
        fetchBalance();
      } else {
        alert(data.message || "Invalid or already used Gift Code.");
      }
    } catch (e) {
      alert("Failed to redeem code. Please try again.");
    } finally {
      setGiftLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!newPassword || newPassword.length < 4) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        triggerHaptic('success');
        setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
        setTimeout(() => {
          setPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordMsg(null);
        }, 1500);
      } else {
        triggerHaptic('error');
        setPasswordMsg({ type: 'error', text: data.message || 'Failed to update password.' });
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    triggerHaptic('heavy');
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem('tradexora_user');
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50 font-sans pb-24 select-none">
      {/* Profile Header Card */}
      <div className="bg-white border-b border-gray-100 px-5 pt-[max(env(safe-area-inset-top,0px),16px)] pb-5">
        <div className="flex items-center gap-3.5 mb-4">
          <div 
            onClick={handleSecretTap}
            title="Profile"
            className="w-14 h-14 bg-gradient-to-tr from-[#0088cc] to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-xl uppercase cursor-pointer active:scale-95 transition-transform"
          >
            {(userId || 'User').substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-gray-900 text-base sm:text-lg truncate max-w-[200px]">{userId || 'User'}</h2>
              <span className="flex items-center gap-0.5 text-[10px] font-extrabold bg-emerald-50 text-[#00b067] px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            </div>
            <div 
              onClick={handleSecretTap}
              className="text-xs text-gray-400 font-mono mt-0.5 cursor-pointer"
            >
              UID: {Math.abs((userId || 'user').split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0)).toString().padStart(8, '0')}
            </div>
          </div>
        </div>

        {/* Balance Overview Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-3.5">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Real Account</div>
            <div className="text-xl font-black text-gray-900 mt-1">
              ₹{realBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Demo Practice</div>
            <div className="text-xl font-black text-gray-900 mt-1">
              ₹{demoBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Action Buttons: Direct Links to Dedicated Pages */}
        <div className="grid grid-cols-2 gap-2.5 mt-3.5">
          <Link
            to="/deposit"
            className="flex items-center justify-center gap-1.5 bg-[#00b067] hover:bg-[#009b5a] text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs"
          >
            <ArrowDownLeft className="w-4 h-4" /> Deposit
          </Link>
          <Link
            to="/withdraw"
            className="flex items-center justify-center gap-1.5 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Referral & Earn Banner */}
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border border-purple-100 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Refer & Earn Real Cash</h3>
                <div className="text-[10px] text-gray-400">Earn lifetime trade turnover commission</div>
              </div>
            </div>
            <a
              href="/referral"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-purple-700 bg-purple-100/80 hover:bg-purple-200/80 px-2.5 py-1 rounded-full transition flex items-center gap-1"
            >
              <span>{userStats?.referralCount || 0} Invites</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center justify-between bg-white border border-purple-200/60 rounded-xl px-3 py-2 mt-3">
            <div>
              <div className="text-[10px] text-gray-400 font-semibold uppercase">Your Referral Code</div>
              <div className="font-mono font-black text-sm text-gray-900 tracking-wider">{referralCode}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={copyReferral}
                className="flex items-center gap-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copiedReferral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedReferral ? 'Copied' : 'Copy'}
              </button>
              <a
                href="/referral"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Menu Items List */}
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs divide-y divide-gray-50">
          <a
            href="/referral"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Refer & Earn Program</span>
                  <span className="text-[9px] font-extrabold bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full">Earn Cash</span>
                </div>
                <div className="text-[10px] text-gray-400">Invite friends, partner tiers & commissions</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>

          <Link
            to="/about"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>About TradeXora</span>
                  <span className="text-[9px] font-extrabold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full">Platform Guide</span>
                </div>
                <div className="text-[10px] text-gray-400">Execution engine, safety & specifications</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            to="/help?view=chat"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center relative">
                <Headphones className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Live Support</span>
                  <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full">Online</span>
                </div>
                <div className="text-[10px] text-gray-400">Ask questions online • 24/7 Support Desk</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <Link
            to="/history"
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 text-[#0088cc] rounded-xl flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm">Transaction Records</div>
                <div className="text-[10px] text-gray-400">View deposit and withdrawal statuses</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>

          <button
            onClick={() => setGiftModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm">Redeem Gift Voucher</div>
                <div className="text-[10px] text-gray-400">Enter coupon code for instant bonus</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setPasswordModal(true);
              setPasswordMsg(null);
            }}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-xs sm:text-sm">Account Security & Password</div>
                <div className="text-[10px] text-gray-400">Update or change account password</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-red-600 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Log Out Account
        </button>
      </div>

      {/* Security & Password Modal */}
      {passwordModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-blue-50 text-[#0088cc] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-0.5">Account Security</h3>
            <p className="text-xs text-gray-500 text-center mb-4">Set or update your account login password</p>

            {passwordMsg && (
              <div className={`p-3 rounded-xl mb-3 text-xs font-semibold flex items-center gap-2 ${
                passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {passwordMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <Shield className="w-4 h-4 text-red-500 shrink-0" />}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Current Password (Optional if newly created)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  New Password (Min 4 chars)
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPasswordModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword}
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Code Modal */}
      {giftModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-gray-900 text-center mb-1">Redeem Gift Code</h3>
            <p className="text-xs text-gray-500 text-center mb-4">Enter promotional voucher code to credit funds directly.</p>

            <form onSubmit={handleRedeemGift} className="space-y-3">
              <input
                type="text"
                value={giftCodeInput}
                onChange={e => setGiftCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. TRADEX100"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setGiftModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={giftLoading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                >
                  {giftLoading ? 'Redeeming...' : 'Apply Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
