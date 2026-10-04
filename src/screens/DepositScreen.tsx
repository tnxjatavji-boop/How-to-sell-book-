import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, ShieldCheck, History, ArrowUpRight, Lock, 
  CreditCard, Sparkles, CheckCircle2, ChevronRight, Headphones, ExternalLink, AlertCircle
} from 'lucide-react';
import { UpiIntentValidator } from '../components/UpiIntentValidator';
import { buildStandardUpiIntent } from '../utils/upiValidator';

export const DepositScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userId, realBalance } = useAppContext();
  
  const [amount, setAmount] = useState('500');

  const numAmount = Number(amount) || 500;

  const handleProceedToPayment = () => {
    if (numAmount < 100) {
      alert("Minimum deposit amount is ₹100");
      return;
    }

    // Validate standard UPI intent format before opening checkout
    const validation = buildStandardUpiIntent({
      upiId: 'tradexora0@okhdfcbank',
      payeeName: 'TradeXora Official',
      amount: numAmount,
      note: `TradeXora Deposit ${userId || 'User'}`
    });

    if (!validation.isValid) {
      alert("UPI Intent Error: " + (validation.errors[0] || "Invalid UPI parameters"));
      return;
    }

    const paymentUrl = `/checkout?amount=${numAmount}&userId=${encodeURIComponent(userId || '')}`;
    navigate(paymentUrl);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-10 select-none text-slate-900">
      
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-gray-200/80 px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-gray-900 flex items-center gap-1.5">
          <span>Deposit Funds</span>
        </h1>
        <Link 
          to="/history" 
          className="flex items-center gap-1 text-xs font-bold text-[#0088cc] hover:bg-blue-50 px-2.5 py-1.5 rounded-xl transition-colors"
          title="Deposit & Withdrawal History"
        >
          <History className="w-4 h-4" />
          <span>History</span>
        </Link>
      </div>

      {/* Account Balance Summary Card */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="bg-gradient-to-br from-[#0088cc] via-blue-700 to-indigo-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xs pointer-events-none" />
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase opacity-80">Current Real Balance</div>
              <div className="text-2xl font-black mt-0.5">
                ₹{realBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-[10px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Instant UPI Gateway</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Amount Selector */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        
        {/* Deposit Amount Selection Box */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#0088cc]" />
              <span>Select Deposit Amount</span>
            </label>
            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Min ₹100
            </span>
          </div>

          {/* Quick Amount Chips */}
          <div className="grid grid-cols-3 gap-2.5">
            {['100', '500', '1000', '2000', '5000', '10000'].map(val => (
              <button
                type="button"
                key={val}
                onClick={() => setAmount(val)}
                className={`py-3 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                  amount === val 
                    ? 'border-[#0088cc] bg-blue-50 text-[#0088cc] shadow-xs ring-2 ring-[#0088cc]/20' 
                    : 'border-gray-200 bg-gray-50/70 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ₹{Number(val).toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          {/* Custom Amount Input Field */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Custom Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 font-black text-base">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter deposit amount (Min ₹100)"
                min="100"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-gray-900 font-black text-base focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
              />
            </div>
          </div>

          {/* Main Action Button - Opens Payment Page in New Tab */}
          <button
            type="button"
            onClick={handleProceedToPayment}
            className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-[#0088cc] hover:opacity-95 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all cursor-pointer text-center mt-2"
          >
            <span>PROCEED TO PAY ₹{numAmount.toLocaleString('en-IN')}</span>
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
