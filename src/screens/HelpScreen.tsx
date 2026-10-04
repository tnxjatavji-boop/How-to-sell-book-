import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Mail, Headphones, HelpCircle, PlayCircle, 
  ChevronRight, Copy, Check, Send, Plus, X, Minus,
  Bot, User, ShieldCheck, CheckCircle2, Search, ExternalLink,
  MessageSquare, Activity
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { triggerHaptic } from '../utils/haptics';

interface Message {
  id: string;
  sender: 'bot' | 'agent' | 'user';
  senderName?: string;
  text: string;
  time: string;
  options?: string[];
}

interface FAQItem {
  q: string;
  a: string;
  category: 'Deposits' | 'Withdrawals' | 'Trading' | 'Account';
}

const FAQS_DATA: FAQItem[] = [
  {
    category: 'Deposits',
    q: 'How do I deposit funds using UPI?',
    a: '1. Navigate to the Deposit page.\n2. Choose an amount (Min ₹100).\n3. Scan the dynamic UPI QR code or copy the UPI ID using Google Pay, PhonePe, Paytm, or BHIM.\n4. Complete the transfer and copy the 12-digit UTR / Reference number from your payment receipt.\n5. Paste the UTR into TradeXora and tap "Verify Deposit". Your balance will be credited within 1-3 minutes.',
  },
  {
    category: 'Deposits',
    q: 'What if my deposit is not credited immediately?',
    a: 'Double check that you have submitted the exact 12-digit UTR reference number from your bank or UPI receipt. If your payment was deducted from your bank, our automated system validates and matches the transaction within 2-5 minutes. You can also message our Online Support bot with your UTR for instant priority verification.',
  },
  {
    category: 'Withdrawals',
    q: 'How do bank withdrawals work and what is the processing time?',
    a: 'Withdrawals are processed directly to your Indian Bank Account via IMPS (Immediate Payment Service).\n• Minimum Withdrawal: ₹200 (100% Unlocked, Zero turnover rejection)\n• Processing Time: 15 to 30 minutes straight to your account\n• Bank Processing Fee: Standard 4% bank gateway charge\n• Simply enter your Account Holder Name, Bank Account Number, and IFSC Code on the Withdraw screen.',
  },
  {
    category: 'Trading',
    q: 'How does digital market forecasting work?',
    a: 'Choose your asset (Forex, Crypto, Commodities, Stocks), select an expiration timeframe (1m to 15m), and decide whether the market will close HIGHER (Call / Buy) or LOWER (Put / Sell). If your prediction is correct when the countdown expires, you receive your investment back plus up to 91% fixed net profit.',
  },
  {
    category: 'Trading',
    q: 'What are 20X Futures and how is PnL calculated?',
    a: '20X Futures allows you to take Long (Buy) or Short (Sell) positions on Bitcoin, Ethereum, Solana, US Tech Titans, and Forex with 20X purchasing power. Your live Profit & Loss (PnL) updates in real time based on market price movements. You can close your position anytime with a single tap to lock in your profits.',
  },
  {
    category: 'Account',
    q: 'How does the free ₹10,000 Demo Account work?',
    a: 'Every registered trader gets a complimentary ₹10,000 virtual balance that streams the exact same live market candles as the Real Account. You can practice strategies without any risk. When your balance runs low, tap the ↻ refill button next to your balance at the top to reload ₹10,000 for free unlimited times.',
  },
];

export const HelpScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId } = useAppContext();

  // Check if view=chat is requested in URL
  const queryParams = new URLSearchParams(location.search);
  const initialView = queryParams.get('view') === 'chat' ? 'chat' : 'hub';

  const [view, setView] = useState<'hub' | 'chat' | 'faq'>(initialView);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  // Formatted user info for livechat profile
  const userEmail = (userId || 'trader@tradexora.com').toLowerCase().trim();
  const userName = userEmail.includes('@')
    ? userEmail.split('@')[0].replace(/[._-]/g, ' ').toUpperCase()
    : 'VALUED TRADER';

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'bot',
      senderName: 'Xora Bot',
      text: "Hello 👋, I'm Xora Bot. How can I help you today?",
      time: '07:00 PM',
    },
    {
      id: 'm2',
      sender: 'bot',
      senderName: 'Xora Bot',
      text: "Choose a topic and tap the button below to find the answers you need. I can also connect to our real agents 😊.",
      time: '07:00 PM',
      options: ['Deposit', 'Withdrawal', 'Trading', 'Account', 'Talk to an agent'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation from live server database
  const fetchLiveMessages = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/live-support/chat?userId=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.ticket && Array.isArray(json.ticket.history) && json.ticket.history.length > 0) {
          const mapped: Message[] = json.ticket.history.map((h: any, idx: number) => ({
            id: `msg_${idx}_${h.timestamp || Date.now()}`,
            sender: h.sender === 'user' ? 'user' : (h.sender === 'admin' ? 'agent' : 'bot'),
            senderName: h.adminName || (h.sender === 'admin' ? 'Senior Desk Officer' : 'Xora Assistant'),
            text: h.message || '',
            time: new Date(h.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: idx === json.ticket.history.length - 1 && h.sender !== 'user'
              ? ['Deposit Verification', 'Check Withdrawal Status', 'Practice Demo Help', 'Talk to Specialist']
              : undefined
          }));
          setMessages(mapped);
        }
      }
    } catch {}
  }, [userEmail]);

  useEffect(() => {
    fetchLiveMessages();
    if (view === 'chat') {
      const interval = setInterval(fetchLiveMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [view, fetchLiveMessages]);

  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view, isTyping]);

  const handleCopyEmail = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText('support@tradexora.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSelectTopic = (topic: string) => {
    triggerHaptic('medium');
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: topic,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    fetch('/api/live-support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userEmail,
        text: topic
      })
    })
      .then(res => res.json())
      .then(json => {
        setIsTyping(false);
        if (json.success && json.ticket && Array.isArray(json.ticket.history)) {
          const mapped: Message[] = json.ticket.history.map((h: any, idx: number) => ({
            id: `msg_${idx}_${h.timestamp || Date.now()}`,
            sender: h.sender === 'user' ? 'user' : (h.sender === 'admin' ? 'agent' : 'bot'),
            senderName: h.adminName || (h.sender === 'admin' ? 'Senior Desk Officer' : 'Xora Assistant'),
            text: h.message || '',
            time: new Date(h.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: idx === json.ticket.history.length - 1 && h.sender !== 'user'
              ? ['Deposit Verification', 'Check Withdrawal Status', 'Practice Demo Help', 'Talk to Specialist']
              : undefined
          }));
          setMessages(mapped);
        }
      })
      .catch(() => {
        setIsTyping(false);
      });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    triggerHaptic('medium');
    const userQuery = inputText.trim();
    setInputText('');

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: userQuery,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Persist to Live Support Server Database
    fetch('/api/live-support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userEmail,
        text: userQuery
      })
    })
      .then(res => res.json())
      .then(json => {
        setIsTyping(false);
        if (json.success && json.ticket && Array.isArray(json.ticket.history)) {
          const mapped: Message[] = json.ticket.history.map((h: any, idx: number) => ({
            id: `msg_${idx}_${h.timestamp || Date.now()}`,
            sender: h.sender === 'user' ? 'user' : (h.sender === 'admin' ? 'agent' : 'bot'),
            senderName: h.adminName || (h.sender === 'admin' ? 'Senior Desk Officer' : 'Xora Assistant'),
            text: h.message || '',
            time: new Date(h.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            options: idx === json.ticket.history.length - 1 && h.sender !== 'user'
              ? ['Deposit Verification', 'Check Withdrawal Status', 'Practice Demo Help', 'Talk to Specialist']
              : undefined
          }));
          setMessages(mapped);
        }
      })
      .catch(() => {
        setIsTyping(false);
      });
  };

  const filteredFaqs = FAQS_DATA.filter(f => 
    f.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans select-none overflow-hidden pb-16">
      {/* ========================================================================= */}
      {/* VIEW 1: HELP HUB (Matching Platform Clean Modern Theme & BottomNav) */}
      {/* ========================================================================= */}
      {view === 'hub' && (
        <div className="flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-2xs">
            <div className="w-8" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0088cc] flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <h1 className="text-base font-black text-gray-900 tracking-tight">
                Help & Support
              </h1>
            </div>
            <div className="w-8" />
          </div>

          <div className="p-4 space-y-3.5 max-w-lg mx-auto w-full pb-8">
            {/* 1. E-mail Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/80 flex items-center justify-center text-[#0088cc] shrink-0 mt-0.5">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-gray-500">E-mail</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-gray-900 truncate">support@tradexora.com</span>
                    <button 
                      onClick={handleCopyEmail}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded transition cursor-pointer shrink-0"
                      title="Copy Support Email"
                    >
                      {copiedEmail ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    You will get a response within 1 business day
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Online Support Card */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0 relative mt-0.5">
                  <Headphones className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <span>Online Support</span>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">24/7 Live</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Ask questions online • Instant Desk Response
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic('medium');
                  setView('chat');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#0088cc] text-[#0088cc] bg-blue-50/40 hover:bg-blue-50 font-bold text-xs transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xs"
              >
                <span>Ask a question online</span>
              </button>

              <div className="text-xs text-gray-400 text-center font-medium">
                Available 24 Hours, 7 Days a Week
              </div>
            </div>

            {/* 3. FAQ Card */}
            <div 
              onClick={() => {
                triggerHaptic('light');
                setView('faq');
              }}
              className="bg-white hover:bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/80 flex items-center justify-center text-purple-600 shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900">FAQ</div>
                  <div className="text-xs text-gray-400">Open knowledge base & guide</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* 4. Live Telegram Support Card (Direct Forward to Telegram Support Bot) */}
            <a
              href="https://t.me/tradexora_supportbot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerHaptic('medium')}
              className="bg-white hover:bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100/80 flex items-center justify-center text-sky-600 shrink-0 group-hover:scale-105 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                    <span>Live Telegram Support</span>
                    <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full border border-sky-200">Bot</span>
                  </div>
                  <div className="text-xs text-gray-400">Direct 24/7 executive bot & instant chat</div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-sky-600 transition-colors" />
            </a>

            {/* Security Note */}
            <div className="text-center pt-3 text-[11px] text-gray-400 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Official TradeXora Global Support Infrastructure</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ONLINE SUPPORT LIVECHAT (Matching Screenshot 3) */}
      {/* ========================================================================= */}
      {view === 'chat' && (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white text-gray-900 px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 flex items-center justify-between border-b border-gray-100 shrink-0 shadow-2xs">
            <button 
              onClick={() => {
                if (initialView === 'chat') {
                  navigate('/me');
                } else {
                  setView('hub');
                }
              }}
              className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-black tracking-tight text-gray-900">Live Support Desk</span>
            </div>

            <div className="flex items-center gap-2 text-gray-400">
              <button 
                onClick={() => {
                  if (initialView === 'chat') {
                    navigate('/me');
                  } else {
                    setView('hub');
                  }
                }}
                className="p-1 hover:text-gray-700 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bot Status Pill at Top */}
          <div className="bg-white border-b border-slate-200/80 px-4 py-2 flex items-center justify-center shrink-0 shadow-2xs">
            <div className="bg-slate-100 border border-slate-200 rounded-full px-3 py-1 flex items-center gap-2 shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-[#0088cc] text-white flex items-center justify-center text-[10px] font-black">
                <Bot className="w-3 h-3" />
              </div>
              <span className="text-xs font-black text-slate-800">Xora Bot</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-100/70">
            {/* Inactivity banner from screenshot */}
            <div className="text-center text-[11px] text-slate-400 px-4 py-1.5 bg-white/60 rounded-xl border border-slate-200/60 max-w-sm mx-auto">
              24/7 Live Desk Session • Verified & Encrypted
            </div>

            <div className="text-center text-[10px] text-slate-400 font-bold">
              07:00 PM
            </div>

            {/* User Identity Card (Screenshot 3) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs max-w-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-400">Name:</div>
                  <div className="font-black text-slate-900 tracking-wide">{userName}</div>
                  <div className="text-[10px] font-bold text-slate-400 pt-0.5">E-mail:</div>
                  <div className="font-semibold text-slate-700 font-mono text-[11px]">{userEmail}</div>
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}>
                  <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                    {!isUser && (
                      <div className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-[#0088cc] text-white rounded-tr-xs font-medium'
                          : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs whitespace-pre-line'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>

                  {/* Topic Option Buttons (Pills from Screenshot 3) */}
                  {m.options && m.options.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-8 pt-1 max-w-[95%]">
                      {m.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelectTopic(opt)}
                          className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-200/80 hover:bg-slate-300 text-slate-800 transition active:scale-95 cursor-pointer shadow-2xs border border-slate-300/50"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 pl-2">
                <div className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="bg-white border-t border-slate-200 p-2.5 shrink-0 shadow-lg">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectTopic('Talk to an agent')}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition cursor-pointer"
                title="Quick Options"
              >
                <Plus className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] focus:bg-white transition"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-full bg-[#0088cc] hover:bg-[#0077b5] disabled:opacity-40 text-white flex items-center justify-center transition cursor-pointer shadow-xs active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="text-center pt-2 text-[10px] text-slate-400 font-medium">
              Powered by <span className="font-bold text-slate-600">TradeXora LiveDesk</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: KNOWLEDGE BASE / FAQ ACCORDION */}
      {/* ========================================================================= */}
      {view === 'faq' && (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="bg-[#0b1633] text-white px-4 pt-[max(env(safe-area-inset-top,0px),12px)] pb-3 flex items-center justify-between border-b border-white/10 sticky top-0 z-20">
            <button 
              onClick={() => setView('hub')} 
              className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-black text-white tracking-wide">
              Frequently Asked Questions
            </h1>
            <div className="w-8" />
          </div>

          <div className="p-4 space-y-3.5 max-w-lg mx-auto w-full pb-8">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search questions (e.g. Deposit, IMPS, UTR, Demo)..."
                className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] shadow-xs"
              />
            </div>

            {/* FAQs List */}
            <div className="space-y-2">
              {filteredFaqs.map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <button
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveFaqIndex(isOpen ? null : idx);
                      }}
                      className="w-full p-3.5 text-left flex items-center justify-between hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="pr-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#0088cc] block mb-0.5">
                          {faq.category}
                        </span>
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {faq.q}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90 text-[#0088cc]' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 whitespace-pre-line bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Need more help button */}
            <button
              onClick={() => setView('chat')}
              className="w-full py-3 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/15"
            >
              <Headphones className="w-4 h-4" />
              <span>Ask a Question Online in Live Support</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
