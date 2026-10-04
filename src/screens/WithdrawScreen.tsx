import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, ArrowUpRight, ShieldCheck, History, 
  CreditCard, Smartphone, CheckCircle2, AlertCircle, Clock, Headphones, ExternalLink, Activity, Building2, ChevronDown
} from 'lucide-react';

export const INDIAN_BANKS = [
  { name: 'State Bank of India (SBI)', short: 'SBI', ifscPrefix: 'SBIN0' },
  { name: 'HDFC Bank', short: 'HDFC', ifscPrefix: 'HDFC0' },
  { name: 'ICICI Bank', short: 'ICICI', ifscPrefix: 'ICIC0' },
  { name: 'Punjab National Bank (PNB)', short: 'PNB', ifscPrefix: 'PUNB0' },
  { name: 'Axis Bank', short: 'Axis', ifscPrefix: 'UTIB0' },
  { name: 'Bank of Baroda (BOB)', short: 'BOB', ifscPrefix: 'BARB0' },
  { name: 'Kotak Mahindra Bank', short: 'Kotak', ifscPrefix: 'KKBK0' },
  { name: 'Canara Bank', short: 'Canara', ifscPrefix: 'CNRB0' },
  { name: 'Union Bank of India', short: 'Union', ifscPrefix: 'UBIN0' },
  { name: 'Bank of India (BOI)', short: 'BOI', ifscPrefix: 'BKID0' },
  { name: 'IndusInd Bank', short: 'IndusInd', ifscPrefix: 'INDB0' },
  { name: 'Yes Bank', short: 'Yes Bank', ifscPrefix: 'YESB0' },
  { name: 'IDFC FIRST Bank', short: 'IDFC FIRST', ifscPrefix: 'IDFB0' },
  { name: 'Central Bank of India', short: 'CBI', ifscPrefix: 'CBIN0' },
  { name: 'Indian Bank', short: 'Indian Bank', ifscPrefix: 'IDIB0' },
  { name: 'UCO Bank', short: 'UCO', ifscPrefix: 'UCBA0' },
  { name: 'Indian Overseas Bank (IOB)', short: 'IOB', ifscPrefix: 'IOBA0' },
  { name: 'Federal Bank', short: 'Federal', ifscPrefix: 'FDRL0' },
  { name: 'Punjab & Sind Bank', short: 'P&S Bank', ifscPrefix: 'PSIB0' },
  { name: 'Bank of Maharashtra', short: 'BOM', ifscPrefix: 'MAHB0' },
  { name: 'Bandhan Bank', short: 'Bandhan', ifscPrefix: 'BDBL0' },
  { name: 'RBL Bank', short: 'RBL', ifscPrefix: 'RATN0' },
  { name: 'AU Small Finance Bank', short: 'AU Small', ifscPrefix: 'AUBL0' },
  { name: 'Airtel Payments Bank', short: 'Airtel Bank', ifscPrefix: 'AIRP0' },
  { name: 'Paytm Payments Bank', short: 'Paytm Bank', ifscPrefix: 'PYTM0' },
  { name: 'India Post Payments Bank (IPPB)', short: 'IPPB', ifscPrefix: 'IPOS0' },
  { name: 'Jio Payments Bank', short: 'Jio Bank', ifscPrefix: 'JIOP0' },
  { name: 'Fino Payments Bank', short: 'Fino Bank', ifscPrefix: 'FINO0' },
  { name: 'Other Bank (Custom)', short: 'Other', ifscPrefix: '' }
];

export const WithdrawScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userId, realBalance, fetchBalance, userStats } = useAppContext();

  const isRiskFree = Boolean(userStats?.isRiskFree);
  const wagerTarget = isRiskFree ? 0 : Math.max(0, Number(userStats?.wagerTarget || 0));
  const wagerCurrent = isRiskFree ? 0 : Math.max(0, Number(userStats?.wagerCurrent || 0));
  const wagerRemaining = Math.max(0, Math.round((wagerTarget - wagerCurrent) * 100) / 100);
  const wagerPercent = wagerTarget > 0 ? Math.min(100, Math.round((wagerCurrent / wagerTarget) * 100)) : 100;
  const isTurnoverMet = wagerRemaining <= 0;

  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('500');
  const [selectedBankKey, setSelectedBankKey] = useState<string>('State Bank of India (SBI)');
  const [customBankName, setCustomBankName] = useState<string>('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: 'SBIN0',
    accountHolder: '',
    bankName: 'State Bank of India (SBI)'
  });
  const [loading, setLoading] = useState(false);

  const handleSelectBank = (bankName: string) => {
    setSelectedBankKey(bankName);
    const found = INDIAN_BANKS.find(b => b.name === bankName);
    if (bankName === 'Other Bank (Custom)') {
      setBankDetails(b => ({ ...b, bankName: customBankName }));
    } else if (found) {
      setBankDetails(b => ({
        ...b,
        bankName: found.name,
        ifscCode: found.ifscPrefix && (!b.ifscCode || b.ifscCode.length <= 5) ? found.ifscPrefix : b.ifscCode
      }));
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 200) {
      alert("Minimum withdrawal amount is ₹200");
      return;
    }
    if (numAmount > realBalance) {
      alert("Insufficient Real Account Balance to process this withdrawal.");
      return;
    }

    setStep(2);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!numAmount || numAmount < 200) {
      alert("Minimum withdrawal amount is ₹200");
      return;
    }
    if (numAmount > realBalance) {
      alert("Insufficient Real Account Balance to process this withdrawal.");
      return;
    }

    if (!bankDetails.accountHolder.trim()) {
      alert("Please enter Account Holder Name as per your bank passbook.");
      return;
    }
    if (!bankDetails.accountNumber.trim()) {
      alert("Please enter your Bank Account Number.");
      return;
    }
    if (bankDetails.confirmAccountNumber.trim() && bankDetails.accountNumber.trim() !== bankDetails.confirmAccountNumber.trim()) {
      alert("Bank Account Numbers do not match. Please recheck.");
      return;
    }
    if (!bankDetails.ifscCode.trim() || bankDetails.ifscCode.trim().length < 8) {
      alert("Please enter a valid 11-character Bank IFSC Code (e.g. SBIN0001234, HDFC0000123).");
      return;
    }

    const recipientDetails = `Bank: ${bankDetails.accountHolder.trim()} | Acc: ${bankDetails.accountNumber.trim()} | IFSC: ${bankDetails.ifscCode.toUpperCase().trim()}${bankDetails.bankName.trim() ? ` | Bank Name: ${bankDetails.bankName.trim()}` : ''}`;

    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: numAmount,
          upi: recipientDetails
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Withdrawal request created successfully! Funds will be transferred directly to your bank account via IMPS within 15-30 minutes.");
        fetchBalance();
        navigate('/history');
      } else {
        alert(data.message || "Failed to process withdrawal request.");
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-6 select-none">
      {/* Top Navigation Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-gray-900 flex items-center gap-1.5">
          <span>Withdraw Funds</span>
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

      {/* Real Withdrawable Balance Summary */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-4 text-white shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-gray-400">Withdrawable Balance</div>
              <div className="text-2xl font-black text-[#00b067] mt-0.5">
                ₹{realBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-gray-200">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>15-30 Min Payout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator Tabs */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex bg-white rounded-2xl p-1 border border-gray-200/80 shadow-xs">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 1
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              step === 1 ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
            }`}>
              1
            </span>
            <span>1. Select Amount</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              if (step === 1) handleProceedToStep2(e);
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              step === 2
                ? 'bg-[#0088cc] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              step === 2 ? 'bg-white text-[#0088cc]' : 'bg-gray-200 text-gray-700'
            }`}>
              2
            </span>
            <span>2. Bank Details</span>
          </button>
        </div>
      </div>

      {/* STEP 1: Select Withdrawal Amount */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="p-4 space-y-4 flex-1">
          {/* Quick Amount Selection */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                Withdrawal Amount (₹)
              </label>
              <span className="text-[10px] font-bold text-gray-400">Min ₹200</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {['500', '1000', '2000', '5000', '10000'].map(val => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setAmount(val)}
                  className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    amount === val 
                      ? 'border-[#0088cc] bg-blue-50 text-[#0088cc] shadow-xs' 
                      : 'border-gray-200 bg-gray-50/70 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ₹{Number(val).toLocaleString('en-IN')}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(Math.floor(realBalance).toString())}
                className="py-2 text-xs font-black rounded-xl border border-emerald-300 bg-emerald-50 text-[#00b067] hover:bg-emerald-100 transition-colors"
              >
                All (₹{Math.floor(realBalance)})
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500 font-black text-sm">₹</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount (Min ₹200)"
                min="200"
                max={realBalance}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 font-black text-base focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
              />
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-xs space-y-2 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Withdrawal Amount:</span>
              <span className="font-bold text-gray-800">₹{Number(amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Bank Processing Fee (4%):</span>
              <span className="font-bold text-rose-500">₹{(Math.round(Number(amount || 0) * 0.04 * 100) / 100).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-gray-500 border-t border-gray-100 pt-1.5 font-bold text-gray-900">
              <span>Net Bank Payout:</span>
              <span className="text-[#00b067] font-black text-sm">₹{(Math.max(0, Math.round((Number(amount || 0) - Number(amount || 0) * 0.04) * 100) / 100)).toLocaleString('en-IN')}</span>
            </div>
            
            {/* Turnover status row added directly underneath Net Bank Payout */}
            <div className="flex justify-between items-center text-gray-500 border-t border-dashed border-gray-200 pt-2 text-xs">
              <span className="font-medium text-gray-600">Turnover:</span>
              <span className={`font-bold ${isTurnoverMet ? 'text-emerald-600' : 'text-slate-700 font-mono'}`}>
                {isTurnoverMet ? '✓ Completed (100%)' : `₹${wagerCurrent.toFixed(2)} / ₹${wagerTarget.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Next Button */}
          <button
            type="submit"
            disabled={realBalance < 200 || !amount || Number(amount) < 200}
            className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088cc] to-blue-700 hover:from-blue-700 hover:to-[#0088cc] disabled:opacity-50 active:scale-[0.99] text-white"
          >
            <span>Next: Enter Bank Details</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>

          {/* Security & Guarantee Notes */}
          <div className="text-center text-[10px] text-gray-400 space-y-1 py-1">
            <div className="flex items-center justify-center gap-1 font-bold text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct IMPS Bank Gateway • 100% Payout Assurance</span>
            </div>
            <p>Minimum withdrawal is ₹200. Processing time: 15–30 minutes.</p>
          </div>
        </form>
      )}

      {/* STEP 2: Bank Details Fill-up Tab */}
      {step === 2 && (
        <form onSubmit={handleSubmitWithdrawal} className="p-4 space-y-4 flex-1 animate-in fade-in">
          {/* Selected Amount Banner */}
          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-gray-500 font-bold uppercase block">Payout Amount</span>
              <span className="text-base font-black text-[#0088cc]">
                ₹{Number(amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] font-bold text-blue-700 hover:underline bg-white px-3 py-1.5 rounded-xl border border-blue-200 cursor-pointer shadow-xs"
            >
              Change Amount
            </button>
          </div>

          {/* Payout Destination: Bank IMPS / NEFT Transfer Only */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
                Bank Account Details (IMPS / NEFT)
              </label>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                4% Fee • Express IMPS
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Account Holder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankDetails.accountHolder}
                  onChange={e => setBankDetails(b => ({ ...b, accountHolder: e.target.value }))}
                  placeholder="Full name as per bank passbook"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
              </div>

              {/* Bank Selector Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-gray-700">
                    Select Your Bank <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">All Indian Banks Supported</span>
                </div>

                {/* Quick Select Popular Bank Pills */}
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-0.5">
                  {INDIAN_BANKS.slice(0, 8).map(bank => {
                    const isSelected = selectedBankKey === bank.name;
                    return (
                      <button
                        key={bank.name}
                        type="button"
                        onClick={() => handleSelectBank(bank.name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                          isSelected
                            ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                        }`}
                      >
                        {bank.short}
                      </button>
                    );
                  })}
                </div>

                {/* Full Bank Dropdown Menu */}
                <div className="relative">
                  <select
                    value={selectedBankKey}
                    onChange={e => handleSelectBank(e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc] pr-9 cursor-pointer"
                  >
                    {INDIAN_BANKS.map(bank => (
                      <option key={bank.name} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                </div>

                {/* Custom Bank Name Input if "Other Bank" selected */}
                {selectedBankKey === 'Other Bank (Custom)' && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      value={customBankName}
                      onChange={e => {
                        setCustomBankName(e.target.value);
                        setBankDetails(b => ({ ...b, bankName: e.target.value }));
                      }}
                      placeholder="Type your Bank Name (e.g. Gramin Bank, Co-op Bank)"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Bank Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails(b => ({ ...b, accountNumber: e.target.value.replace(/\s+/g, '') }))}
                    placeholder="Enter Account Number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.confirmAccountNumber}
                    onChange={e => setBankDetails(b => ({ ...b, confirmAccountNumber: e.target.value.replace(/\s+/g, '') }))}
                    placeholder="Re-enter Account Number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Bank IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={bankDetails.ifscCode}
                  onChange={e => setBankDetails(b => ({ ...b, ifscCode: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  placeholder="e.g. SBIN0001234 / HDFC0000123"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-gray-900 uppercase focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
              </div>
            </div>
          </div>

          {/* Submit Withdrawal Button */}
          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading || realBalance < 200}
              className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088cc] to-blue-700 hover:from-blue-700 hover:to-[#0088cc] disabled:opacity-50 active:scale-[0.99] text-white"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Confirm Withdrawal Request</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              ← Back to Amount Selection
            </button>
          </div>

          {/* Security & Guarantee Notes */}
          <div className="text-center text-[10px] text-gray-400 space-y-1 py-1">
            <div className="flex items-center justify-center gap-1 font-bold text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct IMPS Bank Gateway • 100% Payout Assurance</span>
            </div>
            <p>Minimum withdrawal is ₹200. Processing time: 15–30 minutes.</p>
          </div>
        </form>
      )}
    </div>
  );
};
