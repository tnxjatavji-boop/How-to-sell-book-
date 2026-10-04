import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowLeft, History, ArrowDownLeft, ArrowUpRight, 
  CheckCircle2, Clock, XCircle, RefreshCw, Filter, Sparkles 
} from 'lucide-react';

interface TransactionItem {
  id: string;
  type: 'deposit' | 'withdraw' | 'bet' | 'win' | 'promo_reg' | 'promo_dep' | 'promo_bet';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  utr?: string;
  upi?: string;
  date: string;
  description?: string;
}

export const TransactionHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAppContext();

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'deposit' | 'withdraw'>('all');

  const fetchTransactions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/history?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.history) {
        // Keep strictly deposit and withdrawal records
        const cleanHistory = data.history.filter((tx: TransactionItem) => 
          tx.type === 'deposit' || tx.type === 'withdraw' || tx.type === 'promo_dep'
        );
        setTransactions(cleanHistory);
      }
    } catch (e) {
      console.warn("Failed to fetch history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  const filteredList = transactions.filter(tx => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'deposit') return tx.type === 'deposit' || tx.type === 'promo_dep';
    if (activeFilter === 'withdraw') return tx.type === 'withdraw';
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-50 font-sans pb-6 select-none">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black text-gray-900 flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#0088cc]" />
          <span>Deposit & Withdrawal History</span>
        </h1>
        <button 
          onClick={fetchTransactions} 
          disabled={loading}
          className="p-1.5 text-gray-500 hover:text-[#0088cc] rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          title="Refresh History"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0088cc]' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 bg-white border-b border-gray-100 flex gap-2">
        {[
          { id: 'all', label: 'All Transfers' },
          { id: 'deposit', label: 'Deposits' },
          { id: 'withdraw', label: 'Withdrawals' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide text-center transition-all cursor-pointer ${
              activeFilter === tab.id
                ? 'bg-[#0088cc] text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Quick Action Bar for Deposit / Withdraw */}
      <div className="p-3 bg-slate-100/70 border-b border-gray-200 flex gap-2">
        <Link
          to="/deposit"
          className="flex-1 bg-[#00b067] hover:bg-[#009255] text-white py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs transition-colors"
        >
          <ArrowDownLeft className="w-3.5 h-3.5" />
          <span>New Deposit</span>
        </Link>
        <Link
          to="/withdraw"
          className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-xs transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
          <span>Withdraw</span>
        </Link>
      </div>

      {/* Transactions List */}
      <div className="p-3 space-y-2.5 flex-1">
        {loading && transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
            <div className="w-8 h-8 border-3 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-bold">Loading transaction records...</div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-xs space-y-2">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0088cc] flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-gray-900">No Transactions Found</div>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              You do not have any recorded {activeFilter === 'all' ? '' : activeFilter} transactions yet.
            </p>
          </div>
        ) : (
          filteredList.map(tx => {
            const isDeposit = tx.type === 'deposit' || tx.type === 'promo_dep';
            const isWithdraw = tx.type === 'withdraw';

            return (
              <div 
                key={tx.id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-3"
              >
                {/* Left Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold ${
                    isDeposit 
                      ? 'bg-emerald-50 text-[#00b067] border border-emerald-100' 
                      : 'bg-blue-50 text-[#0088cc] border border-blue-100'
                  }`}>
                    {isDeposit ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-black text-gray-900 capitalize truncate flex items-center gap-1.5">
                      <span>{isDeposit ? 'Deposit' : 'Withdrawal'}</span>
                      {tx.utr && (
                        <span className="text-[10px] font-mono font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                          UTR: {tx.utr.substring(0, 10)}...
                        </span>
                      )}
                      {tx.upi && (
                        <span className="text-[10px] font-medium text-gray-400 truncate max-w-[120px]">
                          UPI: {tx.upi}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[11px] text-gray-400 font-medium">
                      {tx.date ? new Date(tx.date).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Recent'}
                    </div>

                    {tx.description && (
                      <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                        {tx.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Amount & Status Badge */}
                <div className="text-right shrink-0">
                  <div className={`text-sm font-black ${
                    isDeposit 
                      ? 'text-[#00b067]' 
                      : 'text-gray-900'
                  }`}>
                    {isDeposit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <div className="mt-1">
                    {tx.status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-[#00b067] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : tx.status === 'pending' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-600 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>Processing</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
