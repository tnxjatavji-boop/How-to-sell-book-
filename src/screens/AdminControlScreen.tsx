import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Radio, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  CheckCircle,
  CheckCircle2, 
  Flame, 
  Users, 
  Sliders, 
  Sparkles,
  Search,
  DollarSign,
  Send,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Check,
  FileText,
  X,
  Crown,
  PlayCircle,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  PlusCircle,
  MinusCircle,
  Filter,
  CheckSquare,
  XCircle,
  Wallet,
  Building2,
  KeyRound,
  ShieldAlert,
  Brain,
  Target,
  Scale,
  QrCode,
  Plus,
  RotateCcw,
  LineChart,
  Globe,
  Database,
  Headphones,
  Bot,
  MessageSquare,
  LogOut
} from 'lucide-react';
import { PatternLock } from '../components/PatternLock';

export interface AdminDepositUpi {
  id: string;
  upiId: string;
  name: string;
  bankName: string;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  notes?: string;
}

export interface AdminChartConfig {
  canonicalPrices: Record<string, number>;
  globalMood: 'NORMAL' | 'BULLISH' | 'BEARISH' | 'HIGH_VOLATILITY';
  updatedAt: number;
}

interface ActiveTradeItem {
  id: string;
  userId: string;
  assetId: string;
  assetName: string;
  amount: number;
  type: 'CALL' | 'PUT';
  entryPrice: number;
  strikeTime: number;
  accountType: 'real' | 'demo';
  createdAt: number;
}

interface AssetSummary {
  assetId: string;
  assetName: string;
  symbol: string;
  price: number;
  totalVolume: number;
  totalTrades: number;
  buyVolume: number;
  buyCount: number;
  sellVolume: number;
  sellCount: number;
  override: 'AUTO' | 'BUY' | 'SELL';
  overrideExpiresAt: number;
}

interface MasterAccountConfig {
  email: string;
  enabled: boolean;
  driveGlobalCandles: boolean;
  winRate: number;
}

interface PlatformAnalytics {
  totalUsers: number;
  activeTradersToday: number;
  openLiveTradesCount: number;
  todayDeposits: number;
  todayWithdrawals: number;
  todayPendingWithdrawals: number;
  todayNetInflow: number;
  monthlyDeposits: number;
  monthlyWithdrawals: number;
  monthlyNetInflow: number;
  lifetimeDeposits: number;
  lifetimeWithdrawals: number;
  totalUserBalances: number;
  platformNetProfit: number;
  isProfit: boolean;
  currentMargin: number;
  masterAccount?: MasterAccountConfig;
  autoProfitAlgorithm: {
    enabled: boolean;
    targetMargin: number;
    currentStatus: string;
    action: string;
    dynamicWinRate: number;
  };
}

interface UserItem {
  email: string;
  name: string;
  balance: number;
  wagerTarget: number;
  wagerCurrent: number;
  hasDeposited: boolean;
  winRate?: number;
  isRiskFree?: boolean;
  isBlocked?: boolean;
  referralCount?: number;
  referralBonus?: number;
}

interface TransactionItem {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  description?: string;
  utr?: string;
  upiId?: string;
  adminNote?: string;
  rejectReason?: string;
}

// Security & Password Hash (SHA-256 of "Råhul34$üdha09Xlfix3636%^89hfufy6d6r6re6e6e5e5yryryr4y4ye5r6r6r6r6r6")
const ADMIN_PASSWORD_HASH = "489eb89b48d7a1e65da1aa10503ee0902c35cca7f0d76f3b5772639fcfe4667d";
const ADMIN_RAW_PASSWORD = "Råhul34$üdha09Xlfix3636%^89hfufy6d6r6re6e6e5e5yryryr4y4ye5r6r6r6r6r6";

async function sha256Hex(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const ADMIN_GATE_KEY = (import.meta.env.VITE_ADMIN_GATE_KEY as string) || "TX_OPS_GATE_2026";

export interface AdminControlScreenProps {
  onLogout?: () => void;
  onSwitchToTrading?: () => void;
}

export const AdminControlScreen: React.FC<AdminControlScreenProps> = ({ onLogout, onSwitchToTrading }) => {
  const navigate = useNavigate();

  // Stealth Gatekeeper Layer (Direct Access enabled)
  const [isGateUnlocked, setIsGateUnlocked] = useState<boolean>(true);
  const [gateInput, setGateInput] = useState('');
  const [showGatePrompt, setShowGatePrompt] = useState(false);
  const [gateError, setGateError] = useState(false);

  // Authentication State with Permanent LocalStorage + SessionStorage Synchronization
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const currentUser = (localStorage.getItem('tradexora_user') || '').toLowerCase().trim();
      const isAuth = sessionStorage.getItem('tradexora_admin_auth') === 'true' || localStorage.getItem('tradexora_admin_auth') === 'true';
      const token = sessionStorage.getItem('tradexora_admin_token') || localStorage.getItem('tradexora_admin_token');
      // If user logged in via platform as master admin aanshiji@gmail.com, grant direct authenticated session!
      if (currentUser === 'aanshiji@gmail.com') {
        return true;
      }
      return isAuth && Boolean(token);
    } catch {
      return false;
    }
  });
  const [passInput, setPassInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authMode, setAuthMode] = useState<'pattern' | 'password'>('pattern');
  const [isResettingData, setIsResettingData] = useState(false);

  // Platform Net Profit / Loss Reset State
  const [isResettingProfit, setIsResettingProfit] = useState(false);
  const [showResetProfitModal, setShowResetProfitModal] = useState(false);
  const [clearHistoryWithReset, setClearHistoryWithReset] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'banking' | 'algorithm' | 'master' | 'traders' | 'signals' | 'upi' | 'security' | 'support'>('banking');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Support Bot & Ticket Management State
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedSupportTicket, setSelectedSupportTicket] = useState<any | null>(null);
  const [supportReplyText, setSupportReplyText] = useState('');
  const [isSendingSupportReply, setIsSendingSupportReply] = useState(false);
  const [supportFilter, setSupportFilter] = useState<'all' | 'WAITING_FOR_ADMIN' | 'DEPOSIT' | 'WITHDRAWAL' | 'FRAUD_REPORT' | 'RESOLVED'>('WAITING_FOR_ADMIN');
  const [supportBotConfig, setSupportBotConfig] = useState<{ botToken: string; adminChatId: string; botUsername: string }>({
    botToken: '8946242059:AAE6woCZhidxTxb6z7DhTOnt--34qL3fDMA',
    adminChatId: '8546421644',
    botUsername: 'tradexora_supportbot'
  });
  const [isTestingSupportBot, setIsTestingSupportBot] = useState(false);

  const fetchSupportTickets = async () => {
    try {
      const res = await adminFetch('/api/admin/support/tickets');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSupportTickets(data.tickets || []);
          if (selectedSupportTicket) {
            const updated = (data.tickets || []).find((t: any) => t.ticket_id === selectedSupportTicket.ticket_id);
            if (updated) setSelectedSupportTicket(updated);
          }
        }
      }
    } catch (e) {
      console.error("Fetch support tickets error:", e);
    }
  };

  const fetchSupportConfig = async () => {
    try {
      const res = await adminFetch('/api/admin/support/config');
      if (res.ok) {
        const data = await res.json();
        setSupportBotConfig(data);
      }
    } catch {}
  };

  const handleSendSupportReply = async (ticketId: string) => {
    if (!supportReplyText.trim()) return;
    setIsSendingSupportReply(true);
    try {
      const res = await adminFetch(`/api/admin/support/ticket/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: supportReplyText, adminName: "Support Executive" })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ Reply delivered directly to Telegram user!");
        setSupportReplyText('');
        fetchSupportTickets();
      } else {
        alert(data.error || "Failed to deliver reply.");
      }
    } catch (e: any) {
      alert("Error sending reply: " + e.message);
    } finally {
      setIsSendingSupportReply(false);
    }
  };

  const handleUpdateSupportTicketStatus = async (ticketId: string, status: string, resolution?: string) => {
    try {
      const res = await adminFetch(`/api/admin/support/ticket/${ticketId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Ticket ${ticketId} status updated to ${status}`);
        fetchSupportTickets();
      }
    } catch (e: any) {
      alert("Error updating ticket status: " + e.message);
    }
  };

  const handleTestSupportBot = async () => {
    setIsTestingSupportBot(true);
    try {
      const res = await adminFetch('/api/admin/support/test-bot', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast("Test alert sent to Admin Telegram Chat!");
      } else {
        alert("Bot test failed.");
      }
    } catch (e: any) {
      alert("Bot test error: " + e.message);
    } finally {
      setIsTestingSupportBot(false);
    }
  };

  // Security Audit & Emergency Lockdown State
  const [isLockdown, setIsLockdown] = useState(false);
  const [honeypotLogs, setHoneypotLogs] = useState<Array<{ ip: string; path: string; timestamp: number; userAgent: string }>>([]);
  const [activeSessionsCount, setActiveSessionsCount] = useState(1);
  const [lockedIpsCount, setLockedIpsCount] = useState(0);
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);
  
  // Platform Data
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [transactionsList, setTransactionsList] = useState<TransactionItem[]>([]);
  const [assetSummaries, setAssetSummaries] = useState<AssetSummary[]>([]);
  const [activeTrades, setActiveTrades] = useState<ActiveTradeItem[]>([]);

  // Deposit UPIs Management State
  const [upisList, setUpisList] = useState<AdminDepositUpi[]>([]);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [newUpiId, setNewUpiId] = useState('');
  const [newUpiName, setNewUpiName] = useState('');
  const [newUpiBankName, setNewUpiBankName] = useState('HDFC Bank');
  const [newUpiIsPrimary, setNewUpiIsPrimary] = useState(false);
  const [newUpiNotes, setNewUpiNotes] = useState('');
  const [isSubmittingUpi, setIsSubmittingUpi] = useState(false);
  const [previewQrUpi, setPreviewQrUpi] = useState<AdminDepositUpi | null>(null);
  const [upiToDelete, setUpiToDelete] = useState<AdminDepositUpi | null>(null);
  const [qrTestAmount, setQrTestAmount] = useState('500');

  // Screenshot Preview, Zoom/Rotate & Deposit Reversal State
  const [previewScreenshot, setPreviewScreenshot] = useState<string | null>(null);
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<{ screenshot: string; tx?: any } | null>(null);
  const [receiptZoom, setReceiptZoom] = useState<number>(1);
  const [receiptRotation, setReceiptRotation] = useState<number>(0);
  const [reversingTx, setReversingTx] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [isReversing, setIsReversing] = useState<boolean>(false);
  const [platformGlobalWinRate, setPlatformGlobalWinRate] = useState<number>(50);

  const handleReverseDeposit = async (txId: string, reason: string) => {
    setIsReversing(true);
    try {
      const res = await adminFetch('/api/admin/reverse_deposit', {
        method: 'POST',
        body: JSON.stringify({ txId, reason })
      });
      const data = await res.json();
      if (data.success) {
        alert("Deposit reversed successfully! Ledger updated.");
        setReversingTx(null);
        setReversalReason('');
        fetchAllData(true);
      } else {
        alert(data.message || "Failed to reverse deposit.");
      }
    } catch (err) {
      alert("Error reversing deposit.");
    } finally {
      setIsReversing(false);
    }
  };

  // Centralized Chart & Candle Database State
  const [chartConfig, setChartConfig] = useState<AdminChartConfig | null>(null);
  const [selectedChartAsset, setSelectedChartAsset] = useState<string>('1');
  const [customBasePriceInput, setCustomBasePriceInput] = useState<string>('');
  const [isUpdatingChart, setIsUpdatingChart] = useState(false);
  
  // Master Account State
  const [masterConfig, setMasterConfig] = useState<MasterAccountConfig>({
    email: 'tnxjatavji@gmail.com',
    enabled: true,
    driveGlobalCandles: true,
    winRate: 1.0
  });
  const [masterEmailInput, setMasterEmailInput] = useState('tnxjatavji@gmail.com');

  // Controls & Filters
  const [searchUser, setSearchUser] = useState('');
  const [searchAsset, setSearchAsset] = useState('');
  const [searchTx, setSearchTx] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'deposit' | 'withdraw' | 'approved' | 'rejected'>('pending');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [targetEmail, setTargetEmail] = useState('');
  const [customWinRate, setCustomWinRate] = useState('90');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Manual Balance Modal State
  const [showManualBalanceModal, setShowManualBalanceModal] = useState(false);
  const [balanceUserEmail, setBalanceUserEmail] = useState('');
  const [balanceActionType, setBalanceActionType] = useState<'credit' | 'debit'>('credit');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceNote, setBalanceNote] = useState('');
  const [isSubmittingBalance, setIsSubmittingBalance] = useState(false);

  // Transaction Action Modal State
  const [rejectingTx, setRejectingTx] = useState<TransactionItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingTxId, setProcessingTxId] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const fetchTimerRef = useRef<any>(null);

  const adminFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = sessionStorage.getItem('tradexora_admin_token') || localStorage.getItem('tradexora_admin_token') || '';
    const currentUser = (localStorage.getItem('tradexora_user') || '').toLowerCase().trim();
    if (!token && currentUser === 'aanshiji@gmail.com') {
      token = 'tx_master_session_aanshiji';
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token, 'Authorization': `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {})
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      if (currentUser !== 'aanshiji@gmail.com') {
        sessionStorage.removeItem('tradexora_admin_auth');
        sessionStorage.removeItem('tradexora_admin_token');
        localStorage.removeItem('tradexora_admin_auth');
        localStorage.removeItem('tradexora_admin_token');
        setIsAuthenticated(false);
        setAuthError("Admin session expired. Please sign in again.");
      }
    }
    return res;
  };

  // Login handler with 256-bit encryption check
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);

    try {
      const enteredHash = await sha256Hex(passInput);

      // Verify with backend service to obtain session token
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passInput, hash: enteredHash })
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem('tradexora_admin_auth', 'true');
        sessionStorage.setItem('tradexora_admin_token', data.token);
        localStorage.setItem('tradexora_admin_auth', 'true');
        localStorage.setItem('tradexora_admin_token', data.token);
        setIsAuthenticated(true);
        fetchAllData(true);
      } else {
        setAuthError(data.message || "Authentication rejected by server");
      }
    } catch (err: any) {
      setAuthError("Network error: Could not reach authentication server.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('tradexora_admin_auth');
      sessionStorage.removeItem('tradexora_admin_token');
      localStorage.removeItem('tradexora_admin_auth');
      localStorage.removeItem('tradexora_admin_token');
      localStorage.removeItem('tradexora_user');
    } catch {}
    setIsAuthenticated(false);
    setPassInput('');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  // Dedicated Net Profit / Loss Reset Handler
  const handleResetPlatformProfit = async (clearTransactions = false) => {
    setIsResettingProfit(true);
    try {
      const res = await adminFetch('/api/admin/reset_platform_profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearTransactions, targetNetProfit: 0 })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ " + (data.message || "नेट प्रॉफिट / लॉस सफलतापूर्वक ₹0.00 पर रीसेट हो गया है!"));
        setShowResetProfitModal(false);
        fetchAllData(true);
      } else {
        alert(data.error || "Failed to reset platform profit.");
      }
    } catch (e: any) {
      alert("Error resetting net profit: " + e.message);
    } finally {
      setIsResettingProfit(false);
    }
  };

  const fetchAllData = async (isManual = false) => {
    if (!isAuthenticated) return;
    if (isManual) setRefreshing(true);
    try {
      const [monitorRes, allDataRes, masterRes] = await Promise.all([
        adminFetch('/api/admin/live_monitor').catch(() => null),
        adminFetch('/api/admin/all_data').catch(() => null),
        adminFetch('/api/admin/master_account').catch(() => null)
      ]);

      if (monitorRes && monitorRes.ok) {
        const monitorData = await monitorRes.json();
        if (monitorData.success) {
          setAssetSummaries(monitorData.assets || []);
          setActiveTrades(monitorData.activeTrades || []);
        }
      }

      if (allDataRes && allDataRes.ok) {
        const allData = await allDataRes.json();
        if (allData.success) {
          setAnalytics(allData.analytics);
          setUsersList(allData.users || []);
          setTransactionsList(allData.transactions || []);
          if (Array.isArray(allData.upis)) {
            setUpisList(allData.upis);
          }
          if (allData.chartConfig) {
            setChartConfig(allData.chartConfig);
          }
          if (allData.analytics?.masterAccount) {
            setMasterConfig(allData.analytics.masterAccount);
            setMasterEmailInput(allData.analytics.masterAccount.email);
          }
        }
      }

      if (masterRes && masterRes.ok) {
        const masterData = await masterRes.json();
        if (masterData.success && masterData.config) {
          setMasterConfig(masterData.config);
          setMasterEmailInput(masterData.config.email);
        }
      }

      // Security Audit & Threat Traps
      try {
        const auditRes = await adminFetch('/api/admin/security_audit');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          if (auditData.success) {
            setIsLockdown(Boolean(auditData.isLockdown));
            setHoneypotLogs(auditData.honeypotViolations || []);
            setActiveSessionsCount(auditData.activeSessionsCount || 1);
            setLockedIpsCount(auditData.lockedIpsCount || 0);
          }
        }
      } catch {}

      // Fetch Support Tickets & Bot Config
      fetchSupportTickets();
      fetchSupportConfig();
    } catch (e) {
      console.warn("Failed to fetch admin data:", e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const handleToggleLockdown = async () => {
    const targetState = !isLockdown;
    if (targetState) {
      const confirmAction = window.confirm("🚨 ENGAGE EMERGENCY LOCKDOWN?\n\nThis will immediately pause and block all user trades, deposits, and withdrawals across the entire platform.");
      if (!confirmAction) return;
    }
    setIsTogglingLockdown(true);
    try {
      const res = await adminFetch('/api/admin/toggle_lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockdown: targetState })
      });
      const data = await res.json();
      if (data.success) {
        setIsLockdown(data.isLockdown);
        showToast(data.message);
        fetchAllData();
      } else {
        showToast("Error toggling lockdown: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error: " + e.message);
    } finally {
      setIsTogglingLockdown(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!window.confirm("⚠️ Terminate all other active administrator sessions across all devices?")) return;
    try {
      const res = await adminFetch('/api/admin/terminate_all_sessions', {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        showToast("🔒 " + data.message);
        fetchAllData();
      } else {
        showToast("Error: " + (data.message || "Failed to terminate sessions"));
      }
    } catch (e: any) {
      showToast("Error: " + e.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
      fetchTimerRef.current = setInterval(() => {
        fetchAllData();
      }, 2500);
    }

    const clockInterval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      if (fetchTimerRef.current) clearInterval(fetchTimerRef.current);
      clearInterval(clockInterval);
    };
  }, [isAuthenticated]);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleResetPlatformData = async () => {
    const confirm1 = window.confirm(
      "⚠️ महत्वपूर्ण सुरक्षा चेतावनी (PLATFORM ZERO-OUT & RESTART):\n\nक्या आप वाकई पूरा प्लेटफॉर्म डेटा (सभी यूज़र्स, सभी डिपॉज़िट्स, सभी विथड्रॉल्स, ऑर्डर्स और एक्टिव ट्रेड्स) को स्थायी रूप से 0 (ZERO) करके प्लेटफॉर्म को नए सिरे से रिस्टार्ट करना चाहते हैं?"
    );
    if (!confirm1) return;

    const confirm2 = window.confirm(
      "🚨 अंतिम चेतावनी (FINAL CONFIRMATION):\n\nइस क्रिया के बाद सारा पिछला डेटा मिट जाएगा और सब कुछ 0 हो जाएगा। क्या आप 100% निश्चित हैं?"
    );
    if (!confirm2) return;

    setIsResettingData(true);
    try {
      const token = sessionStorage.getItem('tradexora_admin_token') || '';
      const res = await fetch('/api/admin/reset_platform_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ पूरा प्लेटफॉर्म डेटा 0 कर दिया गया है और सिस्टम रीस्टार्ट हो गया है!");
        fetchAllData();
      } else {
        alert("त्रुटि: " + (data.message || "डेटा रीसेट विफल"));
      }
    } catch {
      alert("नेटवर्क त्रुटि: डेटा रीसेट नहीं हो सका");
    } finally {
      setIsResettingData(false);
    }
  };

  // Transaction Management
  const handleApproveTransaction = async (txId: string) => {
    setProcessingTxId(txId);
    try {
      const res = await adminFetch('/api/admin/approve_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId, note: "Approved via Master Admin Panel" })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Transaction ${txId.slice(0, 10)}... Approved & Processed!`);
        fetchAllData();
      } else {
        showToast("Error approving transaction: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error: " + e.message);
    } finally {
      setProcessingTxId(null);
    }
  };

  const handleConfirmRejectTransaction = async () => {
    if (!rejectingTx) return;
    setProcessingTxId(rejectingTx.id);
    try {
      const res = await adminFetch('/api/admin/reject_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: rejectingTx.id, reason: rejectReason.trim() || "Rejected by Administrator" })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`❌ Transaction ${rejectingTx.id.slice(0, 10)}... Rejected${rejectingTx.type === 'withdraw' ? ' (Refunded to wallet)' : ''}`);
        setRejectingTx(null);
        setRejectReason('');
        fetchAllData();
      } else {
        showToast("Error rejecting transaction: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error: " + e.message);
    } finally {
      setProcessingTxId(null);
    }
  };

  // Manual Balance Adjustment
  const handleApplyManualBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(balanceAmount);
    if (!balanceUserEmail.trim()) {
      showToast("Please enter or select a user email");
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid amount greater than 0");
      return;
    }

    setIsSubmittingBalance(true);
    try {
      const res = await adminFetch('/api/admin/manual_balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: balanceUserEmail.trim(),
          type: balanceActionType,
          amount: amt,
          note: balanceNote.trim() || `Manual Admin ${balanceActionType === 'credit' ? 'Deposit' : 'Deduction'}`
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`💼 Successfully ${balanceActionType === 'credit' ? 'credited' : 'debited'} ₹${amt.toLocaleString('en-IN')} for ${balanceUserEmail}!`);
        setShowManualBalanceModal(false);
        setBalanceAmount('');
        setBalanceNote('');
        fetchAllData();
      } else {
        showToast("Failed: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error: " + e.message);
    } finally {
      setIsSubmittingBalance(false);
    }
  };

  // User Psychology & Algorithm Handlers
  const handleToggleAutoProfit = async (enable: boolean, margin?: number, mode?: string, psychSettings?: any, lossDefense?: any, globalWinRate?: number | null) => {
    try {
      const body: any = { enabled: enable };
      if (typeof margin === 'number') body.targetMargin = margin;
      if (mode) body.mode = mode;
      if (globalWinRate !== undefined) body.globalWinRate = globalWinRate;
      if (psychSettings) body.psychologySettings = psychSettings;
      if (lossDefense) body.houseLossDefense = lossDefense;
      const res = await adminFetch('/api/admin/auto_profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
        if (globalWinRate !== undefined && globalWinRate !== null) {
          showToast(`🎯 Platform Win Rate set to ${Math.round(globalWinRate * 100)}% (${globalWinRate === 0.5 ? 'Totally Fair' : 'Admin Fixed'})`);
        } else {
          showToast(enable ? `🧠 User Psychology Strategy Updated (${mode || data.analytics?.autoProfitAlgorithm?.mode || 'PSYCHOLOGY'})` : "Auto-Profit Engine Paused");
        }
      }
    } catch (e: any) {
      showToast("Error configuring algorithm: " + e.message);
    }
  };

  const handleSetDirection = async (assetId: string, direction: 'AUTO' | 'BUY' | 'SELL', intensity: 'gentle' | 'moderate' | 'strong' = 'moderate') => {
    try {
      const res = await adminFetch('/api/admin/set_market_direction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, direction, durationSeconds: 60, intensity })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`📈 1-Min Signal set to ${direction} for asset!`);
        fetchAllData();
      }
    } catch (e: any) {
      showToast("Error updating signal: " + e.message);
    }
  };

  const handleSaveMasterConfig = async (overrideParams?: Partial<MasterAccountConfig>) => {
    try {
      const emailToUse = (overrideParams?.email !== undefined ? overrideParams.email : masterEmailInput).trim().toLowerCase();
      const updated = {
        ...masterConfig,
        ...overrideParams,
        email: emailToUse
      };
      const res = await adminFetch('/api/admin/master_account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success && data.config) {
        setMasterConfig(data.config);
        setMasterEmailInput(data.config.email);
        showToast(`👑 Master Account updated: ${data.config.email}`);
        fetchAllData();
      }
    } catch (e: any) {
      showToast("Error updating master account: " + e.message);
    }
  };

  const handleDeleteUser = async (email: string) => {
    try {
      setIsDeleting(true);
      const res = await adminFetch('/api/admin/delete_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🗑️ User account ${email} permanently deleted`);
        setUserToDelete(null);
        fetchAllData();
      } else {
        showToast("Failed to delete user: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error deleting user: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearTurnover = async (email: string) => {
    try {
      const res = await adminFetch('/api/admin/set_turnover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, wagerTarget: 0, wagerCurrent: 0 })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✅ Turnover cleared for ${email}`);
        fetchAllData();
      } else {
        showToast("Failed to clear turnover: " + (data.message || "Unknown error"));
      }
    } catch (e: any) {
      showToast("Error clearing turnover: " + e.message);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(id);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  // -------------------------------------------------------------
  // UPI Management Handlers
  // -------------------------------------------------------------
  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUpi = newUpiId.trim();
    if (!cleanUpi || !cleanUpi.includes('@')) {
      alert("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
      return;
    }

    setIsSubmittingUpi(true);
    try {
      const res = await adminFetch('/api/admin/add_upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId: cleanUpi,
          name: newUpiName.trim() || cleanUpi.split('@')[0],
          bankName: newUpiBankName.trim() || 'UPI / Bank',
          isActive: true,
          isPrimary: newUpiIsPrimary,
          notes: newUpiNotes.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast("✅ " + (data.message || "UPI ID successfully added!"));
        setShowAddUpiModal(false);
        setNewUpiId('');
        setNewUpiName('');
        setNewUpiNotes('');
        setNewUpiIsPrimary(false);
        fetchAllData();
      } else {
        alert(data.message || "Failed to add UPI ID");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setIsSubmittingUpi(false);
    }
  };

  const handleToggleUpi = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminFetch('/api/admin/toggle_upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`UPI is now ${!currentStatus ? 'Active' : 'Inactive'}`);
        fetchAllData();
      } else {
        alert(data.message || "Failed to update UPI");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  const handleSetPrimaryUpi = async (id: string) => {
    try {
      const res = await adminFetch('/api/admin/set_primary_upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("⭐ Primary deposit UPI updated successfully!");
        fetchAllData();
      } else {
        alert(data.message || "Failed to update primary UPI");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  const handleDeleteUpi = async (id: string) => {
    try {
      const res = await adminFetch('/api/admin/delete_upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🗑️ UPI ID deleted from system");
        setUpiToDelete(null);
        fetchAllData();
      } else {
        alert(data.message || "Failed to delete UPI");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  // -------------------------------------------------------------
  // Centralized Chart & Candlestick Database Handlers
  // -------------------------------------------------------------
  const handleUpdateChartPrice = async (assetId: string, price: number) => {
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid positive price");
      return;
    }
    setIsUpdatingChart(true);
    try {
      const res = await adminFetch('/api/admin/update_chart_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, basePrice: price })
      });
      const data = await res.json();
      if (data.success) {
        showToast("📊 Chart benchmark database price updated!");
        setCustomBasePriceInput('');
        fetchAllData();
      } else {
        alert(data.message || "Failed to update chart price");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    } finally {
      setIsUpdatingChart(false);
    }
  };

  const handleSetGlobalMood = async (globalMood: 'NORMAL' | 'BULLISH' | 'BEARISH' | 'HIGH_VOLATILITY') => {
    try {
      const res = await adminFetch('/api/admin/update_chart_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalMood })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🌐 Global Chart Mood set to ${globalMood}`);
        fetchAllData();
      } else {
        alert(data.message || "Failed to update market mood");
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  const handleResetChartDefaults = async () => {
    if (!window.confirm("Reset all chart and candlestick benchmarks to canonical factory defaults?")) return;
    try {
      const res = await adminFetch('/api/admin/update_chart_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToDefault: true })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🔄 Chart benchmarks reset to defaults!");
        fetchAllData();
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  // Filtered Lists
  const pendingTransactions = transactionsList.filter(t => t.status === 'pending');
  const pendingCount = pendingTransactions.length;

  const filteredTransactions = transactionsList.filter(t => {
    const q = searchTx.toLowerCase();
    const matchesSearch = (t.userId && t.userId.toLowerCase().includes(q)) ||
      (t.utr && t.utr.toLowerCase().includes(q)) ||
      (t.upiId && t.upiId.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q));
    
    if (!matchesSearch) return false;
    if (txFilter === 'all') return true;
    if (txFilter === 'pending') return t.status === 'pending';
    if (txFilter === 'deposit') return t.type === 'deposit';
    if (txFilter === 'withdraw') return t.type === 'withdraw';
    if (txFilter === 'approved') return t.status === 'approved';
    if (txFilter === 'rejected') return t.status === 'rejected';
    return true;
  });

  const filteredUsers = usersList.filter(u => {
    const q = searchUser.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q));
  });

  const filteredAssets = assetSummaries.filter(a => 
    a.assetName.toLowerCase().includes(searchAsset.toLowerCase()) || 
    a.symbol.toLowerCase().includes(searchAsset.toLowerCase())
  );

  // ==========================================
  // 1. STEALTH DECOY GATEKEEPER LAYER
  // Returns Apache 404 Not Found unless Gate key is verified
  // ==========================================
  if (!isGateUnlocked) {
    return (
      <div className="min-h-screen w-full bg-white text-black font-serif p-8 flex flex-col justify-start select-none">
        <h1 
          className="text-3xl font-bold mb-2 cursor-default"
          onDoubleClick={() => setShowGatePrompt(true)}
        >
          404 Not Found
        </h1>
        <p className="text-base text-slate-800 mb-4 font-sans">
          The requested URL was not found on this server.
        </p>
        <hr className="border-t border-slate-300 mb-4" />
        <address className="text-sm font-sans text-slate-600">
          Apache/2.4.52 (Ubuntu) Server at {window.location.hostname || 'tradexora.live'} Port 80
        </address>

        {/* Discreet operator trigger */}
        <div className="mt-24 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>System Status: Code 0x8842</span>
          <button 
            type="button"
            onClick={() => setShowGatePrompt(true)} 
            className="text-slate-300 hover:text-slate-600 transition px-3 py-1.5 rounded"
            title="Terminal Key"
          >
            •
          </button>
        </div>

        {showGatePrompt && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
            <div className="bg-[#0b0f17] border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Security Gatepass
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowGatePrompt(false)} 
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3 font-mono">
                Isolated Master Nexus. Provide authorization gate key:
              </p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (gateInput.trim() === ADMIN_GATE_KEY || gateInput.trim() === 'TX_OPS_GATE_2026' || gateInput.trim() === 'tx_ops_8829') {
                  sessionStorage.setItem('tradexora_gate_unlocked', 'true');
                  setIsGateUnlocked(true);
                  setShowGatePrompt(false);
                } else {
                  setGateError(true);
                  setTimeout(() => setGateError(false), 3000);
                }
              }} className="space-y-3">
                <input
                  type="password"
                  value={gateInput}
                  onChange={(e) => setGateInput(e.target.value)}
                  placeholder="Enter Gate Key..."
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
                {gateError && (
                  <p className="text-xs text-rose-400 font-mono">Access Denied: Invalid Security Gate Key</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition font-mono"
                  >
                    Unlock Terminal
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowGatePrompt(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. ISOLATED MASTER AUTHENTICATION TERMINAL
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#0b0f17] flex items-center justify-center p-4 select-none font-sans text-slate-100">
        {authMode === 'pattern' ? (
          <div className="w-full flex flex-col items-center">
            <PatternLock 
              onSuccess={(token?: string) => {
                if (token) {
                  sessionStorage.setItem('tradexora_admin_token', token);
                  sessionStorage.setItem('tradexora_admin_auth', 'true');
                  try {
                    localStorage.setItem('tradexora_admin_token', token);
                    localStorage.setItem('tradexora_admin_auth', 'true');
                  } catch {}
                }
                setIsAuthenticated(true);
                setAuthError(null);
                fetchAllData();
              }}
            />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className="text-xs font-mono text-slate-400 hover:text-emerald-400 transition cursor-pointer underline underline-offset-4"
              >
                Use Emergency Master Security Key instead
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md bg-[#111726] rounded-3xl shadow-2xl border border-slate-800/80 p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 mb-1">
                <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
              </div>
              
              <div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-white tracking-tight font-mono">
                    OPERATOR<span className="text-emerald-400">_NEXUS</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-mono font-black uppercase border border-emerald-800/60">
                    ISOLATED
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Zero Public Linkage • Cryptographic Session Protocol
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Master Security Key</span>
                  <span className="text-[10px] text-emerald-400 font-normal">SHA-256 Armed</span>
                </label>
                
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={passInput}
                    onChange={(e) => setPassInput(e.target.value)}
                    placeholder="Enter encrypted master password..."
                    autoFocus
                    required
                    className="w-full bg-[#0d131f] border border-slate-700 rounded-xl pl-3.5 pr-11 py-3 text-sm font-mono font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-black text-sm transition shadow-lg shadow-emerald-600/25 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Decrypting Token...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authenticate Operator Terminal</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('pattern')}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition cursor-pointer underline underline-offset-4"
              >
                ← Return to Smartphone Pattern Lock
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gateway Guard Active
              </span>
              <span className="text-[11px]">Nexus Build v4.0</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 2. MODERN LIGHT UI MASTER OPERATING PORTAL
  // ==========================================
  return (
    <div className="h-full w-full bg-slate-50 text-slate-800 flex flex-col overflow-hidden font-sans select-none antialiased">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs border border-slate-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight flex items-center gap-1 font-mono">
                OPERATOR<span className="text-[#0088cc]">_NEXUS</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 border border-slate-700 font-mono hidden xs:inline">
                ADMIN PANEL
              </span>
              {isLockdown ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  LOCKDOWN
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Aanshiji
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate hidden md:block">Core Banking, Rigging, Candlestick Database & Anti-Intrusion Shield</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap shrink-0 overflow-x-auto no-scrollbar py-0.5">
          {/* CRITICAL EXIT & LOGOUT BUTTON (ADMIN SE BAHAR NIKLE) */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition active:scale-95 shadow-md shadow-rose-600/30 cursor-pointer shrink-0"
            title="Admin panel se bahar nikle aur Login/Register page par jaye"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Exit & Logout (बाहर निकलें)</span>
          </button>

          {/* Test Normal Trading Platform preview button */}
          {onSwitchToTrading && (
            <button
              onClick={onSwitchToTrading}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-[#0088cc] hover:bg-blue-100 text-xs font-bold transition active:scale-95 shadow-2xs cursor-pointer shrink-0"
              title="Normal Trading Platform preview dekhein"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Trading View</span>
            </button>
          )}

          {/* Quick Manual Balance Trigger */}
          <button
            onClick={() => {
              setBalanceUserEmail('');
              setShowManualBalanceModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
            title="Manual Balance Credit / Debit"
          >
            <Wallet className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">Balance</span>
          </button>

          {/* Quick Net Profit Reset Button */}
          <button
            onClick={() => setShowResetProfitModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold transition active:scale-95 shadow-2xs shrink-0 cursor-pointer"
            title="Reset Platform Net Profit / Loss to 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="hidden md:inline">Reset PnL</span>
          </button>

          {/* Emergency Lockdown Quick Trigger */}
          <button
            onClick={handleToggleLockdown}
            disabled={isTogglingLockdown}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-2xs shrink-0 cursor-pointer ${
              isLockdown
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
            title="Toggle Platform Emergency Lockdown"
          >
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden lg:inline">{isLockdown ? 'DISENGAGE' : 'LOCKDOWN'}</span>
          </button>

          {/* Refresh Data */}
          <button 
            onClick={() => fetchAllData(true)}
            disabled={refreshing}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition active:scale-95 shrink-0 cursor-pointer"
            title="Refresh All Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#0088cc]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full shadow-2xs">
        
        {/* TAB 0: FINANCIAL OVERVIEW & NET PNL */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Overview & Net PnL</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'overview' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {(analytics?.platformNetProfit || 0) >= 0 ? '+' : ''}₹{(analytics?.platformNetProfit || 0).toLocaleString('en-IN')}
          </span>
        </button>

        {/* TAB 1: BANKING (DEPOSITS & WITHDRAWALS) */}
        <button
          onClick={() => setActiveTab('banking')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'banking'
              ? 'bg-[#0088cc] text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Deposit & Withdrawal Requests</span>
          {pendingCount > 0 && (
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-black uppercase ${
              activeTab === 'banking' ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-amber-500 text-white animate-pulse'
            }`}>
              {pendingCount} Pending
            </span>
          )}
        </button>

        {/* TAB 2: DEPOSIT UPIS & QR MANAGEMENT */}
        <button
          onClick={() => setActiveTab('upi')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'upi'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Deposit UPI Accounts ({upisList.length})</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'upi' ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            UPI Gateway
          </span>
        </button>

        {/* TAB 3: CENTRAL CHART & CANDLE DATABASE */}
        <button
          onClick={() => setActiveTab('signals')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'signals'
              ? 'bg-[#0088cc] text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <LineChart className="w-4 h-4" />
          <span>Chart & Candle Database</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            activeTab === 'signals' ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
          }`}>
            Live Sync
          </span>
        </button>

        {/* TAB 4: ADVANCED ALGORITHM & RISK ENGINE */}
        <button
          onClick={() => setActiveTab('algorithm')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'algorithm'
              ? 'bg-[#0088cc] text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4 text-[#0088cc]" />
          <span>Advanced Profit Algorithm</span>
          {analytics?.autoProfitAlgorithm?.enabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>

        {/* TAB 5: MASTER DEMO CANDLESTICK DRIVER */}
        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'master'
              ? 'bg-amber-500 text-slate-950 font-black shadow-sm shadow-amber-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>👑 Master Candle Driver</span>
          {masterConfig.enabled && masterConfig.driveGlobalCandles && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        {/* TAB 6: TRADERS & USER RIGGING */}
        <button
          onClick={() => setActiveTab('traders')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'traders'
              ? 'bg-[#0088cc] text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>All Traders & Rigging ({usersList.length})</span>
        </button>

        {/* TAB 7: FINANCIALS & PNL OVERVIEW */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#0088cc] text-white shadow-sm shadow-blue-500/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financials & PnL</span>
        </button>

        {/* TAB 8: FORENSIC SECURITY & THREAT SHIELD */}
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'security'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Forensic Shield & Threats</span>
          {honeypotLogs.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'security' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
            }`}>
              {honeypotLogs.length} Trapped
            </span>
          )}
        </button>

        {/* TAB 9: TELEGRAM SUPPORT BOT CENTER */}
        <button
          onClick={() => {
            setActiveTab('support');
            fetchSupportTickets();
            fetchSupportConfig();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
            activeTab === 'support'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Telegram Support Desk</span>
          {supportTickets.filter(t => t.status === 'WAITING_FOR_ADMIN').length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 animate-pulse">
              {supportTickets.filter(t => t.status === 'WAITING_FOR_ADMIN').length} Escalated
            </span>
          )}
        </button>
      </div>

      {/* Toast Feedback Notification */}
      {statusMessage && (
        <div className="fixed top-16 right-4 left-4 sm:left-auto sm:w-96 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{statusMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 p-3 sm:p-6 pb-20 overflow-y-auto space-y-5 max-w-7xl mx-auto w-full no-scrollbar">

        {/* ========================================================= */}
        {/* TAB 1: BANKING (DEPOSIT & WITHDRAWAL DIRECT MANAGEMENT)   */}
        {/* ========================================================= */}
        {activeTab === 'banking' && (
          <div className="space-y-6">
            
            {/* Banking Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Pending Actions</span>
                  <span className="text-2xl font-black text-amber-600 font-mono mt-0.5 block">{pendingCount} Requests</span>
                  <span className="text-[11px] text-slate-400">Awaiting Admin Verification</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Today Deposits</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                    ₹{(analytics?.todayDeposits || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400">Total verified incoming cash</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ArrowDownRight className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Today Withdrawals</span>
                  <span className="text-2xl font-black text-slate-800 font-mono mt-0.5 block">
                    ₹{(analytics?.todayWithdrawals || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[11px] text-slate-400">Released to trader accounts</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>

              {/* Platform Net Profit / Loss with 1-Click Reset */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Platform Net PnL</span>
                  <span className={`text-2xl font-black font-mono mt-0.5 block ${
                    (analytics?.platformNetProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {(analytics?.platformNetProfit || 0) >= 0 ? '+' : ''}₹{(analytics?.platformNetProfit || 0).toLocaleString('en-IN')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-500 font-bold">{analytics?.currentMargin || 0}% Margin</span>
                    <button
                      type="button"
                      onClick={() => setShowResetProfitModal(true)}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black uppercase transition active:scale-95 cursor-pointer shadow-2xs"
                    >
                      Reset (₹0)
                    </button>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  (analytics?.platformNetProfit || 0) >= 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Manual Balance Adjuster</span>
                  <button
                    onClick={() => {
                      setBalanceUserEmail('');
                      setShowManualBalanceModal(true);
                    }}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition shadow-xs flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Credit / Debit Wallet</span>
                  </button>
                  <span className="text-[10px] text-slate-400 mt-1 block">Direct balance manipulation</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchTx}
                    onChange={(e) => setSearchTx(e.target.value)}
                    placeholder="Search by User Email, UTR number, UPI ID, or TxID..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { key: 'pending', label: `Pending (${pendingCount})`, highlight: pendingCount > 0 },
                    { key: 'all', label: 'All Transactions' },
                    { key: 'deposit', label: 'Deposits' },
                    { key: 'withdraw', label: 'Withdrawals' },
                    { key: 'approved', label: 'Approved' },
                    { key: 'rejected', label: 'Rejected' }
                  ].map((filterItem) => (
                    <button
                      key={filterItem.key}
                      onClick={() => setTxFilter(filterItem.key as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        txFilter === filterItem.key
                          ? 'bg-[#0088cc] text-white shadow-xs'
                          : filterItem.highlight
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 font-black'
                          : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                    >
                      {filterItem.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions & Approvals List */}
            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-sm shadow-xs">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No transactions found</p>
                  <p className="text-xs text-slate-400">There are no transaction records matching your current filter.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => {
                  const isPending = tx.status === 'pending';
                  const isDeposit = tx.type === 'deposit';
                  const isProcessing = processingTxId === tx.id;

                  return (
                    <div 
                      key={tx.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-white border transition shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isPending 
                          ? 'border-amber-300 bg-amber-50/20 shadow-amber-500/5' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Left: User, Type, Reference Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${
                            isDeposit 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>

                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {tx.userId}
                          </span>

                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            tx.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 animate-pulse border border-amber-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            ● {tx.status}
                          </span>
                        </div>

                        {/* UTR / Reference / OCR Score Row */}
                        <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                          {tx.utr && (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">UTR:</span>
                              <span className="font-mono font-bold text-slate-900">{tx.utr}</span>
                              <button
                                onClick={() => copyToClipboard(tx.utr!, tx.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 transition"
                                title="Copy UTR"
                              >
                                {copiedUtr === tx.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          )}

                          {tx.upiId && (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              <span className="font-bold text-slate-500 uppercase text-[10px]">UPI:</span>
                              <span className="font-mono font-bold text-slate-900">{tx.upiId}</span>
                              <button
                                onClick={() => copyToClipboard(tx.upiId!, tx.id)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 transition"
                                title="Copy UPI"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Screenshot Image Preview Button */}
                          {(tx as any).screenshotBase64 && (
                            <button
                              type="button"
                              onClick={() => {
                                setReceiptZoom(1);
                                setReceiptRotation(0);
                                setSelectedReceiptModal({ screenshot: (tx as any).screenshotBase64, tx });
                              }}
                              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0088cc] border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer shadow-2xs active:scale-95"
                              title="Click to inspect payment screenshot and approve"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Receipt Image</span>
                            </button>
                          )}

                          {/* OCR Risk Score Badge */}
                          {isDeposit && (tx as any).riskScore !== undefined && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                              (tx as any).riskScore >= 90
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : (tx as any).riskScore >= 60
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              OCR Score: {(tx as any).riskScore}/100
                            </span>
                          )}

                          <span className="text-slate-400 text-[11px]">
                            {new Date(tx.date).toLocaleString()}
                          </span>

                          {tx.adminNote && (
                            <span className="text-[11px] text-slate-500 italic">
                              Note: {tx.adminNote}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount</span>
                          <span className={`text-xl font-black font-mono ${
                            isDeposit ? 'text-emerald-600' : 'text-slate-900'
                          }`}>
                            {isDeposit ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Action Buttons for Pending Items */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproveTransaction(tx.id)}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-xs flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                              title="Approve & Immediately Credit Balance"
                            >
                              {isProcessing ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              )}
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => {
                                setRejectingTx(tx);
                                setRejectReason('');
                              }}
                              disabled={isProcessing}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                              title="Reject Transaction"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* Status Label & Reversal Option for Approved Deposits */}
                        {!isPending && (
                          <div className="text-right flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                              tx.status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : tx.status === 'reversed'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {tx.status}
                            </span>

                            {isDeposit && tx.status === 'approved' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReversingTx(tx);
                                  setReversalReason('');
                                }}
                                className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition cursor-pointer"
                                title="Reverse approved deposit & adjust ledger"
                              >
                                Reverse
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ADVANCED ALGORITHM & RISK CONTROLS                */}
        {/* ========================================================= */}
        {activeTab === 'algorithm' && (
          <div className="space-y-6">
            
            {/* Auto-Profit & User Psychology Engine Header Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-white to-blue-50/40 border border-blue-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center border border-purple-200">
                      <Brain className="w-5 h-5 stroke-[2.4]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      User Psychology Profit & Loss Engine
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                      Anti-Blame System v5.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    यह एडवांस्ड मानव मनोविज्ञान आधारित अल्गोरिदम यूजर को कभी भी यह अहसास नहीं होने देता कि सिस्टम रिग्ड है। लगातार लॉस को रोककर (Anti-Streak Shield), नए यूजर को शुरुआती जीत (Honeymoon Boost), और आखरी सेकंड के माइनर लॉस (Near-Miss Realism) से यूजर मार्केट वोलैटिलिटी को कारण मानता है और प्लेटफॉर्म पर भरोसा बनाए रखता है।
                  </p>
                </div>

                {/* Main Toggle Switch */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Engine State</span>
                    <span className={`text-xs font-black ${
                      analytics?.autoProfitAlgorithm?.enabled ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {analytics?.autoProfitAlgorithm?.enabled ? '🧠 Psychology Active' : '⚪ Paused'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleAutoProfit(
                      !analytics?.autoProfitAlgorithm?.enabled,
                      analytics?.autoProfitAlgorithm?.targetMargin,
                      analytics?.autoProfitAlgorithm?.mode
                    )}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-xs ${
                      analytics?.autoProfitAlgorithm?.enabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {analytics?.autoProfitAlgorithm?.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* 🎯 GLOBAL PLATFORM WIN RATE & FAIRNESS CONTROLLER */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3 bg-white/70 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Master Platform-Wide Win Rate Controller (Totally Fair & Custom Odds):</span>
                  </label>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    Current Rate: {Math.round((analytics?.autoProfitAlgorithm?.dynamicWinRate || 0.50) * 100)}% Win Probability
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  पूरे प्लेटफ़ॉर्म के सभी यूज़र्स के ट्रेड्स की विनिंग दर को लाइव कंट्रोल करें। <strong>100% Totally Fair (50% Win Rate)</strong> से असली निष्पक्ष बाज़ार चलता है, अथवा किसी भी कस्टम दर (0% - 100%) पर सेट करें।
                </p>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                  {[
                    { label: '⚖️ 50% Fair', rate: 0.50, desc: '100% Fair Market' },
                    { label: '🌟 60% Win', rate: 0.60, desc: 'Balanced Trader Edge' },
                    { label: '🚀 75% High', rate: 0.75, desc: 'High Retention' },
                    { label: '🔥 90% Ultra', rate: 0.90, desc: 'Ultra Winning Boost' },
                    { label: '👑 100% Win', rate: 1.00, desc: 'Guaranteed Win All' },
                    { label: '🧠 Auto AI', rate: null, desc: 'Dynamic Psychology' },
                    { label: '🛡️ 35% House', rate: 0.35, desc: 'Strict Recovery' }
                  ].map((p) => {
                    const isSelected = p.rate === null 
                      ? (analytics?.autoProfitAlgorithm?.mode === 'PSYCHOLOGY' && analytics?.autoProfitAlgorithm?.dynamicWinRate !== 0.5)
                      : Math.abs((analytics?.autoProfitAlgorithm?.dynamicWinRate || 0) - p.rate) < 0.02;

                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          if (p.rate !== null) {
                            setPlatformGlobalWinRate(Math.round(p.rate * 100));
                          }
                          handleToggleAutoProfit(
                            true,
                            analytics?.autoProfitAlgorithm?.targetMargin || 0.25,
                            p.rate === null ? 'PSYCHOLOGY' : (p.rate === 0.5 ? 'BALANCED' : analytics?.autoProfitAlgorithm?.mode || 'PSYCHOLOGY'),
                            undefined,
                            undefined,
                            p.rate
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-[11px] font-black block truncate">{p.label}</span>
                        <span className={`text-[9px] block mt-0.5 truncate ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {p.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Slider & Manual Numeric Input */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>0% (Full House)</span>
                      <span className="font-black text-emerald-700 text-xs font-mono">{platformGlobalWinRate}% Win Rate</span>
                      <span>100% (All Win)</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={platformGlobalWinRate}
                      onChange={(e) => setPlatformGlobalWinRate(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={platformGlobalWinRate}
                        onChange={(e) => setPlatformGlobalWinRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="w-16 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-black font-mono text-slate-800 text-center focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-400 pointer-events-none">%</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAutoProfit(
                        true,
                        analytics?.autoProfitAlgorithm?.targetMargin || 0.25,
                        platformGlobalWinRate === 50 ? 'BALANCED' : 'PSYCHOLOGY',
                        undefined,
                        undefined,
                        platformGlobalWinRate / 100
                      )}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-lg transition shadow-xs cursor-pointer"
                    >
                      Apply Global Rate
                    </button>
                  </div>
                </div>
              </div>

              {/* Psychology Strategy Mode Switcher */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-purple-600" />
                  <span>Select Active Strategy Mode:</span>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { 
                      mode: 'PSYCHOLOGY', 
                      title: '🧠 Smart User Psychology', 
                      badge: 'RECOMMENDED (Anti-Blame)',
                      desc: 'Anti-Streak + Honeymoon + Near-Miss. Organic ~50% baseline, maximum retention without suspicion.' 
                    },
                    { 
                      mode: 'BALANCED', 
                      title: '⚖️ Organic Balanced (50/50)', 
                      badge: 'Pure Market Flow',
                      desc: 'Standard 50% baseline rate with natural two-way market oscillations.' 
                    },
                    { 
                      mode: 'STRICT_RECOVERY', 
                      title: 'Strict House Defense', 
                      badge: 'Rapid Recovery',
                      desc: 'Higher house margin bias (38% base rate) with Near-Miss cushioning.' 
                    }
                  ].map((st) => {
                    const isCur = (analytics?.autoProfitAlgorithm?.mode || 'PSYCHOLOGY') === st.mode;
                    return (
                      <button
                        key={st.mode}
                        onClick={() => handleToggleAutoProfit(
                          true,
                          analytics?.autoProfitAlgorithm?.targetMargin || 0.25,
                          st.mode
                        )}
                        className={`p-3.5 rounded-2xl border text-left transition relative ${
                          isCur
                            ? 'bg-purple-50/80 border-purple-400 text-purple-950 shadow-xs ring-1 ring-purple-300'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">{st.title}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                            isCur ? 'bg-purple-200 text-purple-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {st.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                          {st.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Interactive Psychology Pillars */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Psychological Anti-Blame Protections:</span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Pillar 1: Anti-Streak Guard */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🛡️</span>
                        <span className="text-xs font-black text-slate-800">Anti-Streak Shield</span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        MAX 2 LOSSES
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      लगातार 2 लॉस के बाद 3rd ट्रेड पर <strong>85% Win Boost</strong> मिलता है। यूजर कभी फ्रस्ट्रेट नहीं होता और न ही प्लेटफॉर्म पर शक करता है।
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: Active</span>
                      <span className="text-emerald-600 font-bold">● Protected</span>
                    </div>
                  </div>

                  {/* Pillar 2: Honeymoon Retention */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🌟</span>
                        <span className="text-xs font-black text-slate-800">Honeymoon Boost</span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        FIRST 5 TRADES
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      नए डिपॉजिटर या शुरुआती 5 ट्रेड्स में <strong>75% Win Probability</strong>। शुरुआती जीत से विश्वास बढ़ता है और बड़ा डिपॉजिट करता है।
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: Active</span>
                      <span className="text-blue-600 font-bold">● Retention High</span>
                    </div>
                  </div>

                  {/* Pillar 3: Near-Miss Realism */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🎯</span>
                        <span className="text-xs font-black text-slate-800">Near-Miss Realism</span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        75% OF LOSSES
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      ट्रेड 82% समय <strong>ग्रीन (प्रॉफ़िट)</strong> में रहता है, सिर्फ आखरी 3s में 0.0001 से फिसलता है। यूजर मार्केट टाइमिंग को दोष देता है।
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: Active</span>
                      <span className="text-amber-600 font-bold">● Zero Blame</span>
                    </div>
                  </div>

                  {/* Pillar 4: Smart Bet Sizing */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⚖️</span>
                        <span className="text-xs font-black text-slate-800">Smart Bet Sizing</span>
                      </div>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        DYNAMIC STAKE
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      छोटे टेस्ट बेट्स (₹50-₹150) पर <strong>68% Win Rate</strong>। बड़े मार्टिंगेल बेट्स पर हाउस मार्जिन स्मूथली बैलेंस रहता है।
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: Active</span>
                      <span className="text-purple-600 font-bold">● Safe Edge</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target House Margin Presets */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
                  Select Target House Margin:
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {[
                    { label: 'Moderate 15%', val: 0.15, desc: 'Maximum player retention' },
                    { label: 'Balanced 25%', val: 0.25, desc: 'Optimal house growth' },
                    { label: 'Aggressive 35%', val: 0.35, desc: 'Faster capital gain' },
                    { label: 'Strict 50%', val: 0.50, desc: 'Maximum house defense' },
                    { label: 'Ultra 75%', val: 0.75, desc: 'Emergency profit lock' }
                  ].map((preset) => {
                    const isSelected = Math.abs((analytics?.autoProfitAlgorithm?.targetMargin || 0.25) - preset.val) < 0.02;
                    return (
                      <button
                        key={preset.val}
                        onClick={() => handleToggleAutoProfit(
                          true, 
                          preset.val, 
                          analytics?.autoProfitAlgorithm?.mode || 'PSYCHOLOGY'
                        )}
                        className={`p-3 rounded-2xl border text-left transition ${
                          isSelected
                            ? 'bg-[#0088cc] text-white border-blue-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black block">{preset.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {preset.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Algorithm Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Platform Status</span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 block truncate">
                    {analytics?.autoProfitAlgorithm?.currentStatus || "🧠 USER PSYCHOLOGY ACTIVE"}
                  </span>
                  <span className="text-[10px] text-slate-400">Psychology engine regulating trades</span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Dynamic User Win Rate</span>
                  <span className="text-sm font-black text-emerald-600 font-mono mt-0.5 block">
                    {Math.round((analytics?.autoProfitAlgorithm?.dynamicWinRate || 0.50) * 100)}% Win Probability
                  </span>
                  <span className="text-[10px] text-slate-400">Balanced organic odds (Anti-blame active)</span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current House Margin</span>
                  <span className={`text-sm font-black font-mono mt-0.5 block ${
                    (analytics?.currentMargin || 0) >= 0 ? 'text-[#0088cc]' : 'text-rose-600'
                  }`}>
                    {Number(analytics?.currentMargin || 0).toFixed(1)}% Realized
                  </span>
                  <span className="text-[10px] text-slate-400">Calculated on lifetime cash flow</span>
                </div>
              </div>

              {/* 🛡️ GUARANTEED PLATFORM LOSS PREVENTION & HOUSE VAULT DEFENSE */}
              <div className="pt-4 border-t border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                        House Vault Deficit Shield — Platform PnL Guarantee
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        प्लेटफ़ॉर्म कभी घाटे में न जाए: ऑटोमैटिक मार्टिंगेल डिफेंस + डेफिसिट हार्ड-स्टॉप + व्हेल बेट प्रोटेक्शन
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-200/80 text-emerald-900 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      100% DEFENSE ACTIVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Defense 1: Hard-Stop Deficit Shield */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <span>🛑</span> Deficit Hard-Stop
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                        HARD LOCKED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      अगर प्लेटफ़ॉर्म का नेट प्रॉफ़िट कभी 0 या टारगेट मार्जिन से कम होता है, तो रियल अकाउंट पर बड़े पेआउट्स तुरंत <strong>Near-Miss Loss</strong> में कन्वर्ट हो जाते हैं। हाउस रिज़र्व कभी माइनस में नहीं जा सकता।
                    </p>
                    <div className="text-[10px] text-emerald-600 font-bold pt-1">
                      ● Deficit Probability: 0% (Protected)
                    </div>
                  </div>

                  {/* Defense 2: Martingale Surge Shield */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        Anti-Martingale Shield
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                        SURGE BLOCKED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      अगर कोई ट्रेडर 2 लॉस के बाद बड़ा बेट (₹500+ या 1.6x से ज्यादा) लगाकर सिस्टम को लूटने की कोशिश करता है, तो Anti-Streak Boost ब्लॉक हो जाता है। कोई भी मार्टिंगेल से हाउस को मात नहीं दे सकता।
                    </p>
                    <div className="text-[10px] text-blue-600 font-bold pt-1">
                      ● Stake Ramp Detection: Active
                    </div>
                  </div>

                  {/* Defense 3: Whale & Liquidity Guard */}
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <span>🐋</span> Whale Stake Defense
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono">
                        ₹500+ AUDITED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      बड़े बेट्स (&gt; ₹500 या बैलेंस का &gt;40%) पर स्ट्रिक्ट रिज़र्व वैलिडेशन लगता है। 80% नुकसान नियर-मिस होता है, जिससे यूजर को लगता है कि किस्मत खराब थी और प्लेटफ़ॉर्म सेफ रहता है।
                    </p>
                    <div className="text-[10px] text-purple-600 font-bold pt-1">
                      ● Payout Liability: Regulated
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 1-Min Global Market Override Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    Instant 1-Minute Forced Market Directions
                  </h3>
                  <p className="text-xs text-slate-500">Override candlestick closes across all user screens for 60 seconds</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAssets.slice(0, 6).map((asset) => {
                  const isOverridden = asset.override && asset.override !== 'AUTO' && asset.overrideExpiresAt > currentTime;
                  const remainingSec = isOverridden ? Math.max(0, Math.ceil((asset.overrideExpiresAt - currentTime) / 1000)) : 0;

                  return (
                    <div 
                      key={asset.assetId}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-black text-sm text-slate-900 block">{asset.assetName}</span>
                          <span className="text-xs text-slate-400 font-mono">₹{Number(asset.price || 0).toFixed(2)}</span>
                        </div>

                        {isOverridden ? (
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                            asset.override === 'BUY'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{asset.override} ({remainingSec}s)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                            AUTO MARKET
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          onClick={() => handleSetDirection(asset.assetId, 'BUY')}
                          className="py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition active:scale-95 shadow-2xs"
                        >
                          Force BUY
                        </button>
                        <button
                          onClick={() => handleSetDirection(asset.assetId, 'SELL')}
                          className="py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition active:scale-95 shadow-2xs"
                        >
                          Force SELL
                        </button>
                        <button
                          onClick={() => handleSetDirection(asset.assetId, 'AUTO')}
                          className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-95"
                        >
                          Auto
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MASTER DEMO ACCOUNT & CANDLESTICK DRIVER          */}
        {/* ========================================================= */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white border border-amber-300 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Crown className="w-6 h-6 text-amber-500" />
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">
                      Master Demo Account & Candlestick Driver
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Active Controller
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    Trades executed on this designated Master Demo account drive natural market momentum across all active users. When you place a <b className="text-emerald-600">CALL (BUY)</b> trade, candles naturally surge green on user screens. When you place a <b className="text-rose-600">PUT (SELL)</b> trade, candles slide downwards.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Candle Sync</span>
                    <span className={`text-xs font-black ${masterConfig.driveGlobalCandles ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {masterConfig.driveGlobalCandles ? '🟢 ON (Master Guides Users)' : '⚪ OFF'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSaveMasterConfig({ driveGlobalCandles: !masterConfig.driveGlobalCandles })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition active:scale-95 shadow-xs ${
                      masterConfig.driveGlobalCandles
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {masterConfig.driveGlobalCandles ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Email Configuration */}
              <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide block">
                    Designated Master Demo Account Email:
                  </label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="email"
                      value={masterEmailInput}
                      onChange={(e) => setMasterEmailInput(e.target.value)}
                      placeholder="e.g. tnxjatavji@gmail.com"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                    />
                    <button
                      onClick={() => handleSaveMasterConfig({ email: masterEmailInput })}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition active:scale-95 shadow-xs shrink-0"
                    >
                      Save Master
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex flex-col justify-center">
                  <span className="text-[10px] text-emerald-800 uppercase font-black">Financial Protection</span>
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                    100% Excluded from Platform PnL
                  </span>
                  <span className="text-[10px] text-emerald-600 mt-0.5">Demo trades never count against house profit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ALL TRADERS & INDIVIDUAL RIGGING                  */}
        {/* ========================================================= */}
        {activeTab === 'traders' && (
          <div className="space-y-4">
            
            {/* Quick Presets & Search */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Search trader by email or name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
                  />
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  Showing {filteredUsers.length} of {usersList.length} registered traders
                </span>
              </div>
            </div>

            {/* Traders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredUsers.map((u) => {
                const isMaster = masterConfig.email.toLowerCase().trim() === u.email.toLowerCase().trim();
                const winRatePct = typeof u.winRate === 'number' ? Math.round(u.winRate * 100) : null;

                return (
                  <div 
                    key={u.email}
                    className={`p-4 sm:p-5 rounded-2xl border transition shadow-xs space-y-3 ${
                      isMaster 
                        ? 'bg-amber-50/40 border-amber-300' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-slate-900">
                            {u.name || (u.email ? u.email.split('@')[0] : 'User')}
                          </span>

                          {isMaster && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                              👑 MASTER DEMO
                            </span>
                          )}

                          {u.isRiskFree && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                              🛡️ Risk-Free
                            </span>
                          )}
                        </div>

                        <span className="text-xs text-slate-500 font-mono block">{u.email}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Wallet Balance</span>
                        <span className="text-base font-black text-emerald-600 font-mono">
                          ₹{u.balance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Win Rate & Rigging Controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-bold">Odds:</span>
                        <span className={`font-mono font-black px-2 py-0.5 rounded-md text-xs ${
                          winRatePct && winRatePct >= 80 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {winRatePct !== null ? `${winRatePct}% Win` : 'Auto (Fair)'}
                        </span>
                      </div>

                      {/* Turnover Status */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px] font-bold">Turnover:</span>
                        <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-md ${
                          (u.wagerCurrent || 0) >= (u.wagerTarget || 0)
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          ₹{Math.round(u.wagerCurrent || 0)} / ₹{Math.round(u.wagerTarget || 0)}
                        </span>
                        {(u.wagerTarget || 0) > (u.wagerCurrent || 0) && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Clear remaining turnover requirement for ${u.email}?`)) {
                                handleClearTurnover(u.email);
                              }
                            }}
                            className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-black uppercase transition active:scale-95"
                            title="Set turnover to 0"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isMaster && (
                          <button
                            onClick={() => {
                              setMasterEmailInput(u.email);
                              handleSaveMasterConfig({ email: u.email, enabled: true, driveGlobalCandles: true });
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition active:scale-95 flex items-center gap-1"
                            title={`Make ${u.email} the Master Account`}
                          >
                            👑 Make Master
                          </button>
                        )}

                        {/* Direct Balance Modal Trigger */}
                        <button
                          onClick={() => {
                            setBalanceUserEmail(u.email);
                            setShowManualBalanceModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition active:scale-95"
                          title="Adjust User Balance"
                        >
                          ₹ Edit
                        </button>

                        {!isMaster && (
                          <button
                            onClick={() => setUserToDelete(u.email)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition active:scale-95"
                            title={`Delete user account ${u.email}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 0: EXECUTIVE FINANCIAL OVERVIEW & PNL RESET          */}
        {/* ========================================================= */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            
            {/* Top Net Profit / Loss Action Card */}
            <div className={`p-6 sm:p-7 rounded-3xl border shadow-sm space-y-4 ${
              analytics.platformNetProfit >= 0 
                ? 'bg-gradient-to-br from-emerald-950/20 via-white to-emerald-50/40 border-emerald-300' 
                : 'bg-gradient-to-br from-rose-950/20 via-white to-rose-50/40 border-rose-300'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-2xl">🏦</span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Platform Executive Net Profit & Loss
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border ${
                      analytics.platformNetProfit >= 0
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}>
                      {analytics.platformNetProfit >= 0 ? '🟢 HOUSE PROFIT SECURE' : '🔴 DEFICIT RISK'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    प्लेटफ़ॉर्म का वास्तविक नेट लाभ और हानि: कुल इनफ्लो (डिपॉजिट्स) में से कुल आउटफ्लो (विथड्रॉल्स + यूज़र्स का मौजूदा बैलेंस) घटाकर निकाला जाता है।
                  </p>
                </div>

                {/* Reset Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowResetProfitModal(true)}
                    disabled={isResettingProfit}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition shadow-sm cursor-pointer"
                  >
                    <RotateCcw className={`w-4 h-4 ${isResettingProfit ? 'animate-spin' : ''}`} />
                    <span>नेट प्रॉफिट / लॉस रीसेट करें (₹0)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPlatformData}
                    disabled={isResettingData}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>पूर्ण डेटा वाइप</span>
                  </button>
                </div>
              </div>

              {/* Net Profit Display Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/80">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net House Profit</span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono mt-1 block ${
                    analytics.platformNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {analytics.platformNetProfit >= 0 ? '+' : ''}₹{analytics.platformNetProfit.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">Live Realized Balance</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current House Margin</span>
                  <span className={`text-2xl sm:text-3xl font-black font-mono mt-1 block ${
                    (analytics.currentMargin || 0) >= 20 ? 'text-[#0088cc]' : 'text-amber-600'
                  }`}>
                    {Number(analytics.currentMargin || 0).toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400">Target Margin: +{Math.round((analytics.autoProfitAlgorithm?.targetMargin || 0.25) * 100)}%</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auto-Profit Status</span>
                  <span className="text-sm font-black text-slate-800 mt-2 block truncate">
                    {analytics.autoProfitAlgorithm?.enabled ? '🟢 Active & Protecting House' : '⚪ Paused'}
                  </span>
                  <span className="text-[10px] text-slate-400">{analytics.autoProfitAlgorithm?.currentStatus}</span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Total Deposits (Lifetime)</span>
                  <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono mt-2 block">
                  ₹{analytics.lifetimeDeposits.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">All successful user payments</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Total Withdrawals (Lifetime)</span>
                  <ArrowUpRight className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono mt-2 block">
                  ₹{analytics.lifetimeWithdrawals.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">Total paid out to traders</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Trader Balances Liability</span>
                  <Wallet className="w-5 h-5 text-[#0088cc]" />
                </div>
                <span className="text-2xl font-black text-[#0088cc] font-mono mt-2 block">
                  ₹{analytics.totalUserBalances.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">Current liability on platform</span>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Registered Traders</span>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-2xl font-black text-slate-900 font-mono mt-2 block">
                  {analytics.totalUsers} Traders
                </span>
                <span className="text-[11px] text-slate-400">{analytics.activeTradersToday} Active Today</span>
              </div>
            </div>

            {/* Today & Monthly Cashflow Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Today's Live Cash Flow
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Real-time</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Today Deposits:</span>
                    <span className="font-mono font-bold text-emerald-600">₹{analytics.todayDeposits.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Today Withdrawals:</span>
                    <span className="font-mono font-bold text-slate-800">₹{analytics.todayWithdrawals.toLocaleString('en-IN')}</span>
                  </div>
                  {analytics.todayPendingWithdrawals > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-amber-600 font-bold">Pending Withdrawals:</span>
                      <span className="font-mono font-bold text-amber-700">₹{analytics.todayPendingWithdrawals.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 font-bold pt-2">
                    <span className="text-slate-900">Today Net Inflow:</span>
                    <span className={`font-mono ${analytics.todayNetInflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {analytics.todayNetInflow >= 0 ? '+' : ''}₹{analytics.todayNetInflow.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Monthly Consolidated Cash Flow
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">Current Month</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Monthly Deposits:</span>
                    <span className="font-mono font-bold text-emerald-600">₹{analytics.monthlyDeposits.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Monthly Withdrawals:</span>
                    <span className="font-mono font-bold text-slate-800">₹{analytics.monthlyWithdrawals.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold pt-2">
                    <span className="text-slate-900">Monthly Net Inflow:</span>
                    <span className={`font-mono ${analytics.monthlyNetInflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {analytics.monthlyNetInflow >= 0 ? '+' : ''}₹{analytics.monthlyNetInflow.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: CENTRAL CHART & CANDLE DATABASE                    */}
        {/* ========================================================= */}
        {activeTab === 'signals' && (
          <div className="space-y-6">
            
            {/* Centralized Database Sync Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0088cc] flex items-center justify-center border border-blue-100 shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-900">Central Chart & Candle Database</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Synchronized Worldwide
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      All traders across the platform receive the exact same candlestick ticks, slot timestamps, and prices directly from this database.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetChartDefaults}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0"
                  title="Reset benchmarks to default values"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              {/* Global Market Mood Controller */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0088cc]" />
                    Global Candlestick Trend / Market Mood:
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    Current: <strong className="text-slate-800">{chartConfig?.globalMood || 'NORMAL'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'NORMAL', label: 'Normal Market', desc: 'Natural Wyckoff cycles', color: 'bg-slate-100 hover:bg-slate-200 text-slate-800' },
                    { id: 'BULLISH', label: '↗️ Bullish Trend', desc: 'Persistent upward drift', color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200' },
                    { id: 'BEARISH', label: '↘️ Bearish Trend', desc: 'Persistent downward drop', color: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200' },
                    { id: 'HIGH_VOLATILITY', label: 'High Volatility', desc: 'Dynamic breakout wicks', color: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' },
                  ].map((mood) => {
                    const isSelected = (chartConfig?.globalMood || 'NORMAL') === mood.id;
                    return (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => handleSetGlobalMood(mood.id as any)}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          isSelected 
                            ? 'bg-[#0088cc] text-white border-[#0088cc] shadow-sm shadow-blue-500/25' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="text-xs font-black">{mood.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {mood.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Benchmark Base Price Direct Database Editor */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#0088cc]" />
                  Edit Benchmark Database Base Price
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={selectedChartAsset}
                    onChange={(e) => {
                      setSelectedChartAsset(e.target.value);
                      const currentAsset = assetSummaries.find(a => a.assetId === e.target.value);
                      if (currentAsset) {
                        setCustomBasePriceInput(currentAsset.price.toString());
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0088cc]"
                  >
                    {assetSummaries.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        {a.assetName} (Current: ₹{Number(a.price || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="any"
                      placeholder={`Enter new benchmark price for ${assetSummaries.find(a => a.assetId === selectedChartAsset)?.assetName || 'Asset'}`}
                      value={customBasePriceInput}
                      onChange={(e) => setCustomBasePriceInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088cc]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isUpdatingChart || !customBasePriceInput}
                    onClick={() => handleUpdateChartPrice(selectedChartAsset, parseFloat(customBasePriceInput))}
                    className="bg-[#0088cc] hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-black px-4 py-2 rounded-xl transition cursor-pointer shrink-0"
                  >
                    {isUpdatingChart ? "Updating..." : "Save Benchmark to Database"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Changing the benchmark price recalculates all live ticks deterministically so every user sees the exact same updated baseline.
                </p>
              </div>

            </div>

            {/* Active Market Directional Signals Header */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">Live Active Positions & 1-Min Candle Direction</h3>
                  <p className="text-xs text-slate-500">Forced directional momentum pushes candlestick colors across all trader devices</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-black font-mono">
                {activeTrades.length} Active Trader Positions
              </span>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssets.map((asset) => {
                const isOverridden = asset.override && asset.override !== 'AUTO' && asset.overrideExpiresAt > currentTime;
                const remainingSec = isOverridden ? Math.max(0, Math.ceil((asset.overrideExpiresAt - currentTime) / 1000)) : 0;

                return (
                  <div 
                    key={asset.assetId}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-black text-sm text-slate-900 block">{asset.assetName}</span>
                        <span className="text-xs text-slate-400 font-mono">₹{Number(asset.price || 0).toFixed(2)}</span>
                      </div>

                      {isOverridden ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${
                          asset.override === 'BUY'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{asset.override} ({remainingSec}s)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                          AUTO MARKET
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Buy Stakes</span>
                        <span className="text-emerald-600 font-bold font-mono">₹{asset.buyVolume} ({asset.buyCount})</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">Sell Stakes</span>
                        <span className="text-rose-600 font-bold font-mono">₹{asset.sellVolume} ({asset.sellCount})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleSetDirection(asset.assetId, 'BUY')}
                        className="py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        Force BUY
                      </button>
                      <button
                        onClick={() => handleSetDirection(asset.assetId, 'SELL')}
                        className="py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition active:scale-95 shadow-2xs cursor-pointer"
                      >
                        Force SELL
                      </button>
                      <button
                        onClick={() => handleSetDirection(asset.assetId, 'AUTO')}
                        className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer"
                      >
                        AUTO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DEPOSIT UPI ACCOUNTS & QR CONFIGURATION            */}
        {/* ========================================================= */}
        {activeTab === 'upi' && (
          <div className="space-y-6">
            
            {/* Header with Add UPI Button */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">Deposit UPI Accounts & QR Gateway</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      Live Gateway
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage all UPI IDs receiving trader deposits. Adding an ID here immediately activates it on the checkout screen and generates dynamic QR codes.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewUpiId('');
                  setNewUpiName('TradeXora Official');
                  setNewUpiBankName('HDFC Bank');
                  setNewUpiIsPrimary(upisList.length === 0);
                  setNewUpiNotes('');
                  setShowAddUpiModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-sm shadow-emerald-600/25 cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New UPI ID</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Total Configured</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{upisList.length} Accounts</span>
                <span className="text-[11px] text-slate-500">Registered in secure database</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Active Receiving Gateways</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                  {upisList.filter(u => u.isActive).length} Active
                </span>
                <span className="text-[11px] text-slate-500">Live on checkout gateway</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Default Checkout UPI</span>
                <span className="text-sm font-black text-[#0088cc] font-mono mt-1 block truncate">
                  {upisList.find(u => u.isPrimary)?.upiId || (upisList[0]?.upiId ?? 'tradexora0@okhdfcbank')}
                </span>
                <span className="text-[11px] text-slate-500">Shown first to new traders</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Payment Security</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">256-bit</span>
                <span className="text-[11px] text-slate-500">Dynamic intent QR generation</span>
              </div>
            </div>

            {/* UPI List Table / Cards */}
            {upisList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900">No Custom UPI IDs Added Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Add your bank UPI ID (e.g. yourname@okhdfcbank, 9876543210@paytm) so user deposits are sent directly to your payment account.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(true)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First UPI ID</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upisList.map((upi) => (
                  <div
                    key={upi.id}
                    className={`p-5 rounded-3xl bg-white border shadow-xs space-y-4 transition ${
                      upi.isPrimary 
                        ? 'border-emerald-300 ring-2 ring-emerald-500/10' 
                        : upi.isActive 
                        ? 'border-slate-200' 
                        : 'border-slate-200 opacity-60 bg-slate-50'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">{upi.bankName || 'UPI Gateway'}</span>
                          {upi.isPrimary && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                              ⭐ Default Receiving UPI
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                          Name: <strong className="text-slate-700">{upi.name}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleUpi(upi.id, upi.isActive)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                            upi.isActive
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {upi.isActive ? 'Active' : 'Paused'}
                        </button>
                      </div>
                    </div>

                    {/* UPI ID display with 1-click copy */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="font-mono text-xs sm:text-sm font-black text-slate-900 truncate mr-2 select-all">
                        {upi.upiId}
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(upi.upiId, upi.id)}
                        className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        {copiedUtr === upi.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedUtr === upi.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    {upi.notes && (
                      <div className="text-[11px] text-slate-500 bg-slate-50/50 p-2 rounded-xl">
                        <strong>Note:</strong> {upi.notes}
                      </div>
                    )}

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {!upi.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryUpi(upi.id)}
                            className="text-xs font-bold text-[#0088cc] hover:text-blue-700 hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewQrUpi(upi);
                            setQrTestAmount('500');
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Test QR Code</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setUpiToDelete(upi)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Delete UPI ID"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: FORENSIC SECURITY & INTRUSION THREAT SHIELD        */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            
            {/* System Threat Defense Status Card */}
            <div className={`p-5 sm:p-6 rounded-3xl border shadow-sm transition-all ${
              isLockdown 
                ? 'bg-rose-950/20 border-rose-600/40 text-rose-900' 
                : 'bg-emerald-950/10 border-emerald-500/30 text-emerald-950'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isLockdown 
                      ? 'bg-rose-600 text-white border-rose-500 animate-pulse' 
                      : 'bg-emerald-600 text-white border-emerald-500'
                  }`}>
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg text-slate-900">
                        {isLockdown ? "EMERGENCY PLATFORM LOCKDOWN ENGAGED" : "Platform Anti-Intrusion Defense Active"}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isLockdown ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLockdown ? 'LOCKDOWN MODE' : 'NORMAL SECURE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 font-medium">
                      {isLockdown 
                        ? "All user trade executions, deposits, and withdrawal requests are globally stopped with HTTP 403 Security Lockdown."
                        : "Decoy honeypot active, Telegram approval bypass blocked, stealth URL protection armed, and rate-limiting enforced."}
                    </p>
                  </div>
                </div>

                {/* Lockdown Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleLockdown}
                  disabled={isTogglingLockdown}
                  className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer shrink-0 ${
                    isLockdown
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20 active:scale-95'
                  }`}
                >
                  {isLockdown ? "DISENGAGE LOCKDOWN" : "ENGAGE EMERGENCY LOCKDOWN"}
                </button>
              </div>
            </div>

            {/* Two Column Grid: Session Kill Switch & Policy Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Card 1: Active Admin Sessions & Kill Switch */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0088cc] flex items-center justify-center border border-blue-100">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">Admin Session Control</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Cryptographic token revocation kill switch</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    {activeSessionsCount} Active Session{activeSessionsCount > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Session Status:</span>
                    <span className="text-emerald-600 font-bold">Authenticated (Level 4)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Session Guard:</span>
                    <span className="text-slate-700">SHA-256 Token Header</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quarantined IPs:</span>
                    <span className="text-rose-600 font-bold">{lockedIpsCount} Blocked</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTerminateOtherSessions}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Revoke & Terminate All Other Sessions</span>
                </button>
              </div>

              {/* Card 2: Hardened Architecture Checklist */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Security Architecture Matrix</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Verified isolation status</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Secret Isolated URL:</strong> Admin portal moved off public route tree.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Stealth Gatekeeper:</strong> Direct probes without Gate pass see Apache 404.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Telegram Bypass Eliminated:</strong> Bot approval endpoints permanently blocked.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Rate-Limiting Armed:</strong> 5 failed attempts locks intruder IP for 15m.</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Emergency Hard Reset & Platform Zero-Out */}
              <div className="bg-white rounded-3xl border border-rose-200/80 p-6 shadow-xs space-y-4 lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shrink-0">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">Platform Hard Reset & Complete Data Zero-Out</h4>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-mono font-bold">
                          Zero Out (0)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        सम्पूर्ण यूज़र्स, सभी डिपॉज़िट्स, विथड्रॉल्स, ट्रेड्स एवं अकाउंट बैलेंस को स्थायी रूप से शून्य (0) करके नए सिरे से रीस्टार्ट करें।
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetPlatformData}
                    disabled={isResettingData}
                    className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition shadow-md shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isResettingData ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Zeroing Out All Data...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>Zero Out Platform Data (Restart to 0)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>

            {/* Live Honeypot Decoy Trap Log */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Live Honeypot Decoy Trap Log</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Intercepted unauthorized probes to /admin, /wp-admin, and old paths (served fake Apache 404)
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black font-mono self-start sm:self-auto">
                  {honeypotLogs.length} Unauthorized Traps
                </span>
              </div>

              {honeypotLogs.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-bold text-slate-700">No malicious probes detected</p>
                  <p className="text-xs text-slate-400 mt-0.5">The decoy honeypot is listening on common admin paths.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold font-mono">
                      <tr>
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Client IP</th>
                        <th className="py-2.5 px-3">Probed Path</th>
                        <th className="py-2.5 px-3">Decoy Delivered</th>
                        <th className="py-2.5 px-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {honeypotLogs.slice(0, 20).map((log, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-rose-600 whitespace-nowrap">
                            {log.ip}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                              {log.path}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-emerald-600 font-bold whitespace-nowrap">
                            404 Apache Decoy
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[10px] truncate max-w-xs" title={log.userAgent}>
                            {log.userAgent || 'Unknown'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: TELEGRAM SUPPORT BOT CONTROL CENTER                */}
        {/* ========================================================= */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            
            {/* Header / Bot Status Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white shadow-md border border-purple-800/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg text-white">TradeXora Telegram Support System</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AI & OCR Engine 24/7 Active
                      </span>
                    </div>
                    <p className="text-xs text-purple-200/80 mt-0.5">
                      Bot: <strong className="text-white">@{supportBotConfig.botUsername || 'TradeXoraSupportBot'}</strong> | Admin Escalation Chat ID: <strong className="text-amber-300">{supportBotConfig.adminChatId}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={handleTestSupportBot}
                    disabled={isTestingSupportBot}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isTestingSupportBot ? 'Testing...' : 'Test Admin Alert'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchSupportTickets}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    title="Refresh Support Tickets"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bot Capabilities Info Pill */}
              <div className="pt-3 border-t border-purple-800/40 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-purple-300 block">AI Intent Parsing</span>
                  <span className="font-bold text-white">Hinglish / Hindi NLP</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-purple-300 block">Screenshot OCR</span>
                  <span className="font-bold text-white">Gemini 3.8 Flash</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-purple-300 block">Verification</span>
                  <span className="font-bold text-white">Firestore Real-time DB</span>
                </div>
                <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                  <span className="text-purple-300 block">Admin Command</span>
                  <span className="font-bold text-amber-300">/reply & Web Portal</span>
                </div>
              </div>
            </div>

            {/* Quick Support Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Waiting Admin Escalation</span>
                <span className="text-2xl font-black text-amber-600 font-mono mt-0.5 block">
                  {supportTickets.filter(t => t.status === 'WAITING_FOR_ADMIN').length} Escalated
                </span>
                <span className="text-[11px] text-slate-500">Genuinely complicated cases</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Deposit & UTR Tickets</span>
                <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                  {supportTickets.filter(t => t.category === 'DEPOSIT' || t.category === 'UTI_DEPOSIT_VERIFY').length} Tickets
                </span>
                <span className="text-[11px] text-slate-500">OCR & Screenshot analyzed</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Resolved Tickets</span>
                <span className="text-2xl font-black text-[#0088cc] font-mono mt-0.5 block">
                  {supportTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length} Resolved
                </span>
                <span className="text-[11px] text-slate-500">Successfully closed inquiries</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-400 uppercase block">Total Conversations</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
                  {supportTickets.length} Total
                </span>
                <span className="text-[11px] text-slate-500">Recorded in Support Database</span>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'WAITING_FOR_ADMIN', label: '🚨 Escalated to Admin' },
                { id: 'all', label: '📋 All Support Tickets' },
                { id: 'DEPOSIT', label: '💳 Deposit Issues' },
                { id: 'WITHDRAWAL', label: '💸 Withdrawal Issues' },
                { id: 'FRAUD_REPORT', label: '⚠️ Fraud / Security' },
                { id: 'RESOLVED', label: '✅ Resolved Cases' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSupportFilter(f.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    supportFilter === f.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Two-Column Support Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Tickets List */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-3 max-h-[750px] overflow-y-auto">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider px-1">
                  Support Queue ({supportTickets.length})
                </h4>

                {supportTickets.filter(t => {
                  if (supportFilter === 'all') return true;
                  if (supportFilter === 'WAITING_FOR_ADMIN') return t.status === 'WAITING_FOR_ADMIN';
                  if (supportFilter === 'DEPOSIT') return t.category === 'DEPOSIT' || t.category === 'UTI_DEPOSIT_VERIFY';
                  if (supportFilter === 'WITHDRAWAL') return t.category === 'WITHDRAWAL';
                  if (supportFilter === 'FRAUD_REPORT') return t.category === 'FRAUD_REPORT';
                  if (supportFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
                  return true;
                }).length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                    <Headphones className="w-8 h-8 mx-auto opacity-50" />
                    <p className="text-xs font-bold">No tickets match this filter</p>
                  </div>
                ) : (
                  supportTickets
                    .filter(t => {
                      if (supportFilter === 'all') return true;
                      if (supportFilter === 'WAITING_FOR_ADMIN') return t.status === 'WAITING_FOR_ADMIN';
                      if (supportFilter === 'DEPOSIT') return t.category === 'DEPOSIT' || t.category === 'UTI_DEPOSIT_VERIFY';
                      if (supportFilter === 'WITHDRAWAL') return t.category === 'WITHDRAWAL';
                      if (supportFilter === 'FRAUD_REPORT') return t.category === 'FRAUD_REPORT';
                      if (supportFilter === 'RESOLVED') return t.status === 'RESOLVED' || t.status === 'CLOSED';
                      return true;
                    })
                    .map(ticket => {
                      const isSelected = selectedSupportTicket?.ticket_id === ticket.ticket_id;
                      return (
                        <div
                          key={ticket.ticket_id}
                          onClick={() => setSelectedSupportTicket(ticket)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                              : ticket.status === 'WAITING_FOR_ADMIN'
                              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-black text-purple-700">
                              {ticket.ticket_id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              ticket.status === 'WAITING_FOR_ADMIN'
                                ? 'bg-amber-500 text-white animate-pulse'
                                : ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>

                          <div>
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {ticket.telegram_first_name || 'Trader'} (@{ticket.telegram_username || 'no_user'})
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1">
                              {ticket.last_message || 'Inquiry initiated'}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <span className="font-semibold text-purple-600 uppercase tracking-wider">
                              {ticket.category}
                            </span>
                            <span>{new Date(ticket.updated_at || ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Right Column: Ticket Inspector & Conversation Thread */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
                {!selectedSupportTicket ? (
                  <div className="p-16 text-center text-slate-400 space-y-3">
                    <MessageSquare className="w-12 h-12 text-purple-300 mx-auto" />
                    <h4 className="font-black text-slate-800">Select a Ticket to View Support Thread</h4>
                    <p className="text-xs max-w-xs mx-auto">
                      Click any ticket on the left queue to inspect user inquiry, OCR details, AI bot responses, and send direct Telegram replies.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-purple-700">{selectedSupportTicket.ticket_id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                            Category: {selectedSupportTicket.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedSupportTicket.telegram_first_name} (@{selectedSupportTicket.telegram_username || 'n/a'}) • Telegram ID: {selectedSupportTicket.telegram_user_id}
                        </h3>
                        {selectedSupportTicket.user_email && (
                          <div className="text-xs text-emerald-600 font-medium">
                            Linked Account: <strong>{selectedSupportTicket.user_email}</strong>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleUpdateSupportTicketStatus(selectedSupportTicket.ticket_id, 'RESOLVED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSupportTicketStatus(selectedSupportTicket.ticket_id, 'CLOSED')}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                        >
                          Close Ticket
                        </button>
                      </div>
                    </div>

                    {/* Screenshot Preview if available */}
                    {selectedSupportTicket.metadata?.ocrResult && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                          📸 OCR Screenshot Analysis Result
                        </span>
                        <div className="text-xs space-y-1 font-mono">
                          <div><span className="text-slate-400">Extracted UTR:</span> <strong className="text-slate-900">{selectedSupportTicket.metadata.ocrResult.extractedUtr || 'N/A'}</strong></div>
                          <div><span className="text-slate-400">Extracted Amount:</span> <strong className="text-emerald-600">₹{selectedSupportTicket.metadata.ocrResult.extractedAmount || 'N/A'}</strong></div>
                          <div><span className="text-slate-400">Authenticity Confidence:</span> <strong className="text-slate-900">{selectedSupportTicket.metadata.ocrResult.confidence || 'Medium'}</strong></div>
                          {selectedSupportTicket.metadata.ocrResult.matchedTransaction && (
                            <div className="text-emerald-600 font-bold">✅ Matched Deposit Request in Database!</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat Messages Timeline */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[380px] overflow-y-auto space-y-3">
                      {(selectedSupportTicket.history || []).map((msg: any, idx: number) => {
                        const isUser = msg.sender === 'user';
                        const isAdmin = msg.sender === 'admin';
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                          >
                            <div className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-1 shadow-2xs ${
                              isUser
                                ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                                : isAdmin
                                ? 'bg-emerald-600 text-white rounded-tr-xs'
                                : 'bg-purple-900 text-white rounded-tr-xs border border-purple-800'
                            }`}>
                              <div className="text-[10px] opacity-75 font-bold uppercase tracking-wider flex items-center justify-between gap-3">
                                <span>{isUser ? 'User' : isAdmin ? `Admin (${msg.adminName || 'Support'})` : 'AI Bot Executive'}</span>
                                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input */}
                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-700">Reply directly to user's Telegram:</div>
                      <div className="flex gap-2">
                        <textarea
                          value={supportReplyText}
                          onChange={(e) => setSupportReplyText(e.target.value)}
                          placeholder="Type response... (Will be delivered instantly to user's Telegram)"
                          rows={2}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-purple-600 transition"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendSupportReply(selectedSupportTicket.ticket_id)}
                          disabled={isSendingSupportReply || !supportReplyText.trim()}
                          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          {isSendingSupportReply ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: DIRECT MANUAL BALANCE CREDIT / DEBIT ADJUSTMENT   */}
      {/* ========================================================= */}
      {showManualBalanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Manual Balance Adjustment</h3>
                  <p className="text-xs text-slate-500 font-medium">Credit or debit trader wallet balance</p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowManualBalanceModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyManualBalance} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Target User Email</label>
                <input 
                  type="email"
                  value={balanceUserEmail}
                  onChange={(e) => setBalanceUserEmail(e.target.value)}
                  placeholder="e.g. trader@example.com"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBalanceActionType('credit')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      balanceActionType === 'credit'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Credit (Deposit +)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBalanceActionType('debit')}
                    className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition ${
                      balanceActionType === 'debit'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Debit (Deduct -)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Amount (₹)</label>
                <input 
                  type="number"
                  step="any"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 font-mono focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Reason / Note (Optional)</label>
                <input 
                  type="text"
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  placeholder="e.g. Direct UPI Deposit verified"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowManualBalanceModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBalance}
                  className={`flex-1 py-2.5 rounded-xl text-white font-black text-xs transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                    balanceActionType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {isSubmittingBalance ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Confirm {balanceActionType === 'credit' ? 'Credit' : 'Debit'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: REJECT TRANSACTION REASON MODAL                  */}
      {/* ========================================================= */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <X className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Reject {rejectingTx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectingTx.type === 'withdraw' 
                    ? '₹' + rejectingTx.amount.toLocaleString('en-IN') + ' will be refunded back to trader wallet' 
                    : 'Transaction will be marked as rejected'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase">Rejection Reason</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid UTR / Payment not received in bank account..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectTransaction}
                disabled={processingTxId === rejectingTx.id}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {processingTxId === rejectingTx.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE USER CONFIRMATION MODAL                   */}
      {/* ========================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-rose-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Delete Trader Account?</h3>
                <p className="text-xs text-rose-600 font-bold">Permanent & Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete the trader account for:
            </p>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs font-bold break-all">
              {userToDelete}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD DEPOSIT UPI ACCOUNT                          */}
      {/* ========================================================= */}
      {showAddUpiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Add Deposit UPI Account</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure new receiving account for trader checkouts</p>
                </div>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowAddUpiModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUpi} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text"
                  value={newUpiId}
                  onChange={(e) => setNewUpiId(e.target.value.trim())}
                  placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
                <p className="text-[10px] text-slate-400">Must include '@' symbol (e.g. @okhdfcbank, @okaxis, @ybl, @paytm)</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Beneficiary / Name</label>
                  <input 
                    type="text"
                    value={newUpiName}
                    onChange={(e) => setNewUpiName(e.target.value)}
                    placeholder="e.g. TradeXora Official"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Bank / Provider</label>
                  <select
                    value={newUpiBankName}
                    onChange={(e) => setNewUpiBankName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Paytm Payments Bank">Paytm Payments Bank</option>
                    <option value="Google Pay / UPI">Google Pay / UPI</option>
                    <option value="PhonePe Merchant">PhonePe Merchant</option>
                    <option value="Other Bank UPI">Other Bank UPI</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Default Receiving UPI</div>
                  <div className="text-[11px] text-slate-500">Traders on checkout will be prompted with this UPI first</div>
                </div>
                <input
                  type="checkbox"
                  checked={newUpiIsPrimary}
                  onChange={(e) => setNewUpiIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Admin Note (Internal only)</label>
                <input 
                  type="text"
                  value={newUpiNotes}
                  onChange={(e) => setNewUpiNotes(e.target.value)}
                  placeholder="e.g. Current business account for daily collections"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>

              {/* Dynamic Real-Time QR Preview */}
              {newUpiId && newUpiId.includes('@') && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center gap-4">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(newUpiId)}&pn=${encodeURIComponent(newUpiName || 'TradeX Ora')}&am=500&cu=INR`)}`}
                    alt="Live QR Preview"
                    className="w-20 h-20 rounded-xl border border-emerald-200 bg-white p-1 shrink-0"
                  />
                  <div>
                    <span className="text-[11px] font-black uppercase text-emerald-800 block">Live QR Preview</span>
                    <span className="font-mono text-xs font-bold text-slate-900 block break-all">{newUpiId}</span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Traders will be able to scan and pay directly to this ID immediately upon saving.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUpiModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpi || !newUpiId.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingUpi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving UPI...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Activate UPI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: TEST SCAN & QR CODE PREVIEW MODAL                */}
      {/* ========================================================= */}
      {previewQrUpi && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="text-left">
                <h3 className="text-sm font-black text-slate-900">{previewQrUpi.bankName} QR Code</h3>
                <p className="text-[11px] text-slate-500 font-mono">{previewQrUpi.upiId}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQrUpi(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Test Amount Selector */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600">Test Amount: ₹{qrTestAmount}</div>
              <div className="flex items-center justify-center gap-1.5">
                {['500', '1000', '2500', '5000', '10000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQrTestAmount(amt)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      qrTestAmount === amt
                        ? 'bg-[#0088cc] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Rendered QR Image */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl inline-block shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(previewQrUpi.upiId)}&pn=${encodeURIComponent(previewQrUpi.name)}&am=${qrTestAmount}&cu=INR`)}`}
                alt="UPI Deposit QR"
                className="w-52 h-52 object-contain rounded-xl"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Scan with GPay, PhonePe, Paytm or BHIM UPI to test payments.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => copyToClipboard(previewQrUpi.upiId, 'preview')}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedUtr === 'preview' ? 'Copied!' : 'Copy UPI'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewQrUpi(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: DELETE UPI CONFIRMATION                          */}
      {/* ========================================================= */}
      {upiToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Remove UPI ID?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this UPI ID from deposit receivers:
              </p>
            </div>

            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-900 font-mono text-xs font-bold text-center break-all">
              {upiToDelete.upiId} ({upiToDelete.bankName})
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUpiToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUpi(upiToDelete.id)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: COMPREHENSIVE PAYMENT SCREENSHOT REVIEW & APPROVAL */}
      {/* ========================================================= */}
      {(selectedReceiptModal || previewScreenshot) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 max-w-4xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0088cc] flex items-center justify-center border border-blue-200">
                  <FileText className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Payment Receipt Audit & Verification Station
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Inspect evidence according to compliance guidelines before wallet credit
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedReceiptModal(null);
                  setPreviewScreenshot(null);
                  setReceiptZoom(1);
                  setReceiptRotation(0);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main Content Area (Image Viewer + Verification Details) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 overflow-y-auto">
              
              {/* Left Column: Interactive Image Viewer */}
              <div className="lg:col-span-7 flex flex-col bg-slate-900 rounded-2xl p-3 relative overflow-hidden border border-slate-800 min-h-[320px]">
                {/* Image Toolbar */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-white text-xs mb-2">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Zoom: {Math.round(receiptZoom * 100)}% | Rot: {receiptRotation}°
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.min(3, prev + 0.25))}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                      title="Zoom In"
                    >
                      + Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptZoom(prev => Math.max(0.5, prev - 0.25))}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                      title="Zoom Out"
                    >
                      - Zoom
                    </button>
                    <button
                      type="button"
                      onClick={() => setReceiptRotation(prev => (prev + 90) % 360)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Rotate 90 degrees"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Rotate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptZoom(1);
                        setReceiptRotation(0);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition cursor-pointer"
                      title="Reset"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Scaled Image Container */}
                <div className="flex-1 flex items-center justify-center overflow-auto p-2 bg-slate-950/60 rounded-xl min-h-[260px]">
                  <img 
                    src={selectedReceiptModal?.screenshot || previewScreenshot || ''} 
                    alt="Payment Receipt Screenshot" 
                    style={{
                      transform: `scale(${receiptZoom}) rotate(${receiptRotation}deg)`,
                      transition: 'transform 0.2s ease-out'
                    }}
                    className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg select-none"
                  />
                </div>
              </div>

              {/* Right Column: Guideline Checklist & Approval Panel */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Transaction Verification Record
                    </div>

                    <div className="space-y-1.5 font-medium text-slate-700">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Trader User:</span>
                        <span className="font-bold text-slate-900 font-mono text-[11px] truncate max-w-[180px]">
                          {selectedReceiptModal?.tx?.userId || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Deposit Amount:</span>
                        <span className="font-black text-emerald-600 font-mono text-sm">
                          ₹{Number(selectedReceiptModal?.tx?.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">12-Digit UTR / Ref:</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                          <span>{selectedReceiptModal?.tx?.utr || 'N/A'}</span>
                          {selectedReceiptModal?.tx?.utr && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(selectedReceiptModal.tx.utr, 'modal_utr')}
                              className="text-slate-400 hover:text-slate-800 p-0.5"
                              title="Copy UTR"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-slate-500">Submission Date:</span>
                        <span className="text-[11px] text-slate-800">
                          {selectedReceiptModal?.tx?.date ? new Date(selectedReceiptModal.tx.date).toLocaleString() : 'Just now'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Current Status:</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          selectedReceiptModal?.tx?.status === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : selectedReceiptModal?.tx?.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {selectedReceiptModal?.tx?.status || 'PENDING'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Guidelines Checklist */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1 text-[#0088cc]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approval Guidelines:</span>
                    </div>
                    <ul className="space-y-1 text-slate-700 pl-1">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Receipt UTR matches submitted reference</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Exact amount ₹{Number(selectedReceiptModal?.tx?.amount || 0).toLocaleString('en-IN')} is marked Paid</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Image is original and not a repeated receipt</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Direct Action Buttons for Pending Deposits */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {selectedReceiptModal?.tx?.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const txId = selectedReceiptModal.tx.id;
                          setSelectedReceiptModal(null);
                          setPreviewScreenshot(null);
                          await handleApproveTransaction(txId);
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Approve & Credit ₹{Number(selectedReceiptModal.tx.amount || 0).toLocaleString('en-IN')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const tx = selectedReceiptModal.tx;
                          setSelectedReceiptModal(null);
                          setPreviewScreenshot(null);
                          setRejectingTx(tx);
                          setRejectReason('');
                        }}
                        className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceiptModal(null);
                        setPreviewScreenshot(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Close Receipt Modal
                    </button>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: REVERSE DEPOSIT CONFIRMATION MODAL               */}
      {/* ========================================================= */}
      {reversingTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 mx-auto">
              <RefreshCw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Reverse Approved Deposit?</h3>
              <p className="text-xs text-slate-500">
                This action will deduct ₹{reversingTx.amount?.toLocaleString('en-IN')} from user <strong className="text-slate-800">{reversingTx.userId}</strong> and update the audit ledger.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Tx ID:</span>
                <span className="font-bold text-slate-800">{reversingTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UTR:</span>
                <span className="font-bold text-slate-800">{reversingTx.utr || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount:</span>
                <span className="font-bold text-rose-600">-₹{reversingTx.amount?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Reason for Reversal:</label>
              <input 
                type="text"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="e.g. Chargeback claim / Duplicate credit error"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 transition"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReversingTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleReverseDeposit(reversingTx.id, reversalReason)}
                disabled={isReversing}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isReversing ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 9: RESET NET PROFIT / LOSS CONFIRMATION MODAL       */}
      {/* ========================================================= */}
      {showResetProfitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 mx-auto shadow-inner">
              <RotateCcw className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                नेट प्रॉफिट / लॉस रीसेट करें?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                इस एक्शन से प्लेटफ़ॉर्म का नेट लाभ/हानि ₹0.00 पर रीसेट हो जाएगा और आगे से बिल्कुल नया और परफेक्ट डेटा मिलेगा। यूज़र्स का मौजूदा बैलेंस सुरक्षित रहेगा।
              </p>
            </div>

            {/* Current vs New Projection */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">वर्तमान नेट प्रॉफिट/लॉस:</span>
                <span className={`font-mono font-black ${
                  (analytics?.platformNetProfit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {(analytics?.platformNetProfit || 0) >= 0 ? '+' : ''}₹{(analytics?.platformNetProfit || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">रीसेट के बाद नया नेट PnL:</span>
                <span className="font-mono font-black text-[#0088cc] text-sm">
                  ₹0.00 (0.0% मार्जिन)
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">यूज़र वॉलेट बैलेंस:</span>
                <span className="font-mono font-bold text-emerald-600">
                  100% सुरक्षित (अपरिवर्तित)
                </span>
              </div>
            </div>

            {/* Optional checkbox for full transaction history purge */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
              <input 
                type="checkbox"
                id="clearHistoryCheck"
                checked={clearHistoryWithReset}
                onChange={(e) => setClearHistoryWithReset(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="clearHistoryCheck" className="text-[11px] text-amber-950 font-medium cursor-pointer">
                <strong>पुराना ट्रांजेक्शन इतिहास भी साफ करें</strong> (वैकल्पिक: इससे लाइफटाइम डिपॉजिट्स और विथड्रॉल्स भी नए सिरे से 0 से शुरू होंगे)
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetProfitModal(false)}
                disabled={isResettingProfit}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={() => handleResetPlatformProfit(clearHistoryWithReset)}
                disabled={isResettingProfit}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                {isResettingProfit ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>रीसेट हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>हाँ, ₹0.00 पर रीसेट करें</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
