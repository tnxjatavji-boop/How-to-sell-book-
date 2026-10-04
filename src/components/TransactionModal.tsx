import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { X, Copy, Check, QrCode, ArrowDownLeft, ArrowUpRight, Clock, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface TransactionModalProps {
  type: 'deposit' | 'withdraw' | 'history';
  onClose: () => void;
}

interface TransactionItem {
  id?: string;
  type: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  utr?: string;
  upi?: string;
  date: string;
  description?: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ type: initialType, onClose }) => {
  const { userId, realBalance, fetchBalance, userStats } = useAppContext();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>(initialType);
  const [amount, setAmount] = useState('500');
  const [reference, setReference] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank'>('bank');
  const [bankDetails, setBankDetails] = useState({ accountNo: '', ifsc: '', holderName: '' });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<TransactionItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const DEPOSIT_UPIS = [
    "TradeXora@freecharge",
  ];

  const [selectedUpi, setSelectedUpi] = useState(DEPOSIT_UPIS[0]);

  const copyUpi = (upiToCopy?: string) => {
    const target = upiToCopy || selectedUpi;
    navigator.clipboard.writeText(target);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistory = async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?userId=${userId}`);
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, userId]);

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 100) {
      alert("Minimum deposit amount is ₹100");
      return;
    }
    if (!reference || reference.trim().length < 6) {
      alert("Please enter a valid 12-digit UTR or Transaction ID");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: numAmount,
          utr: reference.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Deposit request submitted successfully! Your funds will be credited as soon as verified.");
        fetchBalance();
        setActiveTab('history');
      } else {
        alert(data.message || "Failed to submit deposit request.");
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 200) {
      alert("Minimum withdrawal amount is ₹200");
      return;
    }
    if (numAmount > realBalance) {
      alert("Insufficient withdrawable balance in Real Account");
      return;
    }

    const upiOrBank = withdrawMethod === 'upi' 
      ? reference.trim() 
      : `${bankDetails.holderName} | ${bankDetails.accountNo} | ${bankDetails.ifsc}`;

    if (!upiOrBank) {
      alert("Please enter your recipient account details");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: numAmount,
          upi: upiOrBank
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Withdrawal request created! Funds will be transferred to your account within 15-30 minutes.");
        fetchBalance();
        setActiveTab('history');
      } else {
        alert(data.message || "Failed to process withdrawal.");
      }
    } catch (e) {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate UPI QR Code URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${selectedUpi}&pn=TradeXora&am=${amount || '100'}&cu=INR`
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div className="flex bg-gray-100 p-1 rounded-full text-xs font-bold">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'deposit' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'withdraw' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Withdraw
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-full transition-colors ${activeTab === 'history' ? 'bg-[#0088cc] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}
            >
              History
            </button>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-5 no-scrollbar">
          {/* DEPOSIT TAB */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <a
                href={`/checkout?amount=${amount || 100}&userId=${encodeURIComponent(userId || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-[#0088cc] to-blue-700 text-white font-bold text-xs rounded-xl hover:opacity-95 transition-all shadow-xs mb-3"
              >
                <span>Open Dedicated Payment Page (New Tab)</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Quick Amount Chips */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {['100', '500', '1000', '2500', '5000', '10000'].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-colors ${amount === val ? 'border-[#0088cc] bg-blue-50 text-[#0088cc]' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Custom Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="100"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                  />
                </div>
              </div>

              {/* UPI Payment Card & QR */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-gray-700 mb-1">Scan & Pay via any UPI App</div>
                <div className="text-[10px] text-gray-500 mb-3">PhonePe • Google Pay • Paytm • BHIM • CRED</div>
                
                <div className="inline-block p-2 bg-white rounded-2xl shadow-sm border border-blue-100 mb-3">
                  <img src={qrCodeUrl} alt="UPI QR Code" className="w-36 h-36 mx-auto rounded-lg" />
                </div>

                <div className="flex items-center justify-between bg-white border border-blue-200 rounded-xl px-3 py-2">
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 uppercase font-semibold">Official Payment UPI ID</div>
                    <div className="font-mono font-bold text-xs text-gray-800">{selectedUpi}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyUpi(selectedUpi)}
                    className="flex items-center gap-1 bg-[#0088cc] hover:bg-[#0088cc]/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {DEPOSIT_UPIS.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    {DEPOSIT_UPIS.map((u, i) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setSelectedUpi(u)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-mono transition-colors ${selectedUpi === u ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                      >
                        UPI #{i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  12-Digit UTR / Transaction ID
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="e.g. 423589123456"
                  maxLength={16}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
                <div className="text-[10px] text-gray-400 mt-1">
                  Find the 12-digit UTR in your payment app receipt after paying.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00b067] hover:bg-[#009b5a] disabled:opacity-50 text-white rounded-xl py-3.5 font-bold text-base transition-colors shadow-sm"
              >
                {loading ? 'Submitting...' : `Submit Deposit (₹${amount || 0})`}
              </button>
            </form>
          </div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'withdraw' && (
            <form onSubmit={handleSubmitWithdraw} className="space-y-4">
              {/* Balance Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Withdrawable Real Balance</div>
                  <div className="text-2xl font-extrabold text-[#00b067]">
                    ₹{realBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-full border border-emerald-200">
                    0% Fee
                  </span>
                </div>
              </div>

              {/* Amount Custom Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Withdraw Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Min ₹200"
                    min="200"
                    max={realBalance}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-900 font-bold text-base focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                  />
                </div>
              </div>

              {/* Payout Destination: Bank IMPS / NEFT Only */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Bank Account Details (IMPS Transfer)
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
                    if (prefixMap[bankVal] && (!bankDetails.ifsc || bankDetails.ifsc.length <= 5)) {
                      setBankDetails(prev => ({ ...prev, ifsc: prefixMap[bankVal] }));
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                >
                  <option value="">Select Your Bank (All Indian Banks)</option>
                  <option value="SBI">State Bank of India (SBI)</option>
                  <option value="HDFC">HDFC Bank</option>
                  <option value="ICICI">ICICI Bank</option>
                  <option value="PNB">Punjab National Bank (PNB)</option>
                  <option value="Axis">Axis Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda (BOB)</option>
                  <option value="Kotak">Kotak Mahindra Bank</option>
                  <option value="Canara">Canara Bank</option>
                  <option value="Union Bank">Union Bank of India</option>
                  <option value="Bank of India">Bank of India (BOI)</option>
                  <option value="IndusInd">IndusInd Bank</option>
                  <option value="Yes Bank">Yes Bank</option>
                  <option value="IDFC FIRST">IDFC FIRST Bank</option>
                  <option value="Central Bank">Central Bank of India</option>
                  <option value="Airtel Bank">Airtel Payments Bank</option>
                  <option value="Paytm Bank">Paytm Payments Bank</option>
                  <option value="IPPB">India Post Payments Bank (IPPB)</option>
                  <option value="Other">Other Bank</option>
                </select>

                <input
                  type="text"
                  required
                  value={bankDetails.holderName}
                  onChange={e => setBankDetails(prev => ({ ...prev, holderName: e.target.value }))}
                  placeholder="Account Holder Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
                <input
                  type="text"
                  required
                  value={bankDetails.accountNo}
                  onChange={e => setBankDetails(prev => ({ ...prev, accountNo: e.target.value.replace(/\s+/g, '') }))}
                  placeholder="Bank Account Number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={bankDetails.ifsc}
                  onChange={e => setBankDetails(prev => ({ ...prev, ifsc: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  placeholder="IFSC Code (e.g. SBIN0001234)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#0088cc]/20 focus:border-[#0088cc]"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Requested Amount:</span>
                  <span className="font-bold text-gray-800">₹{Number(amount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Processing Charge (4%):</span>
                  <span className="font-bold text-rose-500">₹{(Math.round(Number(amount || 0) * 0.04 * 100) / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1">
                  <span>Net Bank Payout:</span>
                  <span className="text-[#00b067] font-black">₹{(Math.max(0, Math.round((Number(amount || 0) - Number(amount || 0) * 0.04) * 100) / 100)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs">
                <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Express 15-30 minute processing straight to your bank account via IMPS.</span>
              </div>

              <button
                type="submit"
                disabled={loading || realBalance < 200}
                className="w-full bg-[#0088cc] hover:bg-[#0088cc]/90 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold text-base transition-colors shadow-sm cursor-pointer"
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal Request'}
              </button>
            </form>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Transactions</span>
                <button onClick={loadHistory} className="text-xs text-[#0088cc] font-semibold hover:underline">
                  Refresh
                </button>
              </div>

              {historyLoading ? (
                <div className="py-12 text-center text-gray-400 text-sm">Loading records...</div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No transaction records found.</div>
              ) : (
                history.map((tx, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-emerald-100 text-[#00b067]' : tx.type === 'withdraw' ? 'bg-blue-100 text-[#0088cc]' : 'bg-purple-100 text-purple-600'}`}>
                        {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 capitalize">{tx.type}</div>
                        <div className="text-[10px] text-gray-400">
                          {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-sm text-gray-900">₹{Number(tx.amount || 0).toFixed(2)}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${tx.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : tx.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {tx.status === 'approved' ? 'Completed' : tx.status === 'pending' ? 'Processing' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
